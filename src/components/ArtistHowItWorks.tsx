'use client'

import React, { forwardRef } from 'react'
import { useChatbot } from '@/context/ChatbotContext'

const features = [
  {
    title: 'OSHA Certification',
    icon: (
      <svg className="w-10 h-10 text-[#E55A2B]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="#E55A2B"/>
        <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="#E55A2B" strokeWidth="2" fill="none"/>
      </svg>
    ),
    description: 'Get comprehensive OSHA certification training for your team. Choose from OSHA 10-Hour, OSHA 30-Hour, and specialized safety courses that meet federal compliance requirements.'
  },
  {
    title: 'Flexible Delivery',
    icon: (
      <svg className="w-10 h-10 text-[#E55A2B]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    description: 'Choose from digital self-paced courses or on-site training at your facility. Our flexible delivery options ensure your team gets the training they need, when they need it.'
  },
  {
    title: 'Expert Instruction',
    icon: (
      <svg className="w-10 h-10 text-[#E55A2B]" fill="none" viewBox="0 0 24 24" stroke="#E55A2B" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    description: 'Learn from Kris Mizel, a certified safety professional with years of experience. Get personalized guidance and real-world insights that go beyond basic compliance requirements.'
  },
  {
    title: 'AI Safety Assistant',
    icon: (
      <svg className="w-10 h-10 text-[#E55A2B]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    ),
    description: 'Chat with our AI Safety Assistant to get instant answers about OSHA regulations, course requirements, and training recommendations. Available 24/7 to help with your safety questions.'
  }
]

const SafetyTrainingHowItWorks = () => {
  const { setIsChatbotOpen, setChatbotMode } = useChatbot()
  console.log('SafetyTrainingHowItWorks mounted', { setIsChatbotOpen, setChatbotMode })

  const handleAISafetyAssistantClick = () => {
    console.log('AI Safety Assistant card clicked!')
    setIsChatbotOpen(true)
    setChatbotMode('safety')
  }

  return (
    <section id="how-it-works" className="max-w-4xl mx-auto mt-16 mb-12 px-4" data-section="how-it-works">
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <h2 className="text-4xl font-extrabold mb-4 text-gray-900">For Companies: How It Works</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, idx) => {
          const isAISafetyAssistant = feature.title === 'AI Safety Assistant';
          return (
            <div
              key={feature.title}
              className={`bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-2xl transition-shadow duration-300 ${isAISafetyAssistant ? 'cursor-pointer hover:bg-orange-50' : ''}`}
              onClick={isAISafetyAssistant ? handleAISafetyAssistantClick : undefined}
            >
              {feature.icon}
              <h3 className="text-xl font-bold mt-4 mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-700 mb-2">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  )
}

export default SafetyTrainingHowItWorks 