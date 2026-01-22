import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

type Organization = Database['public']['Tables']['organizations']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

/**
 * Get the current user's organization
 */
export async function getCurrentOrganization(): Promise<Organization | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single()

  return org
}

/**
 * Get the current user's profile with organization
 */
export async function getCurrentUserProfile(): Promise<(UserProfile & { organization: Organization }) | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`
      *,
      organizations (*)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || !profile.organizations) return null

  return {
    ...profile,
    organization: Array.isArray(profile.organizations) 
      ? profile.organizations[0] 
      : profile.organizations as Organization
  }
}

/**
 * Check if user has active subscription or is founding member
 */
export async function hasActiveAccess(): Promise<boolean> {
  const org = await getCurrentOrganization()
  if (!org) return false

  return org.subscription_status === 'active' || 
         org.subscription_status === 'trialing' || 
         org.is_founding_member
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}
