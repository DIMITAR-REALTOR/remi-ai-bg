
DROP POLICY IF EXISTS "Brokers upload own listing photos" ON storage.objects;
CREATE POLICY "Brokers upload own listing photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
    AND public.has_role(auth.uid(), 'broker')
  );

DROP POLICY IF EXISTS "Brokers update own listing photos" ON storage.objects;
CREATE POLICY "Brokers update own listing photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listing-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
    AND public.has_role(auth.uid(), 'broker')
  );

DROP POLICY IF EXISTS "Brokers can update their own listings" ON public.listings;
CREATE POLICY "Brokers can update their own listings" ON public.listings
  FOR UPDATE TO authenticated
  USING (auth.uid() = broker_id AND public.has_role(auth.uid(), 'broker'))
  WITH CHECK (auth.uid() = broker_id AND public.has_role(auth.uid(), 'broker'));
