'use client';

import React from 'react';

const SafetyTrainingHowItWorks = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 title-black whitespace-nowrap">
            For Companies: How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get your team certified with our streamlined safety training process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl font-bold">1</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Training</h3>
            <p className="text-xl text-gray-600">
              Select from our comprehensive catalog of OSHA-approved safety training courses designed for your industry and compliance needs.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl font-bold">2</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Train Your Team</h3>
            <p className="text-xl text-gray-600">
              Deliver training through our flexible platform - online self-paced courses or on-site training at your facility.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl font-bold">3</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Certified</h3>
            <p className="text-xl text-gray-600">
              Receive official OSHA completion cards and certificates to maintain compliance and protect your workforce.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 text-blue-600">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L3 7v8c0 1.1.9 2 2 2h1v4c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-4h1c1.1 0 2-.9 2-2V7l-9-5z"/>
            </svg>
            <span className="text-lg font-semibold">Site Powered By AI</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SafetyTrainingHowItWorks;
