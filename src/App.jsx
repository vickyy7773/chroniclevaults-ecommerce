import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import ScrollToTop from './components/common/ScrollToTop';
import VintageCoinStore from './components/layout/VintageCoinStore';
import CartSidebar from './components/cart/CartSidebar';
import WishlistSidebar from './components/cart/WishlistSidebar';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import Authentication from './pages/auth/Authentication';
import GoogleAuthSuccess from './pages/auth/GoogleAuthSuccess';
import GoogleAuthError from './pages/auth/GoogleAuthError';
import CategoryPage from './pages/products/CategoryPage';
import Accessories from './pages/products/Accessories';
import ProductDetail from './pages/products/ProductDetail';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';

// Info Pages
import AboutUs from './pages/info/AboutUs';
import FAQ from './pages/info/FAQ';
import ContactUs from './pages/info/ContactUs';
import Blog from './pages/Blog';

// Customer Pages
import BuyingWithUs from './pages/customer/BuyingWithUs';

// Policy Pages
import PrivacyPolicy from './pages/policies/PrivacyPolicy';
import TermsConditions from './pages/policies/TermsConditions';
import ShippingPolicy from './pages/policies/ShippingPolicy';
import CancellationRefund from './pages/policies/CancellationRefund';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import AddEditProduct from './pages/admin/AddEditProduct';
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/UserManagement';
import Settings from './pages/admin/Settings';
import CategoryManagement from './pages/admin/CategoryManagement';
import AddEditCategory from './pages/admin/AddEditCategory';
import ReviewManagement from './pages/admin/ReviewManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import SliderManagement from './pages/admin/SliderManagement';
import BannerManagement from './pages/admin/BannerManagement';
import CouponManagement from './pages/admin/CouponManagement';
import FilterOptionsManagement from './pages/admin/FilterOptionsManagement';
import BlogManagement from './pages/admin/BlogManagement';
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
