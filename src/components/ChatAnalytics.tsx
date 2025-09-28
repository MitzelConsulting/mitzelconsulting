'use client'

import React, { useState, useEffect } from 'react'

interface ChatSession {
  id: string
  created_at: string
  user_name: string
  user_email: string
  message_count: number
  source_page: string
  chat_mode: string
  session_duration: number
  is_completed: boolean
}

interface ChatMessage {
  id: string
  message: string
  is_user_message: boolean
  created_at: string
}

interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[]
}

const ChatAnalytics: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchChatSessions()
  }, [])

  const fetchChatSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/chat-sessions')
      const data = await response.json()

      if (data.success) {
        setSessions(data.sessions)
      } else {
        setError('Failed to fetch chat sessions')
      }
    } catch (err) {
      console.error('Error fetching chat sessions:', err)
      setError('Error fetching chat sessions')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat-session?sessionId=${sessionId}`)
      const data = await response.json()

      if (data.success) {
        setSelectedSession(data.session)
        setShowModal(true)
      } else {
        setError('Failed to fetch session details')
      }
    } catch (err) {
      console.error('Error fetching session details:', err)
      setError('Error fetching session details')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getTotalStats = () => {
    const totalSessions = sessions.length
    const totalMessages = sessions.reduce((sum, session) => sum + session.message_count, 0)
    const sessionsWithEmail = sessions.filter(s => s.user_email !== 'No email provided').length
    const averageMessages = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0

    return {
      totalSessions,
      totalMessages,
      sessionsWithEmail,
      averageMessages
    }
  }

  const stats = getTotalStats()

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
            onClick={fetchChatSessions}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-8 ${className}`}>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Chat Analytics</h2>
        <p className="text-gray-600">Monitor all AI assistant conversations and user interactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.totalMessages}</div>
          <div className="text-sm text-gray-600">Total Messages</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.sessionsWithEmail}</div>
          <div className="text-sm text-gray-600">With Contact Info</div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.averageMessages}</div>
          <div className="text-sm text-gray-600">Avg Messages/Session</div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Messages
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {session.user_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.user_email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(session.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.message_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {session.source_page || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDuration(session.session_duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => fetchSessionDetails(session.id)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    View Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No chat sessions found</div>
          <div className="text-gray-400 text-sm mt-2">Chat sessions will appear here once users start conversations</div>
        </div>
      )}

      {/* Chat Detail Modal */}
      {showModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Chat Session Details</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <div><strong>User:</strong> {selectedSession.user_name}</div>
                    <div><strong>Email:</strong> {selectedSession.user_email}</div>
                    <div><strong>Date:</strong> {formatDate(selectedSession.created_at)}</div>
                    <div><strong>Messages:</strong> {selectedSession.message_count}</div>
                    <div><strong>Source:</strong> {selectedSession.source_page}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {selectedSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_user_message ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.is_user_message
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-sm">{message.message}</div>
                      <div className={`text-xs mt-1 ${
                        message.is_user_message ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatDate(message.created_at)}
                      </div>
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

export default ChatAnalytics
