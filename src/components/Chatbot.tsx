'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatbot } from '@/context/ChatbotContext'

const Chatbot = () => {
  const { isChatbotOpen, setIsChatbotOpen, chatbotMode, setChatbotMode } = useChatbot()

  const [messages, setMessages] = useState<{ id: string, text: string, isUser: boolean }[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Add welcome message when opened in manager mode
  useEffect(() => {
    if (isChatbotOpen && chatbotMode === 'manager' && messages.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        text: "🚀 Welcome to your AI Music Manager! I'm here to help you strategize your music career, grow your audience, and maximize your earnings on LaunchThatSong. What would you like to work on today?",
        isUser: false
      }
      setMessages([welcomeMessage])
    }
  }, [isChatbotOpen, chatbotMode, messages.length])

  // Debug log
  console.log('Chatbot rendered', { isOpen: isChatbotOpen, mode: chatbotMode })

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return
    const userMessage = { id: Date.now().toString(), text: inputValue, isUser: true }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    try {
      const res = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [
          { role: 'system', content: "You are an expert music platform assistant for LaunchThatSong.com. Give strategic, actionable, and motivational advice to artists about moving their music from SoundCloud to LaunchThatSong, growing their audience, and monetizing unreleased songs. Use the platform's rocket fuel, NFT, and voice comment features in your answers." },
          ...[...messages, userMessage].map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text }))
        ] })
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: data.reply, isUser: false }])
      } else {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "Sorry, I'm having trouble connecting to the AI assistant right now. Please try again later.", isUser: false }])
      }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "Sorry, I'm having trouble connecting to the AI assistant right now. Please try again later.", isUser: false }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className={`fixed z-50 ${isChatbotOpen ? 'bottom-4 left-1/2 transform -translate-x-1/2' : 'bottom-4 left-4'}`}>
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="bg-[#E55A2B] hover:bg-[#D14A1B] text-white rounded-full p-4 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6 md:w-12 md:h-12" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      )}
      {isChatbotOpen && (
        <div className="bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200 w-[90vw] max-w-[40rem] h-[80vh] max-h-[48rem] md:w-[40rem] md:h-[48rem]">
          <div className="bg-[#E55A2B] text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-sm md:text-base">{chatbotMode === 'manager' ? 'AI Music Manager' : 'Music Manager'}</h3>
              <p className="text-xs md:text-sm opacity-90">Get setup and build your strategy!</p>
            </div>
            <button
              onClick={() => setIsChatbotOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] md:max-w-xs px-3 py-2 rounded-lg ${message.isUser ? 'bg-[#E55A2B] text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                  <p className="text-xs md:text-sm whitespace-pre-line">{message.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 px-3 py-2 rounded-lg">
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
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage() }}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E55A2B] focus:border-transparent text-gray-800 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-[#E55A2B] hover:bg-[#D14A1B] disabled:bg-gray-300 text-white px-3 md:px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chatbot 