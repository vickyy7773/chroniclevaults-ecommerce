import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Search, Heart, User, Menu, Eye, Truck, BadgeCheck, Shield, Mail,
  X, ChevronDown, Home, Star, TrendingUp, Award, Package, LogOut, AlertTriangle
} from 'lucide-react';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import logoImage from '../../assets/fixed logo.png';
import { API_BASE_URL } from '../../constants/api';

const Header = ({
  cartTotal = 0,
  cartItemCount = 0,
  wishlistCount = 0,
  onCartClick,
  onWishlistClick,
  onAuthClick,
  onSearch,
  onComparisonClick,
  comparisonCount = 0,
  searchTerm = '',
  setSearchTerm,
  showMobileMenu = false,
  setShowMobileMenu,
  user = null,
  onLogout,
  hideShoppingFeatures = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState(null);

  // Check if current page is home page
  const isHomePage = location.pathname === '/';

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = localSearchTerm || searchTerm;
    if (onSearch) {
      onSearch(term);
    } else {
      navigate(`/search?q=${encodeURIComponent(term)}`);
    }
    setShowMobileSearch(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    if (setSearchTerm) {
      setSearchTerm(value);
    }
  };

  // Icon mapping for different categories
  const iconMap = {
    'Coins': Star,
    'BankNotes': TrendingUp,
    'Books': Award,
    'Accessories': TrendingUp,
    'Stamps': Shield,
    'Medals': Package,
    'default': Package
  };

  // Generate navigation links dynamically from categories
  const navigationLinks = [
    { to: '/', label: 'Home', icon: Home },
    ...categories
      .filter(cat => cat.type === 'main' && cat.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(category => {
        // Get subcategories for this main category
        const subCategories = categories
          .filter(cat => {
            if (cat.type !== 'sub') return false;
            // Handle both populated and non-populated parentCategory
            const parentId = typeof cat.parentCategory === 'object'
              ? cat.parentCategory?._id
              : cat.parentCategory;
            return parentId === category._id;
          })
          .map(sub => sub.name);

        return {
          to: `/category/${category.name}`,
          label: category.name === 'BankNotes' ? 'Bank Notes' : category.name,
          icon: iconMap[category.name] || iconMap['default'],
          categories: subCategories.length > 0 ? ['All', ...subCategories] : null
        };
      })
  ];

  return (
    <>
      <header className={`bg-primary-200/95 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-strong' : 'shadow-soft'}`}>
        {/* Top Info Bar - Hidden on mobile and on scroll */}
        <div className={`hidden lg:block border-b border-neutral-300/30 bg-white/20 transition-all duration-300 ${
          scrolled ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-20 opacity-100'
        }`}>
          <div className="w-full">
            <div className="flex items-center justify-between py-2 text-xs">
              <div className="flex-1 overflow-hidden max-w-3xl ml-3">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span className="text-red-600 font-bold flex-shrink-0">Statutory Warning:</span>
                  <div className="overflow-hidden relative">
                    <div className="animate-scroll-single whitespace-nowrap font-semibold text-red-600">
                      <span className="inline-block">Antiques over 100 years old cannot be taken out of India without the permission of the Director General, Archaeological Survey of India, Janpath, New Delhi 110011.</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6 flex-shrink-0 pl-8 mr-3">
                <div className="flex items-center space-x-2 text-neutral-800 font-semibold">
                  <FaWhatsapp className="w-3 h-3" />
                  <a href="https://wa.me/918460849878" target="_blank" rel="noopener noreferrer" className="hover:text-accent-600">+918460849878</a>
                </div>
                <div className="flex items-center space-x-2 text-neutral-800 font-semibold">
                  <Mail className="w-3 h-3" />
                  <a href="mailto:chroniclevaults@gmail.com" className="hover:text-accent-600">chroniclevaults@gmail.com</a>
                </div>
                {/* Social Media Icons */}
                <div className="flex items-center space-x-3 border-l border-neutral-300 pl-4">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-blue-600 transition-colors" aria-label="Facebook">
                    <FaFacebookF className="w-3.5 h-3.5" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-pink-600 transition-colors" aria-label="Instagram">
                    <FaInstagram className="w-3.5 h-3.5" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-blue-700 transition-colors" aria-label="LinkedIn">
                    <FaLinkedinIn className="w-3.5 h-3.5" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-blue-400 transition-colors" aria-label="Twitter">
                    <FaTwitter className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header - Hidden on scroll */}
        <div className={`w-full transition-all duration-300 ${
          scrolled ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-40 opacity-100'
        }`}>
          <div className="w-full py-2">
            <div className="flex items-center justify-between">
              {/* Left: Menu + Logo */}
              <div className="flex items-center space-x-2 md:space-x-4 ml-3">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="lg:hidden text-neutral-900 hover:text-accent-600 p-2 -ml-2 hover:bg-primary-100 rounded-xl transition-all hover:scale-110"
                  aria-label="Toggle menu"
                >
                  <Menu className="w-6 h-6" />
                </button>

                <Link to="/" className="flex items-center space-x-3 md:space-x-4">
                  <img src={logoImage} alt="Chronicle Vaults Logo" className="h-16 md:h-20 w-auto object-contain" />
                </Link>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-5 mr-3">
                {/* Mobile Search Toggle - Hidden on info pages and home page */}
                {!hideShoppingFeatures && !isHomePage && (
                  <button
                    onClick={() => setShowMobileSearch(!showMobileSearch)}
                    className="lg:hidden text-neutral-900 hover:text-accent-600 p-2 hover:bg-primary-100 rounded-xl transition-all hover:scale-110"
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}

                {/* Desktop Search - Hidden on info pages and home page */}
                {!hideShoppingFeatures && !isHomePage && (
                  <form onSubmit={handleSearch} className="hidden lg:block relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                    <input
                      type="text"
                      placeholder="Search rare coins..."
                      value={localSearchTerm}
                      onChange={handleSearchChange}
                      className="input-modern w-64 xl:w-80 pl-10 pr-4 shadow-soft hover:shadow-medium"
                    />
                  </form>
                )}

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
                  {user ? (
                    // Logged in user dropdown
                    <div className="relative group">
                      <button className="flex items-center space-x-2 text-neutral-900 hover:text-accent-600 transition-all px-3 py-2 hover:bg-primary-100 rounded-xl hover:scale-105">
                        <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-white font-bold text-sm shadow-soft">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="hidden lg:inline text-sm font-medium">{user.name}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {/* Dropdown menu */}
                      <div className="absolute right-0 mt-2 w-48 card-modern py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 animate-scale-in">
                        <div className="px-4 py-2 border-b border-cream-200">
                          <p className="text-sm font-semibold text-charcoal-900">{user.name}</p>
                          <p className="text-xs text-charcoal-700">{user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-charcoal-900 hover:bg-cream-100"
                        >
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </Link>
                        <button
                          onClick={onLogout}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-charcoal-900 hover:bg-cream-100"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Sign in button
                    <Link
                      to="/authentication"
                      className="flex items-center space-x-2 text-neutral-900 hover:text-accent-600 transition-all px-3 py-2 hover:bg-primary-100 rounded-xl font-medium hover:scale-105"
                    >
                      <User className="w-5 h-5" />
                      <span className="hidden lg:inline text-sm">Sign In</span>
                    </Link>
                  )}

                  {/* Wishlist - Hidden on info pages */}
                  {!hideShoppingFeatures && (
                    <button
                      onClick={onWishlistClick}
                      className="relative flex items-center space-x-2 text-neutral-900 hover:text-accent-600 transition-all px-3 py-2 hover:bg-primary-100 rounded-xl font-medium hover:scale-105"
                    >
                      <Heart className="w-5 h-5" />
                      <span className="hidden lg:inline text-sm">Wishlist</span>
                      {wishlistCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-soft animate-pulse">
                          {wishlistCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Cart Button - Hidden on info pages */}
                {!hideShoppingFeatures && (
                  <button
                    onClick={onCartClick}
                    className="relative btn-primary flex items-center space-x-2 px-3 md:px-5"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-bold">
                      ₹{cartTotal.toFixed(2)}
                    </span>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold shadow-glow pulse-glow">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search Bar - Hidden on info pages */}
          {!hideShoppingFeatures && showMobileSearch && (
            <div className="lg:hidden pb-3 animate-slideDown w-full">
              <div className="mx-3">
                <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                <input
                  type="text"
                  placeholder="Search rare coins..."
                  value={localSearchTerm}
                  onChange={handleSearchChange}
                  className="input-modern w-full pl-10 pr-4 shadow-soft"
                  autoFocus
                />
              </form>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Navigation - Always visible */}
        <div className="w-full">
          <nav className="hidden lg:block py-3 border-t border-neutral-300/30 bg-white/10">
            <div className="flex items-center justify-between">
              <div className="flex space-x-6 xl:space-x-8 ml-3">
                {navigationLinks.map((link) => (
                  <div key={link.to} className="relative group">
                    <Link
                      to={link.to}
                      className="text-neutral-900 hover:text-accent-600 transition-all font-semibold text-sm flex items-center gap-1 py-2"
                    >
                      {link.label}
                      {link.categories && <ChevronDown className="w-3 h-3" />}
                    </Link>

                    {/* Dropdown Menu */}
                    {link.categories && (
                      <div className="absolute top-full left-0 mt-0 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="p-2">
                          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 py-2">
                            Categories
                          </div>
                          {link.categories.map((category) => {
                            // "All" goes to main category, others add ?sub= param
                            const categoryUrl = category === 'All'
                              ? link.to
                              : `${link.to}?sub=${encodeURIComponent(category)}`;

                            return (
                              <Link
                                key={category}
                                to={categoryUrl}
                                className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                              >
                                {category}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {comparisonCount > 0 && (
                <button
                  onClick={onComparisonClick}
                  className="btn-primary flex items-center space-x-2 px-5 py-2.5 text-sm mr-3"
                >
                  <Eye className="w-4 h-4" />
                  <span>Compare ({comparisonCount})</span>
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fadeIn"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Mobile Menu Panel */}
          <div className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-br from-primary-50 to-primary-100 z-50 lg:hidden shadow-strong animate-slideInLeft overflow-y-auto">
            <div className="p-4">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary-300">
                <div className="flex items-center space-x-3">
                  <img src={logoImage} alt="Chronicle Vaults" className="h-12 w-auto object-contain" />
                  <div>
                    <h2 className="text-lg font-black text-neutral-900">Menu</h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-neutral-900 hover:text-accent-600 p-2 hover:bg-primary-200 rounded-xl transition-all hover:scale-110"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile User Actions */}
              <div className="mb-6 space-y-2">
                {user ? (
                  // Logged in user info
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-cream-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-charcoal-800 flex items-center justify-center text-white font-bold text-lg">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal-900">{user.name}</p>
                        <p className="text-xs text-charcoal-700">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link
                        to="/profile"
                        onClick={() => setShowMobileMenu(false)}
                        className="w-full flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded transition-all"
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">My Profile</span>
                      </Link>
                      <button
                        onClick={() => {
                          onLogout();
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center justify-center space-x-2 bg-charcoal-900 hover:bg-charcoal-800 text-white p-2 rounded transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Sign in button
                  <Link
                    to="/authentication"
                    onClick={() => setShowMobileMenu(false)}
                    className="w-full flex items-center space-x-3 p-3 bg-white hover:bg-cream-100 rounded-lg transition-all text-charcoal-900 border border-cream-200 shadow-sm"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Sign In / Register</span>
                  </Link>
                )}

                {/* Wishlist - Hidden on info pages */}
                {!hideShoppingFeatures && (
                  <button
                    onClick={() => {
                      onWishlistClick?.();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-white hover:bg-cream-100 rounded-lg transition-all text-charcoal-900 border border-cream-200 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <Heart className="w-5 h-5" />
                      <span className="font-medium">Wishlist</span>
                    </div>
                    {wishlistCount > 0 && (
                      <span className="bg-red-500 text-white rounded-full px-2.5 py-0.5 text-xs font-bold">
                        {wishlistCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Comparison - Hidden on info pages */}
                {!hideShoppingFeatures && comparisonCount > 0 && (
                  <button
                    onClick={() => {
                      onComparisonClick?.();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-charcoal-900 hover:bg-charcoal-800 rounded-lg transition-all text-white shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <Eye className="w-5 h-5" />
                      <span className="font-medium">Compare Coins</span>
                    </div>
                    <span className="bg-charcoal-700 text-white rounded-full px-2.5 py-0.5 text-xs font-bold">
                      {comparisonCount}
                    </span>
                  </button>
                )}
              </div>

              {/* Mobile Navigation Links */}
              <nav className="space-y-1">
                <div className="text-charcoal-700 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
                  Browse Collections
                </div>
                {navigationLinks.map((link) => {
                  const Icon = link.icon;
                  const isExpanded = expandedMobileCategory === link.to;
                  const hasSubcategories = link.categories && link.categories.length > 0;

                  return (
                    <div key={link.to}>
                      {/* Main Category Link */}
                      <div className="flex items-center">
                        <Link
                          to={link.to}
                          onClick={() => setShowMobileMenu(false)}
                          className="flex-1 flex items-center space-x-3 p-3 hover:bg-white rounded-lg transition-all text-charcoal-900 group border border-transparent hover:border-cream-200"
                        >
                          <Icon className="w-5 h-5 text-charcoal-700 group-hover:text-charcoal-900" />
                          <span className="font-medium">{link.label}</span>
                        </Link>

                        {/* Expand button for subcategories */}
                        {hasSubcategories && (
                          <button
                            onClick={() => setExpandedMobileCategory(isExpanded ? null : link.to)}
                            className="p-3 text-charcoal-700 hover:text-charcoal-900 transition-all"
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Subcategories */}
                      {hasSubcategories && isExpanded && (
                        <div className="ml-8 mt-1 space-y-1 border-l-2 border-amber-200 pl-3">
                          {link.categories.map((category) => {
                            const categoryUrl = category === 'All'
                              ? link.to
                              : `${link.to}?sub=${encodeURIComponent(category)}`;

                            return (
                              <Link
                                key={category}
                                to={categoryUrl}
                                onClick={() => setShowMobileMenu(false)}
                                className="block px-3 py-2 text-sm text-charcoal-700 hover:bg-white hover:text-amber-600 rounded transition-all"
                              >
                                {category}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Mobile Contact Info */}
              <div className="mt-8 pt-6 border-t border-cream-300 space-y-3">
                <div className="text-charcoal-700 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
                  Contact Us
                </div>
                <a href="https://wa.me/918460849878" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-3 hover:bg-white rounded-lg transition-all text-charcoal-900 border border-transparent hover:border-cream-200">
                  <FaWhatsapp className="w-5 h-5 text-green-600" />
                  <span>+918460849878</span>
                </a>
                <a href="mailto:chroniclevaults@gmail.com" className="flex items-center space-x-3 p-3 hover:bg-white rounded-lg transition-all text-charcoal-900 border border-transparent hover:border-cream-200">
                  <Mail className="w-5 h-5 text-charcoal-700" />
                  <span className="text-sm">chroniclevaults@gmail.com</span>
                </a>
              </div>

              {/* Mobile Info Badges */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg text-charcoal-900 text-sm border border-cream-200 shadow-sm">
                  <Truck className="w-4 h-4 text-charcoal-700" />
                  <span>Free shipping over ₹100</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg text-charcoal-900 text-sm border border-cream-200 shadow-sm">
                  <BadgeCheck className="w-4 h-4" />
                  <span>Authenticity guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Header;