
-- Create private bucket for certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('certificates', 'certificates', false, 10485760, ARRAY['application/x-pkcs12', 'application/octet-stream']);

-- RLS: Users can upload certificates to their own company folder
CREATE POLICY "Users can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates'
  AND auth.uid() IS NOT NULL
  AND public.user_owns_company((storage.foldername(name))[1]::uuid)
);

-- RLS: Users can view their own certificates
CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates'
  AND auth.uid() IS NOT NULL
  AND public.user_owns_company((storage.foldername(name))[1]::uuid)
);

-- RLS: Users can update their own certificates
CREATE POLICY "Users can update own certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'certificates'
  AND auth.uid() IS NOT NULL
  AND public.user_owns_company((storage.foldername(name))[1]::uuid)
);

-- RLS: Users can delete their own certificates
CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificates'
  AND auth.uid() IS NOT NULL
  AND public.user_owns_company((storage.foldername(name))[1]::uuid)
);
