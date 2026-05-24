import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { formatIDR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  BookOpen,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kasir — Kedai Buku" },
      { name: "description", content: "Pilih buku, isi invoice, dan cetak struk pembayaran." },
    ],
  }),
  component: CashierPage,
});

type Book = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  price: number;
  stock: number;
  cover_url: string | null;
  description: string | null;
};

function CashierPage() {
  const [query, setQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("title");
      if (error) throw error;
      return data as Book[];
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.category ?? "").toLowerCase().includes(q),
    );
  }, [books, query]);

  const cart = useCart();
  const subtotal = cart.subtotal();
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="mb-8 overflow-hidden rounded-2xl bg-[image:var(--gradient-deep)] p-8 text-primary-foreground shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="mb-3 bg-mint/20 text-mint-foreground border-mint/40 hover:bg-mint/20">
              <BookOpen className="mr-1.5 h-3 w-3" /> Katalog Hari Ini
            </Badge>
            <h1 className="font-display text-4xl font-semibold sm:text-5xl">
              Temukan, pilih, bayar.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/75">
              Sistem kasir untuk toko buku — kelola keranjang, terbitkan invoice,
              dan cetak struk dalam hitungan detik.
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/60" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul, penulis, kategori…"
              className="border-white/20 bg-white/10 pl-9 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-mint"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Books grid */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold">Koleksi Buku</h2>
            <span className="text-sm text-muted-foreground">{filtered.length} buku</span>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              Tidak ada buku yang cocok dengan pencarianmu.
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        {/* Cart */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden border-border/70 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 border-b bg-primary px-5 py-4 text-primary-foreground">
              <ShoppingCart className="h-5 w-5" />
              <div className="flex-1">
                <div className="font-display text-lg leading-none">Keranjang</div>
                <div className="text-xs text-primary-foreground/70">
                  {cart.items.length} item · {cart.items.reduce((s, i) => s + i.quantity, 0)} buku
                </div>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y">
              {cart.items.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Belum ada buku di keranjang.
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{item.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{item.author}</div>
                      <div className="mt-1 text-sm font-semibold text-deep">
                        {formatIDR(item.price)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => cart.remove(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="inline-flex items-center rounded-md border bg-secondary">
                        <button
                          onClick={() => cart.update(item.id, { quantity: item.quantity - 1 })}
                          className="px-2 py-1 hover:text-accent"
                          aria-label="Kurangi"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => cart.update(item.id, { quantity: item.quantity + 1 })}
                          className="px-2 py-1 hover:text-accent"
                          aria-label="Tambah"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 border-t bg-secondary/40 px-5 py-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>PPN 10%</span>
                <span>{formatIDR(tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="text-deep">{formatIDR(total)}</span>
              </div>
              <Button
                disabled={cart.items.length === 0}
                onClick={() => setCheckoutOpen(true)}
                className="mt-2 h-11 w-full bg-accent text-accent-foreground hover:bg-teal/90"
              >
                <Receipt className="mr-2 h-4 w-4" /> Lanjut ke Invoice
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} subtotal={subtotal} tax={tax} total={total} />
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  const cart = useCart();
  const inCart = cart.items.find((i) => i.id === book.id);
  const outOfStock = book.stock <= 0;

  return (
    <Card className="group flex flex-col gap-3 overflow-hidden border-border/70 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <div className="grid h-20 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-[image:var(--gradient-deep)] text-primary-foreground shadow-sm">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <BookOpen className="h-5 w-5 opacity-80" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Badge variant="secondary" className="mb-1 text-[10px] uppercase tracking-wider">
            {book.category ?? "Umum"}
          </Badge>
          <h3 className="font-display text-lg leading-tight font-semibold line-clamp-2">{book.title}</h3>
          <p className="text-xs text-muted-foreground">oleh {book.author}</p>
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2">
        <div>
          <div className="text-lg font-semibold text-deep">{formatIDR(book.price)}</div>
          <div className="text-xs text-muted-foreground">Stok: {book.stock}</div>
        </div>
        <Button
          size="sm"
          disabled={outOfStock || (inCart && inCart.quantity >= book.stock)}
          onClick={() => {
            cart.add({
              id: book.id,
              title: book.title,
              author: book.author,
              price: Number(book.price),
              stock: book.stock,
              cover_url: book.cover_url,
            });
            toast.success(`${book.title} ditambahkan`);
          }}
          className="bg-primary hover:bg-deep"
        >
          {inCart ? <><Plus className="mr-1 h-3 w-3" /> Tambah</> : "+ Keranjang"}
        </Button>
      </div>
    </Card>
  );
}

function CheckoutDialog({
  open,
  onOpenChange,
  subtotal,
  tax,
  total,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subtotal: number;
  tax: number;
  total: number;
}) {
  const cart = useCart();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    payment_method: "cash",
    paid_amount: "",
    notes: "",
  });

  const paid = Number(form.paid_amount) || (form.payment_method === "cash" ? 0 : total);
  const change = Math.max(0, paid - total);

  const submitMut = useMutation({
    mutationFn: async () => {
      if (!form.customer_name.trim()) throw new Error("Nama pelanggan wajib diisi");
      if (form.payment_method === "cash" && paid < total)
        throw new Error("Uang tunai kurang dari total");

      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim() || null,
          customer_phone: form.customer_phone.trim() || null,
          customer_address: form.customer_address.trim() || null,
          payment_method: form.payment_method,
          subtotal,
          tax,
          total,
          paid_amount: form.payment_method === "cash" ? paid : total,
          change_amount: form.payment_method === "cash" ? change : 0,
          status: "paid",
          notes: form.notes.trim() || null,
        })
        .select()
        .single();
      if (invErr) throw invErr;

      const items = cart.items.map((i) => ({
        invoice_id: invoice.id,
        book_id: i.id,
        title: i.title,
        author: i.author,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      }));
      const { error: itemsErr } = await supabase.from("invoice_items").insert(items);
      if (itemsErr) throw itemsErr;

      // Decrement stock
      for (const i of cart.items) {
        await supabase
          .from("books")
          .update({ stock: Math.max(0, i.stock - i.quantity) })
          .eq("id", i.id);
      }

      return invoice.id as string;
    },
    onSuccess: (id) => {
      cart.clear();
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      onOpenChange(false);
      toast.success("Pembayaran berhasil!");
      window.location.href = `/invoice/${id}`;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Form Invoice & Pembayaran</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data Pelanggan
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama lengkap *</Label>
              <Input id="name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">No. telepon</Label>
              <Input id="phone" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr">Alamat</Label>
              <Textarea id="addr" rows={2} value={form.customer_address} onChange={(e) => setForm({ ...form, customer_address: e.target.value })} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pembayaran
            </h3>
            <div className="space-y-1.5">
              <Label>Metode</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash"><Banknote className="mr-2 inline h-4 w-4" /> Tunai</SelectItem>
                  <SelectItem value="qris"><Smartphone className="mr-2 inline h-4 w-4" /> QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.payment_method === "cash" && (
              <div className="space-y-1.5">
                <Label htmlFor="paid">Uang diterima</Label>
                <Input id="paid" inputMode="numeric" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value.replace(/\D/g, "") })} placeholder={String(total)} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="rounded-lg border bg-secondary/50 p-3 text-sm">
              <Row label="Subtotal" value={formatIDR(subtotal)} />
              <Row label="PPN 10%" value={formatIDR(tax)} />
              <div className="my-2 border-t" />
              <Row label="Total" value={formatIDR(total)} bold />
              {form.payment_method === "cash" && (
                <>
                  <Row label="Tunai" value={formatIDR(paid)} />
                  <Row label="Kembalian" value={formatIDR(change)} bold />
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            onClick={() => submitMut.mutate()}
            disabled={submitMut.isPending}
            className="bg-accent text-accent-foreground hover:bg-teal/90"
          >
            {submitMut.isPending ? "Memproses…" : "Bayar & Terbitkan Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold text-deep" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
