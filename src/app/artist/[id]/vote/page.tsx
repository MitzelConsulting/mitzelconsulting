'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

interface Song {
  id: string
  title: string
  vote_price: number
  vote_goal: number
  current_votes: number
  audio_url: string
}

export default function ArtistPage() {
  const { id } = useParams()
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSongs = async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', id)

      if (error) {
        setError(error.message)
      } else {
        setSongs(data)
      }
      setLoading(false)
    }

    fetchSongs()
  }, [id])

  const addToCart = (song: Song) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const exists = cart.find((item: Song) => item.id === song.id)
    if (!exists) {
      cart.push(song)
      localStorage.setItem('cart', JSON.stringify(cart))
      alert(`"${song.title}" added to cart!`)
    } else {
      alert('Song already in cart')
    }
  }

  if (loading) return <p className="text-center mt-10">Loading songs...</p>
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>

  return (
    <main className="p-8 sm:p-16 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Vote on Songs</h1>

      <div className="text-center mb-6">
        <button
          onClick={() => router.push('/cart')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Go to Cart →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {songs.map((song) => (
          <div
            key={song.id}
            className="border rounded-lg p-6 shadow-md hover:shadow-xl transition-all"
          >
            <h2 className="text-xl font-semibold mb-2">{song.title}</h2>
            {song.audio_url && (
              <audio controls src={song.audio_url} className="w-full mb-4" />
            )}
            <p className="text-sm text-gray-600">
              Goal: {song.vote_goal} votes<br />
              Current: {song.current_votes || 0} votes<br />
              Price: ${song.vote_price.toFixed(2)} per vote
            </p>
            <button
              onClick={() => addToCart(song)}
              className="mt-4 bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}