'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ChatbotContextType {
  isChatbotOpen: boolean
  setIsChatbotOpen: (open: boolean) => void
  chatbotMode: 'default' | 'manager'
  setChatbotMode: (mode: 'default' | 'manager') => void
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined)

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [chatbotMode, setChatbotMode] = useState<'default' | 'manager'>('default')

  return (
    <ChatbotContext.Provider value={{
      isChatbotOpen,
      setIsChatbotOpen,
      chatbotMode,
      setChatbotMode
    }}>
      {children}
    </ChatbotContext.Provider>
  )
}

export function useChatbot() {
  const context = useContext(ChatbotContext)
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider')
  }
  return context
} 