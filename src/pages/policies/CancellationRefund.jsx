import React from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Package, Clock, Mail } from 'lucide-react';

const CancellationRefund = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <RefreshCw className="w-12 h-12 text-amber-600 mr-4" />
            <h1 className="text-5xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              Returns & Cancellation
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          {/* Our Commitment */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h2 className="text-3xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                100% Satisfaction Guarantee
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                At Chronicle vaults, our aim is to provide <strong>100% satisfaction</strong> to our customers. All products are checked and verified for quality by our expert team.
              </p>
            </div>
          </section>

          {/* Return Policy */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <Package className="w-10 h-10 text-amber-600 mr-4" />
              <h2 className="text-3xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                Return Policy
              </h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Damaged or Wrong Products</h3>
                  <p className="text-gray-700 leading-relaxed">
                    If for any reason, you receive <strong>damaged or wrong products</strong> then we are here to help.
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Return Requirements</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                      <span>Please return your purchase in its <strong>original packaging</strong></span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                      <span>Include your <strong>original receipt</strong> for refund/replacement</span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-1 flex-shrink-0" />
                      <span><strong>Return shipping will be borne by the customer</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <Clock className="w-10 h-10 text-amber-600 mr-4" />
              <h2 className="text-3xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                Return Timeline
              </h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-amber-600">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Us</h4>
                  <p className="text-sm text-gray-700">Within <strong>3 days</strong> of receiving the product</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-amber-600">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Quality Check</h4>
                  <p className="text-sm text-gray-700">We review the defect once received</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-amber-600">3</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Refund Initiated</h4>
                  <p className="text-sm text-gray-700">Within <strong>7 to 12 working days</strong></p>
                </div>
              </div>
            </div>
          </section>

          {/* Important Information */}
          <section className="mb-12">
            <div className="bg-amber-50 border-l-4 border-amber-600 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 text-amber-600 mr-3" />
                Important Information
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Return Window:</strong> If you need to return a product, you should mail us within <strong>3 days of receiving the product</strong>.
                </p>
                <p>
                  <strong>Quality Check:</strong> Once we receive the product and a quality check is done to review the defect, the refund will be initiated.
                </p>
                <p>
                  <strong>Refund Processing:</strong> The refund will be initiated within <strong>7 to 12 working days</strong> after quality check completion.
                </p>
                <p>
                  <strong>Shipping Costs:</strong> Return shipping will be borne by the customer.
                </p>
              </div>
            </div>
          </section>

          {/* How to Return */}
          <section className="mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              How to Return a Product
            </h2>
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 mr-4">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Inspect Your Package</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Upon receiving your order, carefully inspect the product for any damage or defects. Check if the product matches your order.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 mr-4">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Contact Us Within 3 Days</h3>
                    <p className="text-gray-700 leading-relaxed">
                      If you receive a damaged or wrong product, email us at <a href="mailto:chroniclevaults@gmail.com" className="text-amber-600 hover:text-amber-700 font-semibold">chroniclevaults@gmail.com</a> within 3 days of delivery with your order details and photos of the issue.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 mr-4">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Pack the Product</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Return the product in its original packaging with all accessories and your original receipt. Ensure the package is securely packed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 mr-4">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Ship the Return</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Ship the product back to the address provided by our customer service team. Keep your shipping receipt as proof of return. <strong>Return shipping costs are borne by the customer.</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 mr-4">
                    5
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Quality Check & Refund</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Once we receive the product, our team will conduct a quality check. After verification, your refund will be initiated within 7 to 12 working days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact for Returns */}
          <section>
            <div className="flex items-center mb-6">
              <Mail className="w-10 h-10 text-amber-600 mr-4" />
              <h2 className="text-3xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                Return & Refund Contact
              </h2>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-8 text-white">
              <p className="text-lg mb-6 leading-relaxed">
                For any return or refund, kindly email:
              </p>
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 text-amber-400" />
                <p className="text-sm text-gray-300 mb-2">Email us at:</p>
                <a
                  href="mailto:chroniclevaults@gmail.com"
                  className="text-2xl font-bold text-white hover:text-amber-400 transition-colors"
                >
                  chroniclevaults@gmail.com
                </a>
                <p className="text-sm text-gray-300 mt-4">We'll respond within 24 hours</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefund;
