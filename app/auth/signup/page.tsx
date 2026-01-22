import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignupForm from '@/components/auth/SignupForm'

export default async function SignupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SYSTEM Launchpad</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sovereign Agentic OS for Canadian Professionals
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
