import React from 'react';
import { Award, Shield, Users, Heart } from 'lucide-react';
import posterImage from '../../assets/poster.png';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h1 className="text-5xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            About Chronicle Vaults
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
            Preserving history through rare coins, stamps, medals, and collectibles since 2009.
          </p>
        </div>
      </div>

      {/* Our Story */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              Our Story
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              For over sixteen years, we have been at the heart of the numismatic community, dedicated to the study, collection, and preservation of coins, banknotes, and medals from around the world.
            </p>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Our passion for history and craftsmanship has made us a trusted source for collectors, investors, and enthusiasts alike.
            </p>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Founded in 2009 - Urhistory, began as a small venture driven by a deep fascination with the stories behind every coin. Today, we proudly offering authentic collectibles, expert appraisals, and educational resources that bring the rich heritage of numismatics to life.
            </p>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Our team of seasoned experts combines decades of market insight with a commitment to integrity and authenticity. Whether you're a seasoned collector searching for rare treasures or a newcomer beginning your numismatic journey, we provide personalized guidance and a carefully curated selection to meet your needs.
            </p>
            <p className="text-gray-700 mb-4 leading-relaxed">
              At Chronicle Vaults - A Brand Of Urhistory, we believe every coin tells a story — of nations, art, and human achievement.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Join us as we continue to preserve history, one coin at a time.
            </p>
          </div>
          <div className="flex items-center justify-center h-full">
            <img
              src={posterImage}
              alt="Chronicle Vaults"
              className="rounded-lg w-full max-w-lg object-cover"
            />
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl font-light text-gray-900 mb-12 text-center" style={{ fontFamily: 'Georgia, serif' }}>
            Why Choose Us
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Authenticity Guaranteed</h3>
              <p className="text-gray-600">
                Every item is verified and authenticated by our expert team.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Grading</h3>
              <p className="text-gray-600">
                Professional grading and certification for all rare items.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Trusted Community</h3>
              <p className="text-gray-600">
                Join thousands of satisfied collectors worldwide.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <Heart className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Passion for History</h3>
              <p className="text-gray-600">
                We're collectors too - we understand your passion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-light text-gray-900 mb-12 text-center" style={{ fontFamily: 'Georgia, serif' }}>
          Our Values
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="border-l-4 border-amber-600 pl-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Integrity</h3>
            <p className="text-gray-700">
              We conduct our business with honesty and transparency. Our reputation is built on trust.
            </p>
          </div>
          <div className="border-l-4 border-amber-600 pl-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Quality</h3>
            <p className="text-gray-700">
              Only the finest collectibles make it into our inventory. We never compromise on quality.
            </p>
          </div>
          <div className="border-l-4 border-amber-600 pl-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Service</h3>
            <p className="text-gray-700">
              Your satisfaction is our priority. We're here to help you build your collection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
