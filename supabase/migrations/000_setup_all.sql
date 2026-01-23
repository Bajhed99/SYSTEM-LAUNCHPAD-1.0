-- ============================================
-- COMPLETE DATABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Migration 001: Initial Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Organizations table (multi-tenant root)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
  is_founding_member BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_date TIMESTAMPTZ,
  audio_file_url TEXT,
  audio_file_size BIGINT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'transcribed', 'analyzed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  structured_data JSONB DEFAULT '{}',
  voxtral_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action Items table
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transcript_id UUID REFERENCES transcripts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scope_creep_flag BOOLEAN DEFAULT false,
  ghl_task_id TEXT,
  ghl_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playbook Runs table
CREATE TABLE IF NOT EXISTS playbook_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  playbook_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  n8n_execution_id TEXT,
  payload JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Connections table
CREATE TABLE IF NOT EXISTS crm_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  crm_type TEXT NOT NULL CHECK (crm_type IN ('ghl', 'hubspot', 'salesforce')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  account_id TEXT,
  account_name TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_meetings_org_id ON meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_org_id ON transcripts(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_action_items_org_id ON action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_playbook_runs_org_id ON playbook_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_playbook_runs_status ON playbook_runs(status);
CREATE INDEX IF NOT EXISTS idx_crm_connections_org_id ON crm_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_connections_type ON crm_connections(crm_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_action_items_updated_at ON action_items;
CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_connections_updated_at ON crm_connections;
CREATE TRIGGER update_crm_connections_updated_at BEFORE UPDATE ON crm_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration 002: RLS Policies
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations RLS Policies
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can update any profile in their org" ON user_profiles;
CREATE POLICY "Admins can update any profile in their org"
  ON user_profiles FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Meetings RLS Policies
DROP POLICY IF EXISTS "Users can view meetings in their organization" ON meetings;
CREATE POLICY "Users can view meetings in their organization"
  ON meetings FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can create meetings in their organization" ON meetings;
CREATE POLICY "Users can create meetings in their organization"
  ON meetings FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update meetings in their organization" ON meetings;
CREATE POLICY "Users can update meetings in their organization"
  ON meetings FOR UPDATE
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can delete meetings in their organization" ON meetings;
CREATE POLICY "Users can delete meetings in their organization"
  ON meetings FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Transcripts RLS Policies
DROP POLICY IF EXISTS "Users can view transcripts in their organization" ON transcripts;
CREATE POLICY "Users can view transcripts in their organization"
  ON transcripts FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can create transcripts in their organization" ON transcripts;
CREATE POLICY "Users can create transcripts in their organization"
  ON transcripts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update transcripts in their organization" ON transcripts;
CREATE POLICY "Users can update transcripts in their organization"
  ON transcripts FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Action Items RLS Policies
DROP POLICY IF EXISTS "Users can view action items in their organization" ON action_items;
CREATE POLICY "Users can view action items in their organization"
  ON action_items FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can create action items in their organization" ON action_items;
CREATE POLICY "Users can create action items in their organization"
  ON action_items FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update action items in their organization" ON action_items;
CREATE POLICY "Users can update action items in their organization"
  ON action_items FOR UPDATE
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can delete action items in their organization" ON action_items;
CREATE POLICY "Users can delete action items in their organization"
  ON action_items FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Playbook Runs RLS Policies
DROP POLICY IF EXISTS "Users can view playbook runs in their organization" ON playbook_runs;
CREATE POLICY "Users can view playbook runs in their organization"
  ON playbook_runs FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can create playbook runs in their organization" ON playbook_runs;
CREATE POLICY "Users can create playbook runs in their organization"
  ON playbook_runs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update playbook runs in their organization" ON playbook_runs;
CREATE POLICY "Users can update playbook runs in their organization"
  ON playbook_runs FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- CRM Connections RLS Policies
DROP POLICY IF EXISTS "Users can view CRM connections in their organization" ON crm_connections;
CREATE POLICY "Users can view CRM connections in their organization"
  ON crm_connections FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Admins can create CRM connections in their organization" ON crm_connections;
CREATE POLICY "Admins can create CRM connections in their organization"
  ON crm_connections FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update CRM connections in their organization" ON crm_connections;
CREATE POLICY "Admins can update CRM connections in their organization"
  ON crm_connections FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete CRM connections in their organization" ON crm_connections;
CREATE POLICY "Admins can delete CRM connections in their organization"
  ON crm_connections FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit Logs RLS Policies
DROP POLICY IF EXISTS "Users can view audit logs in their organization" ON audit_logs;
CREATE POLICY "Users can view audit logs in their organization"
  ON audit_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;
CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Migration 003: Storage Bucket
-- Create storage bucket for meeting audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-audio', 'meeting-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for meeting-audio bucket
DROP POLICY IF EXISTS "Users can upload audio files" ON storage.objects;
CREATE POLICY "Users can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meeting-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = (SELECT organization_id::text FROM user_profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view audio files in their organization" ON storage.objects;
CREATE POLICY "Users can view audio files in their organization"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meeting-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = (SELECT organization_id::text FROM user_profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete audio files in their organization" ON storage.objects;
CREATE POLICY "Users can delete audio files in their organization"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meeting-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = (SELECT organization_id::text FROM user_profiles WHERE id = auth.uid())
);

-- Migration 004: Playbook Trigger
-- Function to automatically trigger playbook after meeting analysis
CREATE OR REPLACE FUNCTION trigger_playbook_after_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if meeting status changed to 'analyzed'
  IF NEW.status = 'analyzed' AND OLD.status != 'analyzed' THEN
    -- Insert playbook run record (actual execution handled by API/webhook)
    INSERT INTO playbook_runs (
      organization_id,
      meeting_id,
      playbook_type,
      status,
      payload
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      'ghl_sync',
      'pending',
      jsonb_build_object('meeting_id', NEW.id, 'triggered_by', 'status_change')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on meetings table
DROP TRIGGER IF EXISTS meetings_playbook_trigger ON meetings;
CREATE TRIGGER meetings_playbook_trigger
AFTER UPDATE ON meetings
FOR EACH ROW
WHEN (NEW.status = 'analyzed' AND OLD.status != 'analyzed')
EXECUTE FUNCTION trigger_playbook_after_analysis();

-- ============================================
-- SETUP COMPLETE!
-- You can now sign up and log in to your app
-- ============================================
