import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  payment_method: string;
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  paid_amount: number | string;
  change_amount: number | string;
  status: string;
  notes: string | null;
  created_at: string;
};
type ItemRow = {
  id: string;
  title: string;
  author: string | null;
  price: number | string;
  quantity: number;
  subtotal: number | string;
};

export const Route = createFileRoute("/invoice/$id")({
  head: () => ({
    meta: [{ title: "Invoice — Kedai Buku" }],
  }),
  component: InvoicePage,
});

function InvoicePage() {
  const { id } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_invoice_with_items", { _id: id });
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Invoice tidak ditemukan");
      const payload = data as { invoice: InvoiceRow; items: ItemRow[] };
      return payload;
    },
  });

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Memuat…</div>;
  if (error || !data) return <div className="p-10 text-center text-destructive">Invoice tidak ditemukan.</div>;

  const { invoice, items } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="no-print mb-6 flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
        </Button>
        <Button onClick={() => window.print()} className="bg-accent text-accent-foreground hover:bg-teal/90">
          <Printer className="mr-2 h-4 w-4" /> Cetak Invoice
        </Button>
      </div>

      <Card className="print-area overflow-hidden border-border/70 shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between gap-4 border-b bg-[image:var(--gradient-deep)] p-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-white/15">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <div className="font-display text-2xl font-semibold">Kedai Buku</div>
              <div className="text-xs text-primary-foreground/75">Jl. Sastra No. 1 · Jakarta · (021) 123-4567</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-primary-foreground/70">Invoice</div>
            <div className="font-display text-xl font-semibold">{invoice.invoice_number}</div>
            <div className="text-xs text-primary-foreground/75">{formatDateTime(invoice.created_at)}</div>
          </div>
        </div>

        <div className="grid gap-4 border-b p-6 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Ditagihkan kepada</div>
            <div className="mt-1 font-display text-lg font-semibold">{invoice.customer_name}</div>
            {invoice.customer_email && <div className="text-sm text-muted-foreground">{invoice.customer_email}</div>}
            {invoice.customer_phone && <div className="text-sm text-muted-foreground">{invoice.customer_phone}</div>}
            {invoice.customer_address && <div className="text-sm text-muted-foreground">{invoice.customer_address}</div>}
          </div>
          <div className="sm:text-right">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Status</div>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-mint/30 px-3 py-1 text-sm font-semibold text-deep">
              <CheckCircle2 className="h-4 w-4" /> Lunas
            </div>
            <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">Metode</div>
            <div className="capitalize">{invoice.payment_method}</div>
          </div>
        </div>

        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2">Buku</th>
                <th className="pb-2 text-right">Harga</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="font-medium">{it.title}</div>
                    {it.author && <div className="text-xs text-muted-foreground">{it.author}</div>}
                  </td>
                  <td className="py-3 text-right">{formatIDR(Number(it.price))}</td>
                  <td className="py-3 text-center">{it.quantity}</td>
                  <td className="py-3 text-right font-medium">{formatIDR(Number(it.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t bg-secondary/50 p-6">
          <div className="ml-auto max-w-xs space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatIDR(Number(invoice.subtotal))} />
            <Row label="PPN 10%" value={formatIDR(Number(invoice.tax))} />
            <div className="my-2 border-t" />
            <Row label="Total" value={formatIDR(Number(invoice.total))} bold />
            {invoice.payment_method === "cash" && (
              <>
                <Row label="Tunai" value={formatIDR(Number(invoice.paid_amount))} />
                <Row label="Kembalian" value={formatIDR(Number(invoice.change_amount))} bold />
              </>
            )}
          </div>
          {invoice.notes && (
            <div className="mt-6 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Catatan: </strong>{invoice.notes}
            </div>
          )}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Terima kasih telah berbelanja di Kedai Buku · Semoga harimu indah ✦
          </div>
        </div>
      </Card>
    </div>
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
