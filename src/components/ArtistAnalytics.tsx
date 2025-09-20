'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface ArtistAnalyticsProps {
  artistId: string
}

interface AnalyticsData {
  artistId: string
  timeRange: string
  pageViews: number
  uniqueVisitors: number
  votes: number
  avgSessionTimeSeconds: number
  avgSessionTimeFormatted: string
  totalAudioTimeSeconds: number
  totalAudioTimeFormatted: string
  conversionRate: string
  revenue: {
    total: number
    payouts: number
    pending: number
    platformFees: number
    platformProfit: number
  }
  engagement: {
    avgTimeOnPage: string
    audioEngagement: string
    clickThroughRate: string
  }
  songs: Array<{
    songId: string
    totalRevenue: number
    platformFee: number
    artistPayout: number
    purchaseCount: number
  }>
}

export default function ArtistAnalytics({ artistId }: ArtistAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [artist, setArtist] = useState<any>(null)
  const [songs, setSongs] = useState<any[]>([])

  useEffect(() => {
    fetchArtist()
    fetchSongs()
    fetchAnalytics()
  }, [artistId, timeRange])

  const fetchArtist = async () => {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single()

    if (data) {
      setArtist(data)
    }
  }

  const fetchSongs = async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .eq('status', 'approved')

    if (data) {
      setSongs(data)
    }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/artist-stats?artistId=${artistId}&timeRange=${timeRange}`)
      const result = await response.json()
      
      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Analytics for {artist?.name || 'Artist'}
          </h3>
          <p className="text-sm text-gray-600">Performance metrics and insights</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#E55A2B]"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Page Views and Visitors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Page Views</p>
              <p className="text-2xl font-bold text-blue-800">{analytics.pageViews.toLocaleString()}</p>
            </div>
            <div className="text-blue-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Unique Visitors</p>
              <p className="text-2xl font-bold text-green-800">{analytics.uniqueVisitors.toLocaleString()}</p>
            </div>
            <div className="text-green-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Votes</p>
              <p className="text-2xl font-bold text-purple-800">{analytics.votes.toLocaleString()}</p>
            </div>
            <div className="text-purple-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-orange-800">{analytics.conversionRate}</p>
            </div>
            <div className="text-orange-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-800">{formatCurrency(analytics.revenue.total)}</p>
            </div>
            <div className="text-emerald-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Artist Payouts</p>
              <p className="text-2xl font-bold text-blue-800">{formatCurrency(analytics.revenue.payouts)}</p>
            </div>
            <div className="text-blue-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending Payouts</p>
              <p className="text-2xl font-bold text-yellow-800">{formatCurrency(analytics.revenue.pending)}</p>
            </div>
            <div className="text-yellow-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Platform Profit</p>
              <p className="text-2xl font-bold text-red-800">{formatCurrency(analytics.revenue.platformProfit)}</p>
            </div>
            <div className="text-red-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Engagement</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg. Time on Page:</span>
              <span className="text-sm font-medium">{analytics.engagement.avgTimeOnPage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Audio Engagement:</span>
              <span className="text-sm font-medium">{analytics.engagement.audioEngagement}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Click Through Rate:</span>
              <span className="text-sm font-medium">{analytics.engagement.clickThroughRate}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Time Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Session Time:</span>
              <span className="text-sm font-medium">{analytics.avgSessionTimeFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Audio Time:</span>
              <span className="text-sm font-medium">{analytics.totalAudioTimeFormatted}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Revenue Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Revenue:</span>
              <span className="text-sm font-medium">{formatCurrency(analytics.revenue.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Artist Payouts:</span>
              <span className="text-sm font-medium">{formatCurrency(analytics.revenue.payouts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Platform Profit:</span>
              <span className="text-sm font-medium">{formatCurrency(analytics.revenue.platformProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Song-specific Revenue */}
      {analytics.songs.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-4">Revenue by Song</h4>
          <div className="space-y-3">
            {analytics.songs.map((song) => {
              const songData = songs.find(s => s.id === song.songId)
              return (
                <div key={song.songId} className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{songData?.title || 'Unknown Song'}</p>
                    <p className="text-sm text-gray-500">{song.purchaseCount} purchases</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(song.totalRevenue)}</p>
                    <p className="text-sm text-gray-500">Artist: {formatCurrency(song.artistPayout)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 