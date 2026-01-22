/**
 * Base Agent Interface
 * All agents must implement this interface for consistent orchestration
 */

export interface AgentContext {
  organizationId: string
  userId: string
  metadata?: Record<string, unknown>
}

export interface AgentResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  artifacts?: AgentArtifact[]
}

export interface AgentArtifact {
  type: 'json' | 'task' | 'note' | 'chart' | 'report'
  content: unknown
  metadata?: Record<string, unknown>
}

export interface Agent {
  /**
   * Unique identifier for the agent
   */
  name: string

  /**
   * Execute the agent with given context
   */
  execute(context: AgentContext): Promise<AgentResult>
}

/**
 * Abstract base class for agents
 */
export abstract class BaseAgent implements Agent {
  abstract name: string

  abstract execute(context: AgentContext): Promise<AgentResult>

  /**
   * Validate context before execution
   */
  protected validateContext(context: AgentContext): boolean {
    return !!(context.organizationId && context.userId)
  }

  /**
   * Create a success result
   */
  protected success<T>(data?: T, artifacts?: AgentArtifact[]): AgentResult<T> {
    return {
      success: true,
      data,
      artifacts,
    }
  }

  /**
   * Create an error result
   */
  protected error(message: string): AgentResult {
    return {
      success: false,
      error: message,
    }
  }
}
