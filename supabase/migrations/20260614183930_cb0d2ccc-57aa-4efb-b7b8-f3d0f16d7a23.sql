
CREATE POLICY "Listing photos are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-photos');
CREATE POLICY "Brokers upload own listing photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Brokers update own listing photos" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Brokers delete own listing photos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );
