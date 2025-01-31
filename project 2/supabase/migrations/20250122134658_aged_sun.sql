/*
  # Add create_company_with_admin function

  1. New Functions
    - `create_company_with_admin`: Creates a company and adds the creator as an admin in a single transaction
  
  2. Security
    - Function is accessible to authenticated users only
    - Ensures atomic company creation with admin assignment
*/

CREATE OR REPLACE FUNCTION create_company_with_admin(
  company_name text,
  admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company companies;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Create company
  INSERT INTO companies (name)
  VALUES (company_name)
  RETURNING * INTO new_company;

  -- Add admin member
  INSERT INTO company_members (company_id, user_id, role)
  VALUES (new_company.id, admin_id, 'admin');

  RETURN json_build_object(
    'id', new_company.id,
    'name', new_company.name,
    'created_at', new_company.created_at
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_company_with_admin TO authenticated;