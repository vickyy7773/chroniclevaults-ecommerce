import React from 'react';
import { Truck, Clock, CreditCard, Shield } from 'lucide-react';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <Truck className="w-12 h-12 text-amber-600 mr-4" />
            <h1 className="text-5xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              Shipping Policy
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          {/* Delivery Time */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <Clock className="w-10 h-10 text-amber-600 mr-4" />
              <h2 className="text-3xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                Delivery Timeline
              </h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                Your order will be <strong>delivered within 7-10 days</strong> from the date of dispatch.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                The products are generally <strong>dispatched within 48 hours</strong> of the order being received.
              </p>
            </div>
          </section>

          {/* Courier Partners */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <Shield className="w-10 h-10 text-amber-600 mr-4" />
              <h2 className="text-3xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                Trusted Courier Partners
              </h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <p className="text-gray-700 leading-relaxed mb-4">
                <a href="https://chroniclevaults.com" className="text-amber-600 hover:text-amber-700 font-semibold">Chronicle vaults</a> uses the most reliable courier agencies like <strong>India Post and other reliable courier partners</strong> to ship its products.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you want <strong>insured parcel</strong> then let us know while placing an order. It will be done on <strong>chargeable basis</strong>.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-600 p-6 mt-6">
                <p className="text-gray-800 font-semibold mb-2">Important:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>We urge all customers to inspect the package for any damage or tamper on receiving the parcel.</li>
                  <li><strong>Do not accept the parcel if it is tampered.</strong></li>
                  <li>Kindly verify your Identity to the courier partner for verification purpose.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Coverage */}
          <section className="mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              Service Coverage
            </h2>
            <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-lg p-8 text-center">
              <p className="text-gray-900 text-xl font-semibold mb-2">
                <a href="https://chroniclevaults.com" className="text-amber-600 hover:text-amber-700">Chronicle vaults</a> ships to
              </p>
              <p className="text-4xl font-bold text-amber-600 mb-2">10,000+ pin-codes</p>
              <p className="text-gray-700 text-lg">and locations Across India</p>
            </div>
          </section>

          {/* Payment Options */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <CreditCard className="w-10 h-10 text-amber-600 mr-4" />
              <h2 className="text-3xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                Payment Options
              </h2>
            </div>

            {/* Online Payment */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Online Payment</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Online payment can be done using:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-700">Credit Card</div>
                <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-700">Credit Card (EMI)</div>
                <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-700">Debit Card</div>
                <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-700">Payment Wallets</div>
                <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-700">Bank Transfer</div>
                <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-700">UPI</div>
              </div>
            </div>
          </section>

          {/* Order Tracking */}
          <section className="mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              Order Tracking
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <p className="text-gray-700 leading-relaxed mb-6">
                Track your order every step of the way. You will receive tracking information via email once your order is dispatched.
              </p>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-amber-600 font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-700 font-semibold">Order Confirmed</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-amber-600 font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-700 font-semibold">Processing (48 hours)</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-amber-600 font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-700 font-semibold">Dispatched</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-amber-600 font-bold">4</span>
                  </div>
                  <p className="text-sm text-gray-700 font-semibold">Delivered (7-10 days)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-3xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              Questions About Shipping?
            </h2>
            <div className="bg-gray-50 rounded-lg p-8">
              <p className="text-gray-700 leading-relaxed mb-6">
                Have questions about shipping? Our customer service team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/contact-us" className="inline-block bg-gray-900 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold text-center transition-all">
                  Contact Support
                </a>
                <a href="mailto:chroniclevaults@gmail.com" className="inline-block bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold border border-gray-300 text-center transition-all">
                  Email Us
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
