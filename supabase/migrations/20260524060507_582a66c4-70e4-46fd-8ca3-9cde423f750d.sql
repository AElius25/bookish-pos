
-- Remove public SELECT access on invoices (contains PII: email, phone, address)
DROP POLICY IF EXISTS "Anyone can view invoice by id" ON public.invoices;

-- Remove public SELECT access on invoice_items (exposes purchase history)
DROP POLICY IF EXISTS "Anyone can view invoice items" ON public.invoice_items;

-- Lock down the SECURITY DEFINER event-trigger helper function
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
