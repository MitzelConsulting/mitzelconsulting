// src/app/artist/[id]/page.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useCart, CartItem } from '@/context/CartContext'

interface Artist {
  id: string
  name: string
  bio: string
  image_url: string
}

interface Song {
  id: string
  artist_id: string
  title: string
  audio_url?: string
  file_url?: string
  vote_count: number
  vote_goal: number
  vote_price?: number
}

export default function ArtistPage() {
  console.log('ArtistPage component rendering')
  
  const { id } = useParams()
  const router = useRouter()
  const { cartItems, addToCart, removeFromCart, setLastVisitedArtist, addVoiceComment } = useCart()

  const [artist, setArtist] = useState<Artist | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [error, setError] = useState<string | null>(null)
  const [allArtists, setAllArtists] = useState<Artist[]>([])
  const [currentArtistIndex, setCurrentArtistIndex] = useState<number>(-1)
  const [flippedCards, setFlippedCards] = useState<{ [songId: string]: boolean }>({})
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [voiceComments, setVoiceComments] = useState<{ [songId: string]: string }>({})
  const [isRecording, setIsRecording] = useState<{ [songId: string]: boolean }>({})
  const [audioBlobs, setAudioBlobs] = useState<{ [songId: string]: Blob }>({})
  const [isPlayingBack, setIsPlayingBack] = useState<{ [songId: string]: boolean }>({})
  const [showPlayback, setShowPlayback] = useState<{ [songId: string]: boolean }>({})
  const [mediaRecorder, setMediaRecorder] = useState<{ [songId: string]: MediaRecorder | null }>({})
  const [showPaymentModal, setShowPaymentModal] = useState<{ [songId: string]: boolean }>({})

  // Analytics tracking
  const sessionId = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const pageLoadTime = useRef<number>(Date.now())
  const audioSessions = useRef<{ [songId: string]: { startTime: number, totalTime: number } }>({})

  // Track analytics event
  const trackEvent = async (eventType: string, data?: any) => {
    if (!id) return

    try {
      await fetch('/api/analytics/track-pageview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: id,
          eventType,
          data: {
            ...data,
            sessionId: sessionId.current,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error('Error tracking analytics:', error)
    }
  }

  // Track page view on load
  useEffect(() => {
    if (id) {
      trackEvent('pageview')
      
      // Track session start
      trackEvent('session_start', {
        sessionId: sessionId.current,
        startTime: pageLoadTime.current
      })
    }
  }, [id])

  // Track page unload and session end
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - pageLoadTime.current
      trackEvent('session_end', {
        sessionId: sessionId.current,
        duration: sessionDuration
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Track audio interactions
  const trackAudioEvent = (songId: string, eventType: 'audio_play' | 'audio_pause' | 'audio_end', duration?: number) => {
    if (!audioSessions.current[songId]) {
      audioSessions.current[songId] = { startTime: Date.now(), totalTime: 0 }
    }

    const session = audioSessions.current[songId]
    
    if (eventType === 'audio_play') {
      session.startTime = Date.now()
    } else if (eventType === 'audio_pause' || eventType === 'audio_end') {
      session.totalTime += Date.now() - session.startTime
    }

    trackEvent(eventType, {
      songId,
      sessionId: sessionId.current,
      duration: session.totalTime,
      eventDuration: duration
    })
  }

  useEffect(() => {
    // Track this artist as the last visited
    if (id) {
      setLastVisitedArtist(id as string)
    }
  }, [id, setLastVisitedArtist])

  useEffect(() => {
    const fetchAllArtists = async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, bio, image_url')
        .order('name')

      if (error) {
        console.error('Error fetching all artists:', error.message)
      } else {
        setAllArtists(data || [])
      }
    }

    const fetchArtist = async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, bio, image_url')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching artist:', error.message)
        setError(error.message)
      } else {
        setArtist(data)
      }
    }

    const fetchSongs = async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', id)
        .eq('is_public', true)
        .eq('status', 'approved')

      if (error) {
        console.error('Error fetching songs:', error.message)
        setError(error.message)
      } else {
        setSongs(data)
      }
    }

    if (id) {
      fetchAllArtists()
      fetchArtist()
      fetchSongs()
    }
  }, [id])

  useEffect(() => {
    if (artist && allArtists.length > 0) {
      const index = allArtists.findIndex(a => a.id === artist.id)
      setCurrentArtistIndex(index)
    }
  }, [artist, allArtists])

  const addVote = (song: Song) => {
    addToCart({
      songId: song.id,
      songTitle: song.title,
      artistId: song.artist_id,
      voteCount: 1,
      votePrice: song.vote_price || 1.00
    })
    
    // Track vote event
    trackEvent('vote', {
      songId: song.id,
      songTitle: song.title,
      voteCount: 1,
      votePrice: song.vote_price || 1.00
    })
  }

  const removeVote = (songId: string) => {
    removeFromCart(songId)
    
    // Track vote removal
    trackEvent('vote_removed', {
      songId
    })
  }

  const getVotePercentage = (voteCount: number, voteGoal: number) => {
    return Math.min(Math.round((voteCount / voteGoal) * 100), 100)
  }

  const navigateToArtist = (artistId: string) => {
    // Track navigation click
    trackEvent('click', {
      action: 'navigate_to_artist',
      targetArtistId: artistId
    })
    
    router.push(`/artist/${artistId}`)
  }

  const getPreviousArtist = () => {
    if (currentArtistIndex <= 0) return null
    return allArtists[currentArtistIndex - 1]
  }

  const getNextArtist = () => {
    if (currentArtistIndex >= allArtists.length - 1) return null
    return allArtists[currentArtistIndex + 1]
  }

  const toggleCardFlip = (songId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [songId]: !prev[songId]
    }))
    
    // Track card flip
    trackEvent('click', {
      action: 'flip_card',
      songId
    })
  }

  const handlePlayAudio = (songId: string) => {
    // Stop any currently playing audio
    if (currentlyPlaying && currentlyPlaying !== songId) {
      const prevAudio = document.getElementById(`audio-${currentlyPlaying}`) as HTMLAudioElement
      if (prevAudio) {
        prevAudio.pause()
        prevAudio.currentTime = 0
      }
    }

    const audio = document.getElementById(`audio-${songId}`) as HTMLAudioElement
    if (audio) {
      if (audio.paused) {
        audio.play()
        setCurrentlyPlaying(songId)
      } else {
        audio.pause()
        setCurrentlyPlaying(null)
      }
    }

    trackAudioEvent(songId, 'audio_play')
  }

  const handleAudioEnded = (songId: string) => {
    setCurrentlyPlaying(null)
    const progress = document.getElementById(`progress-${songId}`)
    if (progress) {
      progress.style.width = '0%'
    }

    trackAudioEvent(songId, 'audio_end')
  }

  const startRecording = (songId: string) => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const recorder = new MediaRecorder(stream)
          const chunks: Blob[] = []
          
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data)
            }
          }
          
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' })
            setAudioBlobs(prev => ({
              ...prev,
              [songId]: blob
            }))
            setShowPlayback(prev => ({
              ...prev,
              [songId]: true
            }))
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop())
          }
          
          recorder.start()
          setMediaRecorder(prev => ({
            ...prev,
            [songId]: recorder
          }))
          setIsRecording(prev => ({
            ...prev,
            [songId]: true
          }))
          setVoiceComments(prev => ({
            ...prev,
            [songId]: ''
          }))

          trackAudioEvent(songId, 'audio_play')
        })
        .catch(err => {
          console.error('Error accessing microphone:', err)
          alert('Unable to access microphone. Please check permissions.')
        })
    }
  }

  const stopRecording = (songId: string) => {
    const recorder = mediaRecorder[songId]
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
    setIsRecording(prev => ({
      ...prev,
      [songId]: false
    }))

    trackAudioEvent(songId, 'audio_end')
  }

  const playBackRecording = (songId: string) => {
    const blob = audioBlobs[songId]
    if (blob) {
      const audio = new Audio(URL.createObjectURL(blob))
      audio.onended = () => {
        setIsPlayingBack(prev => ({
          ...prev,
          [songId]: false
        }))
      }
      audio.play()
      setIsPlayingBack(prev => ({
        ...prev,
        [songId]: true
      }))

      trackAudioEvent(songId, 'audio_play')
    }
  }

  const submitVoiceComment = async (songId: string) => {
    const songInCart = Array.isArray(cartItems) ? cartItems.find(item => item.songId === songId) : undefined
    if (!songInCart || songInCart.voteCount === 0) {
      setShowPaymentModal(prev => ({
        ...prev,
        [songId]: true
      }))
      return
    }

    const blob = audioBlobs[songId]
    if (!blob) {
      alert('No voice comment recorded.')
      return
    }

    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Audio = reader.result as string
        const song = songs.find(s => s.id === songId)
        
        if (!song || !artist) {
          alert('Song or artist information not found.')
          return
        }

        // Save to Supabase first
        const saveResponse = await fetch('/api/save-voice-comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            songId,
            artistId: artist.id,
            songTitle: song.title,
            artistName: artist.name,
            audioData: base64Audio,
            audioFilename: `voice-comment-${song.title}-${Date.now()}.webm`
          }),
        })

        if (!saveResponse.ok) {
          alert('Failed to save voice comment. Please try again.')
          return
        }

        const saveResult = await saveResponse.json()
        
        // Add to cart context
        const voiceComment = {
          songId,
          songTitle: song.title,
          artistId: artist.id,
          artistName: artist.name,
          audioData: base64Audio,
          audioFilename: `voice-comment-${song.title}-${Date.now()}.webm`,
          commentId: saveResult.commentId
        }
        
        addVoiceComment(songId, voiceComment)

        // Clear the recording UI
        setAudioBlobs(prev => {
          const newBlobs = { ...prev }
          delete newBlobs[songId]
          return newBlobs
        })
        setVoiceComments(prev => ({
          ...prev,
          [songId]: ''
        }))
        setShowPlayback(prev => ({
          ...prev,
          [songId]: false
        }))

        alert('Voice comment saved! It will be sent to the artist when you complete your purchase.')

        trackAudioEvent(songId, 'audio_end')
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error('Error submitting voice comment:', error)
      alert('Error submitting voice comment. Please try again.')
    }
  }

  const discardVoiceComment = (songId: string) => {
    setAudioBlobs(prev => {
      const newBlobs = { ...prev }
      delete newBlobs[songId]
      return newBlobs
    })
    setVoiceComments(prev => ({
      ...prev,
      [songId]: ''
    }))
    setShowPlayback(prev => ({
      ...prev,
      [songId]: false
    }))
    setIsRecording(prev => ({
      ...prev,
      [songId]: false
    }))

    trackAudioEvent(songId, 'audio_end')
  }

  const handleMaybeLater = (songId: string) => {
    setShowPaymentModal(prev => ({
      ...prev,
      [songId]: false
    }))
  }

  const handleAddToRocketFuel = (songId: string) => {
    const song = songs.find(s => s.id === songId)
    if (song) {
      addVote(song)
    }
    setShowPaymentModal(prev => ({
      ...prev,
      [songId]: false
    }))
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          Error: {error}
        </div>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-700">
          Loading artist...
        </div>
      </div>
    )
  }

  // Add a simple test render
  console.log('About to render main component')
  
  const previousArtist = getPreviousArtist()
  const nextArtist = getNextArtist()
  const totalVotesInCart = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + item.voteCount, 0) : 0
  const fuelPercentage = Math.min((totalVotesInCart / 50) * 100, 100) // Assuming 50 votes is a full tank

  return (
    <div className="min-h-screen bg-white">
      {/* Left Arrow - Previous Artist or Home */}
      {previousArtist ? (
        <button 
          onClick={() => navigateToArtist(previousArtist.id)}
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
        </button>
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

      {/* Right Arrow - Next Artist or Home */}
      {id === '51da1dd7-a6b9-4304-a6e9-ee2ebad3f787' ? (
        // Special case for Joey Hendrickson's page - link to Columbus Songwriters Association
        <Link 
          href="/artist/a5590c42-c83f-4ce5-b64e-5ae4c1db1d6c"
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 inline-flex items-center justify-center w-12 h-12 bg-white backdrop-blur-md border border-gray-300 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 group shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6 group-hover:translate-x-1 transition-transform"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      ) : nextArtist ? (
        <button 
          onClick={() => navigateToArtist(nextArtist.id)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 inline-flex items-center justify-center w-12 h-12 bg-white backdrop-blur-md border border-gray-300 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 group shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6 group-hover:translate-x-1 transition-transform"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : (
        <Link 
          href="/" 
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 inline-flex items-center justify-center w-12 h-12 bg-white backdrop-blur-md border border-gray-300 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 group shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6 group-hover:translate-x-1 transition-transform"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      )}

      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        {/* Artist Info */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 mb-12">
          {artist.image_url ? (
            <div className="flex justify-center">
              <div className="relative w-80 h-80 overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src={artist.image_url}
                  alt={artist.name}
                  fill
                  className="object-cover object-top"
                  sizes="320px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            </div>
          ) : (
            <div className="w-80 h-80 bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}

          <div className="bg-white border border-gray-200 p-8 rounded-2xl flex-1 shadow-lg">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{artist.name}</h1>
            <p className="text-gray-600 text-lg leading-relaxed">{artist.bio}</p>
          </div>
        </div>

        {/* Songs Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Unreleased Music</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {songs.map((song) => {
              const cartItem = Array.isArray(cartItems) ? cartItems.find(item => item.songId === song.id) : undefined
              const totalVotes = (song.vote_count || 0) + (cartItem?.voteCount || 0)
              const votePercentage = getVotePercentage(totalVotes, song.vote_goal || 100)
              const isFlipped = flippedCards[song.id] || false
              const isPlaying = currentlyPlaying === song.id
              
              return (
                <div key={song.id} className="relative group perspective-1000">
                  {/* Flip Card Container */}
                  <div 
                    className={`relative w-full h-96 transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                    onClick={() => toggleCardFlip(song.id)}
                  >
                    {/* Front of Card - Audio Player */}
                    <div className="absolute inset-0 bg-white border border-gray-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all backface-hidden">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#E55A2B] transition-colors">
                        {song.title}
                      </h3>

                      {(song.audio_url || song.file_url) ? (
                        <div className="mb-6">
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <button 
                                className="w-10 h-10 bg-[#E55A2B] text-white rounded-full flex items-center justify-center hover:bg-[#D14A1B] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePlayAudio(song.id)
                                }}
                              >
                                {isPlaying ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5"
                                  >
                                    <path d="M6 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1H6zM12 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5 ml-0.5"
                                  >
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="text-gray-900 font-medium text-sm">{song.title}</div>
                                <div className="text-gray-500 text-xs">
                                  {isPlaying ? 'Now Playing' : 'Click to play'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Custom Progress Bar */}
                            <div className="relative">
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-[#E55A2B] h-2 rounded-full transition-all duration-100 ease-out"
                                  style={{ width: '0%' }}
                                  id={`progress-${song.id}`}
                                />
                              </div>
                              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-orange-200 to-transparent opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     const audio = document.getElementById(`audio-${song.id}`) as HTMLAudioElement
                                     const rect = e.currentTarget.getBoundingClientRect()
                                     const clickX = e.clientX - rect.left
                                     const percentage = (clickX / rect.width) * 100
                                     if (audio) {
                                       audio.currentTime = (percentage / 100) * audio.duration
                                     }
                                   }}
                              />
                            </div>
                            
                            {/* Hidden Audio Element */}
                            <audio 
                              id={`audio-${song.id}`}
                              src={song.audio_url || song.file_url}
                              onTimeUpdate={(e) => {
                                const audio = e.target as HTMLAudioElement
                                const progress = document.getElementById(`progress-${song.id}`)
                                if (progress && audio.duration) {
                                  const percentage = (audio.currentTime / audio.duration) * 100
                                  progress.style.width = `${percentage}%`
                                }
                              }}
                              onEnded={() => handleAudioEnded(song.id)}
                              className="hidden"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5 text-gray-600"
                              >
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-gray-600 font-medium text-sm">No audio uploaded</div>
                              <div className="text-gray-500 text-xs">Audio file not available</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Vote Progress */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Contributions: {totalVotes} / {song.vote_goal || 'Goal not set'}</span>
                          <span className="font-bold">{votePercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-[#E55A2B] h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${votePercentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                          <span>${song.vote_price?.toFixed(2) || '1.00'}</span>
                          <span>Total: ${(cartItem?.voteCount || 0) * (song.vote_price || 1.00)}</span>
                        </div>
                      </div>

                      {/* Vote Controls */}
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeVote(song.id)
                          }}
                          disabled={!cartItem}
                          className="w-12 h-12 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-xl font-bold"
                        >
                          −
                        </button>
                        <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
                          {cartItem?.voteCount || 0}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addVote(song)
                          }}
                          className="w-12 h-12 bg-[#E55A2B] text-white rounded-full hover:bg-[#D14A1B] transition-all flex items-center justify-center text-xl font-bold"
                        >
                          ＋
                        </button>
                      </div>

                      {/* Download Access Info */}
                      {/* <div className="text-center text-xs text-gray-500 mb-4">
                        Support to unlock song download
                      </div> */}

                      {/* Flip Hint */}
                      <div className="text-center text-gray-500 text-sm">
                        Click outside player to record voice comment
                      </div>
                    </div>

                    {/* Back of Card - Voice Comment */}
                    <div className="absolute inset-0 bg-white border border-gray-200 p-6 rounded-2xl shadow-lg rotate-y-180 backface-hidden">
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-gray-900">Voice Comment</h3>
                          {isRecording[song.id] && (
                            <div className="flex items-center gap-2 text-red-500">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-sm">Recording</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto mb-4">
                          {!audioBlobs[song.id] && !isRecording[song.id] ? (
                            <div className="text-gray-600 text-center py-8">
                              <div className="text-4xl mb-4">🎤</div>
                              <div className="text-lg font-semibold mb-2">Record Your Thoughts</div>
                              <div className="text-sm mb-6">
                                Share your feedback about &quot;{song.title}&quot;
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startRecording(song.id)
                                }}
                                className="bg-[#E55A2B] hover:bg-[#D14A1B] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                              >
                                Start Comment
                              </button>
                            </div>
                          ) : isRecording[song.id] ? (
                            <div className="text-center py-8">
                              <div className="text-4xl mb-4">🔴</div>
                              <div className="text-lg font-semibold mb-2 text-red-500">Recording...</div>
                              <div className="text-sm text-gray-500 mb-6">
                                Speak your mind about &quot;{song.title}&quot;
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  stopRecording(song.id)
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                              >
                                End Recording
                              </button>
                            </div>
                          ) : showPlayback[song.id] ? (
                            <div className="text-center py-8">
                              <div className="text-4xl mb-4">🎵</div>
                              <div className="text-lg font-semibold mb-2 text-green-600">Recording Complete!</div>
                              <div className="text-sm text-gray-500 mb-6">
                                Listen to your comment about &quot;{song.title}&quot;
                              </div>
                              <div className="space-y-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    playBackRecording(song.id)
                                  }}
                                  disabled={isPlayingBack[song.id]}
                                  className="w-full bg-[#E55A2B] hover:bg-[#D14A1B] disabled:bg-[#B83A0B] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                                >
                                  {isPlayingBack[song.id] ? 'Playing...' : 'Play Recording'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    submitVoiceComment(song.id)
                                  }}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                                >
                                  Send to Artist
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    discardVoiceComment(song.id)
                                  }}
                                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                                >
                                  Discard & Record Again
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                        
                        <div className="text-center text-gray-500 text-sm">
                          {isRecording[song.id] ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span>Recording your comment...</span>
                            </div>
                          ) : (
                            <div>Click to flip back to player</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rocket Fuel Section */}
        {Array.isArray(cartItems) && cartItems.length > 0 && (
          <div className="w-full px-4 md:px-8 lg:px-16 py-8">
            <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  🚀 Your Contributions
                </h3>
                <p className="text-gray-600 text-lg">
                  Your Song Downloads
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.songId} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 font-semibold truncate">{item.songTitle}</div>
                      <div className="text-black text-sm">Contributions: {item.voteCount}</div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <div className="text-[#E55A2B] font-bold text-lg">
                          ${(item.voteCount * item.votePrice).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.songId)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                        title="Remove from cart"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="text-gray-900 text-xl font-bold">
                    Total: ${Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + (item.voteCount * item.votePrice), 0).toFixed(2) : '0.00'}
                  </div>
                  <p className="text-gray-600">
                    {Array.isArray(cartItems) ? cartItems.length : 0} song{Array.isArray(cartItems) && cartItems.length !== 1 ? 's' : ''} supported
                  </p>
                </div>
                
                <button
                  onClick={() => router.push('/cart')}
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
                  Proceed to Launch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Required Modal */}
        {songs.map((song) => 
          showPaymentModal[song.id] && (
            <div key={`payment-modal-${song.id}`} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Contribution Required!</h3>
                  <p className="text-gray-600 text-sm">
                    To send your voice comment about &quot;{song.title}&quot; to the artist, please add a contribution to support this song.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleAddToRocketFuel(song.id)}
                    className="w-full bg-[#E55A2B] hover:bg-[#D14A1B] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
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
                    Add Contribution
                  </button>
                  <button
                    onClick={() => handleMaybeLater(song.id)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}