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
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

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
CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

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
CREATE POLICY "Users can view meetings in their organization"
  ON meetings FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create meetings in their organization"
  ON meetings FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    created_by = auth.uid()
  );

CREATE POLICY "Users can update meetings in their organization"
  ON meetings FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete meetings in their organization"
  ON meetings FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Transcripts RLS Policies
CREATE POLICY "Users can view transcripts in their organization"
  ON transcripts FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create transcripts in their organization"
  ON transcripts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update transcripts in their organization"
  ON transcripts FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Action Items RLS Policies
CREATE POLICY "Users can view action items in their organization"
  ON action_items FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create action items in their organization"
  ON action_items FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update action items in their organization"
  ON action_items FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete action items in their organization"
  ON action_items FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Playbook Runs RLS Policies
CREATE POLICY "Users can view playbook runs in their organization"
  ON playbook_runs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create playbook runs in their organization"
  ON playbook_runs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update playbook runs in their organization"
  ON playbook_runs FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- CRM Connections RLS Policies
CREATE POLICY "Users can view CRM connections in their organization"
  ON crm_connections FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can create CRM connections in their organization"
  ON crm_connections FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update CRM connections in their organization"
  ON crm_connections FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

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
CREATE POLICY "Users can view audit logs in their organization"
  ON audit_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
