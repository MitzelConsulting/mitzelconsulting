import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: "LaunchThatSong Demo API",
    status: "Demo mode - API routes are available but return mock data",
    features: [
      "Artist signup and management",
      "Song submission and voting",
      "Admin dashboard",
      "Stripe payment integration",
      "OpenAI chatbot integration"
    ]
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  return NextResponse.json({ 
    message: "Demo API response",
    received: body,
    note: "In production, this would process real data"
  })
} 