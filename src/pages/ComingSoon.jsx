import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Gavel } from 'lucide-react';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-accent-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-8 shadow-2xl">
              <Gavel className="w-24 h-24 text-accent-600" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          Coming Soon
        </h1>

        <div className="flex items-center justify-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-accent-600 animate-pulse" />
          <p className="text-xl md:text-2xl text-gray-600 font-medium">
            We're working on something exciting!
          </p>
        </div>

        <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto">
          Our auction feature is currently under development. Stay tuned for an amazing bidding experience!
        </p>

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        {/* Decorative Elements */}
        <div className="mt-16 flex justify-center gap-4">
          <div className="w-3 h-3 bg-accent-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-accent-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
