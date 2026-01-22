import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEEPSEEK_API_URL = Deno.env.get('DEEPSEEK_API_URL') || 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')

serve(async (req) => {
  try {
    const { meetingId, transcriptId, organizationId } = await req.json()

    if (!meetingId || !transcriptId || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('id', transcriptId)
      .eq('organization_id', organizationId)
      .single()

    if (transcriptError || !transcript) {
      throw new Error('Transcript not found')
    }

    // Extract action items using DeepSeek-V3
    let actionItems: Array<{
      title: string
      description?: string
      assignee?: string
      due_date?: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
      scope_creep_flag: boolean
    }> = []

    if (DEEPSEEK_API_KEY) {
      try {
        const response = await fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `You are an expert at extracting action items from meeting transcripts.
Extract all action items with:
- title (concise, action-oriented)
- description (if available)
- assignee (if mentioned)
- due_date (if mentioned, format as ISO 8601)
- priority (low, medium, high, urgent)
- scope_creep_flag (true if the action expands beyond original meeting scope)

Return ONLY valid JSON array of action items.`,
              },
              {
                role: 'user',
                content: `Extract action items from this transcript:\n\n${transcript.raw_text}`,
              },
            ],
            temperature: 0.3,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content

          if (content) {
            const jsonMatch = content.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              actionItems = JSON.parse(jsonMatch[0])
            } else {
              actionItems = JSON.parse(content)
            }
          }
        }
      } catch (error) {
        console.error('DeepSeek extraction error:', error)
        // Fallback to simple extraction
        actionItems = extractActionItemsSimple(transcript.raw_text)
      }
    } else {
      // Mock extraction for development
      actionItems = extractActionItemsSimple(transcript.raw_text)
    }

    // Store action items
    const storedItems = []
    for (const item of actionItems) {
      const { data: storedItem, error: insertError } = await supabase
        .from('action_items')
        .insert({
          meeting_id: meetingId,
          organization_id: organizationId,
          transcript_id: transcriptId,
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

    // Trigger playbook if configured
    try {
      await supabase.functions.invoke('trigger-playbook', {
        body: {
          meetingId,
          organizationId,
          playbookType: 'ghl_sync',
        },
      })
    } catch (error) {
      console.error('Playbook trigger error:', error)
      // Don't fail if playbook trigger fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        actionItems: storedItems,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('MeetingMind agent error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function extractActionItemsSimple(transcript: string): Array<{
  title: string
  description?: string
  assignee?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scope_creep_flag: boolean
}> {
  const actionKeywords = ['action', 'todo', 'task', 'follow up', 'next steps', 'deadline', 'need to']
  const lines = transcript.split('\n').filter((line) =>
    actionKeywords.some((keyword) => line.toLowerCase().includes(keyword))
  )

  return lines.slice(0, 5).map((line, index) => ({
    title: line.substring(0, 100).trim(),
    description: line.length > 100 ? line : undefined,
    priority: index === 0 ? 'high' : 'medium' as const,
    scope_creep_flag: false,
  }))
}
