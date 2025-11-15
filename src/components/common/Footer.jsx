import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Shield, Mail, MapPin, Clock, Award, Eye } from 'lucide-react';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import logoImage from '../../assets/fixed logo.png';

const Footer = () => {
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    // Get current visitor count from localStorage
    const currentCount = parseInt(localStorage.getItem('visitorCount') || '1000', 10);

    // Check if this is a new session
    const lastVisit = sessionStorage.getItem('hasVisited');

    if (!lastVisit) {
      // New session - increment counter
      const newCount = currentCount + 1;
      localStorage.setItem('visitorCount', newCount.toString());
      sessionStorage.setItem('hasVisited', 'true');
      setVisitorCount(newCount);
    } else {
      // Returning visitor in same session
      setVisitorCount(currentCount);
    }
  }, []);

  return (
    <footer className="bg-[#EBDEC0] border-t-2 md:border-t-4 border-accent-500 shadow-strong">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 lg:gap-12">
          <div className="animate-fade-in">
            <div className="flex items-center space-x-2 mb-2 md:mb-5">
              <img src={logoImage} alt="Chronicle Vaults" className="h-10 md:h-14 lg:h-16 w-auto object-contain" />
            </div>
            <div className="flex items-center space-x-1.5 md:space-x-2 bg-gradient-accent text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl shadow-soft">
              <BadgeCheck className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-[9px] md:text-xs font-bold">100% Authenticity Guaranteed</span>
            </div>
          </div>

          <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
            <h4 className="font-black mb-1.5 md:mb-3 text-neutral-900 text-xs md:text-sm lg:text-base">Quick Links</h4>
            <ul className="space-y-1 md:space-y-2 text-neutral-800 text-[10px] md:text-sm">
              <li><Link to="/about-us" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">About Us</Link></li>
              <li><Link to="/blog" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Blog</Link></li>
              <li><Link to="/faq" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">FAQ</Link></li>
              <li><Link to="/buying-with-us" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Buying With Us</Link></li>
              <li>
                <span className="hover:text-accent-600 transition-all inline-block font-medium">Connect with Us</span>
                <div className="flex items-center space-x-2 md:space-x-3 mt-1">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-white/70 hover:bg-blue-600 text-neutral-700 hover:text-white p-1.5 md:p-2 rounded-lg transition-all shadow-sm hover:shadow-md" aria-label="Facebook">
                    <FaFacebookF className="w-3 h-3 md:w-4 md:h-4" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-white/70 hover:bg-pink-600 text-neutral-700 hover:text-white p-1.5 md:p-2 rounded-lg transition-all shadow-sm hover:shadow-md" aria-label="Instagram">
                    <FaInstagram className="w-3 h-3 md:w-4 md:h-4" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-white/70 hover:bg-blue-700 text-neutral-700 hover:text-white p-1.5 md:p-2 rounded-lg transition-all shadow-sm hover:shadow-md" aria-label="LinkedIn">
                    <FaLinkedinIn className="w-3 h-3 md:w-4 md:h-4" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-white/70 hover:bg-blue-400 text-neutral-700 hover:text-white p-1.5 md:p-2 rounded-lg transition-all shadow-sm hover:shadow-md" aria-label="Twitter">
                    <FaTwitter className="w-3 h-3 md:w-4 md:h-4" />
                  </a>
                </div>
              </li>
            </ul>
          </div>

          <div className="animate-fade-in" style={{animationDelay: '0.2s'}}>
            <h4 className="font-black mb-1.5 md:mb-3 text-neutral-900 text-xs md:text-sm lg:text-base">Customer Support</h4>
            <ul className="space-y-1 md:space-y-2 text-neutral-800 text-[10px] md:text-sm">
              <li><Link to="/contact-us" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Contact Us</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Terms & Conditions</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Shipping Policy</Link></li>
              <li><Link to="/cancellation-refund" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Cancellation & Refund</Link></li>
            </ul>
          </div>

          <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
            <h4 className="font-black mb-1.5 md:mb-3 text-neutral-900 text-xs md:text-sm lg:text-base">Contact Info</h4>
            <div className="space-y-1 md:space-y-2 text-neutral-800 text-[10px] md:text-sm">
              <div className="flex items-center space-x-1.5 md:space-x-2 hover:text-accent-600 transition-colors font-medium">
                <FaWhatsapp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                <a href="https://wa.me/918460849878" target="_blank" rel="noopener noreferrer" className="hover:text-accent-600">+918460849878</a>
              </div>
              <div className="flex items-center space-x-1.5 md:space-x-2 hover:text-accent-600 transition-colors font-medium">
                <Mail className="w-3 h-3 md:w-4 md:h-4" />
                <a href="mailto:chroniclevaults@gmail.com" className="hover:text-accent-600 break-all">chroniclevaults@gmail.com</a>
              </div>
               <div className="flex items-start space-x-1.5 md:space-x-2 font-medium">
                 <MapPin className="w-3 h-3 md:w-4 md:h-4 mt-0.5" />
                 <div>
                  <div>16/189, Netajinagar, Meghaninagar,</div>
                  <div>Ahmedabad-380016, Gujarat</div>
               </div>
             </div>
              <div className="flex items-center space-x-1.5 md:space-x-2 font-medium">
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                <span>Mon-Sat 9AM-6PM IST</span>
              </div>
            </div>
          </div>
        </div>


        <div className="border-t border-primary-400/50 pt-3 md:pt-5 mt-3 md:mt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
            <p className="text-neutral-800 text-[9px] md:text-xs font-semibold">
              © 2025 CHRONICLE VAULTS. All rights reserved.
            </p>

            {/* Visitor Counter - Center */}
            <div className="flex items-center space-x-1 md:space-x-2 text-[9px] md:text-xs text-neutral-800 bg-gradient-to-r from-amber-100 to-orange-100 px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-bold border border-amber-300">
              <Eye className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
              <span className="text-amber-900">Visitors:</span>
              <span className="text-amber-700 font-black">{visitorCount.toLocaleString()}</span>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center space-x-1 md:space-x-2 text-[9px] md:text-xs text-neutral-800 bg-white/50 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-lg font-medium">
                <Shield className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-accent-600" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2 text-[9px] md:text-xs text-neutral-800 bg-white/50 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-lg font-medium">
                <Award className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-accent-600" />
                <span>Trusted Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


