'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'
import UnifiedCommandCenter from './UnifiedCommandCenter'
import MeetingMindPanel from './MeetingMindPanel'
import PlaybookStatus from './PlaybookStatus'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

interface DashboardClientProps {
  profile: UserProfile & { organization: Organization }
  hasAccess: boolean
}

export default function DashboardClient({ profile, hasAccess }: DashboardClientProps) {
  const router = useRouter()
  const [activeTool, setActiveTool] = useState<'command' | 'meeting' | 'playbook'>('command')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Required</h2>
          <p className="text-gray-600 mb-6">
            You need an active subscription to access SYSTEM Launchpad.
          </p>
          <a
            href="/billing"
            className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Subscribe Now
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">SYSTEM Launchpad</h1>
              <p className="text-xs text-gray-500">🇨🇦 Sovereign • PIPEDA Ready</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{profile.full_name || profile.email}</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-sm text-gray-600">{profile.organization.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTool('command')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTool === 'command'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Unified Command Center
            </button>
            <button
              onClick={() => setActiveTool('meeting')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTool === 'meeting'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              MeetingMind AI
            </button>
            <button
              onClick={() => setActiveTool('playbook')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTool === 'playbook'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Playbooks
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTool === 'command' && <UnifiedCommandCenter organizationId={profile.organization_id} />}
        {activeTool === 'meeting' && <MeetingMindPanel organizationId={profile.organization_id} />}
        {activeTool === 'playbook' && <PlaybookStatus organizationId={profile.organization_id} />}
      </main>
    </div>
  )
}
