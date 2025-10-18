'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  category: string;
  subcategory: string;
  duration_hours: number;
  price: number;
  certification_type: string;
  difficulty_level: string;
  delivery_method: string[];
  featured_image_url: string;
  slug: string;
  is_featured: boolean;
  is_active: boolean;
  enrollment_count: number;
  view_count: number;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.slug) {
      fetchCourse(params.slug as string);
    }
  }, [params.slug]);

  const fetchCourse = async (slug: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        const foundCourse = data.courses.find((c: Course) => c.slug === slug);
        if (foundCourse) {
          setCourse(foundCourse);
        } else {
          setError('Course not found');
        }
      } else {
        setError('Failed to fetch course');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to fetch course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (course) {
      // Add course to cart - we'll need to update the cart context for courses
      addToCart({
        courseId: course.id,
        courseTitle: course.title,
        coursePrice: course.price,
        courseSlug: course.slug,
        courseImage: course.featured_image_url,
        courseDuration: course.duration_hours,
        courseCategory: course.category
      });
      
      // Navigate to cart
      router.push('/cart');
    }
  };

  const getSafetyTrainingImages = () => {
    const baseImages = [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop&crop=center', // Construction safety
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop&crop=center', // Environmental safety
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop&crop=center', // General safety
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=center', // Training session
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop&crop=center', // Safety equipment
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop&crop=center'  // Workplace safety
    ];
    
    // Return 3-4 images based on course category
    if (course?.category === 'Construction Safety') {
      return baseImages.slice(0, 4);
    } else if (course?.category === 'Environmental Safety') {
      return baseImages.slice(1, 5);
    } else {
      return baseImages.slice(2, 6);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 text-xl">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-xl text-gray-600 mb-8">{error || 'The course you are looking for does not exist.'}</p>
          <Link
            href="/courses"
            className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Courses
          </Link>
        </div>
      </div>
    );
  }

  const safetyImages = getSafetyTrainingImages();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/courses" className="text-blue-600 hover:text-blue-800">Courses</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{course.title}</span>
          </nav>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Image */}
            <div className="space-y-4">
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                {course.featured_image_url ? (
                  <img
                    src={course.featured_image_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <div className="text-white text-center">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p className="text-xl font-semibold">Safety Training Course</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Additional Safety Training Images */}
              <div className="grid grid-cols-2 gap-4">
                {safetyImages.slice(0, 4).map((image, index) => (
                  <div key={index} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Safety training ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Course Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {course.category}
                  </span>
                  {course.is_featured && (
                    <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      Best Seller
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
                <p className="text-xl text-gray-600 leading-relaxed">{course.short_description}</p>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-gray-900">${course.price}</div>
                  <div className="text-sm text-gray-500">Course Price</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{course.duration_hours}h</div>
                  <div className="text-sm text-gray-500">Duration</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{course.enrollment_count}</div>
                  <div className="text-sm text-gray-500">Students Enrolled</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{course.difficulty_level}</div>
                  <div className="text-sm text-gray-500">Difficulty</div>
                </div>
              </div>

              {/* Delivery Methods */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Methods</h3>
                <div className="flex flex-wrap gap-2">
                  {course.delivery_method.map((method, index) => (
                    <span key={index} className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              {/* Purchase Button */}
              <div className="pt-6">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-600 text-white font-semibold py-4 px-8 rounded-lg hover:bg-blue-700 transition-colors text-xl flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  Add to Cart - ${course.price}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Description */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Course Description</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed text-xl">
                {course.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Features */}
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What You'll Learn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">OSHA Compliance</h3>
                </div>
                <p className="text-gray-600">Learn the latest OSHA standards and regulations to ensure workplace safety compliance.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Interactive Learning</h3>
                </div>
                <p className="text-gray-600">Engage with interactive modules, quizzes, and real-world scenarios.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Safety Certification</h3>
                </div>
                <p className="text-gray-600">Receive industry-recognized certification upon successful completion.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Flexible Schedule</h3>
                </div>
                <p className="text-gray-600">Learn at your own pace with 24/7 access to course materials.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who trust Mizel Safety Consulting for their safety training needs.
            </p>
            <button
              onClick={handleAddToCart}
              className="bg-white text-blue-600 font-semibold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors text-xl"
            >
              Enroll Now - ${course.price}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
