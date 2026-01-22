'use client'

import { useState } from 'react'
import type { Database } from '@/lib/types/database'

type Organization = Database['public']['Tables']['organizations']['Row']

interface BillingClientProps {
  organization: Organization
}

export default function BillingClient({ organization }: BillingClientProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
      setLoading(false)
    }
  }

  const isActive = organization.subscription_status === 'active' || organization.is_founding_member

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600 mb-8">
            Subscribe to SYSTEM Launchpad for full access to all agentic tools
          </p>

          {isActive ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-2">Active Subscription</h2>
              <p className="text-green-700">
                {organization.is_founding_member
                  ? 'You are a founding member with lifetime access.'
                  : 'Your subscription is active.'}
              </p>
              {organization.subscription_status && (
                <p className="text-sm text-green-600 mt-2">
                  Status: {organization.subscription_status}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Monthly Subscription</h2>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">$97</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5"
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
                    <span className="text-gray-700">Unlimited meeting transcriptions</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5"
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
                    <span className="text-gray-700">AI-powered action item extraction</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5"
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
                    <span className="text-gray-700">CRM integration (GHL, HubSpot, Salesforce)</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5"
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
                    <span className="text-gray-700">Automated playbook workflows</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5"
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
                    <span className="text-gray-700">🇨🇦 100% Canadian data sovereignty</span>
                  </li>
                </ul>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Founding Member Program:</strong> Early adopters get lifetime access.
                  Contact support to upgrade.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
