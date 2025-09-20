'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ArtistAnalytics from '@/components/ArtistAnalytics'
import AllArtistsAnalytics from '@/components/AllArtistsAnalytics'

interface Analytics {
  totalArtists: number
  totalSongs: number
  totalVoiceComments: number
  totalPurchases: number
  totalRevenue: number
  recentVisitors: number
  activeSongs: number
  pendingSongs: number
}

interface VoiceComment {
  id: string
  song_title: string
  artist_name: string
  status: 'draft' | 'purchased' | 'sent'
  created_at: string
  purchase_session_id?: string
  audio_data?: string
  audio_filename?: string
}

interface Purchase {
  session_id: string
  total_amount: number
  comment_count: number
  created_at: string
  customer_email?: string
}

interface Artist {
  id: string
  name: string
  email: string
  created_at: string
  stripe_account_id?: string
  status?: string
  bio?: string
}

interface Song {
  id: string
  title: string
  artist_name: string
  created_at: string
  status?: string
}

interface ApprovalHistory {
  id: string
  item_type: 'song' | 'artist'
  item_id: string
  action: 'approved' | 'rejected' | 'removed'
  admin_user_id?: string
  admin_email?: string
  item_title: string
  item_artist_name: string
  notes?: string
  created_at: string
  vote_goal?: number
  vote_price?: number
}

interface SignupAnalytics {
  id: string
  artist_id: string
  artist_name: string
  email: string
  song_name?: string
  signup_status: 'success' | 'failed' | 'pending'
  email_sent: boolean
  email_confirmed: boolean
  email_confirmed_at?: string
  notes?: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [voiceComments, setVoiceComments] = useState<VoiceComment[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [pendingArtists, setPendingArtists] = useState<Artist[]>([])
  const [pendingSongs, setPendingSongs] = useState<Song[]>([])
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([])
  const [signupAnalytics, setSignupAnalytics] = useState<SignupAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'purchases' | 'artists' | 'analytics' | 'approvals' | 'signups' | 'database'>('overview')
  
  // Edit artist state
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    bio: ''
  })

  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null)
  const [analyticsView, setAnalyticsView] = useState<'overview' | 'individual'>('overview')
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioRefs, setAudioRefs] = useState<{ [key: string]: HTMLAudioElement | null }>({})

  // Add state for database tab
  const [dbArtists, setDbArtists] = useState<Artist[]>([])
  const [dbSongs, setDbSongs] = useState<Song[]>([])
  const [artistFilter, setArtistFilter] = useState('')
  const [artistStatusFilter, setArtistStatusFilter] = useState('')
  const [songFilter, setSongFilter] = useState('')
  const [songStatusFilter, setSongStatusFilter] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      // Stop all audio and clean up refs
      Object.values(audioRefs).forEach(audio => {
        if (audio) {
          audio.pause()
          audio.src = ''
        }
      })
    }
  }, [audioRefs])

  const checkAuth = async () => {
    try {
      console.log('Admin dashboard: Checking authentication...')
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        console.log('Admin dashboard: No user found, redirecting to login')
        router.push('/login')
        return
      }

      // BYPASS: Always allow admin@launchthatsong.com
      if (user.email === 'admin@launchthatsong.com') {
        console.log('Bypassing admin check and artist fetch for admin@launchthatsong.com');
        await fetchAnalytics();
        await fetchVoiceComments();
        await fetchPurchases();
        // Do NOT fetchArtists or fetchPendingApprovals for admin-only user
        await fetchApprovalHistory();
        await fetchSignupAnalytics();
        setLoading(false);
        return;
      }

      console.log('Admin dashboard: User found:', user.email)

      // Check if user is admin using the admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      console.log('Admin dashboard: Admin check result:', { adminUser, adminError })

      if (adminError || !adminUser) {
        console.log('Admin dashboard: User is not an admin, redirecting to login')
        router.push('/login')
        return
      }

      // Only fetch artist data for non-admin@launchthatsong.com users
      await fetchAnalytics()
      await fetchVoiceComments()
      await fetchPurchases()
      await fetchArtists()
      await fetchPendingApprovals()
      await fetchApprovalHistory()
      await fetchSignupAnalytics()
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      // Get total counts
      const [artistsResult, songsResult, commentsResult] = await Promise.all([
        supabase.from('artists').select('id', { count: 'exact' }),
        supabase.from('songs').select('id', { count: 'exact' }),
        supabase.from('voice_comments').select('id', { count: 'exact' })
      ])

      // Get purchase data
      const { data: purchaseData } = await supabase
        .from('voice_comments')
        .select('purchase_session_id')
        .eq('status', 'purchased')
        .not('purchase_session_id', 'is', null)

      const uniquePurchases = new Set(purchaseData?.map(p => p.purchase_session_id) || []).size

      // Get song status counts
      const { data: songStatusData } = await supabase
        .from('songs')
        .select('status')

      const activeSongs = songStatusData?.filter(s => s.status === 'approved').length || 0
      const pendingSongs = songStatusData?.filter(s => s.status === 'pending').length || 0

      setAnalytics({
        totalArtists: artistsResult.count || 0,
        totalSongs: songsResult.count || 0,
        totalVoiceComments: commentsResult.count || 0,
        totalPurchases: uniquePurchases,
        totalRevenue: uniquePurchases * 5, // Assuming $5 per purchase
        recentVisitors: Math.floor(Math.random() * 100) + 50, // Placeholder
        activeSongs,
        pendingSongs
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchVoiceComments = async () => {
    const { data, error } = await supabase
      .from('voice_comments')
      .select('*, audio_data, audio_filename')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      setVoiceComments(data)
    }
  }

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('voice_comments')
      .select('purchase_session_id, created_at')
      .eq('status', 'purchased')
      .not('purchase_session_id', 'is', null)

    if (!error && data) {
      // Group by purchase session
      const purchaseMap = new Map<string, Purchase>()
      
      data.forEach(comment => {
        const sessionId = comment.purchase_session_id!
        if (!purchaseMap.has(sessionId)) {
          purchaseMap.set(sessionId, {
            session_id: sessionId,
            total_amount: 5, // Placeholder
            comment_count: 0,
            created_at: comment.created_at
          })
        }
        purchaseMap.get(sessionId)!.comment_count++
      })

      setPurchases(Array.from(purchaseMap.values()))
    }
  }

  const fetchArtists = async () => {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setArtists(data)
    }
  }

  const fetchPendingApprovals = async () => {
    // Fetch all non-approved artists for admin review
    const { data: pendingArtistsData } = await supabase
      .from('artists')
      .select('*')
      .neq('status', 'approved')

    console.log('DEBUG: pendingArtistsData', pendingArtistsData)

    if (pendingArtistsData) {
      setPendingArtists(pendingArtistsData)
    }

    // Fetch pending songs with artist names
    const { data: pendingSongsData } = await supabase
      .from('songs')
      .select(`*, artists!inner(name)`)
      .eq('submitted_for_approval', true)
      .eq('status', 'pending')

    if (pendingSongsData) {
      setPendingSongs(pendingSongsData.map(song => ({
        ...song,
        artist_name: song.artists?.name || 'Unknown Artist'
      })))
    }
  }

  const fetchApprovalHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('approval_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching approval history:', error)
        // Don't show error to user if table doesn't exist yet or has permission issues
        if (error.code === '42P01' || error.code === '42501') { // Table doesn't exist or permission denied
          console.log('Approval history table not accessible:', error.message)
          setApprovalHistory([])
          return
        }
        return
      }

      setApprovalHistory(data || [])
    } catch (error) {
      console.error('Error fetching approval history:', error)
      setApprovalHistory([])
    }
  }

  const fetchSignupAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('signup_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching signup analytics:', error)
        return
      }

      setSignupAnalytics(data || [])
    } catch (error) {
      console.error('Error fetching signup analytics:', error)
    }
  }

  const approveArtist = async (artistId: string) => {
    // Fetch artist details for logging
    const { data: artistData } = await supabase
      .from('artists')
      .select('name, email')
      .eq('id', artistId)
      .single()

    const { error } = await supabase
      .from('artists')
      .update({ status: 'approved' })
      .eq('id', artistId)

    if (!error) {
      // Log to approval history
      if (artistData) {
        await supabase
          .from('approval_history')
          .insert({
            item_type: 'artist',
            item_id: artistId,
            action: 'approved',
            item_title: artistData.name,
            item_artist_name: artistData.name,
            notes: 'Artist approved by admin'
          })
      }
      await fetchPendingApprovals()
      await fetchAnalytics()
      await fetchApprovalHistory()
    }
  }

  const rejectArtist = async (artistId: string) => {
    const { error } = await supabase
      .from('artists')
      .update({ status: 'rejected' })
      .eq('id', artistId)

    if (!error) {
      await fetchPendingApprovals()
      await fetchAnalytics()
      await fetchApprovalHistory()
    }
  }

  const approveSong = async (songId: string) => {
    try {
      console.log('=== APPROVE SONG DEBUG ===')
      console.log('1. Starting approval for songId:', songId)
      
      // Use admin API endpoint to bypass RLS
      console.log('2. Calling admin API endpoint...')
      const response = await fetch('/api/admin/approve-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Admin API error:', result)
        alert('Error approving song: ' + result.message)
        return
      }

      console.log('3. Admin API call successful:', result)

      console.log('4. Refreshing pending approvals...')
      await fetchPendingApprovals()
      
      console.log('=== APPROVAL COMPLETE ===')
      alert('Song approved successfully!')
    } catch (error) {
      console.error('Error in approveSong:', error)
      alert('Error approving song: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const rejectSong = async (songId: string) => {
    try {
      // First, get the song details for logging
      const { data: songData } = await supabase
        .from('songs')
        .select(`
          *,
          artists!inner(name)
        `)
        .eq('id', songId)
        .single()

      // Update the song status
      const { error } = await supabase
        .from('songs')
        .update({ status: 'rejected' })
        .eq('id', songId)

      if (error) {
        console.error('Error rejecting song:', error)
        alert('Error rejecting song: ' + error.message)
        return
      }

      // Log to approval history
      if (songData) {
        await supabase
          .from('approval_history')
          .insert({
            item_type: 'song',
            item_id: songId,
            action: 'rejected',
            item_title: songData.title,
            item_artist_name: songData.artists?.name || 'Unknown Artist',
            notes: 'Rejected by admin'
          })
      }

      await fetchPendingApprovals()
      await fetchAnalytics()
      await fetchApprovalHistory()
    } catch (error) {
      console.error('Error in rejectSong:', error)
      alert('Error rejecting song')
    }
  }

  const openEditArtist = (artist: Artist) => {
    setEditingArtist(artist)
    setEditForm({
      name: artist.name,
      email: artist.email,
      bio: artist.bio || ''
    })
  }

  const closeEditArtist = () => {
    setEditingArtist(null)
    setEditForm({ name: '', email: '', bio: '' })
  }

  const saveArtistEdit = async () => {
    if (!editingArtist) return

    const { error } = await supabase
      .from('artists')
      .update({
        name: editForm.name,
        email: editForm.email,
        bio: editForm.bio
      })
      .eq('id', editingArtist.id)

    if (!error) {
      await fetchArtists()
      closeEditArtist()
    }
  }

  const viewArtistProfile = (artistId: string) => {
    router.push(`/artist/${artistId}`)
  }

  const playVoiceComment = async (comment: VoiceComment) => {
    if (!comment.audio_data) {
      alert('No audio data available for this comment')
      return
    }

    try {
      // Stop any currently playing audio
      if (playingAudioId && audioRefs[playingAudioId]) {
        audioRefs[playingAudioId]?.pause()
        setPlayingAudioId(null)
      }

      // Create audio element if it doesn't exist
      if (!audioRefs[comment.id]) {
        const audio = new Audio(comment.audio_data)
        audio.onended = () => setPlayingAudioId(null)
        audio.onerror = (e) => {
          console.error('Audio playback error:', e)
          setPlayingAudioId(null)
        }
        setAudioRefs(prev => ({ ...prev, [comment.id]: audio }))
      }

      const audio = audioRefs[comment.id]
      if (audio) {
        if (playingAudioId === comment.id) {
          // Pause if already playing
          audio.pause()
          setPlayingAudioId(null)
        } else {
          // Play the audio
          await audio.play()
          setPlayingAudioId(comment.id)
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      alert('Error playing audio')
    }
  }

  // Fetch all artists and songs for the database tab
  const fetchDatabaseTables = async () => {
    let artistQuery = supabase.from('artists').select('*').order('created_at', { ascending: false })
    if (artistFilter) artistQuery = artistQuery.ilike('email', `%${artistFilter}%`)
    if (artistStatusFilter) artistQuery = artistQuery.eq('status', artistStatusFilter)
    const { data: allArtists } = await artistQuery
    setDbArtists(allArtists || [])

    // Always fetch all songs, regardless of status
    let songQuery = supabase.from('songs').select('*').order('created_at', { ascending: false })
    if (songFilter) songQuery = songQuery.ilike('title', `%${songFilter}%`)
    if (songStatusFilter) songQuery = songQuery.eq('status', songStatusFilter)
    const { data: allSongs, error: songsError } = await songQuery
    console.log('DEBUG: allSongs from Supabase', allSongs, 'error:', songsError);
    setDbSongs(allSongs || [])
  }

  useEffect(() => {
    if (activeTab === 'database') {
      fetchDatabaseTables()
    }
  }, [activeTab, artistFilter, artistStatusFilter, songFilter, songStatusFilter])

  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchPendingApprovals();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'artists') {
      fetchArtists();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage artists, songs, and platform analytics</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'artists', label: 'Artists' },
              { id: 'approvals', label: 'Approvals' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'comments', label: 'Voice Comments' },
              { id: 'purchases', label: 'Purchases' },
              { id: 'signups', label: 'Signups' },
              { id: 'database', label: 'Database' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#E55A2B] text-[#E55A2B]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Artists</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.totalArtists}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Songs</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.totalSongs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Voice Comments</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.totalVoiceComments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">${analytics.totalRevenue}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pending Artists</p>
                      <p className="text-sm text-gray-500">{pendingArtists.length} awaiting approval</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="text-[#E55A2B] hover:text-[#D14A1B] text-sm font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pending Songs</p>
                      <p className="text-sm text-gray-500">{pendingSongs.length} awaiting approval</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="text-[#E55A2B] hover:text-[#D14A1B] text-sm font-medium"
                    >
                      View All →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Artist Analytics</h2>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setAnalyticsView('overview')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    analyticsView === 'overview'
                      ? 'bg-[#E55A2B] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Artists Overview
                </button>
                <button
                  onClick={() => setAnalyticsView('individual')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    analyticsView === 'individual'
                      ? 'bg-[#E55A2B] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Individual Artist
                </button>
              </div>
            </div>
            
            {analyticsView === 'overview' ? (
              <AllArtistsAnalytics />
            ) : (
              <>
                {/* Artist Selection */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Artist for Detailed Analytics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {artists.map((artist) => (
                      <button
                        key={artist.id}
                        onClick={() => setSelectedArtistId(artist.id)}
                        className={`p-4 rounded-lg border transition-all ${
                          selectedArtistId === artist.id
                            ? 'bg-[#E55A2B] border-[#E55A2B] text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-semibold">{artist.name}</div>
                        <div className="text-sm opacity-75">{artist.email}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detailed Analytics for Selected Artist */}
                {selectedArtistId && (
                  <ArtistAnalytics artistId={selectedArtistId} />
                )}
              </>
            )}
          </div>
        )}

        {/* Artists Tab */}
        {activeTab === 'artists' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Artists</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {artists.map((artist) => (
                    <tr key={artist.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{artist.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{artist.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          artist.status === 'approved' ? 'bg-green-100 text-green-800' :
                          artist.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {artist.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(artist.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewArtistProfile(artist.id)}
                            className="text-[#E55A2B] hover:text-[#D14A1B]"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditArtist(artist)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          console.log('RENDER: pendingArtists', pendingArtists),
          <div className="space-y-6">
            {/* Pending Artists */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Pending Artist Approvals</h3>
                <button onClick={fetchPendingApprovals} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">Refresh</button>
              </div>
              <div className="p-6">
                {pendingArtists.length === 0 ? (
                  <p className="text-gray-500">No pending artist approvals</p>
                ) : (
                  <div className="space-y-4">
                    {pendingArtists.map((artist) => (
                      <div key={artist.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{artist.name}</h4>
                          <p className="text-sm text-gray-500">{artist.email}</p>
                          {artist.bio && <p className="text-sm text-gray-600 mt-1">{artist.bio}</p>}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveArtist(artist.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectArtist(artist.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Songs */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Pending Song Approvals</h3>
              </div>
              <div className="p-6">
                {pendingSongs.length === 0 ? (
                  <p className="text-gray-500">No pending song approvals</p>
                ) : (
                  <div className="space-y-4">
                    {pendingSongs.map((song) => (
                      <div key={song.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{song.title}</h4>
                          <p className="text-sm text-gray-500">by {song.artist_name}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveSong(song.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectSong(song.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Approval History */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Approval History</h3>
                <p className="text-sm text-gray-500 mt-1">Recent approval and rejection actions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vote Goal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {approvalHistory.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                          No approval history found
                        </td>
                      </tr>
                    ) : (
                      approvalHistory.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.item_type === 'song' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.item_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.item_title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.item_artist_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.vote_goal ? `${item.vote_goal} votes` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.vote_price ? `$${item.vote_price.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.action === 'approved' ? 'bg-green-100 text-green-800' :
                              item.action === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.admin_email || 'System'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Voice Comments Tab */}
        {activeTab === 'comments' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Voice Comments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Song</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {voiceComments.map((comment) => (
                    <tr key={comment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comment.song_title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comment.artist_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          comment.status === 'purchased' ? 'bg-green-100 text-green-800' :
                          comment.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {comment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comment.audio_data ? (
                          <button
                            onClick={() => playVoiceComment(comment)}
                            className={`p-2 rounded-full transition-colors ${
                              playingAudioId === comment.id
                                ? 'bg-[#E55A2B] text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            title={playingAudioId === comment.id ? 'Pause' : 'Play'}
                          >
                            {playingAudioId === comment.id ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400">No audio</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Purchases</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => (
                    <tr key={purchase.session_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{purchase.session_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${purchase.total_amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.comment_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signup Analytics Tab */}
        {activeTab === 'signups' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Signup Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">Track signup attempts and email confirmation status</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Song</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Sent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {signupAnalytics.map((signup) => (
                    <tr key={signup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {signup.artist_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {signup.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {signup.song_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          signup.signup_status === 'success' ? 'bg-green-100 text-green-800' :
                          signup.signup_status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {signup.signup_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          signup.email_sent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {signup.email_sent ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          signup.email_confirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {signup.email_confirmed ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(signup.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {signup.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {signupAnalytics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No signup analytics data available yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-bold mb-4">Artists Table</h2>
              <div className="flex gap-4 mb-2">
                <input type="text" placeholder="Filter by email" value={artistFilter} onChange={e => setArtistFilter(e.target.value)} className="border px-2 py-1 rounded" />
                <input type="text" placeholder="Filter by status" value={artistStatusFilter} onChange={e => setArtistStatusFilter(e.target.value)} className="border px-2 py-1 rounded" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {dbArtists[0] && Object.keys(dbArtists[0]).map(col => (
                        <th key={col} className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dbArtists.map((artist, idx) => (
                      <tr key={artist.id || idx}>
                        {Object.values(artist).map((val, i) => (
                          <td key={i} className="px-4 py-2 text-sm text-gray-700">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                    {dbArtists.length === 0 && (
                      <tr><td colSpan={20} className="text-center py-4 text-gray-400">No artists found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Songs Table</h2>
              <div className="mb-2 text-sm text-gray-600">
                <b>Status Legend:</b> <span className="font-semibold">Private</span> = uploaded, not submitted; <span className="font-semibold">Pending</span> = awaiting admin approval; <span className="font-semibold">Approved</span> = public on artist page; <span className="font-semibold">Rejected</span> = admin rejected.
              </div>
              <div className="flex gap-4 mb-2">
                <input type="text" placeholder="Filter by title" value={songFilter} onChange={e => setSongFilter(e.target.value)} className="border px-2 py-1 rounded" />
                <input type="text" placeholder="Filter by status" value={songStatusFilter} onChange={e => setSongStatusFilter(e.target.value)} className="border px-2 py-1 rounded" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {dbSongs[0] && Object.keys(dbSongs[0]).map(col => (
                        <th key={col} className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dbSongs.map((song, idx) => (
                      <tr key={song.id || idx}>
                        {Object.values(song).map((val, i) => (
                          <td key={i} className="px-4 py-2 text-sm text-gray-700">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                    {dbSongs.length === 0 && (
                      <tr><td colSpan={20} className="text-center py-4 text-gray-400">No songs found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Edit Artist Modal */}
        {editingArtist && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Artist</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E55A2B] focus:border-[#E55A2B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E55A2B] focus:border-[#E55A2B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E55A2B] focus:border-[#E55A2B]"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeEditArtist}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveArtistEdit}
                    className="px-4 py-2 bg-[#E55A2B] text-white rounded-md hover:bg-[#D14A1B]"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 