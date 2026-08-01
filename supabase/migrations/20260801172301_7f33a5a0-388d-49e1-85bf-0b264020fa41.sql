CREATE POLICY "Broker photos readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'broker-photos');

CREATE POLICY "Owner can upload own broker photo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'broker-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner can update own broker photo"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'broker-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'broker-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner can delete own broker photo"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'broker-photos' AND (storage.foldername(name))[1] = auth.uid()::text);