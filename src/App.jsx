import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import ScrollToTop from './components/common/ScrollToTop';
import VintageCoinStore from './components/layout/VintageCoinStore';
import CartSidebar from './components/cart/CartSidebar';
import WishlistSidebar from './components/cart/WishlistSidebar';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';

// Lazy load pages for code splitting
const Authentication = lazy(() => import('./pages/auth/Authentication'));
const GoogleAuthSuccess = lazy(() => import('./pages/auth/GoogleAuthSuccess'));
const GoogleAuthError = lazy(() => import('./pages/auth/GoogleAuthError'));
const CategoryPage = lazy(() => import('./pages/products/CategoryPage'));
const Accessories = lazy(() => import('./pages/products/Accessories'));
const ProductDetail = lazy(() => import('./pages/products/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Profile = lazy(() => import('./pages/Profile'));

// Info Pages
const AboutUs = lazy(() => import('./pages/info/AboutUs'));
const FAQ = lazy(() => import('./pages/info/FAQ'));
const ContactUs = lazy(() => import('./pages/info/ContactUs'));
const Blog = lazy(() => import('./pages/Blog'));

// Customer Pages
const BuyingWithUs = lazy(() => import('./pages/customer/BuyingWithUs'));

// Policy Pages
const PrivacyPolicy = lazy(() => import('./pages/policies/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/policies/TermsConditions'));
const ShippingPolicy = lazy(() => import('./pages/policies/ShippingPolicy'));
const CancellationRefund = lazy(() => import('./pages/policies/CancellationRefund'));

// Admin Pages
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement'));
const AddEditProduct = lazy(() => import('./pages/admin/AddEditProduct'));
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement'));
const AddEditCategory = lazy(() => import('./pages/admin/AddEditCategory'));
const ReviewManagement = lazy(() => import('./pages/admin/ReviewManagement'));
const CustomerManagement = lazy(() => import('./pages/admin/CustomerManagement'));
const SliderManagement = lazy(() => import('./pages/admin/SliderManagement'));
const BannerManagement = lazy(() => import('./pages/admin/BannerManagement'));
const CouponManagement = lazy(() => import('./pages/admin/CouponManagement'));
const FilterOptionsManagement = lazy(() => import('./pages/admin/FilterOptionsManagement'));
const BlogManagement = lazy(() => import('./pages/admin/BlogManagement'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);
import ProfileManagement from './pages/admin/ProfileManagement';
import RoleManagement from './pages/admin/RoleManagement';
import AdminManagement from './pages/admin/AdminManagement';
import UserRoleManagement from './pages/admin/UserRoleManagement';
import InitialSetup from './pages/admin/InitialSetup';
import PagePosters from './pages/admin/PagePosters';
import InvoicePreview from './pages/admin/InvoicePreview';
import AdminActivities from './pages/admin/AdminActivities';

const AppContent = () => {
  const location = useLocation();

  const hideHeaderFooter = location.pathname === '/authentication' ||
                          location.pathname === '/checkout' ||
                          location.pathname === '/profile' ||
                          location.pathname.startsWith('/admin');

  // Show shopping features (search, cart, wishlist) on all pages
  const hideShoppingFeatures = false;

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });
  const [user, setUser] = useState(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [comparisonCoins, setComparisonCoins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Logout function
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setToastMessage('Logged out successfully!');
    setShowToast(true);
  };

  // Calculate cart totals
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalSavings = cart.reduce((total, item) => total + ((item.originalPrice - item.price) * item.quantity), 0);

  // Cart functions
  const addToCart = (coin) => {
    setCart(prev => {
      // Get product ID - MongoDB products use _id
      const productId = coin._id || coin.id;

      const existing = prev.find(item => {
        const itemId = item._id || item.id;
        return itemId === productId;
      });

      if (existing) {
        setToastMessage(`${coin.name} quantity updated in cart!`);
        setShowToast(true);
        return prev.map(item => {
          const itemId = item._id || item.id;
          return itemId === productId
            ? { ...item, quantity: Math.min(item.quantity + 1, coin.inStock) }
            : item;
        });
      }
      setToastMessage(`${coin.name} added to cart!`);
      setShowToast(true);
      return [...prev, { ...coin, quantity: 1 }];
    });
  };

  const removeFromCart = (coinId) => {
    setCart(prev => prev.filter(item => {
      const itemId = item._id || item.id;
      return itemId !== coinId;
    }));
  };

  const updateQuantity = (coinId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(coinId);
      return;
    }
    const coin = cart.find(c => (c._id || c.id) === coinId);
    const maxQuantity = coin ? coin.inStock : 1;

    setCart(prev =>
      prev.map(item => {
        const itemId = item._id || item.id;
        return itemId === coinId
          ? { ...item, quantity: Math.min(newQuantity, maxQuantity) }
          : item;
      })
    );
  };

  // Wishlist functions
  const addToWishlist = (coin) => {
    const coinId = coin._id || coin.id;
    setWishlist(prev => {
      const existing = prev.find(item => (item._id || item.id) === coinId);
      if (existing) {
        setToastMessage(`${coin.name} removed from wishlist!`);
        setShowToast(true);
        return prev.filter(item => (item._id || item.id) !== coinId);
      }
      setToastMessage(`${coin.name} added to wishlist!`);
      setShowToast(true);
      return [...prev, coin];
    });
  };

  const isInWishlist = (coinId) => wishlist.some(item => (item._id || item.id) === coinId);

  // Comparison functions
  const addToComparison = (coin) => {
    setComparisonCoins(prev => {
      if (prev.length >= 3) return prev;
      if (prev.find(c => c.id === coin.id)) return prev;
      return [...prev, coin];
    });
  };

  const removeFromComparison = (coinId) => {
    setComparisonCoins(prev => prev.filter(c => c.id !== coinId));
  };

  // Header event handlers
  const handleCartClick = () => {
    setShowCart(!showCart);
  };

  const handleWishlistClick = () => {
    setShowWishlist(!showWishlist);
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  const handleSearch = (searchTerm) => {
    setSearchTerm(searchTerm);
  };

  const handleComparisonClick = () => {
    // Handle comparison modal
    console.log('Comparison clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
      <ScrollToTop />
      {!hideHeaderFooter && (
        <Header
          cartTotal={cartTotal}
          cartItemCount={cartItemCount}
          wishlistCount={wishlist.length}
          onCartClick={handleCartClick}
          onWishlistClick={handleWishlistClick}
          onAuthClick={handleAuthClick}
          onSearch={handleSearch}
          onComparisonClick={handleComparisonClick}
          comparisonCount={comparisonCoins.length}
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          user={user}
          onLogout={handleLogout}
          hideShoppingFeatures={hideShoppingFeatures}
        />
      )}

        {/* Cart Sidebar - positioned below header */}
        {showCart && (
          <CartSidebar
            cart={cart}
            cartItemCount={cartItemCount}
            cartTotal={cartTotal}
            totalSavings={totalSavings}
            setShowCart={setShowCart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />
        )}

        {/* Wishlist Sidebar */}
        {showWishlist && (
          <WishlistSidebar
            wishlist={wishlist}
            setShowWishlist={setShowWishlist}
            addToCart={addToCart}
            addToWishlist={addToWishlist}
          />
        )}

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={
              <VintageCoinStore
                cart={cart}
                wishlist={wishlist}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                addToWishlist={addToWishlist}
                isInWishlist={isInWishlist}
                addToComparison={addToComparison}
                removeFromComparison={removeFromComparison}
                comparisonCoins={comparisonCoins}
                showCart={showCart}
                setShowCart={setShowCart}
                showAuthModal={showAuthModal}
                setShowAuthModal={setShowAuthModal}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            } />
            {/* New hierarchical product URL */}
            <Route path="/:category/:subcategory/:productSlug" element={
              <ProductDetail
                addToCart={addToCart}
                addToWishlist={addToWishlist}
                isInWishlist={isInWishlist}
              />
            } />
            {/* Old product URL for backward compatibility */}
            <Route path="/product/:id" element={
              <ProductDetail
                addToCart={addToCart}
                addToWishlist={addToWishlist}
                isInWishlist={isInWishlist}
              />
            } />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
            <Route path="/invoice/:orderId" element={<InvoicePreview />} />
            {/* Dynamic Category Pages - Any category from database */}
            <Route path="/category/:categoryName" element={
              <CategoryPage
                addToCart={addToCart}
                addToWishlist={addToWishlist}
                isInWishlist={isInWishlist}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            } />

            {/* Keep Accessories as reference (can be removed later) */}
            <Route path="/accessories" element={
              <Accessories
                addToCart={addToCart}
                addToWishlist={addToWishlist}
                isInWishlist={isInWishlist}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            } />
            <Route path="/authentication" element={<Authentication setUser={setUser} />} />
            <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
            <Route path="/auth/google/error" element={<GoogleAuthError />} />
            <Route path="/setup-admin" element={<InitialSetup />} />

            {/* Info Pages */}
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/blog" element={<Blog />} />

            {/* Customer Pages */}
            <Route path="/buying-with-us" element={<BuyingWithUs />} />

            {/* Policy Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/cancellation-refund" element={<CancellationRefund />} />

            {/* Admin Routes - All wrapped in AdminLayout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="page-posters" element={<PagePosters />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="products/add" element={<AddEditProduct />} />
              <Route path="products/edit/:id" element={<AddEditProduct />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="orders/new" element={<OrderManagement />} />
              <Route path="orders/history" element={<OrderManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="settings" element={<Settings />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="categories/add" element={<AddEditCategory />} />
              <Route path="categories/edit/:id" element={<AddEditCategory />} />
              <Route path="filter-options" element={<FilterOptionsManagement />} />
              <Route path="reviews" element={<ReviewManagement />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="sliders" element={<SliderManagement />} />
              <Route path="banners" element={<BannerManagement />} />
              <Route path="coupons" element={<CouponManagement />} />
              <Route path="blog" element={<BlogManagement />} />
              <Route path="blog/add" element={<BlogManagement />} />
              <Route path="blog/edit/:id" element={<BlogManagement />} />
              <Route path="profile" element={<ProfileManagement />} />
              <Route path="users-roles" element={<UserRoleManagement />} />
              {/* Keep old routes for backward compatibility */}
              <Route path="roles" element={<UserRoleManagement />} />
              <Route path="admins" element={<UserRoleManagement />} />
              <Route path="admin-activities" element={<AdminActivities />} />
            </Route>
          </Routes>
        </Suspense>

      {!hideHeaderFooter && <Footer />}

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type="success"
      />
    </div>
  );
}

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
