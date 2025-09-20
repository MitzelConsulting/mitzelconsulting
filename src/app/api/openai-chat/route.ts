import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  // Use the provided Assistant ID
  const assistantId = process.env.OPENAI_ASSISTANT_ID || 'asst_m1BZ2M66g9Lanh7iYMtJZcOX'

  // If no API key, return a demo response
  if (!apiKey) {
    const lastMessage = messages[messages.length - 1]?.content || ''
    const demoResponse = `🎵 **Demo Mode** - This is a demo response since OpenAI API key is not configured.
    
Your message: "${lastMessage}"

In the live version, this would connect to the AI Music Manager to help you discover and support artists! 🚀`
    
    return NextResponse.json({ reply: demoResponse })
  }

  try {
    // Create a new thread for each conversation (stateless, or you can persist thread_id for stateful)
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: messages[messages.length-1].content }] })
    })
    const thread = await threadRes.json()
    if (!thread.id) {
      console.error('OpenAI thread creation failed:', thread);
      throw new Error('Failed to create thread')
    }

    // Run the assistant on the thread
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({ assistant_id: assistantId })
    })
    const run = await runRes.json()
    if (!run.id) throw new Error('Failed to start assistant run')

    // Poll for completion
    let status = run.status
    let runResult = run
    while (status !== 'completed' && status !== 'failed' && status !== 'cancelled') {
      await new Promise(res => setTimeout(res, 1000))
      const pollRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      })
      runResult = await pollRes.json()
      status = runResult.status
    }
    if (status !== 'completed') throw new Error('Assistant run failed')

    // Get the messages from the thread
    const msgRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })
    const msgData = await msgRes.json()
    const lastMsg = msgData.data && (msgData.data as any[]).reverse().find((m: any) => m.role === 'assistant')
    const reply = lastMsg?.content?.[0]?.text?.value || 'Sorry, no response.'
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('OpenAI Assistant API error:', err);
    return NextResponse.json({ error: err.message || 'OpenAI Assistants API error' }, { status: 500 })
  }
} 