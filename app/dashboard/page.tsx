import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile, hasActiveAccess } from '@/lib/auth/tenancy'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getCurrentUserProfile()
  if (!profile) {
    redirect('/auth/login')
  }

  const hasAccess = await hasActiveAccess()

  return <DashboardClient profile={profile} hasAccess={hasAccess} />
}
