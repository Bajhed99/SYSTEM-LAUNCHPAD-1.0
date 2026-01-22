-- Create storage bucket for meeting audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-audio', 'meeting-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for meeting-audio bucket
CREATE POLICY "Users can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meeting-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = (SELECT organization_id::text FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can view audio files in their organization"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meeting-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = (SELECT organization_id::text FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete audio files in their organization"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meeting-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = (SELECT organization_id::text FROM user_profiles WHERE id = auth.uid())
);
