import React from 'react';
import { Search, CreditCard, Package, Shield, CheckCircle, Clock } from 'lucide-react';

const BuyingWithUs = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h1 className="text-5xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Buying With Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
            Your complete guide to purchasing rare collectibles from Chronicle Vaults
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-light text-gray-900 mb-12 text-center" style={{ fontFamily: 'Georgia, serif' }}>
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
              <Search className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">1. Browse & Select</h3>
            <p className="text-gray-700">
              Explore our curated collection of rare coins, stamps, medals, and collectibles. Use filters to find exactly what you're looking for.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
              <CreditCard className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">2. Secure Checkout</h3>
            <p className="text-gray-700">
              Add items to cart and proceed to our secure checkout. We accept all major credit cards and payment methods.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
              <Package className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">3. Fast Delivery</h3>
            <p className="text-gray-700">
              Your items are carefully packaged and shipped with tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl font-light text-gray-900 mb-8" style={{ fontFamily: 'Georgia, serif' }}>
            Payment Methods
          </h2>
          <div className="bg-white rounded-lg p-8 shadow-md">
            <p className="text-gray-700 mb-6">We accept all Indian standard payment methods:</p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                Credit Cards / Debit Cards (Visa, Mastercard, RuPay)
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                UPI (Google Pay, PhonePe, Paytm, etc.)
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                Net Banking (All major Indian banks)
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                Wallets (Paytm, PhonePe, Amazon Pay)
              </li>
            </ul>
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-amber-600 mr-3 mt-1" />
                <p className="text-gray-800 text-sm">
                  All transactions are encrypted with 256-bit SSL security. Your payment information is never stored on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buying Tips */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-light text-gray-900 mb-8" style={{ fontFamily: 'Georgia, serif' }}>
          Buying Tips
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Authentication</h3>
            <p className="text-gray-700 mb-4">
              Every item comes with a certificate of authenticity. Rare items include professional grading from recognized services (PCGS, NGC, PMG).
            </p>
            <div className="p-4 bg-red-50 rounded-lg border border-red-300">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                <p className="text-red-900 text-sm font-medium">
                  <strong>Note:</strong> Professional grading and certification services are available on a chargeable basis if requested by the buyer.
                </p>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Condition Grading</h3>
            <p className="text-gray-700">
              We use industry-standard grading scales. Check item descriptions for detailed condition reports and high-resolution images.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Market Value</h3>
            <p className="text-gray-700">
              Our prices are competitive and based on current market trends. We regularly update pricing to reflect market conditions.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Investment Quality</h3>
            <p className="text-gray-700">
              Many items in our collection are investment-grade. Contact our experts for advice on building a valuable collection.
            </p>
          </div>
        </div>
      </div>

      {/* Customer Support */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <Clock className="w-16 h-16 text-amber-600 mx-auto mb-6" />
            <h2 className="text-3xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Need Help?
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Our expert team is here to assist you with any questions about your purchase. Contact us via phone, email, or live chat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact-us" className="inline-block bg-gray-900 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold transition-all">
                Contact Support
              </a>
              <a href="/faq" className="inline-block bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold border border-gray-300 transition-all">
                View FAQ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyingWithUs;
