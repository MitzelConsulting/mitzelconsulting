'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type VoiceComment = {
  songId: string
  songTitle: string
  artistId: string
  artistName: string
  audioData: string // Base64 encoded audio
  audioFilename: string
  commentId?: string // Supabase record ID if saved
}

export type CartItem = {
  songId: string
  songTitle: string
  artistId: string
  voteCount: number
  votePrice: number
  voiceComment?: VoiceComment
}

type CartContextType = {
  cartItems: CartItem[]
  lastVisitedArtist: string | null
  addToCart: (item: CartItem) => void
  removeFromCart: (songId: string) => void
  clearCart: () => void
  setLastVisitedArtist: (artistId: string) => void
  addVoiceComment: (songId: string, voiceComment: VoiceComment) => void
  removeVoiceComment: (songId: string) => void
  getVoiceComment: (songId: string) => VoiceComment | undefined
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [lastVisitedArtist, setLastVisitedArtistState] = useState<string | null>(null)

  // Function to reset corrupted cart data
  const resetCorruptedCart = () => {
    console.warn('Resetting corrupted cart data')
    setCartItems([])
    localStorage.removeItem('cart')
  }

  useEffect(() => {
    const storedCart = localStorage.getItem('cart')
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart)
        // Ensure parsed data is an array
        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart)
        } else {
          resetCorruptedCart()
        }
      } catch (error) {
        console.error('Error parsing cart data from localStorage:', error)
        resetCorruptedCart()
      }
    }
    
    const storedLastArtist = localStorage.getItem('lastVisitedArtist')
    if (storedLastArtist) {
      setLastVisitedArtistState(storedLastArtist)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    if (lastVisitedArtist) {
      localStorage.setItem('lastVisitedArtist', lastVisitedArtist)
    }
  }, [lastVisitedArtist])

  const addToCart = (item: CartItem) => {
    setCartItems(prev => {
      const currentItems = Array.isArray(prev) ? prev : []
      const existing = currentItems.find(i => i.songId === item.songId)
      if (existing) {
        return currentItems.map(i =>
          i.songId === item.songId
            ? { ...i, voteCount: i.voteCount + (item.voteCount || 1) }
            : i
        )
      }
      return [...currentItems, { ...item, voteCount: item.voteCount || 1 }]
    })
  }

  const removeFromCart = (songId: string) => {
    setCartItems(prev => {
      const currentItems = Array.isArray(prev) ? prev : []
      return currentItems.filter(i => i.songId !== songId)
    })
  }

  const clearCart = () => setCartItems([])

  const setLastVisitedArtist = (artistId: string) => {
    setLastVisitedArtistState(artistId)
  }

  const addVoiceComment = (songId: string, voiceComment: VoiceComment) => {
    setCartItems(prev => {
      const currentItems = Array.isArray(prev) ? prev : []
      return currentItems.map(item => 
        item.songId === songId 
          ? { ...item, voiceComment }
          : item
      )
    })
  }

  const removeVoiceComment = (songId: string) => {
    setCartItems(prev => {
      const currentItems = Array.isArray(prev) ? prev : []
      return currentItems.map(item => 
        item.songId === songId 
          ? { ...item, voiceComment: undefined }
          : item
      )
    })
  }

  const getVoiceComment = (songId: string) => {
    const item = Array.isArray(cartItems) ? cartItems.find(i => i.songId === songId) : undefined
    return item?.voiceComment
  }

  return (
    <CartContext.Provider value={{ 
      cartItems: Array.isArray(cartItems) ? cartItems : [], 
      lastVisitedArtist, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      setLastVisitedArtist,
      addVoiceComment,
      removeVoiceComment,
      getVoiceComment
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}