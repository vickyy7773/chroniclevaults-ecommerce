import React from 'react';
import { Truck, Shield, Headphones, Tag } from 'lucide-react';

const FeaturesBar = () => {
 return (
  <div className="border-t border-gray-200 py-4 md:py-6 lg:py-8" style={{ backgroundColor: '#EEE3C8' }}>
    <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-8">
      <div className="grid grid-cols-3 gap-2 md:gap-4 lg:gap-6 xl:gap-8">
        {/* Free Shipping */}
        <div className="flex flex-col md:flex-row items-center md:space-x-3 lg:space-x-4 text-center md:text-left">
          <div className="flex-shrink-0 mb-1 md:mb-0">
            <div className="w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-amber-100 rounded-full flex items-center justify-center">
              <Truck className="w-4 h-4 md:w-6 md:h-6 lg:w-7 lg:h-7 text-amber-600" />
            </div>
          </div>
          <div>
            <h3 className="text-[8px] md:text-sm lg:text-base xl:text-lg font-bold text-gray-900">Free Shipping</h3>
          </div>
        </div>

        {/* Payment Secure */}
        <div className="flex flex-col md:flex-row items-center md:space-x-3 lg:space-x-4 text-center md:text-left">
          <div className="flex-shrink-0 mb-1 md:mb-0">
            <div className="w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 md:w-6 md:h-6 lg:w-7 lg:h-7 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="text-[8px] md:text-sm lg:text-base xl:text-lg font-bold text-gray-900">100% Payment Secure</h3>
          </div>
        </div>

        {/* Customer Support */}
        <div className="flex flex-col md:flex-row items-center md:space-x-3 lg:space-x-4 text-center md:text-left">
          <div className="flex-shrink-0 mb-1 md:mb-0">
            <div className="w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <Headphones className="w-4 h-4 md:w-6 md:h-6 lg:w-7 lg:h-7 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-[8px] md:text-sm lg:text-base xl:text-lg font-bold text-gray-900">24/7 Customer Support</h3>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default FeaturesBar;
