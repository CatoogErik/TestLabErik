/*
  # Add company and product management tables

  1. New Tables
    - `companies` - Store company information
    - `company_members` - User-company relationships with roles
    - `products` - Products for testing
    - `tests` - Test cases with privacy settings
    - `testers` - External testers list
    - `test_shares` - Test sharing permissions

  2. Security
    - Enable RLS on all tables
    - Policies for company-based access control
    - Policies for test sharing and privacy
*/

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company members table with roles
CREATE TABLE IF NOT EXISTS company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Testers table (external testers)
CREATE TABLE IF NOT EXISTS testers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Test shares table
CREATE TABLE IF NOT EXISTS test_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(test_id, shared_with_user_id)
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_shares ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Company members can view their company"
  ON companies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = companies.id
    AND company_members.user_id = auth.uid()
  ));

CREATE POLICY "Company admins can update their company"
  ON companies FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = companies.id
    AND company_members.user_id = auth.uid()
    AND company_members.role = 'admin'
  ));

-- Company members policies
CREATE POLICY "Company admins can manage members"
  ON company_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_members.company_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
  ));

CREATE POLICY "Members can view company members"
  ON company_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = company_members.company_id
    AND cm.user_id = auth.uid()
  ));

-- Products policies
CREATE POLICY "Company members can view products"
  ON products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = products.company_id
    AND company_members.user_id = auth.uid()
  ));

CREATE POLICY "Company members can manage products"
  ON products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = products.company_id
    AND company_members.user_id = auth.uid()
  ));

-- Tests policies
CREATE POLICY "Users can view their own and shared tests"
  ON tests FOR SELECT
  USING (
    created_by = auth.uid()
    OR NOT is_private
    OR EXISTS (
      SELECT 1 FROM test_shares
      WHERE test_shares.test_id = tests.id
      AND test_shares.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own tests"
  ON tests FOR ALL
  USING (created_by = auth.uid());

-- Testers policies
CREATE POLICY "Company members can view testers"
  ON testers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = testers.company_id
    AND company_members.user_id = auth.uid()
  ));

CREATE POLICY "Company members can manage testers"
  ON testers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = testers.company_id
    AND company_members.user_id = auth.uid()
  ));

-- Test shares policies
CREATE POLICY "Test creators can manage shares"
  ON test_shares FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tests
    WHERE tests.id = test_shares.test_id
    AND tests.created_by = auth.uid()
  ));

CREATE POLICY "Users can view their test shares"
  ON test_shares FOR SELECT
  USING (shared_with_user_id = auth.uid());

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_testers_updated_at
  BEFORE UPDATE ON testers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();