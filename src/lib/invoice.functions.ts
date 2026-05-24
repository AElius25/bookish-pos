import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getInvoice = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const [{ data: invoice, error: e1 }, { data: items, error: e2 }] = await Promise.all([
      supabaseAdmin.from("invoices").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("invoice_items").select("*").eq("invoice_id", data.id),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    if (!invoice) throw new Error("Invoice tidak ditemukan");
    return { invoice, items: items ?? [] };
  });
