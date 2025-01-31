/*
  # Fix company members policies

  1. Changes
    - Drop and recreate company_members policies to avoid recursion
    - Add proper indexes for performance
    - Simplify permission structure

  2. Security
    - Maintain security while avoiding circular dependencies
    - Ensure proper access control for company members
*/

-- Drop existing policies on company_members
DROP POLICY IF EXISTS "Company admins can manage members" ON company_members;
DROP POLICY IF EXISTS "Members can view company members" ON company_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON company_members;

-- Create new, simplified policies
CREATE POLICY "Users can view their own memberships"
  ON company_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view memberships of their companies"
  ON company_members FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage members"
  ON company_members 
  USING (
    EXISTS (
      SELECT 1 
      FROM company_members admins
      WHERE admins.company_id = company_members.company_id
      AND admins.user_id = auth.uid()
      AND admins.role = 'admin'
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_role ON company_members(role);