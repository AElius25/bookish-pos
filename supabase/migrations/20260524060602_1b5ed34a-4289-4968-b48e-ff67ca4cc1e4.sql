
CREATE POLICY "Authenticated can view invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can view invoice items"
ON public.invoice_items FOR SELECT
TO authenticated
USING (true);
