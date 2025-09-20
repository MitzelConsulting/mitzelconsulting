'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface ArtistAnalyticsSummary {
  artistId: string
  artistName: string
  artistEmail: string
  pageViews: number
  uniqueVisitors: number
  votes: number
  avgSessionTime: number
  totalAudioTime: number
  conversionRate: number
  revenue: {
    total: number
    payouts: number
    pending: number
    platformFees: number
    platformProfit: number
  }
}

export default function AllArtistsAnalytics() {
  const [analytics, setAnalytics] = useState<ArtistAnalyticsSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [sortBy, setSortBy] = useState<'pageViews' | 'votes' | 'revenue' | 'conversionRate'>('pageViews')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchAllArtistsAnalytics()
  }, [timeRange])

  const fetchAllArtistsAnalytics = async () => {
    setLoading(true)
    try {
      // Get all artists
      const { data: artists, error: artistsError } = await supabase
        .from('artists')
        .select('id, name, email')
        .eq('status', 'approved')

      if (artistsError || !artists) {
        console.error('Error fetching artists:', artistsError)
        return
      }

      // Fetch analytics for each artist
      const analyticsPromises = artists.map(async (artist) => {
        try {
          const response = await fetch(`/api/analytics/artist-stats?artistId=${artist.id}&timeRange=${timeRange}`)
          const result = await response.json()
          
          if (result.success) {
            return {
              artistId: artist.id,
              artistName: artist.name,
              artistEmail: artist.email,
              pageViews: result.data.pageViews,
              uniqueVisitors: result.data.uniqueVisitors,
              votes: result.data.votes,
              avgSessionTime: result.data.avgSessionTimeSeconds,
              totalAudioTime: result.data.totalAudioTimeSeconds,
              conversionRate: parseFloat(result.data.conversionRate.replace('%', '')),
              revenue: result.data.revenue
            }
          }
        } catch (error) {
          console.error(`Error fetching analytics for ${artist.name}:`, error)
        }
        
        // Return default data if analytics fetch failed
        return {
          artistId: artist.id,
          artistName: artist.name,
          artistEmail: artist.email,
          pageViews: 0,
          uniqueVisitors: 0,
          votes: 0,
          avgSessionTime: 0,
          totalAudioTime: 0,
          conversionRate: 0,
          revenue: { 
            total: 0, 
            payouts: 0, 
            pending: 0, 
            platformFees: 0, 
            platformProfit: 0 
          }
        }
      })

      const analyticsData = await Promise.all(analyticsPromises)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error fetching all artists analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const sortedAnalytics = [...analytics].sort((a, b) => {
    let aValue: number
    let bValue: number

    switch (sortBy) {
      case 'pageViews':
        aValue = a.pageViews
        bValue = b.pageViews
        break
      case 'votes':
        aValue = a.votes
        bValue = b.votes
        break
      case 'revenue':
        aValue = a.revenue.total
        bValue = b.revenue.total
        break
      case 'conversionRate':
        aValue = a.conversionRate
        bValue = b.conversionRate
        break
      default:
        aValue = a.pageViews
        bValue = b.pageViews
    }

    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
  })

  const totalStats = analytics.reduce((acc, artist) => ({
    pageViews: acc.pageViews + artist.pageViews,
    uniqueVisitors: acc.uniqueVisitors + artist.uniqueVisitors,
    votes: acc.votes + artist.votes,
    revenue: acc.revenue + artist.revenue.total,
    payouts: acc.payouts + artist.revenue.payouts,
    platformProfit: acc.platformProfit + artist.revenue.platformProfit
  }), {
    pageViews: 0,
    uniqueVisitors: 0,
    votes: 0,
    revenue: 0,
    payouts: 0,
    platformProfit: 0
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">All Artists Analytics</h3>
          <p className="text-sm text-gray-600">Performance metrics across all artists</p>
        </div>
        
        <div className="flex gap-2">
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
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#E55A2B]"
          >
            <option value="pageViews">Page Views</option>
            <option value="votes">Votes</option>
            <option value="revenue">Revenue</option>
            <option value="conversionRate">Conversion Rate</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Total Page Views</p>
          <p className="text-2xl font-bold text-blue-800">{totalStats.pageViews.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-600">Total Votes</p>
          <p className="text-2xl font-bold text-green-800">{totalStats.votes.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-600">Total Revenue</p>
          <p className="text-2xl font-bold text-purple-800">{formatCurrency(totalStats.revenue)}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-orange-600">Platform Profit</p>
          <p className="text-2xl font-bold text-orange-800">{formatCurrency(totalStats.platformProfit)}</p>
        </div>
      </div>

      {/* Artists Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Views</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Visitors</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Session</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audio Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payouts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Profit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAnalytics.map((artist) => (
              <tr key={artist.artistId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{artist.artistName}</div>
                    <div className="text-sm text-gray-500">{artist.artistEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {artist.pageViews.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {artist.uniqueVisitors.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {artist.votes.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(artist.avgSessionTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(artist.totalAudioTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {artist.conversionRate.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(artist.revenue.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(artist.revenue.payouts)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(artist.revenue.platformProfit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedAnalytics.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      )}
    </div>
  )
} 