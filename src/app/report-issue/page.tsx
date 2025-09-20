'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FormData {
  issueName: string
  description: string
  pageUrl: string
  name: string
  email: string
}

export default function ReportIssue() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    issueName: '',
    description: '',
    pageUrl: '',
    name: '',
    email: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // For now, we'll just log the issue and show success
      // In production, you'd send this to your backend/email system
      console.log('Issue reported:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess(true)
      setIsSubmitting(false)
    } catch (error) {
      console.error('Error submitting issue:', error)
      setError('There was an error submitting your issue. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Issue Reported Successfully</h2>
          <p className="text-gray-600 mb-6">
            Thank you for reporting this issue. We'll review it and get back to you soon.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#E55A2B] text-white font-semibold py-3 px-6 rounded-full hover:bg-[#D14A1B] transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-[#E55A2B] hover:text-[#D14A1B] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Report an Issue</h1>
            <p className="text-gray-600 text-lg">
              Help us improve Launch That Song by reporting any issues you encounter.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Name *
                </label>
                <input
                  type="text"
                  name="issueName"
                  value={formData.issueName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E55A2B] focus:border-[#E55A2B] text-gray-900 placeholder-gray-500"
                  placeholder="Brief description of the issue"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E55A2B] focus:border-[#E55A2B] text-gray-900 placeholder-gray-500 resize-none"
                  placeholder="Please describe the issue in detail, including what you were trying to do and what happened instead"
                />
              </div>

              {/* Page URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page URL (where the issue occurred)
                </label>
                <input
                  type="url"
                  name="pageUrl"
                  value={formData.pageUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E55A2B] focus:border-[#E55A2B] text-gray-900 placeholder-gray-500"
                  placeholder="https://launchthatsong.com/..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional: Include the URL of the page where you encountered the issue
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E55A2B] focus:border-[#E55A2B] text-gray-900 placeholder-gray-500"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E55A2B] focus:border-[#E55A2B] text-gray-900 placeholder-gray-500"
                  placeholder="Enter your email address"
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll use this to follow up on your issue
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#E55A2B] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#D14A1B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Issue Report'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 