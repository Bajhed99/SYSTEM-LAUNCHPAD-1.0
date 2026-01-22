import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/auth/tenancy'

/**
 * Handle GHL OAuth callback
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const locationId = searchParams.get('locationId')

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    if (!code || !locationId) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=ghl_auth_failed`)
    }

    const org = await getCurrentOrganization()
    if (!org) {
      return NextResponse.redirect(`${baseUrl}/auth/login`)
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.gohighlevel.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/ghl/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=ghl_token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()

    // Get account info
    const accountResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
      },
    })

    let accountName = 'GoHighLevel'
    if (accountResponse.ok) {
      const accountData = await accountResponse.json()
      accountName = accountData.location?.name || accountName
    }

    // Store connection
    const supabase = await createClient()
    const { error: insertError } = await supabase
      .from('crm_connections')
      .insert({
        organization_id: org.id,
        crm_type: 'ghl',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        account_id: locationId,
        account_name: accountName,
        is_active: true,
        metadata: {
          locationId,
        },
      })

    if (insertError) {
      console.error('GHL connection save error:', insertError)
      return NextResponse.redirect(`${baseUrl}/dashboard?error=ghl_save_failed`)
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?success=ghl_connected`)
  } catch (error) {
    console.error('GHL callback error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/dashboard?error=ghl_callback_failed`)
  }
}
