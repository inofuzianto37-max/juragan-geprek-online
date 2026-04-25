-- Order status timeline
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by UUID,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_osh_order ON public.order_status_history(order_id, changed_at);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own order history" ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE POLICY "Admins view all order history" ON public.order_status_history FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger: log on insert + on status change
CREATE OR REPLACE FUNCTION public.log_order_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, NEW.user_id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_log_order_status ON public.orders;
CREATE TRIGGER trg_log_order_status
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status();

-- Backfill existing orders with their initial status entry
INSERT INTO public.order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, o.status, o.created_at, o.user_id
FROM public.orders o
WHERE NOT EXISTS (SELECT 1 FROM public.order_status_history h WHERE h.order_id = o.id);

-- Storage policies for menu-images bucket (public read, admin write)
DROP POLICY IF EXISTS "Public read menu images" ON storage.objects;
CREATE POLICY "Public read menu images" ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Admins upload menu images" ON storage.objects;
CREATE POLICY "Admins upload menu images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update menu images" ON storage.objects;
CREATE POLICY "Admins update menu images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete menu images" ON storage.objects;
CREATE POLICY "Admins delete menu images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND has_role(auth.uid(), 'admin'::app_role));