// app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

// Create Stripe client only if we have the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'placeholder_key'
const stripe = stripeSecretKey !== 'placeholder_key' 
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-05-28.basil' })
  : null

export async function POST(req: Request) {
  try {
    // If we don't have a valid Stripe client, return an error
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service not available' },
        { status: 503 }
      )
    }

    const { items, voiceCommentIds } = await req.json() // items: [{ songId, title, vote_price, quantity }]

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Get artist information for each song to include in metadata
    const songIds = items.map((item: any) => item.songId)
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id, artist_id, title')
      .in('id', songIds)

    if (songsError) {
      console.error('Error fetching songs:', songsError)
      return NextResponse.json(
        { error: 'Error fetching song information' },
        { status: 500 }
      )
    }

    // Create a map of songId to artistId
    const songToArtistMap: { [key: string]: string } = {}
    songs?.forEach((song: any) => {
      songToArtistMap[song.id] = song.artist_id
    })

    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
        },
        unit_amount: Math.round(item.vote_price * 100), // in cents
      },
      quantity: item.quantity,
    }))

    // Prepare metadata for votes, voice comments, and artist information
    const votes: { [key: string]: number } = {}
    const artistVotes: { [key: string]: { [key: string]: number } } = {} // artistId -> { songId: quantity }
    
    items.forEach((item: any) => {
      votes[item.songId] = item.quantity
      const artistId = songToArtistMap[item.songId]
      if (artistId) {
        if (!artistVotes[artistId]) {
          artistVotes[artistId] = {}
        }
        artistVotes[artistId][item.songId] = item.quantity
      }
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
      metadata: {
        votes: JSON.stringify(votes),
        voiceCommentIds: JSON.stringify(voiceCommentIds || []),
        artistVotes: JSON.stringify(artistVotes),
        totalAmount: (items.reduce((sum: number, item: any) => sum + (item.vote_price * item.quantity), 0)).toString()
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err.message)
    return NextResponse.json(
      { error: 'Unable to create checkout session' },
      { status: 500 }
    )
  }
}
