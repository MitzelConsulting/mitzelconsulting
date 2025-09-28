'use client'

import React, { useState, useEffect } from 'react'

interface Keyword {
  keyword: string
  count: number
}

interface EmailCapture {
  id: string
  email: string
  name: string | null
  captured_at: string
  source_page: string
  chat_mode: string
  chat_session: {
    id: string
    user_name: string
    user_email: string
    created_at: string
    source_page: string
    chat_mode: string
  }
  keywords: Keyword[]
  has_user_account: boolean
  user_account_created: string | null
  total_keywords: number
  search_queries: string[]
}

interface EmailCaptureAnalytics {
  emailCaptures: EmailCapture[]
  summary: {
    totalCaptures: number
    withUserAccounts: number
    withoutUserAccounts: number
    conversionRate: number
  }
}

const EmailCaptureAnalytics: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<EmailCaptureAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState(30)
  const [selectedEmail, setSelectedEmail] = useState<EmailCapture | null>(null)
  const [generatedEmail, setGeneratedEmail] = useState<string>('')
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  useEffect(() => {
    fetchEmailCaptures()
  }, [timeRange])

  const fetchEmailCaptures = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/email-captures-detailed?days=${timeRange}&limit=100`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data)
      } else {
        setError('Failed to fetch email captures')
      }
    } catch (err) {
      console.error('Error fetching email captures:', err)
      setError('Error fetching email captures')
    } finally {
      setLoading(false)
    }
  }

  const generateFollowUpEmail = async (emailCapture: EmailCapture) => {
    try {
      setGeneratingEmail(true)
      const response = await fetch('/api/analytics/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailCapture.email,
          name: emailCapture.name || emailCapture.chat_session.user_name,
          keywords: emailCapture.keywords,
          searchQueries: emailCapture.search_queries,
          hasUserAccount: emailCapture.has_user_account,
          sourcePage: emailCapture.source_page
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedEmail(data.emailContent)
        setSelectedEmail(emailCapture)
        setShowEmailModal(true)
      } else {
        setError('Failed to generate email')
      }
    } catch (err) {
      console.error('Error generating email:', err)
      setError('Error generating email')
    } finally {
      setGeneratingEmail(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const formatDate = (dateString: string) => {
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
            onClick={fetchEmailCaptures}
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
          <p className="text-lg">No email capture data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-8 ${className}`}>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-900">Email Capture Analytics</h2>
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
        <p className="text-gray-600">Track captured emails with associated keywords and user account status</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{analytics.summary.totalCaptures}</div>
          <div className="text-sm text-gray-600">Total Email Captures</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{analytics.summary.withUserAccounts}</div>
          <div className="text-sm text-gray-600">With User Accounts</div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{analytics.summary.withoutUserAccounts}</div>
          <div className="text-sm text-gray-600">Without User Accounts</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{analytics.summary.conversionRate}%</div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
        </div>
      </div>

      {/* Email Captures Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email & Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Captured
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Keywords
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {analytics.emailCaptures.map((capture) => (
              <tr key={capture.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{capture.email}</div>
                    <div className="text-sm text-gray-500">
                      {capture.name || capture.chat_session.user_name || 'No name provided'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(capture.captured_at)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {capture.keywords.slice(0, 3).map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {keyword.keyword} ({keyword.count})
                      </span>
                    ))}
                    {capture.keywords.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{capture.keywords.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    capture.has_user_account
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {capture.has_user_account ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {capture.source_page}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => generateFollowUpEmail(capture)}
                    disabled={generatingEmail}
                    className="text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50"
                  >
                    {generatingEmail ? 'Generating...' : 'Generate Email'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {analytics.emailCaptures.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No email captures found</div>
          <div className="text-gray-400 text-sm mt-2">Email captures will appear here once users provide their contact information</div>
        </div>
      )}

      {/* Email Generation Modal */}
      {showEmailModal && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Generated Follow-up Email</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <div><strong>To:</strong> {selectedEmail.email}</div>
                    <div><strong>Name:</strong> {selectedEmail.name || selectedEmail.chat_session.user_name || 'No name'}</div>
                    <div><strong>Keywords:</strong> {selectedEmail.keywords.map(k => k.keyword).join(', ')}</div>
                    <div><strong>Has Account:</strong> {selectedEmail.has_user_account ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Email Content:
                </label>
                <textarea
                  value={generatedEmail}
                  readOnly
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Copy this email and paste it into your email client to send to {selectedEmail.email}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => copyToClipboard(generatedEmail)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmailCaptureAnalytics
