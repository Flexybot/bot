/*
  # Multi-tenant Chatbot Platform Schema

  1. Tables
    - organizations
      - id (uuid, primary key)
      - name (text)
      - created_at (timestamp)
      
    - users
      - id (uuid, primary key)
      - email (text)
      - organization_id (uuid, foreign key)
      - role (text)
      - created_at (timestamp)
      
    - documents
      - id (uuid, primary key)
      - organization_id (uuid, foreign key)
      - title (text)
      - content (text)
      - embedding (vector)
      - created_at (timestamp)
      - updated_at (timestamp)
      
    - chats
      - id (uuid, primary key)
      - organization_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - title (text)
      - created_at (timestamp)
      
    - messages
      - id (uuid, primary key)
      - chat_id (uuid, foreign key)
      - role (text)
      - content (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for organization-based access
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Organizations table
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Documents table
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  title text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Chats table
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  user_id uuid REFERENCES users(id),
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id),
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can read their own organization
CREATE POLICY "Users can view own organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Users: Users can read other users in their organization
CREATE POLICY "Users can view organization members"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Documents: Users can read documents in their organization
CREATE POLICY "Users can view organization documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Chats: Users can read their own chats
CREATE POLICY "Users can view own chats"
  ON chats
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Messages: Users can read messages from their chats
CREATE POLICY "Users can view chat messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    chat_id IN (
      SELECT id 
      FROM chats 
      WHERE user_id = auth.uid()
    )
  );