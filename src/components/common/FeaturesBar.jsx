import React from 'react';
import { Truck, Shield, Headphones, Tag } from 'lucide-react';

const FeaturesBar = () => {
 return (
  <div className="border-t border-gray-200 py-8" style={{ backgroundColor: '#EEE3C8' }}>
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Shipping Charges */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
              <Truck className="w-7 h-7 text-amber-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Shipping Charges</h3>
          </div>
        </div>

        {/* Payment Secure */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">100% Payment Secure</h3>
          </div>
        </div>

        {/* Customer Support */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <Headphones className="w-7 h-7 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">24/7 Customer Support</h3>
          </div>
        </div>

        {/* Right Pricing */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <Tag className="w-7 h-7 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Right Pricing</h3>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default FeaturesBar;
