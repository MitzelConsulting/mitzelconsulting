'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    question: "What OSHA training courses do you offer?",
    answer: "We offer comprehensive OSHA training courses including OSHA 10-hour and 30-hour construction and general industry courses, HAZWOPER training, confined space entry, fall protection, and many other specialized safety programs.",
    category: "General"
  },
  {
    question: "How long does it take to complete a course?",
    answer: "Course duration varies by program. OSHA 10-hour courses typically take 10 hours, OSHA 30-hour courses take 30 hours. Most courses can be completed at your own pace within 180 days of enrollment.",
    category: "Training Timeline"
  },
  {
    question: "Are your courses OSHA approved?",
    answer: "Yes, all our OSHA training courses are developed in accordance with OSHA standards and are delivered by authorized OSHA outreach trainers. Upon successful completion, you'll receive an official OSHA completion card.",
    category: "Certification"
  },
  {
    question: "Can I take courses online?",
    answer: "Yes! We offer both online and on-site training options. Our online courses are interactive, self-paced, and include multimedia content, quizzes, and final exams to ensure comprehensive learning.",
    category: "Training Methods"
  },
  {
    question: "What is the cost of OSHA training?",
    answer: "Course prices vary depending on the program. OSHA 10-hour courses start at $89, OSHA 30-hour courses start at $189. We also offer group discounts for companies training multiple employees.",
    category: "Pricing"
  },
  {
    question: "Do you offer HAZWOPER training?",
    answer: "Yes, we provide comprehensive HAZWOPER training programs including 40-hour initial training, 8-hour refresher courses, and specialized training for emergency response personnel.",
    category: "Specialized Training"
  },
  {
    question: "What if I fail the final exam?",
    answer: "If you don't pass the final exam on your first attempt, you can retake it up to two additional times at no extra cost. Our courses are designed to help you succeed.",
    category: "Course Content"
  },
  {
    question: "How quickly will I receive my certificate?",
    answer: "For online courses, you'll receive your completion certificate immediately after passing the final exam. For on-site training, certificates are typically issued within 5-7 business days.",
    category: "Training Timeline"
  },
  {
    question: "Do you offer training in languages other than English?",
    answer: "Currently, our courses are available in English. However, we can arrange for interpreters for on-site training sessions if needed. Please contact us to discuss your specific language requirements.",
    category: "Language Options"
  },
  {
    question: "What industries do you serve?",
    answer: "We serve a wide range of industries including construction, manufacturing, healthcare, oil and gas, chemical processing, and general industry. Our training programs are tailored to meet specific industry requirements.",
    category: "Industries"
  },
  {
    question: "Can you provide training at our facility?",
    answer: "Yes, we offer on-site training at your facility. This is ideal for companies that need to train multiple employees or want customized training content. Contact us for pricing and scheduling.",
    category: "Training Methods"
  },
  {
    question: "What support do you provide during training?",
    answer: "We provide comprehensive support including technical assistance, instructor support via email and phone, and access to additional learning resources. Our team is committed to your success.",
    category: "Support"
  },
  {
    question: "Are there prerequisites for OSHA courses?",
    answer: "Most OSHA courses don't have prerequisites. However, some specialized courses like HAZWOPER may require basic safety knowledge. Course descriptions will indicate any prerequisites.",
    category: "Training Levels"
  },
  {
    question: "How often do I need to renew my OSHA certification?",
    answer: "OSHA completion cards don't expire, but we recommend refresher training every 3-5 years to stay current with regulations and best practices. Some employers may require more frequent updates.",
    category: "Certification"
  },
  {
    question: "Do you offer group training discounts?",
    answer: "Yes, we offer significant discounts for group training. Discounts increase with the number of participants. Contact us for a custom quote based on your group size and training needs.",
    category: "Group Training"
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and can arrange invoicing for corporate accounts. Payment is due before course access is granted.",
    category: "Pricing"
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer: "We offer a 30-day money-back guarantee for all our training courses. If you're not completely satisfied, contact us within 30 days for a full refund.",
    category: "Support"
  },
  {
    question: "Do you offer continuing education credits?",
    answer: "Yes, many of our courses qualify for continuing education credits. Specific credit information is provided with each course description.",
    category: "Certification"
  },
  {
    question: "How do I access my course materials?",
    answer: "Once enrolled, you'll receive login credentials to access your course materials through our secure learning management system. You can access materials 24/7 from any device.",
    category: "Course Content"
  },
  {
    question: "What if I have technical issues during training?",
    answer: "Our technical support team is available Monday through Friday, 8 AM to 6 PM EST. You can reach us via phone, email, or live chat for immediate assistance.",
    category: "Support"
  }
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    name: '',
    email: '',
    company: '',
    trainingNeeds: '',
  });
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const filteredFAQs = selectedCategory === 'All' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setShowConsultationForm(false);
      setConsultationForm({ name: '', email: '', company: '', trainingNeeds: '' });
    }, 1000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setShowContactForm(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-8xl md:text-10xl font-bold text-gray-900 mb-6 title-black">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Can't find what you're looking for? <br />
            Our AI can answer thousands of questions. <br />
            Or, get in touch with our CEO, Kris Mizel, below.
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Category Filter */}
            <div className="mb-12">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => handleCategoryChange('All')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {['General', 'Training Levels', 'Certification', 'Training Methods', 'Specialized Training', 'Pricing', 'Course Content', 'Training Timeline', 'Industries', 'Language Options', 'Support', 'Group Training'].map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-6">
              {filteredFAQs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">Q</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {faq.answer}
                      </p>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Still Have Questions */}
            <div className="mt-16 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Still Have Questions?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Get personalized guidance on certification requirements and training options.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowConsultationForm(true)}
                  className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Request Training Consultation
                </button>
                <button
                  onClick={() => setShowContactForm(true)}
                  className="bg-transparent border-2 border-blue-600 text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Training Consultation Form */}
      {showConsultationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Request Training Consultation
                </h3>
                <button
                  onClick={() => setShowConsultationForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleConsultationSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={consultationForm.name}
                      onChange={(e) => setConsultationForm({...consultationForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={consultationForm.email}
                      onChange={(e) => setConsultationForm({...consultationForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={consultationForm.company}
                    onChange={(e) => setConsultationForm({...consultationForm, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Training Needs *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={consultationForm.trainingNeeds}
                    onChange={(e) => setConsultationForm({...consultationForm, trainingNeeds: e.target.value})}
                    placeholder="Please describe your training requirements, number of employees, timeline, and any specific compliance needs..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowConsultationForm(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Contact Form */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Contact Us
                </h3>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    placeholder="Complete the form with a message and our CEO, Kris Mizel, will get back to you as soon as possible."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Popular Training Topics */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Trainings
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our most requested safety training programs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Link href="/courses#osha" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600">
                  OSHA 10 & 30 Hour
                </h3>
                <p className="text-2xl text-gray-600">
                  Essential construction and general industry safety training
                </p>
              </div>
            </Link>
            
            <Link href="/courses#hazwoper" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600">
                  HAZWOPER Training
                </h3>
                <p className="text-2xl text-gray-600">
                  Comprehensive hazardous waste operations and emergency response
                </p>
              </div>
            </Link>
            
            <Link href="/courses#confined-space" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600">
                  Confined Space Entry
                </h3>
                <p className="text-2xl text-gray-600">
                  Critical training for workers entering confined spaces
                </p>
              </div>
            </Link>
            
            <Link href="/courses#fall-protection" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600">
                  Fall Protection
                </h3>
                <p className="text-2xl text-gray-600">
                  Essential training for working at height safely
                </p>
              </div>
            </Link>
            
            <Link href="/courses#lockout-tagout" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600">
                  Lockout/Tagout
                </h3>
                <p className="text-2xl text-gray-600">
                  Control hazardous energy and prevent workplace injuries
                </p>
              </div>
            </Link>
            
            <Link href="/courses#electrical-safety" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600">
                  Electrical Safety
                </h3>
                <p className="text-2xl text-gray-600">
                  Protect workers from electrical hazards and arc flash
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of professionals who trust Mizel Safety Consulting for their safety training needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/courses"
              className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              View All Courses
            </Link>
            <Link 
              href="/contact"
              className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Contact Us Today
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}