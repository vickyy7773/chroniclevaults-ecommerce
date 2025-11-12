import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services';
import { Award, BadgeCheck, Users, Heart, ChevronRight } from 'lucide-react';
import posterImage from '../../assets/poster.jpg';

// Header is now handled by the parent App component
import Hero from './Hero';
import CategoryGrid from '../product/CategoryGrid';
import TodayInHistoryBanner from '../common/TodayInHistoryBanner';
import FeaturedCarousel from '../product/FeaturedCarousel';
import ProductGrid from '../product/ProductGrid';
import FeaturesBar from '../common/FeaturesBar';
// CartSidebar is now handled globally in App.jsx
import QuickViewModal from '../modals/QuickViewModal';
import ComparisonModal from '../modals/ComparisonModal';
import MobileMenu from './MobileMenu';
import AuthModal from '../modals/AuthModal';

const VintageCoinStore = ({
  cart = [],
  wishlist = [],
  addToCart = () => {},
  removeFromCart = () => {},
  updateQuantity = () => {},
  addToWishlist = () => {},
  isInWishlist = () => false,
  addToComparison = () => {},
  removeFromComparison = () => {},
  comparisonCoins = [],
  showCart = false,
  setShowCart = () => {},
  showAuthModal = false,
  setShowAuthModal = () => {},
  searchTerm = '',
  setSearchTerm = () => {},
  categoriesOverride,
  baseFilter
}) => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch from API
      const response = await productService.getAllProducts();

      // Handle different API response formats
      const productsData = response?.data?.data || response?.data || [];
      setCoins(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setCoins([]);
    } finally {
      setLoading(false);
    }
  };

  const [filterRarity, setFilterRarity] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterCondition, setFilterCondition] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // Default to newest first
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [user, setUser] = useState(null);

  const coinsPerPage = 6;

  const rarityColors = {
    'Common': 'bg-cream-100 text-charcoal-800',
    'Uncommon': 'bg-cream-200 text-charcoal-800',
    'Rare': 'bg-cream-300 text-charcoal-900',
    'Very Rare': 'bg-charcoal-100 text-charcoal-900'
  };

  const categories = categoriesOverride || ['All', 'Penny', 'Nickel', 'Dime', 'Quarter', 'Half Dollar', 'Dollar'];
  const conditions = ['All', 'Good', 'Very Good', 'Fine', 'Very Fine', 'About Uncirculated', 'Uncirculated'];

  const filteredCoins = coins
    .filter(coin => (typeof baseFilter === 'function' ? baseFilter(coin) : true))
    .filter(coin =>
      (coin.inStock || 0) > 0 && // Exclude sold items
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterRarity === 'All' || coin.rarity === filterRarity) &&
      (filterCategory === 'All' || coin.subCategory === filterCategory || coin.category === filterCategory) &&
      (filterCondition === 'All' || coin.condition === filterCondition)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // Sort by creation date (newest first)
          return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'year': return (b.year || 0) - (a.year || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'featured': return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        case 'name': return a.name.localeCompare(b.name);
        default:
          // Default also newest first
          return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredCoins.length / coinsPerPage);
  const currentCoins = filteredCoins.slice((currentPage - 1) * coinsPerPage, currentPage * coinsPerPage);

  // Functions are now passed as props from App component

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalSavings = cart.reduce((total, item) => total + ((item.originalPrice - item.price) * item.quantity), 0);

  const openQuickView = (coin) => {
    setSelectedCoin(coin);
    setSelectedImageIndex(0);
    setShowQuickView(true);
  };

  // Show all active products that are in stock (not just featured ones)
  const featuredCoins = coins.filter(coin => (coin.inStock || 0) > 0);
  const saleCoins = coins.filter(coin => coin.onSale && (coin.inStock || 0) > 0);

  return (
    <div className="min-h-screen">

      <Hero />

      <CategoryGrid />

      <TodayInHistoryBanner />

      {featuredCoins.length > 0 && (
        <FeaturedCarousel
          featuredCoins={featuredCoins}
          addToCart={addToCart}
          openQuickView={openQuickView}
          addToWishlist={addToWishlist}
          isInWishlist={isInWishlist}
        />
      )}

      {/* Chronicle Vaults Section */}
      <div style={{ backgroundColor: '#EFE0C3', paddingTop: '5rem', paddingBottom: '4.5rem' }}>
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Chronicle Vaults
              </h1>
              <p className="text-gray-700 leading-relaxed mb-8 text-base" style={{ fontFamily: 'Georgia, serif' }}>
                Chronicle Vaults was founded with a simple mission: to make rare and historical collectibles accessible to enthusiasts and collectors worldwide. What started as a small shop has grown into one of the most trusted names in numismatics and collectibles.
              </p>

              <div className="space-y-5 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full">
                      <BadgeCheck className="w-7 h-7 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Authenticity Guaranteed</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Expert verified items.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full">
                      <Users className="w-7 h-7 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Trusted Community</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Thousands of satisfied collectors since 2016.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full">
                      <Heart className="w-7 h-7 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Passion for History</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Preserving history through rare collectibles.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/about-us"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Read More
                <ChevronRight size={20} />
              </Link>
            </div>

            <div className="relative flex justify-center items-center">
              <img
                src={posterImage}
                alt="Rare coins collection"
                className="rounded-lg w-4/5 h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <FeaturesBar />

      {showQuickView && selectedCoin && (
        <QuickViewModal
          selectedCoin={selectedCoin}
          setShowQuickView={setShowQuickView}
          rarityColors={rarityColors}
          addToCart={addToCart}
          addToWishlist={addToWishlist}
          isInWishlist={isInWishlist}
          selectedImageIndex={selectedImageIndex}
          setSelectedImageIndex={setSelectedImageIndex}
        />
      )}

      {showComparison && comparisonCoins.length > 0 && (
        <ComparisonModal
          comparisonCoins={comparisonCoins}
          setShowComparison={setShowComparison}
          rarityColors={rarityColors}
          addToCart={addToCart}
          removeFromComparison={removeFromComparison}
        />
      )}

      {showMobileMenu && (
        <MobileMenu
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          wishlistCount={wishlist.length}
          cartTotal={cartTotal}
          setShowMobileMenu={setShowMobileMenu}
        />
      )}

      {showAuthModal && (
        <AuthModal setShowAuthModal={setShowAuthModal} />
      )}
    </div>
  );
};

export default VintageCoinStore;

