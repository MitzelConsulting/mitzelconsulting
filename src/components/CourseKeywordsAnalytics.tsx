'use client'

import React, { useState, useEffect } from 'react'

interface KeywordAnalytic {
  keyword: string
  search_count: number
  unique_searches: number
  last_searched: string
  avg_results_count: number
}

interface SearchTrend {
  date: string
  total_searches: number
  unique_keywords: number
  avg_results_per_search: number
}

interface PopularSearch {
  search_query: string
  search_count: number
  avg_results_count: number
  last_searched: string
}

interface KeywordsAnalytics {
  keywordAnalytics: KeywordAnalytic[]
  searchTrends: SearchTrend[]
  popularSearches: PopularSearch[]
  summary: {
    totalSearches: number
    uniqueKeywords: number
    avgSearchesPerDay: number
  }
}

const CourseKeywordsAnalytics: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<KeywordsAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState(30)
  const [activeTab, setActiveTab] = useState<'keywords' | 'trends' | 'searches'>('keywords')

  useEffect(() => {
    fetchKeywordsAnalytics()
  }, [timeRange])

  const fetchKeywordsAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/keywords?days=${timeRange}&limit=50`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        setError('Failed to fetch keywords analytics')
      }
    } catch (err) {
      console.error('Error fetching keywords analytics:', err)
      setError('Error fetching keywords analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-8 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={fetchKeywordsAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-lg">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-8 ${className}`}>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-900">Course Search Keywords Analytics</h2>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
        <p className="text-gray-600">Track and analyze keywords used in course searches</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{analytics.summary.totalSearches}</div>
          <div className="text-sm text-gray-600">Total Searches</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{analytics.summary.uniqueKeywords}</div>
          <div className="text-sm text-gray-600">Unique Keywords</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{analytics.summary.avgSearchesPerDay}</div>
          <div className="text-sm text-gray-600">Avg Searches/Day</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('keywords')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'keywords'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Top Keywords
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Search Trends
            </button>
            <button
              onClick={() => setActiveTab('searches')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'searches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Popular Searches
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'keywords' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keyword
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Searches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Searches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Searched
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.keywordAnalytics.map((keyword, index) => (
                <tr key={keyword.keyword} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        #{index + 1}
                      </span>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {keyword.keyword}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {keyword.search_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {keyword.unique_searches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {keyword.avg_results_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(keyword.last_searched)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Searches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Keywords
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Results/Search
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.searchTrends.map((trend) => (
                <tr key={trend.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(trend.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trend.total_searches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trend.unique_keywords}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trend.avg_results_per_search}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'searches' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Search Query
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Search Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Searched
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.popularSearches.map((search, index) => (
                <tr key={search.search_query} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        #{index + 1}
                      </span>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        "{search.search_query}"
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {search.search_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {search.avg_results_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(search.last_searched)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analytics.keywordAnalytics.length === 0 && analytics.searchTrends.length === 0 && analytics.popularSearches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No search data available</div>
          <div className="text-gray-400 text-sm mt-2">Search analytics will appear here once users start searching for courses</div>
        </div>
      )}
    </div>
  )
}

export default CourseKeywordsAnalytics
