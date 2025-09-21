'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useChatbot } from '@/context/ChatbotContext'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const Chatbot = () => {
  const { isChatbotOpen, setIsChatbotOpen, chatbotMode, setChatbotMode } = useChatbot()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [email, setEmail] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [size, setSize] = useState({ width: 400, height: 600 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputValue(transcript)
          handleSendMessage(transcript)
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
        }
      }
      
      synthesisRef.current = window.speechSynthesis
    }
  }, [])

  // Initialize welcome message
  useEffect(() => {
    if (isChatbotOpen && messages.length === 0) {
      let welcomeText = "Welcome to your Mizel Course and Safety Training Advisor! I can help you search the entire site for training courses, understand safety requirements and which courses may fit your needs best, while ensuring your team gets the proper trainings and certifications. I'm loaded up with thousands of proprietary course materials, documents, and experiences in safety situations and trainings, so how can I support?"
      
      if (chatbotMode === 'manager') {
        welcomeText = "Welcome! I'm your Enterprise Training Solutions Advisor. I can help you explore our comprehensive enterprise training programs, including custom training solutions, Learning Management System integration, and bulk pricing options. What type of enterprise training solutions are you looking for? Are you interested in custom programs, LMS integration, or volume training for your organization?"
      }
      
      const welcomeMessage: Message = {
        id: 'welcome',
        text: welcomeText,
        isUser: false,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isChatbotOpen, chatbotMode])

  // Handle course search mode
  useEffect(() => {
    if (isChatbotOpen && chatbotMode === 'course-search') {
      const searchQuery = sessionStorage.getItem('courseSearchQuery')
      if (searchQuery) {
        setInputValue(searchQuery)
        handleSendMessage(searchQuery)
        sessionStorage.removeItem('courseSearchQuery')
        setChatbotMode('default')
      }
    }
  }, [isChatbotOpen, chatbotMode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const speak = (text: string) => {
    if (synthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.1
      utterance.pitch = 0.8
      
      // Try to find Australian voice
      const voices = synthesisRef.current.getVoices()
      const australianVoice = voices.find(voice => 
        voice.lang.includes('en-AU') || voice.name.includes('Australian')
      )
      
      if (australianVoice) {
        utterance.voice = australianVoice
      }
      
      synthesisRef.current.speak(utterance)
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim()
    if (!text) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Send search query to API for course search and analytics
      const response = await fetch('/api/course-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          email: email || null,
          mode: chatbotMode
        })
      })

      const data = await response.json()

      if (data.success && data.courses && data.courses.length > 0) {
        // Build AI response with course recommendations
        let aiResponseText = `I found ${data.courses.length} course${data.courses.length !== 1 ? 's' : ''} that match your search for "${text}":\n\n`
        
        data.courses.forEach((course: any, index: number) => {
          aiResponseText += `${index + 1}. **${course.title}**\n`
          aiResponseText += `   - Category: ${course.category}\n`
          aiResponseText += `   - Duration: ${course.duration_hours} hours\n`
          aiResponseText += `   - Price: $${course.price}\n`
          aiResponseText += `   - ${course.short_description}\n\n`
        })

        aiResponseText += `These courses are designed to meet your safety training needs. Would you like me to provide more details about any specific course, or would you like to discuss your training requirements further?`

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          isUser: false,
          timestamp: new Date()
        }

        setTimeout(() => {
          setMessages(prev => [...prev, aiResponse])
          setIsTyping(false)
          speak(aiResponse.text)
        }, 1000)
      } else {
        // Fallback response if no courses found
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `I understand you're looking for "${text}". While I didn't find exact matches, I can help you find the right safety training. Our courses cover Construction Safety, Environmental Safety, General Safety, and Specialized Training. What specific safety requirements do you need to meet?`,
          isUser: false,
          timestamp: new Date()
        }

        setTimeout(() => {
          setMessages(prev => [...prev, aiResponse])
          setIsTyping(false)
          speak(aiResponse.text)
        }, 1000)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        isUser: false,
        timestamp: new Date()
      }
      
      setTimeout(() => {
        setMessages(prev => [...prev, errorMessage])
        setIsTyping(false)
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
    if (isResizing) {
      const newWidth = resizeStart.width + (e.clientX - resizeStart.x)
      const newHeight = resizeStart.height + (e.clientY - resizeStart.y)
      setSize({
        width: Math.max(300, newWidth),
        height: Math.max(400, newHeight)
      })
    }
  }, [isDragging, isResizing, dragStart, resizeStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    })
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  if (!isChatbotOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="bg-blue-600 text-white p-6 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4 7v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7l-8-5z"/>
            <path d="M12 6l6 3v6H6V9l6-3z"/>
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div
      ref={chatRef}
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
    >
      {/* Header */}
      <div 
        className="bg-blue-600 text-white p-4 rounded-t-lg cursor-move drag-handle flex justify-between items-center"
        onMouseDown={handleMouseDown}
      >
        <div>
          <h3 className="text-2xl font-bold">Mizel AI Advisor</h3>
        </div>
        <button
          onClick={() => setIsChatbotOpen(false)}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-xl">{message.text}</div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Email Capture */}
      {email === '' && messages.length > 2 && (
        <div className="p-4 border-t border-gray-200">
          <label className="block text-xl font-medium text-gray-700 mb-2">
            Email for follow-up
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@company.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about safety training..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={startVoiceInput}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Voice Input"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4 7v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7l-8-5z"/>
              <path d="M12 6l6 3v6H6V9l6-3z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400"
        onMouseDown={handleResizeStart}
      />
    </div>
  )
}

export default Chatbot