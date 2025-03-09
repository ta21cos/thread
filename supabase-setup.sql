
-- Create memos table if it doesn't exist
CREATE TABLE IF NOT EXISTS memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES memos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_memos_updated_at
BEFORE UPDATE ON memos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create a storage bucket for memo images
INSERT INTO storage.buckets (id, name, public)
VALUES ('memo-images', 'memo-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for memos table
-- Allow users to select their own memos and any memos they can reply to
CREATE POLICY "Users can view their own memos and public memos"
ON memos FOR SELECT
USING (auth.uid() = user_id OR parent_id IS NOT NULL);

-- Allow users to insert their own memos
CREATE POLICY "Users can insert their own memos"
ON memos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own memos
CREATE POLICY "Users can update their own memos"
ON memos FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own memos
CREATE POLICY "Users can delete their own memos"
ON memos FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for users table
-- Allow users to select any user
CREATE POLICY "Anyone can view user profiles"
ON users FOR SELECT
USING (true);

-- Allow users to insert their own user profile
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own user profile
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Create RLS policies for storage
-- Allow users to select any image
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'memo-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'memo-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'memo-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'memo-images' AND
  auth.uid()::text = (stogv
-- Create memos table if it doesn't exist
CREATE TABLE IF NOT EXISTS memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES memos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_memos_updated_at
BEFORE UPDATE ON memos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create a storage bucket for memo images
INSERT INTO storage.buckets (id, name, public)
VALUES ('memo-images', 'memo-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for memos table
-- Allow users to select their own memos and any memos they can reply to
CREATE POLICY "Users can view their own memos and public memos"
ON memos FOR SELECT
USING (auth.uid() = user_id OR parent_id IS NOT NULL);

-- Allow users to insert their own memos
CREATE POLICY "Users can insert their own memos"
ON memos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own memos
CREATE POLICY "Users can update their own memos"
ON memos FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own memos
CREATE POLICY "Users can delete their own memos"
ON memos FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for users table
-- Allow users to select any user
CREATE POLICY "Anyone can view user profiles"
ON users FOR SELECT
USING (true);

-- Allow users to insert their own user profile
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own user profile
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Create RLS policies for storage
-- Allow users to select any image
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'memo-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'memo-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'memo-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'memo-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
age.foldername(name))[1]
);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
