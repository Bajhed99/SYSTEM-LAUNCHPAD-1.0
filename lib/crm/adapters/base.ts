/**
 * Base CRM Adapter Interface
 * Platform-agnostic abstraction for CRM integrations
 */

export interface CrmTask {
  title: string
  description?: string
  assignee?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: Record<string, unknown>
}

export interface CrmNote {
  content: string
  relatedTo?: string // Contact/Deal ID
  metadata?: Record<string, unknown>
}

export interface CrmConnection {
  id: string
  organizationId: string
  crmType: 'ghl' | 'hubspot' | 'salesforce'
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: Date
  accountId?: string
  accountName?: string
  isActive: boolean
}

export interface CrmAdapter {
  /**
   * CRM type identifier
   */
  readonly crmType: 'ghl' | 'hubspot' | 'salesforce'

  /**
   * Create a task in the CRM
   */
  createTask(connection: CrmConnection, task: CrmTask): Promise<{ id: string }>

  /**
   * Create a note in the CRM
   */
  createNote(connection: CrmConnection, note: CrmNote): Promise<{ id: string }>

  /**
   * Refresh access token if expired
   */
  refreshToken(connection: CrmConnection): Promise<CrmConnection>

  /**
   * Validate connection is active
   */
  validateConnection(connection: CrmConnection): Promise<boolean>
}
