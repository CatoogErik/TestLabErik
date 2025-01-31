# TestLab Backend Documentation

## Database Schema Overview

The TestLab application uses a Supabase PostgreSQL database with Row Level Security (RLS) for data protection. Below is a detailed description of each table and its relationships.

### Core Tables

#### `profiles`
- Primary user profiles linked to Supabase Auth
- **Primary Key**: `id` (uuid, references auth.users)
- **Fields**:
  - `email` (text, required)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **Security**:
  - Users can only read and update their own profile
  - Automatically created when a new user signs up

#### `companies`
- Represents organizations using the platform
- **Primary Key**: `id` (uuid)
- **Fields**:
  - `name` (text, required)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **Security**:
  - Company members can view their company
  - Only admins can update company details

#### `company_members`
- Links users to companies with role-based access
- **Primary Key**: `id` (uuid)
- **Fields**:
  - `company_id` (uuid, references companies)
  - `user_id` (uuid, references auth.users)
  - `role` (text, either 'admin' or 'member')
  - `created_at` (timestamptz)
- **Constraints**: Unique combination of company_id and user_id
- **Security**:
  - Company admins can manage members
  - Members can view other company members

### Product Management

#### `products`
- Products that can be tested
- **Primary Key**: `id` (uuid)
- **Fields**:
  - `company_id` (uuid, references companies)
  - `name` (text, required)
  - `description` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **Security**:
  - Company members can view and manage their company's products

### Testing System

#### `tests`
- Test configurations for products
- **Primary Key**: `id` (uuid)
- **Fields**:
  - `product_id` (uuid, references products)
  - `created_by` (uuid, references auth.users)
  - `title` (text, required)
  - `description` (text, optional)
  - `is_private` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **Security**:
  - Users can view their own tests and shared tests
  - Private tests are only visible to creators and explicitly shared users

#### `test_shares`
- Manages test sharing between users
- **Primary Key**: `id` (uuid)
- **Fields**:
  - `test_id` (uuid, references tests)
  - `shared_with_user_id` (uuid, references auth.users)
  - `created_at` (timestamptz)
- **Constraints**: Unique combination of test_id and shared_with_user_id
- **Security**:
  - Test creators can manage shares
  - Users can view their received shares

### Tester Management

#### `testers`
- External test participants
- **Primary Key**: `id` (uuid)
- **Fields**:
  - `company_id` (uuid, references companies)
  - `name` (text, required)
  - `email` (text, required)
  - `phone` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **Constraints**: Unique combination of company_id and email
- **Security**:
  - Company members can view and manage testers

#### `test_invitations`
- Manages test participation invitations
- **Primary Key**: `id` (uuid)
- **Fields**:
  - `test_id` (uuid, references tests)
  - `tester_id` (uuid, references testers)
  - `status` (text: 'pending', 'accepted', 'declined', 'completed')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **Constraints**: Unique combination of test_id and tester_id
- **Security**:
  - Company members can manage invitations
  - Testers can view their own invitations

#### `test_results`
- Stores feedback and ratings from testers
- **Primary Key**: `id` (uuid)
- **Fields**:
  - `test_id` (uuid, references tests)
  - `tester_id` (uuid, references testers)
  - `feedback` (text, optional)
  - `rating` (integer, 1-5)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **Constraints**: 
  - Unique combination of test_id and tester_id
  - Rating must be between 1 and 5
- **Security**:
  - Company members can view results
  - Testers can manage their own results

## Row Level Security (RLS)

All tables have Row Level Security enabled with specific policies:

1. **Company-based Access**:
   - Members can view their company's data
   - Admins have additional management privileges

2. **Test Privacy**:
   - Private tests are only visible to creators and shared users
   - Public tests are visible to all company members

3. **Tester Protection**:
   - Testers can only access their own invitations and results
   - Company members can manage testers within their company

## Automated Features

1. **Timestamp Management**:
   - `created_at` automatically set on record creation
   - `updated_at` automatically updated via triggers

2. **User Management**:
   - Profile automatically created when user signs up
   - Cascading deletes protect referential integrity

## Database Relationships

1. **Company Hierarchy**:
   ```
   Company
     ├── Company Members (Users)
     ├── Products
     │     └── Tests
     │           ├── Test Shares
     │           ├── Test Invitations
     │           └── Test Results
     └── Testers
           ├── Test Invitations
           └── Test Results
   ```

2. **User Connections**:
   ```
   User (auth.users)
     ├── Profile
     ├── Company Memberships
     └── Created Tests
   ```

This schema design ensures:
- Clear ownership and access control
- Scalable test management
- Secure data isolation between companies
- Flexible test sharing and collaboration
- Comprehensive result tracking