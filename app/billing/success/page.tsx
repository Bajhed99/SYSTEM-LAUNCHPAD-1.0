import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/auth/tenancy'

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const org = await getCurrentOrganization()
  if (!org) {
    redirect('/auth/login')
  }

  // Refresh org data to get updated subscription status
  const { data: updatedOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', org.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h1>
        <p className="text-gray-600 mb-6">
          Your subscription has been successfully activated. You now have full access to SYSTEM
          Launchpad.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
