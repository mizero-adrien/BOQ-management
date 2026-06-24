import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let prompt: string
  let max_tokens: number
  try {
    const body = await request.json() as { prompt?: string; max_tokens?: number }
    prompt = body.prompt ?? ''
    max_tokens = body.max_tokens ?? 1000
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!prompt) return Response.json({ error: 'Missing prompt' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'AI not configured on this server' }, { status: 503 })

  let aiResponse: Response
  try {
    aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } catch {
    return Response.json({ error: 'Could not reach AI service' }, { status: 502 })
  }

  if (!aiResponse.ok) {
    return Response.json({ error: 'AI service returned an error', status: aiResponse.status }, { status: 502 })
  }

  const data = await aiResponse.json() as { content?: { type: string; text: string }[] }
  const text = data.content?.find((c) => c.type === 'text')?.text ?? ''
  return Response.json({ text })
}
