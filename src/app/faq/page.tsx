import React from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is OSHA certification and why is it important?",
    answer: "OSHA (Occupational Safety and Health Administration) certification ensures that workers have the necessary knowledge and skills to work safely in their industry. OSHA certification is crucial for compliance with federal safety regulations and helps prevent workplace accidents, injuries, and fatalities. It demonstrates your commitment to workplace safety and can reduce insurance costs while protecting your employees.",
    category: "General"
  },
  {
    question: "What's the difference between OSHA 10-Hour and OSHA 30-Hour training?",
    answer: "OSHA 10-Hour training provides basic awareness training covering fundamental safety and health hazards in the workplace. OSHA 30-Hour training offers more comprehensive coverage with detailed instruction on safety management systems, hazard recognition, and prevention strategies. OSHA 30-Hour is typically required for supervisors and safety personnel, while OSHA 10-Hour is suitable for entry-level workers.",
    category: "Training Levels"
  },
  {
    question: "How long does OSHA certification last?",
    answer: "OSHA 10-Hour and 30-Hour certifications do not expire, but OSHA recommends refresher training every 3-5 years to stay current with updated regulations and best practices. Some employers or industries may require more frequent refresher training. HAZWOPER certification requires annual 8-hour refresher training.",
    category: "Certification"
  },
  {
    question: "Can I take OSHA training online?",
    answer: "Yes! Our online OSHA training courses are fully compliant and recognized by OSHA. Our digital courses offer the same comprehensive content as in-person training but with the convenience of self-paced learning. You can access your training materials 24/7 and complete the courses on your schedule.",
    category: "Training Methods"
  },
  {
    question: "What is HAZWOPER training and who needs it?",
    answer: "HAZWOPER (Hazardous Waste Operations and Emergency Response) training is required for workers involved in hazardous waste cleanup, emergency response, or handling hazardous substances. This includes cleanup technicians, emergency responders, and personnel at treatment, storage, and disposal facilities. HAZWOPER training comes in 24-hour, 40-hour, and 8-hour refresher levels.",
    category: "Specialized Training"
  },
  {
    question: "How much does OSHA training cost?",
    answer: "Our OSHA training courses range from $49 for basic refresher courses to $299 for comprehensive 30-hour programs. We offer volume discounts for companies training multiple employees and special pricing for partnerships. Contact us for custom pricing based on your specific training needs.",
    category: "Pricing"
  },
  {
    question: "Do you offer on-site training?",
    answer: "Yes! We provide on-site training at your facility for groups of 10 or more employees. On-site training allows for customized content specific to your workplace hazards and can be more cost-effective for larger groups. Our expert instructors will come to your location and provide hands-on training tailored to your industry.",
    category: "Training Methods"
  },
  {
    question: "What's included in the training materials?",
    answer: "All our courses include comprehensive study materials, interactive modules, practice quizzes, and a final exam. Upon successful completion, you'll receive a printable certificate of completion. Our materials are regularly updated to reflect the latest OSHA standards and best practices.",
    category: "Course Content"
  },
  {
    question: "How quickly can I complete OSHA training?",
    answer: "OSHA 10-Hour courses typically take 10-12 hours to complete, while OSHA 30-Hour courses take 30-35 hours. Our self-paced online format allows you to complete training as quickly as your schedule permits. Some students complete courses in just a few days, while others prefer to spread it out over several weeks.",
    category: "Training Timeline"
  },
  {
    question: "What industries require OSHA training?",
    answer: "OSHA training is required or highly recommended in construction, manufacturing, healthcare, warehousing, agriculture, and many other industries. Any workplace with potential safety hazards should consider OSHA training for their employees. Our courses cover both construction and general industry requirements.",
    category: "Industries"
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer: "We offer a 30-day money-back guarantee on all our training courses. If you're not completely satisfied with your training experience, contact our customer service team within 30 days of purchase for a full refund. We're committed to your success and satisfaction.",
    category: "Pricing"
  },
  {
    question: "Do you offer training in Spanish?",
    answer: "Yes! We offer OSHA training courses in Spanish to serve our Spanish-speaking workforce. Our Spanish courses cover the same comprehensive content as our English courses and are fully OSHA compliant. This ensures all your employees can receive proper safety training regardless of their primary language.",
    category: "Language Options"
  },
  {
    question: "What support do you provide during training?",
    answer: "We provide comprehensive support throughout your training journey. Our customer service team is available via phone, email, and live chat to answer questions and provide technical support. We also offer progress tracking and reminders to help you stay on track with your training goals.",
    category: "Support"
  },
  {
    question: "How do I verify my OSHA certification?",
    answer: "Upon completing your training, you'll receive a certificate of completion that includes your name, course details, and completion date. This certificate serves as proof of your OSHA training. We also maintain records of all completed training for verification purposes if needed by employers or regulatory agencies.",
    category: "Certification"
  },
  {
    question: "Can I train my entire team at once?",
    answer: "Absolutely! We offer group training solutions for companies of all sizes. Our Learning Management System (LMS) allows you to track progress for multiple employees, and we provide volume discounts for bulk training purchases. We can also customize training content to address your specific workplace hazards and safety concerns.",
    category: "Group Training"
  }
];

const categories = ["All", "General", "Training Levels", "Certification", "Training Methods", "Specialized Training", "Pricing", "Course Content", "Training Timeline", "Industries", "Language Options", "Support", "Group Training"];

export default function FAQPage() {
  return (
    <>
      <head>
        <title>Frequently Asked Questions | OSHA Training | Mitzel Consulting</title>
        <meta name="description" content="Get answers to common questions about OSHA training, HAZWOPER certification, pricing, and safety training requirements. Expert guidance from Mitzel Consulting." />
        <meta name="keywords" content="OSHA training FAQ, safety training questions, HAZWOPER certification, OSHA 10 30 hour training, workplace safety" />
        <meta property="og:title" content="OSHA Training FAQs | Mitzel Consulting" />
        <meta property="og:description" content="Expert answers to your OSHA training questions. Learn about certification requirements, pricing, and training options." />
        <meta property="og:type" content="website" />
      </head>

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <nav className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-[#E55A2B]">Home</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900">FAQ</span>
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get expert answers to your OSHA training questions. Can't find what you're looking for? 
              Contact our safety training experts for personalized guidance.
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
                  {categories.map((category) => (
                    <button
                      key={category}
                      className="px-4 py-2 text-sm font-medium rounded-full border border-gray-300 hover:border-[#E55A2B] hover:text-[#E55A2B] transition-colors"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Items */}
              <div className="space-y-6">
                {faqData.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E55A2B] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">Q</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {faq.question}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                        <div className="mt-3">
                          <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            {faq.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact CTA */}
              <div className="mt-16 bg-[#E55A2B] rounded-2xl p-8 text-center text-white">
                <h2 className="text-2xl font-bold mb-4">
                  Still Have Questions?
                </h2>
                <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
                  Our OSHA training experts are here to help you find the right safety training solution for your team. 
                  Get personalized guidance on certification requirements and training options.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/request-training"
                    className="bg-white text-[#E55A2B] font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Request Training Consultation
                  </Link>
                  <Link
                    href="/contact"
                    className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-[#E55A2B] transition-colors"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>

              {/* Popular Topics */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                  Popular Training Topics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Link
                    href="/courses/osha-10-construction"
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
                  >
                    <div className="w-12 h-12 bg-[#E55A2B] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      OSHA 10-Hour Construction
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Essential safety training for construction workers covering hazard recognition and prevention.
                    </p>
                  </Link>

                  <Link
                    href="/courses/hazwoper-40-hour"
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
                  >
                    <div className="w-12 h-12 bg-[#E55A2B] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      HAZWOPER 40-Hour
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Comprehensive hazardous waste operations training for emergency responders and cleanup workers.
                    </p>
                  </Link>

                  <Link
                    href="/courses/fall-protection"
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
                  >
                    <div className="w-12 h-12 bg-[#E55A2B] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Fall Protection
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Critical training for workers at height, covering proper use of safety equipment and procedures.
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
