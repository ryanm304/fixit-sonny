
-- Add dorm_hall and room_number to profiles
ALTER TABLE public.profiles ADD COLUMN dorm_hall text;
ALTER TABLE public.profiles ADD COLUMN room_number text;

-- Create storage bucket for request photos
INSERT INTO storage.buckets (id, name, public) VALUES ('request-photos', 'request-photos', true);

-- Allow authenticated users to upload to request-photos bucket
CREATE POLICY "Authenticated users can upload request photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'request-photos');

-- Allow public read access
CREATE POLICY "Public read access for request photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'request-photos');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own request photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'request-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add image_url column to maintenance_requests
ALTER TABLE public.maintenance_requests ADD COLUMN image_url text;
