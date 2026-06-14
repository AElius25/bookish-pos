
-- Remove public INSERT policies; checkout now goes through server function (service role)
DROP POLICY IF EXISTS "Anyone can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Anyone can create invoice items" ON public.invoice_items;

-- Revoke broad execute on SECURITY DEFINER function and grant only to anon
-- (invoice view page is public; the UUID acts as the capability/secret)
REVOKE EXECUTE ON FUNCTION public.get_invoice_with_items(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_invoice_with_items(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_invoice_with_items(uuid) TO anon;
