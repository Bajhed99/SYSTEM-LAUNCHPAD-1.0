import { BaseAgent, type AgentContext, type AgentResult, type AgentArtifact } from './base'
import { createClient } from '@/lib/supabase/server'

interface ActionItemData {
  title: string
  description?: string
  assignee?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scope_creep_flag: boolean
}

interface MeetingMindResult {
  meetingId: string
  transcriptId: string
  actionItems: ActionItemData[]
}

/**
 * MeetingMind Agent
 * Extracts action items, deadlines, owners, and scope creep flags from meeting transcripts
 */
export class MeetingMindAgent extends BaseAgent {
  name = 'meetingmind'

  async execute(context: AgentContext): Promise<AgentResult<MeetingMindResult>> {
    if (!this.validateContext(context)) {
      return this.error('Invalid context')
    }

    const { meetingId } = context.metadata || {}
    if (!meetingId || typeof meetingId !== 'string') {
      return this.error('Meeting ID required')
    }

    try {
      const supabase = await createClient()

      // Get transcript
      const { data: transcript, error: transcriptError } = await supabase
        .from('transcripts')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('organization_id', context.organizationId)
        .single()

      if (transcriptError || !transcript) {
        return this.error('Transcript not found')
      }

      // Call DeepSeek-V3 for action item extraction
      const actionItems = await this.extractActionItems(transcript.raw_text)

      // Store action items
      const storedItems = []
      for (const item of actionItems) {
        const { data: storedItem, error: insertError } = await supabase
          .from('action_items')
          .insert({
            meeting_id: meetingId,
            organization_id: context.organizationId,
            transcript_id: transcript.id,
            title: item.title,
            description: item.description,
            assignee: item.assignee,
            due_date: item.due_date,
            priority: item.priority,
            scope_creep_flag: item.scope_creep_flag,
            status: 'pending',
          })
          .select()
          .single()

        if (!insertError && storedItem) {
          storedItems.push(storedItem)
        }
      }

      // Update meeting status
      await supabase
        .from('meetings')
        .update({ status: 'analyzed' })
        .eq('id', meetingId)

      // Create artifacts
      const artifacts: AgentArtifact[] = [
        {
          type: 'json',
          content: {
            actionItems: storedItems,
            extractedAt: new Date().toISOString(),
          },
          metadata: {
            meetingId,
            transcriptId: transcript.id,
          },
        },
      ]

      return this.success(
        {
          meetingId,
          transcriptId: transcript.id,
          actionItems: storedItems,
        },
        artifacts
      )
    } catch (error) {
      console.error('MeetingMind agent error:', error)
      return this.error(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Extract action items using DeepSeek-V3
   * This would call the ISAIC-hosted DeepSeek-V3 API
   */
  private async extractActionItems(transcript: string): Promise<ActionItemData[]> {
    // TODO: Replace with actual DeepSeek-V3 API call to ISAIC
    // For now, return mock data structure
    
    const deepseekApiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions'
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY

    if (!deepseekApiKey) {
      console.warn('DeepSeek API key not configured, using mock extraction')
      return this.mockExtractActionItems(transcript)
    }

    try {
      const response = await fetch(deepseekApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are an expert at extracting action items from meeting transcripts. 
              Extract all action items with:
              - Title (concise, action-oriented)
              - Description (if available)
              - Assignee (if mentioned)
              - Due date (if mentioned, format as ISO 8601)
              - Priority (low, medium, high, urgent)
              - Scope creep flag (true if the action expands beyond original meeting scope)
              
              Return ONLY valid JSON array of action items.`,
            },
            {
              role: 'user',
              content: `Extract action items from this transcript:\n\n${transcript}`,
            },
          ],
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No content in DeepSeek response')
      }

      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ActionItemData[]
      }

      return JSON.parse(content) as ActionItemData[]
    } catch (error) {
      console.error('DeepSeek extraction error:', error)
      // Fallback to mock extraction
      return this.mockExtractActionItems(transcript)
    }
  }

  /**
   * Mock extraction for development/testing
   */
  private mockExtractActionItems(transcript: string): ActionItemData[] {
    // Simple keyword-based extraction for MVP
    const actionKeywords = ['action', 'todo', 'task', 'follow up', 'next steps', 'deadline']
    const lines = transcript.split('\n').filter((line) =>
      actionKeywords.some((keyword) => line.toLowerCase().includes(keyword))
    )

    return lines.slice(0, 5).map((line, index) => ({
      title: line.substring(0, 100),
      description: line.length > 100 ? line : undefined,
      priority: index === 0 ? 'high' : 'medium' as const,
      scope_creep_flag: false,
    }))
  }
}
