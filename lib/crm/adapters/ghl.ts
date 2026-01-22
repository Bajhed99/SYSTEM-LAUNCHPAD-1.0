import type { CrmAdapter, CrmTask, CrmNote, CrmConnection } from './base'
import { createClient } from '@/lib/supabase/server'

/**
 * GoHighLevel CRM Adapter
 * Implements OAuth-based integration with GHL API
 */
export class GHLAdapter implements CrmAdapter {
  readonly crmType = 'ghl' as const

  private readonly apiBaseUrl = 'https://services.leadconnectorhq.com'

  async createTask(connection: CrmConnection, task: CrmTask): Promise<{ id: string }> {
    const validatedConnection = await this.ensureValidToken(connection)

    const response = await fetch(`${this.apiBaseUrl}/tasks/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validatedConnection.accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        title: task.title,
        body: task.description || '',
        assignedTo: task.assignee,
        dueDate: task.dueDate,
        priority: this.mapPriority(task.priority),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GHL task creation failed: ${error}`)
    }

    const data = await response.json()
    return { id: data.task?.id || data.id }
  }

  async createNote(connection: CrmConnection, note: CrmNote): Promise<{ id: string }> {
    const validatedConnection = await this.ensureValidToken(connection)

    // GHL notes are typically associated with contacts
    // For MVP, we'll create a note in the general notes endpoint
    const response = await fetch(`${this.apiBaseUrl}/notes/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validatedConnection.accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        body: note.content,
        contactId: note.relatedTo,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GHL note creation failed: ${error}`)
    }

    const data = await response.json()
    return { id: data.note?.id || data.id }
  }

  async refreshToken(connection: CrmConnection): Promise<CrmConnection> {
    if (!connection.refreshToken) {
      throw new Error('No refresh token available')
    }

    // GHL OAuth token refresh
    const response = await fetch('https://api.gohighlevel.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: connection.refreshToken,
        grant_type: 'refresh_token',
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
      }),
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()

    // Update connection in database
    const supabase = await createClient()
    await supabase
      .from('crm_connections')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq('id', connection.id)

    return {
      ...connection,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  }

  async validateConnection(connection: CrmConnection): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/contacts/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'Version': '2021-07-28',
        },
      })

      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Ensure token is valid, refresh if needed
   */
  private async ensureValidToken(connection: CrmConnection): Promise<CrmConnection> {
    if (connection.tokenExpiresAt && connection.tokenExpiresAt > new Date()) {
      return connection
    }

    return this.refreshToken(connection)
  }

  /**
   * Map our priority levels to GHL priority
   */
  private mapPriority(
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  ): 'low' | 'normal' | 'high' {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'high'
      case 'low':
        return 'low'
      default:
        return 'normal'
    }
  }
}
