import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CheckoutSchema = z.object({
  customer_name: z.string().trim().min(1).max(120),
  customer_email: z.string().trim().email().max(255).optional().nullable(),
  customer_phone: z.string().trim().max(40).optional().nullable(),
  customer_address: z.string().trim().max(500).optional().nullable(),
  payment_method: z.enum(["cash", "qris"]),
  paid_amount: z.number().nonnegative().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  items: z
    .array(
      z.object({
        book_id: z.string().uuid(),
        quantity: z.number().int().positive().max(999),
      }),
    )
    .min(1)
    .max(100),
});

export const submitCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CheckoutSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Re-fetch authoritative book prices/stock from DB
    const ids = Array.from(new Set(data.items.map((i) => i.book_id)));
    const { data: books, error: booksErr } = await supabaseAdmin
      .from("books")
      .select("id,title,author,price,stock")
      .in("id", ids);
    if (booksErr) throw new Error(booksErr.message);
    if (!books || books.length !== ids.length) {
      throw new Error("Salah satu buku tidak ditemukan");
    }

    const byId = new Map(books.map((b) => [b.id, b]));

    // Compute server-side
    let subtotal = 0;
    const itemRows = data.items.map((i) => {
      const b = byId.get(i.book_id)!;
      if (i.quantity > b.stock) {
        throw new Error(`Stok tidak cukup untuk "${b.title}"`);
      }
      const price = Number(b.price);
      const lineSubtotal = price * i.quantity;
      subtotal += lineSubtotal;
      return {
        book_id: b.id,
        title: b.title,
        author: b.author,
        price,
        quantity: i.quantity,
        subtotal: lineSubtotal,
      };
    });

    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;

    const paid = data.payment_method === "cash" ? (data.paid_amount ?? 0) : total;
    if (data.payment_method === "cash" && paid < total) {
      throw new Error("Uang tunai kurang dari total");
    }
    const change = data.payment_method === "cash" ? Math.max(0, paid - total) : 0;

    const { data: invoice, error: invErr } = await supabaseAdmin
      .from("invoices")
      .insert({
        customer_name: data.customer_name,
        customer_email: data.customer_email || null,
        customer_phone: data.customer_phone || null,
        customer_address: data.customer_address || null,
        payment_method: data.payment_method,
        subtotal,
        tax,
        total,
        paid_amount: paid,
        change_amount: change,
        status: "paid",
        notes: data.notes || null,
      })
      .select("id")
      .single();
    if (invErr) throw new Error(invErr.message);

    const { error: itemsErr } = await supabaseAdmin
      .from("invoice_items")
      .insert(itemRows.map((r) => ({ ...r, invoice_id: invoice.id })));
    if (itemsErr) throw new Error(itemsErr.message);

    // Decrement stock
    for (const i of data.items) {
      const b = byId.get(i.book_id)!;
      await supabaseAdmin
        .from("books")
        .update({ stock: Math.max(0, b.stock - i.quantity) })
        .eq("id", b.id);
    }

    return { id: invoice.id as string };
  });
