import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">Sorry, we couldn't find the page you're looking for.</p>
        <Link
          href="/"
          className="bg-[#E55A2B] hover:bg-[#D14A1B] text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
} 