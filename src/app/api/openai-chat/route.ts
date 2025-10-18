import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'

export async function POST(req: NextRequest) {
  const { messages, query } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  const pineconeApiKey = process.env.PINECONE_API_KEY

  // If no API key, return a demo response
  if (!apiKey) {
    const lastMessage = messages[messages.length - 1]?.content || ''
    const demoResponse = `🛡️ **Demo Mode** - This is a demo response since OpenAI API key is not configured.
    
Your message: "${lastMessage}"

In the live version, this would connect to our AI Safety Training Assistant to help you with OSHA compliance and safety training questions! 🚀`
    
    return NextResponse.json({ reply: demoResponse })
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Get the user's latest query
    const userQuery = query || messages[messages.length - 1]?.content || ''
    
    let contextFromDocuments = ''
    let relevantSources: any[] = []

    // Query Pinecone for relevant training content if API key is available
    if (pineconeApiKey && userQuery) {
      try {
        // Initialize Pinecone
        const pc = new Pinecone({
          apiKey: pineconeApiKey
        })
        
        const index = pc.index('mizelconsulting')
        
        // Generate embedding for the user's query
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: userQuery
        })
        
        const queryEmbedding = embeddingResponse.data[0].embedding
        
        // Query Pinecone for relevant documents
        const queryResponse = await index.namespace('site').query({
          vector: queryEmbedding,
          topK: 5,
          includeMetadata: true
        })
        
        // Extract relevant content from matches
        if (queryResponse.matches && queryResponse.matches.length > 0) {
          const relevantTexts = queryResponse.matches
            .filter(match => match.score && match.score > 0.35) // Use matches with reasonable confidence
            .map(match => {
              if (match.metadata) {
                relevantSources.push({
                  fileName: match.metadata.file_name,
                  score: match.score
                })
                return match.metadata.text
              }
              return ''
            })
            .filter(text => text.length > 0)
          
          if (relevantTexts.length > 0) {
            contextFromDocuments = relevantTexts.join('\n\n---\n\n')
          }
        }
      } catch (pineconeError) {
        console.error('Error querying Pinecone:', pineconeError)
        // Continue without Pinecone context if there's an error
      }
    }

    // Build the system message with context if available
    let systemContent = `You are an expert AI assistant for Mizel Consulting, a professional safety training company. You have deep expertise in OSHA compliance, workplace safety, and training programs.

Your knowledge includes:
- OSHA 10-hour and 30-hour training requirements
- Construction safety standards and best practices
- General industry safety protocols
- HAZWOPER training and hazardous materials handling
- Fall protection systems and requirements
- Electrical safety regulations
- PPE (Personal Protective Equipment) requirements
- Confined space entry procedures
- Fire safety and emergency response
- Incident investigation and reporting
- Safety committee management
- Job Hazard Analysis (JHA/JSA)
- Machine guarding and lockout/tagout
- And many other safety topics`

    if (contextFromDocuments) {
      systemContent += `\n\n**IMPORTANT: You have access to specific training materials and documents. Use this information to provide accurate, detailed answers:**\n\n${contextFromDocuments}\n\n**Instructions:**
- Use the training materials above to answer the user's questions with specific, accurate information
- Reference relevant safety standards, procedures, and requirements from the materials
- If the materials contain specific course information, mention relevant courses
- Be professional, thorough, and educational
- If the user asks about training they might need, guide them based on the materials and recommend they explore specific courses
- Always prioritize safety and compliance`
    } else {
      systemContent += `\n\nBe professional, accurate, and helpful. Provide detailed safety guidance and recommend appropriate training when relevant.`
    }

    // Use GPT-4.1 for chat completions
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: systemContent
        },
        ...messages
      ],
      max_tokens: 1500,
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
    
    return NextResponse.json({ 
      reply,
      sources: relevantSources.length > 0 ? relevantSources : undefined
    })
  } catch (err: any) {
    console.error('OpenAI Chat API error:', err);
    return NextResponse.json({ error: err.message || 'OpenAI Chat API error' }, { status: 500 })
  }
} 