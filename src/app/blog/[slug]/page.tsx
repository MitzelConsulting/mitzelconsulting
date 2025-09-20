'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { notFound } from 'next/navigation'

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image_url: string
  featured_image_alt: string
  author_name: string
  author_bio: string
  author_image_url: string
  published_at: string
  category_id: string
  tags: string[]
  seo_title: string
  seo_description: string
  seo_keywords: string[]
  view_count: number
  read_time_minutes: number
}

type BlogCategory = {
  id: string
  name: string
  slug: string
  description: string
  color: string
}

type RelatedPost = {
  id: string
  title: string
  slug: string
  featured_image_url: string
  published_at: string
}

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [category, setCategory] = useState<BlogCategory | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBlogPost(params.slug)
  }, [params.slug])

  const fetchBlogPost = async (slug: string) => {
    try {
      // Fetch the blog post
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (postError || !postData) {
        notFound()
        return
      }

      setPost(postData)

      // Update view count
      await supabase
        .from('blog_posts')
        .update({ view_count: (postData.view_count || 0) + 1 })
        .eq('id', postData.id)

      // Fetch category
      if (postData.category_id) {
        const { data: categoryData } = await supabase
          .from('blog_categories')
          .select('*')
          .eq('id', postData.category_id)
          .single()
        
        setCategory(categoryData)
      }

      // Fetch related posts
      const { data: relatedData } = await supabase
        .from('blog_posts')
        .select('id, title, slug, featured_image_url, published_at')
        .eq('status', 'published')
        .neq('id', postData.id)
        .order('published_at', { ascending: false })
        .limit(3)

      setRelatedPosts(relatedData || [])

    } catch (error) {
      console.error('Error fetching blog post:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E55A2B] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading blog post...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    notFound()
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <head>
        <title>{post.seo_title || post.title} | Mitzel Consulting</title>
        <meta name="description" content={post.seo_description || post.excerpt} />
        <meta name="keywords" content={post.seo_keywords?.join(', ') || post.tags.join(', ')} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.featured_image_url} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.featured_image_url} />
      </head>

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <nav className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-[#E55A2B]">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href="/blog" className="text-gray-500 hover:text-[#E55A2B]">Blog</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900">{post.title}</span>
            </div>
          </div>
        </nav>

        {/* Article Header */}
        <article className="bg-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              {/* Category Badge */}
              {category && (
                <div className="mb-4">
                  <Link
                    href={`/blog?category=${category.slug}`}
                    className="inline-block px-4 py-2 text-sm font-medium text-white rounded-full"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </Link>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {post.excerpt}
              </p>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#E55A2B] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {post.author_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{post.author_name}</p>
                    <p className="text-gray-500">Safety Training Expert</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{post.read_time_minutes || 5} min read</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{formatDate(post.published_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span>{post.view_count} views</span>
                </div>
              </div>

              {/* Featured Image */}
              {post.featured_image_url && (
                <div className="relative h-64 md:h-96 mb-12 rounded-lg overflow-hidden">
                  <Image
                    src={post.featured_image_url}
                    alt={post.featured_image_alt || post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="prose prose-lg max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
                  className="text-gray-800 leading-relaxed"
                />
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-[#E55A2B] hover:text-white transition-colors cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Bio */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-[#E55A2B] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-bold">
                      {post.author_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      About {post.author_name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {post.author_bio || `Kris Mitzel is a certified safety professional with years of experience in OSHA training and workplace safety. He specializes in helping companies develop comprehensive safety programs and ensuring regulatory compliance.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  Related Articles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      href={`/blog/${relatedPost.slug}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative h-48">
                        <Image
                          src={relatedPost.featured_image_url || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800'}
                          alt={relatedPost.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(relatedPost.published_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-[#E55A2B] py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Your Safety Training?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Get your team OSHA certified with our comprehensive training programs. 
              Digital and on-site options available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="bg-white text-[#E55A2B] font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
              >
                View Courses
              </Link>
              <Link
                href="/request-training"
                className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-[#E55A2B] transition-colors"
              >
                Request Training
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
