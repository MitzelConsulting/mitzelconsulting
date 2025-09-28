'use client'

import React, { useState, useEffect } from 'react'

interface EmailCapture {
  id: string
  email: string
  session_id: string
  captured_at: string
  source_page: string
  chat_mode: string
  total_messages: number
  chat_sessions: {
    id: string
    session_id: string
    created_at: string
    total_messages: number
  }
}

interface EmailAnalyticsProps {
  className?: string
}

export default function EmailAnalytics({ className = '' }: EmailAnalyticsProps) {
  const [emailCaptures, setEmailCaptures] = useState<EmailCapture[]>([])
  const [statistics, setStatistics] = useState({
    totalCaptures: 0,
    totalMessages: 0,
    avgMessagesPerCapture: 0,
    dailyStats: {} as Record<string, number>
  })
  const [loading, setLoading] = useState(true)
  const [selectedCapture, setSelectedCapture] = useState<EmailCapture | null>(null)
  const [chatHistory, setChatHistory] = useState<any[]>([])

  useEffect(() => {
    fetchEmailAnalytics()
  }, [])

  const fetchEmailAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/email-captures')
      const data = await response.json()

      if (data.success) {
        setEmailCaptures(data.data.emailCaptures)
        setStatistics(data.data.statistics)
      }
    } catch (error) {
      console.error('Error fetching email analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChatHistory = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat-session?sessionId=${sessionId}`)
      const data = await response.json()

      if (data.success) {
        setChatHistory(data.messages)
      }
    } catch (error) {
      console.error('Error fetching chat history:', error)
    }
  }

  const handleViewChatHistory = (capture: EmailCapture) => {
    setSelectedCapture(capture)
    fetchChatHistory(capture.session_id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Email Captures Analytics</h2>
        <button
          onClick={fetchEmailAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Email Captures</h3>
          <p className="text-2xl font-bold text-blue-900">{statistics.totalCaptures}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Total Messages</h3>
          <p className="text-2xl font-bold text-green-900">{statistics.totalMessages}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Avg Messages/Capture</h3>
          <p className="text-2xl font-bold text-purple-900">{statistics.avgMessagesPerCapture}</p>
        </div>
      </div>

      {/* Email Captures List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Email Captures</h3>
        {emailCaptures.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No email captures yet.</p>
        ) : (
          <div className="space-y-3">
            {emailCaptures.slice(0, 10).map((capture) => (
              <div
                key={capture.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{capture.email}</span>
                      <span className="text-sm text-gray-500">
                        {formatDate(capture.captured_at)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Source: {capture.source_page}</p>
                      <p>Mode: {capture.chat_mode}</p>
                      <p>Messages: {capture.total_messages}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewChatHistory(capture)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    View Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat History Modal */}
      {selectedCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Chat History</h3>
                  <p className="text-gray-600">{selectedCapture.email}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedCapture.captured_at)} • {selectedCapture.total_messages} messages
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCapture(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.is_user_message ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.is_user_message
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message_text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
