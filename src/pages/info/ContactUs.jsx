import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-cream-200 to-cream-100 border-b border-cream-300 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 text-charcoal-900">Contact Us</h1>
          <p className="text-xl text-charcoal-700">We'd love to hear from you. Get in touch with our team!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-8">
            <h2 className="text-3xl font-bold text-charcoal-900 mb-6">Send us a Message</h2>

            {submitted && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
                <p className="font-semibold">Thank you for contacting us!</p>
                <p className="text-sm">We'll get back to you within 24-48 hours.</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-charcoal-900 font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-cream-50 border border-cream-300 rounded-lg focus:ring-2 focus:ring-charcoal-700 focus:border-transparent text-charcoal-900 focus:outline-none"
                  placeholder="Your full name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-charcoal-900 font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-cream-50 border border-cream-300 rounded-lg focus:ring-2 focus:ring-charcoal-700 focus:border-transparent text-charcoal-900 focus:outline-none"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="mb-4">
                <label className="block text-charcoal-900 font-semibold mb-2">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-cream-50 border border-cream-300 rounded-lg focus:ring-2 focus:ring-charcoal-700 focus:border-transparent text-charcoal-900 focus:outline-none"
                  placeholder="How can we help?"
                />
              </div>

              <div className="mb-6">
                <label className="block text-charcoal-900 font-semibold mb-2">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 bg-cream-50 border border-cream-300 rounded-lg focus:ring-2 focus:ring-charcoal-700 focus:border-transparent text-charcoal-900 focus:outline-none resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-charcoal-900 hover:bg-charcoal-800 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md"
              >
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-8 mb-6">
              <h2 className="text-3xl font-bold text-charcoal-900 mb-6">Contact Information</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-cream-100 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-charcoal-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal-900 mb-1">Address</h3>
                    <p className="text-charcoal-700">16/189, Netajinagar, Meghaninagar<br />Ahmedabad-380016, Gujarat<br />India</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-cream-100 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-charcoal-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal-900 mb-1">Phone</h3>
                    <p className="text-charcoal-700"><a href="tel:+918460849878" className="hover:text-charcoal-900">+918460849878</a></p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-cream-100 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-charcoal-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal-900 mb-1">Email</h3>
                    <p className="text-charcoal-700"><a href="mailto:chroniclevaults@gmail.com" className="hover:text-charcoal-900">chroniclevaults@gmail.com</a></p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-cream-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-charcoal-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal-900 mb-1">Business Hours</h3>
                    <p className="text-charcoal-700">
                      Monday - Friday: 9:00 AM - 6:00 PM IST<br />
                      Saturday: 10:00 AM - 4:00 PM IST<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
