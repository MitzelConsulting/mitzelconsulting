'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EmailAnalytics from '@/components/EmailAnalytics'
import ChatAnalytics from '@/components/ChatAnalytics'
import CourseKeywordsAnalytics from '@/components/CourseKeywordsAnalytics'
import EmailCaptureAnalytics from '@/components/EmailCaptureAnalytics'

const AdminDashboard = () => {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    digitalClients: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    courseSearches: 0,
    totalInquiries: 0
  })
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Tooltip component
  const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
      <div 
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 max-w-xs">
            <div className="whitespace-pre-line">{content}</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    checkAdminAuth()
    fetchDashboardData()
  }, [])

  const checkAdminAuth = () => {
    try {
      const adminSession = localStorage.getItem('adminSession')
      if (adminSession) {
        const sessionData = JSON.parse(adminSession)
        const now = Date.now()
        const sessionAge = now - sessionData.timestamp
        
        // Check if session is less than 24 hours old
        if (sessionAge < 24 * 60 * 60 * 1000) {
          setAdminUser(sessionData.admin)
          setAuthLoading(false)
          return
        } else {
          // Session expired, remove it
          localStorage.removeItem('adminSession')
        }
      }
      
      // No valid session, redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Error checking admin auth:', error)
      router.push('/login')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/login')
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data
      const [courseSearchRes, coursesRes, analyticsRes] = await Promise.all([
        fetch('/api/course-search'),
        fetch('/api/courses'),
        fetch('/api/analytics/dashboard')
      ])
      
      const courseSearchData = await courseSearchRes.json()
      const coursesData = await coursesRes.json()
      const analyticsData = await analyticsRes.json()

      setStats({
        totalCourses: coursesData?.courses?.length || 0,
        totalUsers: analyticsData?.analytics?.totalUsers || 0,
        digitalClients: analyticsData?.analytics?.digitalClients || 0,
        totalRevenue: analyticsData?.analytics?.totalRevenue || 0,
        pendingApprovals: analyticsData?.analytics?.pendingApprovals || 0,
        courseSearches: courseSearchData?.analytics?.length || 0,
        totalInquiries: analyticsData?.analytics?.totalInquiries || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-8xl md:text-10xl font-bold text-gray-900 mb-2 title-black">Admin Dashboard</h1>
              <p className="text-xl text-gray-600">Welcome, {adminUser.firstName} {adminUser.lastName}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Site
              </button>
            </div>
          </div>
        </div>
        </div>

      <div className="container mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Tooltip content="Total number of safety training courses available in the system. This count is fetched from the courses table in the database and represents all active training programs offered by Mizel Consulting.">
            <div className="bg-white rounded-lg shadow-lg p-6 cursor-help">
                  <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</p>
                  <p className="text-gray-600">Total Courses</p>
                    </div>
                  </div>
                </div>
          </Tooltip>

          <Tooltip content="Total number of users who have created accounts on the website. This count is fetched from the clients table in the database and represents all registered users who can log in and access training programs.">
            <div className="bg-white rounded-lg shadow-lg p-6 cursor-help">
                  <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-gray-600">Registered Users</p>
                    </div>
                  </div>
                </div>
          </Tooltip>

          <Tooltip content="Number of users who have actually purchased digital courses through the website. This count is fetched from the course_enrollments table where course_type = 'digital' and represents users who have completed a purchase, not just registered accounts.">
            <div className="bg-white rounded-lg shadow-lg p-6 cursor-help">
                  <div className="flex items-center">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.digitalClients}</p>
                  <p className="text-gray-600">Digital Clients</p>
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip content="Total number of inquiries received through contact forms, chat sessions, and email captures. This count is fetched from the email_captures table and represents all potential leads who have provided their contact information.">
            <div className="bg-white rounded-lg shadow-lg p-6 cursor-help">
                  <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalInquiries}</p>
                  <p className="text-gray-600">Total Inquiries</p>
                    </div>
                  </div>
                </div>
          </Tooltip>

          <Tooltip content="Total revenue generated from all course purchases. This amount is calculated by summing the price field from all records in the course_enrollments table, representing the total income from digital course sales.">
            <div className="bg-white rounded-lg shadow-lg p-6 cursor-help">
                  <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-gray-600">Total Revenue</p>
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip content="Number of pending approvals for artist submissions or other content that requires admin review. This count is fetched from the analytics dashboard API and represents items waiting for administrative action.">
            <div className="bg-white rounded-lg shadow-lg p-6 cursor-help">
                        <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
                <p className="text-gray-600">Pending Approvals</p>
              </div>
            </div>
            </div>
          </Tooltip>

          <Tooltip content="Total number of course searches performed by users on the website. This count is fetched from the course_search_analytics table and represents all search queries made through the course search functionality.">
            <div className="bg-white rounded-lg shadow-lg p-6 cursor-help">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-full">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.courseSearches}</p>
                <p className="text-gray-600">Course Searches</p>
              </div>
            </div>
            </div>
          </Tooltip>
                  </div>

        {/* Email Analytics */}
        <EmailAnalytics className="mb-8" />

        {/* Chat Analytics */}
        <ChatAnalytics className="mb-8" />

        {/* Course Keywords Analytics */}
        <CourseKeywordsAnalytics className="mb-8" />

        {/* Email Capture Analytics */}
        <EmailCaptureAnalytics className="mb-8" />

        {/* Course Search Analytics */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Course Search Analytics</h2>
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-2xl text-gray-600">Course search analytics will appear here</p>
            <p className="text-gray-500 mt-2">Track popular search terms and user behavior</p>
          </div>
        </div>
      </div>
    </div>
  )
} 

export default AdminDashboard