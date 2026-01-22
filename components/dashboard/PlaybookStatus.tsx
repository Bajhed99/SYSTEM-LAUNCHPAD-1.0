'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type PlaybookRun = Database['public']['Tables']['playbook_runs']['Row']
type CrmConnection = Database['public']['Tables']['crm_connections']['Row']

interface PlaybookStatusProps {
  organizationId: string
}

export default function PlaybookStatus({ organizationId }: PlaybookStatusProps) {
  const [playbookRuns, setPlaybookRuns] = useState<PlaybookRun[]>([])
  const [crmConnections, setCrmConnections] = useState<CrmConnection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    const supabase = createClient()
    
    const [runsRes, connectionsRes] = await Promise.all([
      supabase
        .from('playbook_runs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('crm_connections')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true),
    ])

    if (runsRes.data) setPlaybookRuns(runsRes.data)
    if (connectionsRes.data) setCrmConnections(connectionsRes.data)
    setLoading(false)
  }

  const handleGHLConnect = () => {
    window.location.href = '/api/crm/ghl/connect'
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Intelligence Playbooks</h2>
        <p className="text-gray-600">n8n automation workflows and CRM sync status</p>
      </div>

      {/* CRM Connections */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">CRM Connections</h3>
          {!crmConnections.some((c) => c.crm_type === 'ghl') && (
            <button
              onClick={handleGHLConnect}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Connect GoHighLevel
            </button>
          )}
        </div>
        <div className="p-6">
          {crmConnections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No CRM connections configured</p>
              <button
                onClick={handleGHLConnect}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Connect GoHighLevel
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {crmConnections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-md"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">{conn.crm_type}</h4>
                    {conn.account_name && (
                      <p className="text-sm text-gray-500 mt-1">{conn.account_name}</p>
                    )}
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                    Connected
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Playbook Runs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Playbook Executions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {playbookRuns.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No playbook runs yet. Playbooks will execute automatically after meeting analysis.
            </div>
          ) : (
            playbookRuns.map((run) => (
              <div key={run.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">{run.playbook_type}</h4>
                    {run.n8n_execution_id && (
                      <p className="text-sm text-gray-500 mt-1">
                        Execution ID: {run.n8n_execution_id}
                      </p>
                    )}
                    {run.error_message && (
                      <p className="text-sm text-red-600 mt-1">{run.error_message}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        run.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : run.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : run.status === 'running'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {run.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(run.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
