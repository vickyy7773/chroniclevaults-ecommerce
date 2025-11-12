import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      category: 'Orders & Shipping',
      questions: [
        {
          question: 'How long does shipping take?',
          answer: 'Standard shipping takes 5-7 business days, Express shipping takes 2-3 business days, and Overnight shipping takes 1 business day. International orders typically arrive within 7-14 business days depending on the destination.'
        },
        {
          question: 'Do you ship internationally?',
          answer: 'Yes! We ship to over 150 countries worldwide. International shipping rates vary by destination. All international orders include tracking, and customers are responsible for any customs duties or taxes imposed by their country.'
        },
        {
          question: 'How can I track my order?',
          answer: 'Once your order ships, you\'ll receive a tracking number via email. You can also track your order by logging into your account and viewing your order history. Click on the order to see detailed tracking information.'
        },
        {
          question: 'Can I change my shipping address after placing an order?',
          answer: 'If your order hasn\'t shipped yet, we can update your shipping address. Please contact our customer service team immediately at chroniclevaults@gmail.com or call +918460849878. Once shipped, we cannot modify the address.'
        }
      ]
    },
    {
      category: 'Returns & Refunds',
      questions: [
        {
          question: 'What is your return policy?',
          answer: 'We offer a 30-day money-back guarantee on most items. Items must be in original condition with all packaging, tags, and accessories. To initiate a return, log into your account and request a return from your order history.'
        },
        {
          question: 'How long does it take to get a refund?',
          answer: 'Once we receive and inspect your return, refunds are processed within 5-7 business days. The time it takes for the refund to appear in your account depends on your payment method: Credit/Debit cards take 5-7 days, UPI/Wallets take 3-5 days, and bank transfers take 7-10 days.'
        },
        {
          question: 'Do I have to pay for return shipping?',
          answer: 'Return shipping is free for defective or damaged items and for errors on our part. For buyer remorse returns, a ₹5.99 shipping fee will be deducted from your refund. Original shipping costs are non-refundable.'
        },
        {
          question: 'Can I exchange an item?',
          answer: 'Yes! We offer free exchanges. When requesting a return, indicate that you\'d like an exchange and specify which item you\'d like instead. We\'ll send your new item as soon as we receive your return. If there\'s a price difference, we\'ll either refund the difference or request payment for the additional amount.'
        }
      ]
    },
    {
      category: 'Products & Authenticity',
      questions: [
        {
          question: 'Are all your collectibles authentic?',
          answer: 'Yes, absolutely! We guarantee the authenticity of all items we sell. Our team of experts carefully examines each item before listing. Many items come with certificates of authenticity, and graded coins are authenticated by professional grading services like PCGS, NGC, or ANACS.'
        },
        {
          question: 'Do your coins come with certificates of authenticity?',
          answer: 'Graded coins come in sealed slabs from professional grading services, which serve as certificates of authenticity. For ungraded rare coins, we provide our own certificate of authenticity. Common circulated coins typically don\'t include certificates unless specifically stated in the listing.'
        },
        {
          question: 'What does the grading scale mean?',
          answer: 'Coin grading uses the Sheldon scale from 1 to 70. Poor (P-1) to Good (G-4) shows heavy wear, Very Good (VG-8) to Fine (F-12) shows moderate wear, Very Fine (VF-20) to Extremely Fine (EF-40) shows light wear, About Uncirculated (AU-50/58) shows minimal wear, and Mint State (MS-60 to MS-70) means uncirculated. Higher numbers indicate better condition.'
        },
        {
          question: 'Can I request specific photos of an item?',
          answer: 'Yes! If you need additional photos or want to see specific details of an item, contact us at chroniclevaults@gmail.com with the item number. We\'ll be happy to provide additional images within 24 hours.'
        }
      ]
    },
    {
      category: 'Account & Payment',
      questions: [
        {
          question: 'Do I need an account to make a purchase?',
          answer: 'No, you can check out as a guest. However, creating an account allows you to track orders, save items to your wishlist, manage returns, and receive exclusive offers. It only takes a minute to sign up!'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all Indian standard payment methods including Credit/Debit Cards (Visa, Mastercard, RuPay), UPI (Google Pay, PhonePe, Paytm), Net Banking (all major Indian banks), and Digital Wallets. All payments are processed securely with 256-bit SSL encryption through Razorpay payment gateway.'
        },
        {
          question: 'Is it safe to use my credit card on your site?',
          answer: 'Absolutely! Our website uses industry-standard SSL encryption to protect your personal and payment information. We never store your complete credit card details on our servers. All transactions are processed through secure, PCI-compliant payment gateways.'
        },
        {
          question: 'Can I save my payment information?',
          answer: 'Yes, you can securely save your payment information in your account for faster checkout. We use tokenization to store payment methods, which means your actual card numbers are never stored on our servers.'
        }
      ]
    },
    {
      category: 'Pricing & Discounts',
      questions: [
        {
          question: 'Do you offer bulk discounts?',
          answer: 'Yes! We offer volume discounts for bulk purchases. Contact our sales team at chroniclevaults@gmail.com with details about your intended purchase, and we\'ll provide a custom quote. Generally, orders of 10+ items qualify for bulk pricing.'
        },
        {
          question: 'How often do you have sales?',
          answer: 'We regularly feature sales and special promotions. Sign up for our newsletter to receive notifications about upcoming sales, exclusive discounts, and new arrivals. We also offer seasonal sales during major holidays.'
        },
        {
          question: 'Do you price match?',
          answer: 'We strive to offer competitive prices. If you find an identical item (same condition, grading, certification) at a lower price from an authorized dealer, contact us within 7 days of purchase, and we\'ll review your request for a price adjustment.'
        },
        {
          question: 'Are there any hidden fees?',
          answer: 'No hidden fees! The price you see is the price you pay, plus shipping and applicable taxes. Taxes are calculated at checkout based on your shipping address. International customers may be responsible for customs duties imposed by their country.'
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-cream-200 to-cream-100 border-b border-cream-300 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 text-charcoal-900">Frequently Asked Questions</h1>
          <p className="text-xl text-charcoal-700">Find answers to common questions about our products and services</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6 mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-4 w-6 h-6 text-charcoal-700" />
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-cream-50 border border-cream-300 rounded-lg text-lg focus:ring-2 focus:ring-charcoal-700 focus:border-transparent text-charcoal-900 focus:outline-none"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-12 text-center">
            <HelpCircle className="w-16 h-16 text-charcoal-700 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-charcoal-900 mb-2">No Results Found</h3>
            <p className="text-charcoal-700">Try different keywords or browse all categories</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredFaqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-lg shadow-sm border border-cream-200 p-8">
                <h2 className="text-3xl font-bold text-charcoal-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-charcoal-900 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  {category.category}
                </h2>

                <div className="space-y-4">
                  {category.questions.map((faq, questionIndex) => {
                    const globalIndex = `₹{categoryIndex}-₹{questionIndex}`;
                    const isOpen = openIndex === globalIndex;

                    return (
                      <div
                        key={questionIndex}
                        className="border border-cream-200 rounded-lg overflow-hidden hover:border-charcoal-700 transition-colors"
                      >
                        <button
                          onClick={() => toggleQuestion(globalIndex)}
                          className="w-full px-6 py-4 flex items-center justify-between bg-cream-50 hover:bg-cream-100 transition-colors"
                        >
                          <span className="font-semibold text-left text-charcoal-900">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-charcoal-700 flex-shrink-0 ml-4" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-charcoal-700 flex-shrink-0 ml-4" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-6 py-4 bg-white border-t border-cream-200">
                            <p className="text-charcoal-700 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-charcoal-900 rounded-lg shadow-sm border border-cream-200 p-8 text-white text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-3">Still Have Questions?</h3>
          <p className="text-lg mb-6">
            Our customer service team is here to help! We typically respond within 24 hours.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/contact-us"
              className="bg-white text-charcoal-900 font-semibold py-3 px-8 rounded-lg hover:bg-cream-100 transition-colors shadow-sm hover:shadow-md"
            >
              Contact Support
            </a>
            <a
              href="mailto:chroniclevaults@gmail.com"
              className="bg-charcoal-800 text-white font-semibold py-3 px-8 rounded-lg hover:bg-charcoal-700 transition-colors shadow-sm hover:shadow-md"
            >
              Email Us
            </a>
          </div>
          <div className="mt-6">
            <p className="text-sm">Phone: <a href="tel:+918460849878" className="hover:underline">+918460849878</a></p>
            <p className="text-sm">Email: <a href="mailto:chroniclevaults@gmail.com" className="hover:underline">chroniclevaults@gmail.com</a></p>
            <p className="text-sm">Hours: Mon-Fri 9AM-6PM IST</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
