import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Shield, Mail, MapPin, Clock, Award } from 'lucide-react';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import logoImage from '../../assets/fixed logo.png';

const Footer = () => {
  return (
    <footer className="bg-[#EBDEC0] border-t-4 border-accent-500 shadow-strong">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="animate-fade-in">
            <div className="flex items-center space-x-2 mb-5">
              <img src={logoImage} alt="Chronicle Vaults" className="h-16 w-auto object-contain" />
            </div>
            <div className="flex items-center space-x-2 bg-gradient-accent text-white px-3 py-2 rounded-xl shadow-soft">
              <BadgeCheck className="w-4 h-4" />
              <span className="text-xs font-bold">100% Authenticity Guaranteed</span>
            </div>
          </div>

          <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
            <h4 className="font-black mb-3 text-neutral-900 text-base">Quick Links</h4>
            <ul className="space-y-2 text-neutral-800 text-sm">
              <li><Link to="/about-us" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">About Us</Link></li>
              <li><Link to="/blog" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Blog</Link></li>
              <li><Link to="/faq" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">FAQ</Link></li>
              <li><Link to="/buying-with-us" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Buying With Us</Link></li>
              <li>
                <span className="hover:text-accent-600 transition-all inline-block font-medium">Connect with Us</span>
                <div className="flex items-center space-x-3 mt-1">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-white/70 hover:bg-blue-600 text-neutral-700 hover:text-white p-2 rounded-lg transition-all shadow-sm hover:shadow-md" aria-label="Facebook">
                    <FaFacebookF className="w-4 h-4" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-white/70 hover:bg-pink-600 text-neutral-700 hover:text-white p-2 rounded-lg transition-all shadow-sm hover:shadow-md" aria-label="Instagram">
                    <FaInstagram className="w-4 h-4" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-white/70 hover:bg-blue-700 text-neutral-700 hover:text-white p-2 rounded-lg transition-all shadow-sm hover:shadow-md" aria-label="LinkedIn">
                    <FaLinkedinIn className="w-4 h-4" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-white/70 hover:bg-blue-400 text-neutral-700 hover:text-white p-2 rounded-lg transition-all shadow-sm hover:shadow-md" aria-label="Twitter">
                    <FaTwitter className="w-4 h-4" />
                  </a>
                </div>
              </li>
            </ul>
          </div>

          <div className="animate-fade-in" style={{animationDelay: '0.2s'}}>
            <h4 className="font-black mb-3 text-neutral-900 text-base">Customer Support</h4>
            <ul className="space-y-2 text-neutral-800 text-sm">
              <li><Link to="/contact-us" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Contact Us</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Terms & Conditions</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Shipping Policy</Link></li>
              <li><Link to="/cancellation-refund" className="hover:text-accent-600 transition-all hover:translate-x-1 inline-block font-medium">Cancellation & Refund</Link></li>
            </ul>
          </div>

          <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
            <h4 className="font-black mb-3 text-neutral-900 text-base">Contact Info</h4>
            <div className="space-y-2 text-neutral-800 text-sm">
              <div className="flex items-center space-x-2 hover:text-accent-600 transition-colors font-medium">
                <FaWhatsapp className="w-4 h-4 text-green-600" />
                <a href="https://wa.me/918460849878" target="_blank" rel="noopener noreferrer" className="hover:text-accent-600">+918460849878</a>
              </div>
              <div className="flex items-center space-x-2 hover:text-accent-600 transition-colors font-medium">
                <Mail className="w-4 h-4" />
                <a href="mailto:chroniclevaults@gmail.com" className="hover:text-accent-600">chroniclevaults@gmail.com</a>
              </div>
               <div className="flex items-center space-x-2 font-medium">
                 <MapPin className="w-4 h-4" />
                 <div>
                  <div>16/189, Netajinagar, Meghaninagar,</div>
                  <div>Ahmedabad-380016, Gujarat</div>
               </div>
             </div>
              <div className="flex items-center space-x-2 font-medium">
                <Clock className="w-4 h-4" />
                <span>Mon-Sat 9AM-6PM IST</span>
              </div>
            </div>
          </div>
        </div>


        <div className="border-t-2 border-primary-400/50 pt-5 mt-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-neutral-800 text-xs mb-3 md:mb-0 font-semibold">
              © 2025 CHRONICLE VAULTS. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs text-neutral-800 bg-white/50 px-2.5 py-1.5 rounded-lg font-medium">
                <Shield className="w-3.5 h-3.5 text-accent-600" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-800 bg-white/50 px-2.5 py-1.5 rounded-lg font-medium">
                <Award className="w-3.5 h-3.5 text-accent-600" />
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


