'use client'

import React, { useEffect, useState, createContext, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import { useCart } from '@/context/CartContext'
import SafetyTrainingHowItWorks from '@/components/SafetyTrainingHowItWorks'
import { useChatbot } from '@/context/ChatbotContext'

type Course = {
  id: string
  title: string
  description: string
  short_description: string
  category: string
  subcategory: string
  duration_hours: number
  price: number
  certification_type: string
  difficulty_level: string
  delivery_method: string[]
  featured_image_url: string
  slug: string
  enrollment_count: number
  view_count: number
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCourseSearch, setShowCourseSearch] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [courseSearchQuery, setCourseSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  })

  const { setIsChatbotOpen, setChatbotMode } = useChatbot()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .limit(12)

      if (error) {
        console.error('Error fetching courses:', error)
        setError('Failed to fetch courses')
        return
      }

      setCourses(data || [])
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Something went wrong')
    }
  }

  const handleCourseSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseSearchQuery.trim()) return

    try {
      setIsSearching(true)
      console.log('Course search query:', courseSearchQuery)
      
      // Open chatbot with course search mode
      setIsChatbotOpen(true)
      setChatbotMode('course-search')
      
      // Store the search query for the AI
      sessionStorage.setItem('courseSearchQuery', courseSearchQuery)
      
    } catch (error) {
      console.error('Course search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      console.log('Contact form submitted:', contactForm)
      
      // Here you would typically send the form data to your backend
      alert('Message sent successfully! Our CEO, Kris Mitzel, will get back to you soon.')
      
      // Reset form
      setContactForm({ name: '', email: '', message: '' })
      setShowContactForm(false)
    } catch (error) {
      console.error('Contact form error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className={isModalOpen ? 'opacity-0 pointer-events-none select-none' : ''}>
        <section className="text-center py-20 sm:py-32 container mx-auto">
          <h1 className="text-8xl md:text-10xl font-bold text-gray-900 leading-tight title-black mb-6">
            Extensive Safety Training
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
            Comprehensive safety resource for digital courses and on-site trainings. Navigate our options with AI
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href="/courses"
              className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto flex items-center justify-center gap-2"
            >
              View All Courses
            </Link>
            <button
              onClick={() => setShowCourseSearch(!showCourseSearch)}
              className="bg-transparent border-2 border-blue-600 text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              Explore Courses
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${showCourseSearch ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </section>
        
        {/* Course Search Section */}
        {showCourseSearch && (
          <section className="transition-all duration-500 ease-in-out opacity-100 py-16">
            <div className="container mx-auto px-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Quick Course Search
                  </h3>
                  <p className="text-gray-600">
                    Tell us what safety training you need and our AI will find the best course for you.
                  </p>
                </div>
                
                <form onSubmit={handleCourseSearch} className="space-y-6">
                  <div>
                    <textarea
                      value={courseSearchQuery}
                      onChange={(e) => setCourseSearchQuery(e.target.value)}
                      placeholder="Example: I need OSHA 30-hour construction training for my supervisors, or HAZWOPER training for chemical cleanup workers..."
                      className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                      rows={3}
                      required
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      type="submit"
                      disabled={isSearching || !courseSearchQuery.trim()}
                      className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSearching ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Searching...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Find My Course
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowCourseSearch(false)}
                      className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                  
                  <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      💡 Tip: Be specific about your industry, job role, and certification needs for better results.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Top Requested Safety Training Courses */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Top Requested Safety Training Courses</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our most popular courses designed to meet your compliance requirements.
              </p>
            </div>
            
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Something went wrong! We're sorry, but something unexpected happened. Try again</p>
                <button 
                  onClick={fetchCourses}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
                      </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {course.featured_image_url && (
                      <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${course.featured_image_url})` }}></div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {course.category}
                        </span>
                        {course.enrollment_count > 100 && (
                          <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{course.short_description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-bold text-gray-900">${course.price}</div>
                        <div className="text-sm text-gray-500">
                          {course.duration_hours}h • {course.certification_type}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {course.delivery_method.map((method, index) => (
                          <span key={index} className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            {method}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/course/${course.slug}`}
                        className="block w-full bg-blue-600 text-white text-center font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Course
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* How It Works Section */}
        <SafetyTrainingHowItWorks />

        {/* Why Choose Mitzel Safety Consulting Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Mitzel Safety Consulting?</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Since 2020, Mitzel Safety Consulting has helped 1,000+ professionals achieve their safety trainings. With over 50 specialized courses and certifications, we are your trusted partner for workplace safety compliance.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Experience Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">25+ Years Experience</h3>
                <p className="text-gray-600 mb-4">Delivering comprehensive OSHA training and safety compliance solutions</p>
                <div className="text-4xl font-bold text-blue-600">25+</div>
                <div className="text-sm text-gray-500">Years Experience</div>
        </div>
        
              {/* Digital Learning Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Digital Learning</h3>
                <p className="text-gray-600 mb-4">Advanced User Experience</p>
                <div className="text-4xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-gray-500">Digital Platform</div>
      </div>

              {/* Flexible Delivery Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Delivery</h3>
                <p className="text-gray-600 mb-4">Digital self-paced courses or on-site training at your facility</p>
                <div className="text-4xl font-bold text-blue-600">2</div>
                <div className="text-sm text-gray-500">Delivery Options</div>
              </div>

              {/* AI Powered Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setIsChatbotOpen(true)}>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3L2 8v6c0 1.1.9 2 2 2h1v4c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-4h1c1.1 0 2-.9 2-2V8l-10-5zM12 7c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                    <path d="M8 14h8v2H8v-2zm0-4h8v2H8v-2z" fill="currentColor"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Site Powered By AI</h3>
                <p className="text-gray-600 mb-4">Our entire platform is powered by advanced AI technology. Get instant answers about OSHA regulations, course requirements, and training recommendations.</p>
                <div className="text-4xl font-bold text-blue-600">24/7</div>
                <div className="text-sm text-gray-500">AI Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* Looking for Other Industry Courses Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Looking for Other Industry Courses?</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Explore our comprehensive range of safety training programs across different industries and specializations.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: 'Construction Safety', color: 'bg-blue-600', courses: ['OSHA 30-Hour Construction', 'Scaffold Safety', 'Fall Protection', 'Excavation Safety'] },
                { name: 'Environmental Safety', color: 'bg-blue-600', courses: ['HAZWOPER 40-Hour', 'Environmental Compliance', 'Waste Management', 'Spill Response'] },
                { name: 'General Industry', color: 'bg-blue-600', courses: ['OSHA 10-Hour General', 'Workplace Safety', 'Emergency Response', 'Safety Management'] },
                { name: 'Healthcare Safety', color: 'bg-blue-600', courses: ['Bloodborne Pathogens', 'Infection Control', 'Healthcare Ergonomics', 'Patient Safety'] },
                { name: 'Manufacturing', color: 'bg-blue-600', courses: ['Machine Safety', 'Chemical Safety', 'Quality Control', 'Process Safety'] },
                { name: 'Specialized Training', color: 'bg-blue-600', courses: ['Confined Space Entry', 'Lockout/Tagout', 'Respiratory Protection', 'Hearing Conservation'] }
              ].map((category, index) => (
                <div key={index} className="bg-black rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className={`h-32 ${category.color} flex items-center justify-center`}>
                    <div className="text-white text-center">
                      <h3 className="text-xl font-bold">{category.name}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-2">
                      {category.courses.map((course, courseIndex) => (
                        <li key={courseIndex} className="text-gray-300 flex items-center">
                          <span className="text-blue-400 mr-2">&gt;</span>
                          {course}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      View All {category.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        {showContactForm && (
          <section className="transition-all duration-500 ease-in-out opacity-100 py-16">
            <div className="container mx-auto px-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Get in Touch with Our Team
                  </h3>
                  <p className="text-gray-600">
                    Complete the form with a message and our CEO, Kris Mitzel, will get back to you as soon as possible.
                  </p>
                </div>
                
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="contact-name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="contact-email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      id="contact-message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Tell us about your safety training needs, questions, or how we can help..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      required
                    />
        </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      type="submit"
                      disabled={isSubmitting || !contactForm.name || !contactForm.email || !contactForm.message}
                      className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
        </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who trust Mitzel Safety Consulting for their safety training needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowContactForm(true)}
                className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Request Training
              </button>
              <button
                onClick={() => setIsChatbotOpen(true)}
                className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Chat with AI Assistant
              </button>
            </div>
          </div>
        </section>
    </div>
    </>
  )
}