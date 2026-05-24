
-- Books catalog
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  cover_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Books are viewable by everyone"
  ON public.books FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert books"
  ON public.books FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update books"
  ON public.books FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete books"
  ON public.books FOR DELETE TO authenticated USING (true);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT ('INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  change_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'paid',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create invoices"
  ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view invoice by id"
  ON public.invoices FOR SELECT USING (true);

-- Invoice items
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  author TEXT,
  price NUMERIC(12,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create invoice items"
  ON public.invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view invoice items"
  ON public.invoice_items FOR SELECT USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed sample books
INSERT INTO public.books (title, author, category, price, stock, description) VALUES
  ('Bumi Manusia', 'Pramoedya Ananta Toer', 'Sastra', 95000, 25, 'Tetralogi Buru — kisah Minke di era kolonial.'),
  ('Laskar Pelangi', 'Andrea Hirata', 'Novel', 78000, 30, 'Kisah inspiratif anak-anak Belitung.'),
  ('Filosofi Teras', 'Henry Manampiring', 'Self-Help', 88000, 40, 'Pengantar filsafat Stoa untuk kehidupan modern.'),
  ('Atomic Habits', 'James Clear', 'Self-Help', 110000, 50, 'Perubahan kecil yang menghasilkan hasil luar biasa.'),
  ('Sapiens', 'Yuval Noah Harari', 'Sejarah', 145000, 20, 'Riwayat ringkas umat manusia.'),
  ('Pulang', 'Leila S. Chudori', 'Novel', 92000, 18, 'Sebuah kisah tentang eksil politik 1965.'),
  ('Cantik Itu Luka', 'Eka Kurniawan', 'Sastra', 105000, 15, 'Novel magis realis ikonik Indonesia.'),
  ('Tentang Kamu', 'Tere Liye', 'Novel', 85000, 35, 'Perjalanan menelusuri kisah seorang wanita.');
