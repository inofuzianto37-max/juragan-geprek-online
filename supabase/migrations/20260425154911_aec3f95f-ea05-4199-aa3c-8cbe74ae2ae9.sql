
-- Update order number generator to JG-YYYYMMDD-XXXX (4-digit padded)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'JG-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

-- Auto-decrement stock & disable item when stock reaches 0
CREATE OR REPLACE FUNCTION public.decrement_menu_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_stock INT;
BEGIN
  IF NEW.menu_item_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT stock INTO current_stock FROM public.menu_items WHERE id = NEW.menu_item_id FOR UPDATE;

  IF current_stock IS NULL THEN
    RETURN NEW;
  END IF;

  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Stok tidak mencukupi untuk %: tersedia %, diminta %', NEW.item_name, current_stock, NEW.quantity;
  END IF;

  UPDATE public.menu_items
  SET stock = stock - NEW.quantity,
      is_available = CASE WHEN (stock - NEW.quantity) <= 0 THEN FALSE ELSE is_available END
  WHERE id = NEW.menu_item_id;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON public.order_items;
CREATE TRIGGER trg_decrement_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_menu_stock();
