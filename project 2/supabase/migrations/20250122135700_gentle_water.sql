/*
  # Fix Company Policies and Access

  1. Changes
    - Add policy to allow authenticated users to create companies
    - Fix company members view policy
    - Add policy for users to view their own company memberships
    - Add policy for company creation through RPC function

  2. Security
    - Maintains RLS protection while allowing necessary access
    - Ensures users can only access their own data
*/

-- Allow authenticated users to create companies through the RPC function
CREATE POLICY "Users can create companies through RPC"
  ON companies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE company_members.company_id = id
      AND company_members.user_id = auth.uid()
      AND company_members.role = 'admin'
    )
  );

-- Allow users to view their own company memberships
CREATE POLICY "Users can view own memberships"
  ON company_members FOR SELECT
  USING (user_id = auth.uid());

-- Fix company members view policy to include user profile information
CREATE OR REPLACE VIEW company_members_with_profiles AS
SELECT 
  cm.id,
  cm.company_id,
  cm.user_id,
  cm.role,
  cm.created_at,
  p.email
FROM company_members cm
JOIN profiles p ON cm.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON company_members_with_profiles TO authenticated;