// src/app/cart/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useCart, CartItem } from '@/context/CartContext'

interface Song {
  id: string
  title: string
  vote_price: number
  current_votes: number
  vote_goal: number
  artist_id: string
}

interface Artist {
  id: string
  name: string
}

export default function CartPage() {
  const router = useRouter()
  const { cartItems, removeFromCart, clearCart, lastVisitedArtist, removeVoiceComment } = useCart()
  const [songs, setSongs] = useState<Song[]>([])
  const [artists, setArtists] = useState<{ [key: string]: Artist }>({})
  const [loading, setLoading] = useState(true)
  const [playingComment, setPlayingComment] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchSongs = async () => {
      if (cartItems.length === 0) {
        setSongs([])
        setLoading(false)
        return
      }

      const songIds = cartItems.map(item => item.songId)
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, vote_price, current_votes, vote_goal, artist_id')
        .in('id', songIds)

      if (error) {
        console.error('Error fetching songs:', error.message)
      } else {
        setSongs(data || [])
        
        // Fetch artist information for each song
        const artistIds = [...new Set(data?.map(song => song.artist_id) || [])]
        if (artistIds.length > 0) {
          const { data: artistData, error: artistError } = await supabase
            .from('artists')
            .select('id, name')
            .in('id', artistIds)

          if (!artistError && artistData) {
            const artistMap: { [key: string]: Artist } = {}
            artistData.forEach(artist => {
              artistMap[artist.id] = artist
            })
            setArtists(artistMap)
          }
        }
      }
      setLoading(false)
    }

    fetchSongs()
  }, [cartItems])

  // Cleanup audio when component unmounts or cartItems change
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.onended = null
      }
    }
  }, [currentAudio])

  const totalPrice = cartItems.reduce((total, item) => {
    if (item.songId && item.voteCount && item.votePrice) {
      return total + (item.voteCount * item.votePrice)
    } else if (item.courseId && item.coursePrice) {
      return total + item.coursePrice
    }
    return total
  }, 0)

  const handleCheckout = async () => {
    try {
      // Prepare items for checkout
      const items = cartItems.map(item => ({
        songId: item.songId,
        title: item.songTitle,
        vote_price: item.votePrice,
        quantity: item.voteCount
      }))

      // Get voice comment IDs
      const voiceCommentIds = cartItems
        .filter(item => item.voiceComment?.commentId)
        .map(item => item.voiceComment!.commentId!)

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          voiceCommentIds
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    }
  }

  const handleRemoveItem = (id: string, type: 'song' | 'course' = 'song') => {
    removeFromCart(id, type)
  }

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart()
    }
  }

  const handlePlayVoiceComment = (songId: string) => {
    const item = cartItems.find(i => i.songId === songId)
    if (!item?.voiceComment) return

    // If clicking the same comment that's currently playing
    if (playingComment === songId && currentAudio) {
      // If audio is playing, restart it from the beginning
      currentAudio.currentTime = 0
      currentAudio.play()
      return
    }

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.onended = null // Remove the event listener
    }

    // Create and play audio
    const audio = new Audio(item.voiceComment.audioData)
    audio.onended = () => {
      setPlayingComment(null)
      setCurrentAudio(null)
    }
    audio.play()
    setPlayingComment(songId)
    setCurrentAudio(audio)
  }

  const handleRemoveVoiceComment = (songId: string) => {
    if (confirm('Are you sure you want to remove this voice comment?')) {
      removeVoiceComment(songId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Taking you to your Contributions...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button - Middle Left */}
      {lastVisitedArtist ? (
        <Link 
          href={`/artist/${lastVisitedArtist}`}
          className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 inline-flex items-center justify-center w-12 h-12 bg-white backdrop-blur-md border border-gray-300 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 group shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6 group-hover:-translate-x-1 transition-transform"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      ) : (
        <Link 
          href="/"
          className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 inline-flex items-center justify-center w-12 h-12 bg-white backdrop-blur-md border border-gray-300 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 group shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6 group-hover:-translate-x-1 transition-transform"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">🛒 Your Cart</h1>
          <p className="text-gray-600 text-lg">Ready to complete your purchase!</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white border border-gray-200 p-8 rounded-2xl text-center shadow-lg">
            <div className="text-gray-600 text-lg mb-4">Your cart is empty!</div>
            <div className="flex justify-center">
              <Link 
                href="/courses"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Browse Courses
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {cartItems.map((item) => {
                // Handle song items
                if (item.songId) {
                  const song = songs.find(s => s.id === item.songId)
                  const artist = artists[item.artistId]
                  const hasVoiceComment = !!item.voiceComment
                  
                  return (
                    <div key={item.songId} className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 font-semibold truncate">{item.songTitle}</div>
                          {artist && (
                            <div className="text-gray-600 text-sm">by {artist.name}</div>
                          )}
                          <div className="text-gray-600 text-sm">Contributions: {item.voteCount}</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-[#E55A2B] font-bold text-lg">
                            ${((item.voteCount || 0) * (item.votePrice || 0)).toFixed(2)}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.songId!, 'song')}
                            className="text-red-500 hover:text-red-600 transition-colors p-1 mt-1"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Voice Comment Section */}
                      {hasVoiceComment && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="text-green-600">🎤</div>
                              <span className="text-green-700 text-sm font-medium">Voice Comment</span>
                            </div>
                            <button
                              onClick={() => handleRemoveVoiceComment(item.songId!)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-3 h-3"
                              >
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={() => handlePlayVoiceComment(item.songId!)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            {playingComment === item.songId ? (
                              <>
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                Playing...
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                                Play Comment
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }
                
                // Handle course items
                if (item.courseId) {
                  return (
                    <div key={item.courseId} className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 font-semibold truncate">{item.courseTitle}</div>
                          <div className="text-gray-600 text-sm">{item.courseCategory}</div>
                          <div className="text-gray-600 text-sm">{item.courseDuration}h course</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-blue-600 font-bold text-lg">
                            ${item.coursePrice?.toFixed(2)}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.courseId!, 'course')}
                            className="text-red-500 hover:text-red-600 transition-colors p-1 mt-1"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Course Image */}
                      {item.courseImage && (
                        <div className="mt-3">
                          <img
                            src={item.courseImage}
                            alt={item.courseTitle}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )
                }
                
                return null
              })}
            </div>

            {/* Total and Actions */}
            <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="text-gray-900 text-xl font-bold">
                    Total: ${totalPrice.toFixed(2)}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {cartItems.filter(item => item.songId).length} song{cartItems.filter(item => item.songId).length !== 1 ? 's' : ''} supported
                    {cartItems.filter(item => item.courseId).length > 0 && (
                      <span>
                        {cartItems.filter(item => item.songId).length > 0 ? ' • ' : ''}
                        {cartItems.filter(item => item.courseId).length} course{cartItems.filter(item => item.courseId).length !== 1 ? 's' : ''} selected
                      </span>
                    )}
                  </div>
                  {cartItems.some(item => item.voiceComment) && (
                    <div className="text-green-600 text-sm mt-1">
                      {cartItems.filter(item => item.voiceComment).length} voice comment{cartItems.filter(item => item.voiceComment).length !== 1 ? 's' : ''} included
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCheckout}
                    className="bg-[#E55A2B] hover:bg-[#D14A1B] text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg text-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
                      />
                    </svg>
                    Proceed to Checkout
                  </button>
                  
                  <button
                    onClick={handleClearCart}
                    className="px-6 py-3 border border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-500 hover:text-white transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}