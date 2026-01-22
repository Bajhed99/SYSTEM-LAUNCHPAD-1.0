import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/auth/tenancy'

/**
 * Initiate GHL OAuth flow
 */
export async function GET() {
  try {
    const org = await getCurrentOrganization()
    if (!org) {
      return NextResponse.redirect('/auth/login')
    }

    const clientId = process.env.GHL_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/ghl/callback`

    if (!clientId) {
      return NextResponse.json({ error: 'GHL client ID not configured' }, { status: 500 })
    }

    // GHL OAuth authorization URL
    const authUrl = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'tasks.write notes.write contacts.read')

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('GHL connect error:', error)
    return NextResponse.json({ error: 'Failed to initiate connection' }, { status: 500 })
  }
}
