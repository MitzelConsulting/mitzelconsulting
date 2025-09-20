'use client'

import { useState } from 'react'

export default function DashboardPage() {
  const [artistName, setArtistName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)

    try {
      // Look up artist in Supabase by name
      const supabaseRes = await fetch(`/api/lookup-artist?name=${encodeURIComponent(artistName)}`)
      const artist = await supabaseRes.json()

      if (!artist?.id || !artist?.email) {
        alert('Artist not found or missing email.')
        setLoading(false)
        return
      }

      // Send data to Stripe onboarding route
      const stripeRes = await fetch('/api/stripe/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: artist.id,
          name: artistName,
          email: artist.email,
        }),
      })

      const stripeData = await stripeRes.json()

      if (stripeData?.url) {
        window.location.href = stripeData.url
      } else {
        alert('Unable to get Stripe onboarding link.')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to connect to Stripe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Connect Stripe for Payouts</h1>
      <p className="mb-4 text-gray-600">
        Enter your artist name to begin onboarding with Stripe.
      </p>

      <input
        type="text"
        placeholder="Your Artist Name"
        className="border p-2 w-full mb-4"
        value={artistName}
        onChange={(e) => setArtistName(e.target.value)}
      />

      <button
        onClick={handleConnect}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        {loading ? 'Redirecting...' : 'Connect Stripe'}
      </button>
    </main>
  )
}