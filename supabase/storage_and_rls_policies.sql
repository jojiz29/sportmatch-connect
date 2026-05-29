-- ============================================================
-- SportMatch Connect — Supabase Storage RLS Policies
-- Bucket: avatars (public read, auth-scoped write)
-- ============================================================
-- Run this in: Supabase Dashboard > SQL Editor
-- Or: supabase db push (if using CLI migrations)
-- ============================================================

-- 1. Allow any authenticated user to INSERT objects.
--    The policy enforces that the object path starts with the user's own UID,
--    so users can only write to their own folder: public/{uid}.webp
CREATE POLICY "Avatar upload: owner only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'public'
  AND (storage.foldername(name))[2] IS NULL -- flat path, not nested
  -- Allow if the filename starts with auth.uid()
  -- File path format: public/{user_id}.webp
  AND name LIKE 'public/' || auth.uid()::text || '%'
);

-- 2. Allow authenticated users to UPDATE their own avatar object.
CREATE POLICY "Avatar update: owner only"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE 'public/' || auth.uid()::text || '%'
)
WITH CHECK (
  bucket_id = 'avatars'
  AND name LIKE 'public/' || auth.uid()::text || '%'
);

-- 3. Allow authenticated users to SELECT (read) their own avatar.
--    Public avatars can be read by anyone via the public bucket URL,
--    but this policy covers authenticated reads via the storage API.
CREATE POLICY "Avatar select: public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 4. Allow authenticated users to DELETE their own avatar.
CREATE POLICY "Avatar delete: owner only"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE 'public/' || auth.uid()::text || '%'
);

-- ============================================================
-- VERIFY: After running, confirm policies are active:
--   SELECT * FROM storage.policies WHERE bucket_id = 'avatars';
-- ============================================================

-- ============================================================
-- Trust Score — Ensure profiles default is 50 (not 100)
-- ============================================================
-- If trust_score column has a default of 100, update it:
ALTER TABLE public.profiles
  ALTER COLUMN trust_score SET DEFAULT 50;

-- Existing users who signed up with trust_score = 100 should be
-- normalized to 50 ONLY if they have no other data (optional):
-- UPDATE public.profiles SET trust_score = 50 WHERE trust_score = 100;

-- ============================================================
-- Followers — Ensure RLS allows follow/unfollow operations
-- ============================================================
-- Make sure RLS is enabled on followers table
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to see all follower relationships
CREATE POLICY "followers_select_all"
ON public.followers
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own follow (follower_id = their uid)
CREATE POLICY "followers_insert_own"
ON public.followers
FOR INSERT
TO authenticated
WITH CHECK (follower_id = auth.uid());

-- Allow users to delete only their own follow relationships
CREATE POLICY "followers_delete_own"
ON public.followers
FOR DELETE
TO authenticated
USING (follower_id = auth.uid());
