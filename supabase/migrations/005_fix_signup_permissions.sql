-- Fix RLS policies for signup flow

-- Allow authenticated users to create organizations
-- (They need this during the signup process, immediately after signing up via Auth)
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to create their own profile
-- (They need this during the signup process)
CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());
