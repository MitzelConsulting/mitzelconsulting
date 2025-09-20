'use client'

import { useEffect, useState, createContext, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import { useCart } from '@/context/CartContext'
import ArtistHowItWorks from '@/components/ArtistHowItWorks'

type Artist = {
  id: string
  name: string
  bio: string
  image_url: string
  spotify_url: string
  soundcloud_url: string
  website_url: string
  genre?: string
  vote_percentage?: number
}

type Song = {
  id: string
  title: string
  artist_name: string
  genre: string
  created_at: string
  vote_count: number
  target_votes: number
  status: string
}

// Force immediate deployment - urgent update
export default function Home() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [recentSongs, setRecentSongs] = useState<Song[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeCardIndex, setActiveCardIndex] = useState(-1)
  const [formData, setFormData] = useState({
    artistName: '',
    email: '',
    password: '',
    confirmPassword: '',
    songName: '',
    songFile: null as File | null,
    bio: '',
    soundcloudLink: '',
    website: '',
    message: '',
    agreeToTerms: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animatedCards, setAnimatedCards] = useState<number[]>([])
  const { cartItems } = useCart()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch artists
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .order('name')

      console.log('Fetched artists data:', artistsData)
      console.log('Artists error:', artistsError)

      if (artistsError) {
        console.error('Error fetching artists:', artistsError.message)
        setError(artistsError.message)
      } else if (artistsData && artistsData.length > 0) {
        const artistsWithDummyData = artistsData.map((artist: Artist) => {
          let genre = 'Pop • Rock' // default
          
          // Set specific genres for known artists
          if (artist.name === 'Douggert') {
            genre = 'Punk Electronica • EDM'
          } else if (artist.name === 'Joey Hendrickson') {
            genre = 'Alternative • Acoustic'
          } else if (artist.name === 'Columbus Songwriters Association') {
            genre = 'Pop • Acoustic'
          }
          
          return {
            ...artist,
            genre,
            vote_percentage: Math.floor(Math.random() * (85 - 40 + 1)) + 40,
          }
        })
        setArtists(artistsWithDummyData)
      } else {
        console.log('No artists found in database')
        setArtists([])
      }

      // Fetch recent songs
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (songsError) {
        console.error('Error fetching songs:', songsError.message)
      } else {
        setRecentSongs(songsData || [])
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, songFile: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match')
        setIsSubmitting(false)
        return
      }

      // Validate password length
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters')
        setIsSubmitting(false)
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append('artistName', formData.artistName)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('password', formData.password)
      formDataToSend.append('confirmPassword', formData.confirmPassword)
      formDataToSend.append('songName', formData.songName)
      formDataToSend.append('bio', formData.bio)
      formDataToSend.append('soundcloudLink', formData.soundcloudLink)
      formDataToSend.append('website', formData.website)
      formDataToSend.append('message', formData.message)
      
      if (formData.songFile) {
        formDataToSend.append('songFile', formData.songFile)
      }

      // Send to artist signup endpoint
      const response = await fetch('/api/artist-signup', {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert('Artist account created successfully! Please check your email to confirm your account. You can then login to access your dashboard.')
        setIsModalOpen(false)
        setFormData({
          artistName: '',
          email: '',
          password: '',
          confirmPassword: '',
          songName: '',
          songFile: null,
          bio: '',
          soundcloudLink: '',
          website: '',
          message: '',
          agreeToTerms: false
        })
      } else {
        alert(result.message || 'There was an error creating your account. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('There was an error creating your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getVotePercentage = (voteCount: number, targetVotes: number) => {
    return Math.min(Math.round((voteCount / targetVotes) * 100), 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400'
      case 'pending': return 'text-yellow-400'
      case 'launched': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '🎵'
      case 'pending': return '⏳'
      case 'launched': return '🚀'
      default: return '📝'
    }
  }

  const triggerArtistCardAnimation = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setActiveCardIndex(0)
    
    const animateNextCard = (index: number) => {
      if (index >= artists.length) {
        // Animation complete
        setIsAnimating(false)
        setActiveCardIndex(-1)
        return
      }
      
      setActiveCardIndex(index)
      
      setTimeout(() => {
        animateNextCard(index + 1)
      }, 3000) // 3 seconds per card
    }
    
    animateNextCard(0)
  }

  return (
    <div>
      <style jsx global>{`
        body { ${isModalOpen ? 'overflow: hidden !important;' : ''} }
      `}</style>
      <div className={isModalOpen ? 'opacity-0 pointer-events-none select-none' : ''}>
        <section className="text-center py-20 sm:py-32 container mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
            Support Unreleased Songs
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
            Support what artists just wrote. Provide feedback. Make contributions.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button 
              className="bg-[#E55A2B] text-white font-semibold py-3 px-8 rounded-lg hover:bg-[#D14A1B] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto"
              onClick={triggerArtistCardAnimation}
            >
              Explore Songs
            </button>
            <Link 
              href="/artist-signup"
              className="bg-white text-gray-900 border border-[#E55A2B] font-semibold py-3 px-8 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto text-center"
            >
              Submit Your Song
            </Link>
          </div>
        </section>
        
        <main className="container mx-auto px-4 md:px-0 pb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center sm:text-left">
            Featured Artists
          </h2>

          {error && (
            <p className="text-red-500 bg-red-50 p-4 rounded-lg text-center mb-6">
              Error: {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {artists.length > 0 ? (
              artists.map((artist, index) => {
                const isColumbusCard = artist.name === 'Columbus Songwriters Association'
                const imageContainerHeight = isColumbusCard ? 'h-48' : 'h-[32rem]'
                const imageFitStyle = isColumbusCard ? 'object-contain' : 'object-cover'

                return (
                  <div 
                    key={artist.id} 
                    className={`relative bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group ${
                      activeCardIndex === index ? 'ring-4 ring-black ring-opacity-75 shadow-2xl' : ''
                    }`}
                    style={{ 
                      height: isColumbusCard ? '400px' : '650px'
                    }}
                  >
                    <Link href={`/artist/${artist.id}`} className={`relative ${imageContainerHeight} block`}>
                      <Image
                        src={artist.image_url}
                        alt={artist.name}
                        fill
                        className={`w-full h-full group-hover:scale-105 transition-transform duration-300 ${imageFitStyle}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                        <h3 className="text-3xl font-bold">{artist.name}</h3>
                        <p className="text-sm text-gray-200">{artist.genre}</p>
                      </div>
                    </Link>

                    <div className="p-6">
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div 
                          className="bg-black h-3 rounded-full transition-all duration-500"
                          style={{ width: `${artist.vote_percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mb-4">
                        <span>{artist.vote_percentage}%</span>
                        <span>Support now</span>
                      </div>

                      <Link href={`/artist/${artist.id}`} className="block w-full">
                        <button 
                          className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          {artist.name === 'Douggert' ? 'Secret Tracks' :
                           artist.name === 'Joey Hendrickson' ? 'Live Acoustic Recordings' :
                           artist.name === 'Jack Folley' ? 'Never Released Single' :
                           artist.name === 'Test 3' ? 'Provide Feedback' :
                           index === 0 ? 'Collaborate' :
                           index === 1 ? 'Support' :
                           index === 2 ? 'Contribute' :
                           'Listen'}
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">Loading artists...</p>
              </div>
            )}
          </div>
        </main>
        
        {/* Cool Divider with Zig-Zag Line and Rocket */}
        <div className="relative w-full flex items-center justify-center my-20">
          <svg width="100%" height="60" viewBox="0 0 1200 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-0 right-0 w-full h-16">
            <polyline points="0,30 50,10 100,50 150,10 200,50 250,10 300,50 350,10 400,50 450,10 500,50 550,10 600,50 650,10 700,50 750,10 800,50 850,10 900,50 950,10 1000,50 1050,10 1100,50 1150,10 1200,30" stroke="#E55A2B" strokeWidth="6" fill="none" />
          </svg>
        </div>
        
        <ArtistHowItWorks />
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50">
          {/* Back Arrow - Fixed Position */}
          <Link 
            href="/" 
            className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 inline-flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-white backdrop-blur-md border border-gray-300 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 group shadow-lg"
            onClick={() => setIsModalOpen(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform"
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </Link>

          {/* Navbar */}
          <div className="fixed top-0 left-0 right-0 z-40">
            <div className="sticky top-0 z-50 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200">
              <div className="container mx-auto flex justify-between items-center px-4 md:px-0">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsModalOpen(false)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-8 h-8 text-[#E55A2B]"
                  >
                    <path
                      d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
                    />
                  </svg>
                  <span className="text-xl font-bold text-gray-900">LaunchThatSong</span>
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                  <Link href="/#connect" className="text-gray-700 hover:text-black transition-colors" onClick={() => setIsModalOpen(false)}>
                    Connect
                  </Link>
                  <Link
                    href="/login"
                    className="bg-[#E55A2B] text-white font-semibold py-2 px-4 rounded-full hover:bg-[#D14A1B] transition-colors"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Login
                  </Link>
                  <Link href="/cart" className="relative hover:text-black transition-colors text-gray-700" onClick={() => setIsModalOpen(false)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-6 h-6"
                    >
                      <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.46-5.23c.18-.487.22-1.01.12-1.521a.75.75 0 00-.728-.654h-12.21l-1.581-5.927A.75.75 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                    </svg>
                    {Array.isArray(cartItems) && cartItems.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {Array.isArray(cartItems) ? cartItems.reduce((acc, item) => acc + item.voteCount, 0) : 0}
                      </span>
                    )}
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {Array.isArray(cartItems) && cartItems.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Link
            href="/cart"
            className="bg-[#E55A2B] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#D14A1B] transition-colors flex items-center gap-2"
          >
            <span>🛒</span>
            <span>{Array.isArray(cartItems) ? cartItems.reduce((acc, item) => acc + item.voteCount, 0) : 0} contribution</span>
          </Link>
        </div>
      )}
    </div>
  )
}