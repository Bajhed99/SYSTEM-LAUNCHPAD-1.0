import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/auth/tenancy'
import BillingClient from '@/components/billing/BillingClient'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const org = await getCurrentOrganization()
  if (!org) {
    redirect('/auth/login')
  }

  return <BillingClient organization={org} />
}
