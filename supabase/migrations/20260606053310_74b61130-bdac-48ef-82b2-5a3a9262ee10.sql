CREATE OR REPLACE FUNCTION public.get_invoice_with_items(_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invoice jsonb;
  _items jsonb;
BEGIN
  SELECT to_jsonb(i.*) INTO _invoice FROM public.invoices i WHERE i.id = _id;
  IF _invoice IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(it.*) ORDER BY it.created_at), '[]'::jsonb)
    INTO _items FROM public.invoice_items it WHERE it.invoice_id = _id;
  RETURN jsonb_build_object('invoice', _invoice, 'items', _items);
END;
$$;

REVOKE ALL ON FUNCTION public.get_invoice_with_items(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invoice_with_items(uuid) TO anon, authenticated;