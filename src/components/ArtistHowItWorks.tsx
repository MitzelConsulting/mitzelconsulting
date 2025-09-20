'use client'

import React, { forwardRef } from 'react'
import { useChatbot } from '@/context/ChatbotContext'

const features = [
  {
    title: 'Gain Contributions',
    icon: (
      <svg className="w-10 h-10 text-[#8B5CF6]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#8B5CF6"/>
      </svg>
    ),
    description: 'Get support for unreleased songs during the early stage of your creation process. See which songs ideas resonate most before you fully produce, release, and distribute on Bandcamp, Spotify, or SoundCloud.'
  },
  {
    title: 'NFTs',
    icon: (
      <svg className="w-10 h-10 text-[#6366F1]" fill="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="#6366F1" />
        <rect x="6" y="8" width="6" height="6" rx="1" fill="#fff" />
        <circle cx="17" cy="10" r="2" fill="#fff" />
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="#4F46E5" strokeWidth="2" fill="none" />
      </svg>
    ),
    description: 'You can reward your supporters with NFT badges that give them backstage passes, private invites to house concerts, early arrival at your release show, free parking, and more!'
  },
  {
    title: 'Song Feedback',
    icon: (
      <svg className="w-10 h-10 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="#8B5CF6" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5z" fill="#8B5CF6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12c0-1.657-1.343-3-3-3m3 3c0 1.657-1.343 3-3 3m3-3h0" />
      </svg>
    ),
    description: 'Potential supporters can click on the song and leave voice comments for feedback. They will be encouraged to make a paid contribution so that their recorded comments send to you!'
  },
  {
    title: 'AI Music Manager',
    icon: (
      <svg className="w-10 h-10 text-[#6366F1]" fill="currentColor" viewBox="0 0 24 24">
        <rect x="5" y="8" width="14" height="10" rx="3" />
        <rect x="9" y="2" width="6" height="4" rx="2" />
        <circle cx="8" cy="13" r="1.5" fill="#fff" />
        <circle cx="16" cy="13" r="1.5" fill="#fff" />
        <rect x="11" y="16" width="2" height="2" rx="1" fill="#fff" />
      </svg>
    ),
    description: 'Chat with the AI Music Manager on the bottom left (<-- over there!) You can ask it anything about LaunchThatSong.com or even get help for writing social posts that inspire support and feedback.'
  }
]

const ArtistHowItWorks = () => {
  const { setIsChatbotOpen, setChatbotMode } = useChatbot()
  console.log('ArtistHowItWorks mounted', { setIsChatbotOpen, setChatbotMode })

  const handleAIMusicManagerClick = () => {
    console.log('AI Music Manager card clicked!')
    setIsChatbotOpen(true)
    setChatbotMode('manager')
  }

  return (
    <section id="how-it-works" className="max-w-4xl mx-auto mt-16 mb-12 px-4" data-section="how-it-works">
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <h2 className="text-4xl font-extrabold mb-4 text-gray-900">For Artists: How It Works</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, idx) => {
          const isAIMusicManager = feature.title === 'AI Music Manager';
          return (
            <div
              key={feature.title}
              className={`bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-2xl transition-shadow duration-300 ${isAIMusicManager ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
              onClick={isAIMusicManager ? handleAIMusicManagerClick : undefined}
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

export default ArtistHowItWorks 