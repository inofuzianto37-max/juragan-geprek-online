
-- Customers can upload their own payment proof (path starts with their user id)
CREATE POLICY "Users upload own payment proof"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Customers can view their own payment proof
CREATE POLICY "Users view own payment proof"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Customers can replace their own payment proof
CREATE POLICY "Users update own payment proof"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all payment proofs
CREATE POLICY "Admins view all payment proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND public.has_role(auth.uid(), 'admin')
);
