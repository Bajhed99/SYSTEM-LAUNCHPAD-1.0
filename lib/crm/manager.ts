import { createClient } from '@/lib/supabase/server'
import type { CrmAdapter, CrmTask, CrmNote } from './adapters/base'
import { GHLAdapter } from './adapters/ghl'

/**
 * CRM Manager
 * Routes CRM operations to appropriate adapter
 */
export class CrmManager {
  private adapters: Map<string, CrmAdapter> = new Map()

  constructor() {
    // Register adapters
    this.adapters.set('ghl', new GHLAdapter())
    // Future: this.adapters.set('hubspot', new HubSpotAdapter())
    // Future: this.adapters.set('salesforce', new SalesforceAdapter())
  }

  /**
   * Get active CRM connection for organization
   */
  async getActiveConnection(
    organizationId: string,
    crmType: 'ghl' | 'hubspot' | 'salesforce' = 'ghl'
  ) {
    const supabase = await createClient()
    const { data: connection } = await supabase
      .from('crm_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('crm_type', crmType)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return null
    }

    return {
      id: connection.id,
      organizationId: connection.organization_id,
      crmType: connection.crm_type,
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token || undefined,
      tokenExpiresAt: connection.token_expires_at
        ? new Date(connection.token_expires_at)
        : undefined,
      accountId: connection.account_id || undefined,
      accountName: connection.account_name || undefined,
      isActive: connection.is_active,
    }
  }

  /**
   * Create task in CRM
   */
  async createTask(
    organizationId: string,
    task: CrmTask,
    crmType: 'ghl' | 'hubspot' | 'salesforce' = 'ghl'
  ) {
    const connection = await this.getActiveConnection(organizationId, crmType)
    if (!connection) {
      throw new Error(`No active ${crmType} connection found`)
    }

    const adapter = this.adapters.get(crmType)
    if (!adapter) {
      throw new Error(`No adapter found for ${crmType}`)
    }

    return adapter.createTask(connection, task)
  }

  /**
   * Create note in CRM
   */
  async createNote(
    organizationId: string,
    note: CrmNote,
    crmType: 'ghl' | 'hubspot' | 'salesforce' = 'ghl'
  ) {
    const connection = await this.getActiveConnection(organizationId, crmType)
    if (!connection) {
      throw new Error(`No active ${crmType} connection found`)
    }

    const adapter = this.adapters.get(crmType)
    if (!adapter) {
      throw new Error(`No adapter found for ${crmType}`)
    }

    return adapter.createNote(connection, note)
  }
}
