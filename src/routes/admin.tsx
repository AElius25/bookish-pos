import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR, formatDateTime } from "@/lib/format";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ShieldCheck,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  TrendingUp,
  Receipt,
  Wallet,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Kedai Buku" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingSession(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loadingSession) {
    return <div className="p-10 text-center text-muted-foreground">Memuat…</div>;
  }
  if (!session) return <LoginScreen />;
  return <Dashboard email={session.user.email ?? ""} />;
}

/* ────────────────────────────  LOGIN  ──────────────────────────── */

function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Selamat datang kembali!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Akun admin dibuat. Silakan masuk.");
        setMode("login");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full overflow-hidden border-border/70 shadow-[var(--shadow-soft)]">
        <div className="bg-[image:var(--gradient-deep)] p-6 text-primary-foreground">
          <ShieldCheck className="mb-2 h-7 w-7" />
          <h1 className="font-display text-3xl font-semibold">Admin Panel</h1>
          <p className="text-sm text-primary-foreground/75">
            {mode === "login" ? "Masuk untuk mengelola toko." : "Buat akun admin pertama."}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Kata sandi</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="h-11 w-full bg-accent text-accent-foreground hover:bg-teal/90">
            {loading ? "Memproses…" : mode === "login" ? "Masuk" : "Daftar"}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "login" ? "Belum punya akun admin? Daftar" : "Sudah punya akun? Masuk"}
          </button>
        </form>
      </Card>
    </div>
  );
}

/* ────────────────────────────  DASHBOARD  ──────────────────────────── */

function Dashboard({ email }: { email: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">Masuk sebagai {email}</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Berhasil keluar");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Keluar
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="books">Manajemen Buku</TabsTrigger>
          <TabsTrigger value="invoices">Histori Pembelian</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="books"><BooksManager /></TabsContent>
        <TabsContent value="invoices"><InvoicesList /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ────────────────────────────  OVERVIEW  ──────────────────────────── */

function Overview() {
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: books = [] } = useQuery({
    queryKey: ["books"],
    queryFn: async () => (await supabase.from("books").select("*")).data ?? [],
  });

  const metrics = useMemo(() => {
    const total = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const now = new Date();
    const today = invoices
      .filter((i) => new Date(i.created_at).toDateString() === now.toDateString())
      .reduce((s, i) => s + Number(i.total || 0), 0);
    const month = invoices
      .filter((i) => {
        const d = new Date(i.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, i) => s + Number(i.total || 0), 0);
    return {
      revenue: total,
      today,
      month,
      count: invoices.length,
      books: books.length,
      lowStock: books.filter((b) => b.stock <= 5).length,
    };
  }, [invoices, books]);

  const recent = invoices.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total Pendapatan" value={formatIDR(metrics.revenue)} icon={<Wallet className="h-5 w-5" />} hero />
        <Metric label="Pendapatan Hari Ini" value={formatIDR(metrics.today)} icon={<TrendingUp className="h-5 w-5" />} />
        <Metric label="Pendapatan Bulan Ini" value={formatIDR(metrics.month)} icon={<TrendingUp className="h-5 w-5" />} />
        <Metric label="Total Transaksi" value={String(metrics.count)} icon={<Receipt className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Metric label="Total Judul Buku" value={String(metrics.books)} icon={<BookOpen className="h-5 w-5" />} />
        <Metric label="Stok Menipis (≤5)" value={String(metrics.lowStock)} icon={<BookOpen className="h-5 w-5" />} warning={metrics.lowStock > 0} />
      </div>

      <Card className="overflow-hidden border-border/70">
        <div className="border-b bg-secondary/40 px-5 py-3">
          <h2 className="font-display text-lg font-semibold">Transaksi Terbaru</h2>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Belum ada transaksi.</div>
        ) : (
          <div className="divide-y">
            {recent.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{inv.invoice_number}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {inv.customer_name} · {formatDateTime(inv.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-deep">{formatIDR(Number(inv.total))}</span>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/invoice/$id" params={{ id: inv.id }}><Eye className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  hero,
  warning,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hero?: boolean;
  warning?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden p-5 ${
        hero ? "bg-[image:var(--gradient-deep)] text-primary-foreground border-transparent" : ""
      } ${warning ? "ring-1 ring-destructive/40" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className={`text-xs uppercase tracking-wider ${hero ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {label}
        </div>
        <span className={`rounded-md p-2 ${hero ? "bg-white/15" : "bg-secondary text-accent"}`}>{icon}</span>
      </div>
      <div className={`mt-3 font-display text-3xl font-semibold ${hero ? "" : "text-deep"}`}>{value}</div>
    </Card>
  );
}

/* ────────────────────────────  BOOKS CRUD  ──────────────────────────── */

type BookRow = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  price: number;
  stock: number;
  description: string | null;
  cover_url: string | null;
};

function BooksManager() {
  const qc = useQueryClient();
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").order("title");
      if (error) throw error;
      return data as BookRow[];
    },
  });

  const [editing, setEditing] = useState<BookRow | null>(null);
  const [open, setOpen] = useState(false);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      toast.success("Buku dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="overflow-hidden border-border/70">
      <div className="flex items-center justify-between border-b bg-secondary/40 px-5 py-3">
        <h2 className="font-display text-lg font-semibold">Daftar Buku</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)} className="bg-accent text-accent-foreground hover:bg-teal/90">
              <Plus className="mr-1 h-4 w-4" /> Tambah Buku
            </Button>
          </DialogTrigger>
          <BookFormDialog editing={editing} onClose={() => setOpen(false)} />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">Memuat…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Judul</th>
                <th className="px-3 py-3">Kategori</th>
                <th className="px-3 py-3 text-right">Harga</th>
                <th className="px-3 py-3 text-center">Stok</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {books.map((b) => (
                <tr key={b.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-3">
                    <div className="font-medium">{b.title}</div>
                    <div className="text-xs text-muted-foreground">{b.author}</div>
                  </td>
                  <td className="px-3 py-3"><Badge variant="secondary">{b.category ?? "—"}</Badge></td>
                  <td className="px-3 py-3 text-right font-medium text-deep">{formatIDR(Number(b.price))}</td>
                  <td className="px-3 py-3 text-center">
                    <Badge className={b.stock <= 5 ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-mint/20 text-deep border-mint/40"}>
                      {b.stock}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Hapus "${b.title}"?`)) deleteMut.mutate(b.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function BookFormDialog({ editing, onClose }: { editing: BookRow | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    author: editing?.author ?? "",
    category: editing?.category ?? "",
    price: editing ? String(editing.price) : "",
    stock: editing ? String(editing.stock) : "",
    description: editing?.description ?? "",
    cover_url: editing?.cover_url ?? "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({
      title: editing?.title ?? "",
      author: editing?.author ?? "",
      category: editing?.category ?? "",
      price: editing ? String(editing.price) : "",
      stock: editing ? String(editing.stock) : "",
      description: editing?.description ?? "",
      cover_url: editing?.cover_url ?? "",
    });
  }, [editing]);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("book-covers").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
      setForm((f) => ({ ...f, cover_url: data.publicUrl }));
      toast.success("Gambar diunggah");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.author.trim()) throw new Error("Judul dan penulis wajib diisi");
      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category.trim() || null,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        description: form.description.trim() || null,
        cover_url: form.cover_url.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("books").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("books").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      toast.success(editing ? "Buku diperbarui" : "Buku ditambahkan");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">
          {editing ? "Edit Buku" : "Tambah Buku Baru"}
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-3">
        <Field label="Gambar Sampul">
          <div className="flex items-start gap-3">
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded border bg-secondary">
              {form.cover_url ? (
                <img src={form.cover_url} alt="Sampul" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  Tidak ada
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
              {uploading && <p className="text-xs text-muted-foreground">Mengunggah…</p>}
              {form.cover_url && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cover_url: "" })}
                  className="text-xs text-destructive hover:underline"
                >
                  Hapus gambar
                </button>
              )}
            </div>
          </div>
        </Field>
        <Field label="Judul *"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Penulis *"><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Field>
        <Field label="Kategori"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Harga (Rp)"><Input inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="Stok"><Input inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, "") })} /></Field>
        </div>
        <Field label="Deskripsi"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || uploading} className="bg-accent text-accent-foreground hover:bg-teal/90">
          {saveMut.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ────────────────────────────  INVOICES LIST  ──────────────────────────── */

function InvoicesList() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="overflow-hidden border-border/70">
      <div className="border-b bg-secondary/40 px-5 py-3">
        <h2 className="font-display text-lg font-semibold">Histori Pembelian</h2>
      </div>
      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">Memuat…</div>
      ) : invoices.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">Belum ada transaksi.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">No. Invoice</th>
                <th className="px-3 py-3">Pelanggan</th>
                <th className="px-3 py-3">Tanggal</th>
                <th className="px-3 py-3">Metode</th>
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-3 py-3">{inv.customer_name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatDateTime(inv.created_at)}</td>
                  <td className="px-3 py-3 capitalize">{inv.payment_method}</td>
                  <td className="px-3 py-3 text-right font-semibold text-deep">{formatIDR(Number(inv.total))}</td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/invoice/$id" params={{ id: inv.id }}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
