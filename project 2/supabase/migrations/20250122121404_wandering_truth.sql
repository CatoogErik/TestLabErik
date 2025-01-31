/*
  # Add test results and invitations

  1. New Tables
    - `test_results`
      - Stores test feedback and results
      - Links to tests and testers
    - `test_invitations`
      - Manages test participation invites
      - Tracks invitation status

  2. Security
    - Enable RLS on new tables
    - Add policies for proper access control
*/

-- Test results table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  tester_id uuid REFERENCES testers(id) ON DELETE CASCADE,
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(test_id, tester_id)
);

-- Test invitations table
CREATE TABLE IF NOT EXISTS test_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  tester_id uuid REFERENCES testers(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(test_id, tester_id)
);

-- Enable RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_invitations ENABLE ROW LEVEL SECURITY;

-- Test results policies
CREATE POLICY "Company members can view test results"
  ON test_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tests
    JOIN products ON tests.product_id = products.id
    JOIN company_members ON products.company_id = company_members.company_id
    WHERE test_results.test_id = tests.id
    AND company_members.user_id = auth.uid()
  ));

CREATE POLICY "Testers can manage their own results"
  ON test_results FOR ALL
  USING (EXISTS (
    SELECT 1 FROM test_invitations
    WHERE test_invitations.test_id = test_results.test_id
    AND test_invitations.tester_id = test_results.tester_id
    AND test_invitations.status = 'accepted'
  ));

-- Test invitations policies
CREATE POLICY "Company members can manage test invitations"
  ON test_invitations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tests
    JOIN products ON tests.product_id = products.id
    JOIN company_members ON products.company_id = company_members.company_id
    WHERE test_invitations.test_id = tests.id
    AND company_members.user_id = auth.uid()
  ));

CREATE POLICY "Testers can view their invitations"
  ON test_invitations FOR SELECT
  USING (tester_id IN (
    SELECT id FROM testers
    WHERE email = auth.email()
  ));

-- Updated timestamp triggers
CREATE TRIGGER update_test_results_updated_at
  BEFORE UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_test_invitations_updated_at
  BEFORE UPDATE ON test_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();