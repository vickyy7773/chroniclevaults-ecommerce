import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/common/Header';
import ScrollToTop from './components/common/ScrollToTop';
import VintageCoinStore from './components/layout/VintageCoinStore';
import CartSidebar from './components/cart/CartSidebar';
import WishlistSidebar from './components/cart/WishlistSidebar';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import { userSyncService, authService } from './services';

// Lazy load pages for code splitting
const Authentication = lazy(() => import('./pages/auth/Authentication'));
const GoogleAuthSuccess = lazy(() => import('./pages/auth/GoogleAuthSuccess'));
const GoogleAuthError = lazy(() => import('./pages/auth/GoogleAuthError'));
const FacebookAuthSuccess = lazy(() => import('./pages/auth/FacebookAuthSuccess'));
const FacebookAuthError = lazy(() => import('./pages/auth/FacebookAuthError'));
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
const BlogDetail = lazy(() => import('./pages/BlogDetail'));

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
const AuctionManagement = lazy(() => import('./pages/admin/AuctionManagement'));
const AuctionRegistrationManagement = lazy(() => import('./pages/admin/AuctionRegistrationManagement'));

// Auction Pages
const Auctions = lazy(() => import('./pages/Auctions'));
const Auction = lazy(() => import('./pages/Auction'));
const AuctionRegistration = lazy(() => import('./pages/AuctionRegistration'));
const NoAuction = lazy(() => import('./pages/NoAuction'));

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
                          location.pathname.startsWith('/admin') ||
                          location.pathname.startsWith('/auction/');

  // Show shopping features (search, cart, wishlist) on all pages
  const hideShoppingFeatures = false;

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
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
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      // First, immediately load user from localStorage for instant UI update
      if (savedUser && token) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('📦 Loaded user from localStorage:', userData._id);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing saved user:', error);
        }
      }

      // Then fetch fresh user data from backend in background
      if (token) {
        try {
          console.log('🔄 Fetching fresh user data from backend...');
          const response = await authService.getCurrentUser();
          if (response.success && response.data) {
            console.log('✅ Fresh user data loaded:', response.data._id);
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Only logout if we got a response but it's invalid (actual auth failure)
            console.warn('⚠️ Invalid user data from backend, logging out');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Token is invalid or expired - clear everything and force re-login
          if (error.response?.status === 401) {
            console.warn('⚠️ Token expired or invalid - clearing session');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
          } else {
            console.log('📡 Network error, keeping cached user data');
            // Keep the user data from localStorage that we loaded earlier
          }
        }
      }
    };

    loadUser();
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Listen for cart cleared event from Checkout page
  useEffect(() => {
    const handleCartCleared = () => {
      console.log('🗑️ Cart cleared event received in App.jsx');
      setCart([]);
    };

    window.addEventListener('cartCleared', handleCartCleared);

    return () => {
      window.removeEventListener('cartCleared', handleCartCleared);
    };
  }, []);

  // Remove out-of-stock items from cart automatically
  useEffect(() => {
    if (cart.length === 0) return;

    // Filter out items with inStock <= 0
    const validItems = cart.filter(item => {
      const stock = item.inStock || 0;
      if (stock <= 0) {
        console.log(`🗑️ Removing out-of-stock item from cart: ${item.name} (stock: ${stock})`);
        return false;
      }
      // Also adjust quantity if it exceeds available stock
      if (item.quantity > stock) {
        console.log(`⚠️ Adjusting quantity for ${item.name} from ${item.quantity} to ${stock}`);
        item.quantity = stock;
      }
      return true;
    });

    // Update cart if any items were filtered out
    if (validItems.length !== cart.length) {
      console.log(`🗑️ Removed ${cart.length - validItems.length} out-of-stock items from cart`);
      setCart(validItems);
    }
  }, [cart]);

  // Sync cart and wishlist with backend when user logs in
  useEffect(() => {
    const syncWithBackend = async () => {
      if (user && user._id) {
        try {
          console.log('🔄 Syncing cart and wishlist with backend...');

          // First, fetch current data from backend
          const [cartResponse, wishlistResponse] = await Promise.all([
            userSyncService.getCart().catch(() => ({ success: false, cart: [] })),
            userSyncService.getWishlist().catch(() => ({ success: false, wishlist: [] }))
          ]);

          // Get local data
          const localCart = cart;
          const localWishlist = wishlist;

          // Only sync if local data exists (user added items while logged out)
          if (localCart.length > 0 || localWishlist.length > 0) {
            console.log('📤 Syncing local data to backend...');
            const result = await userSyncService.syncCartAndWishlist(localCart, localWishlist);

            if (result.success) {
              console.log('✅ Local data synced to backend');

              // Update state with merged data from backend
              if (result.cart) {
                const formattedCart = result.cart.map(item => ({
                  ...item.product,
                  quantity: item.quantity
                }));
                setCart(formattedCart);
                localStorage.setItem('cart', JSON.stringify(formattedCart));
              }

              if (result.wishlist) {
                setWishlist(result.wishlist);
                localStorage.setItem('wishlist', JSON.stringify(result.wishlist));
              }
            }
          } else {
            // No local data, just load from backend
            console.log('📥 Loading data from backend...');

            if (cartResponse.success && cartResponse.cart) {
              const formattedCart = cartResponse.cart.map(item => ({
                ...item.product,
                quantity: item.quantity
              }));
              setCart(formattedCart);
              localStorage.setItem('cart', JSON.stringify(formattedCart));
            }

            if (wishlistResponse.success && wishlistResponse.wishlist) {
              setWishlist(wishlistResponse.wishlist);
              localStorage.setItem('wishlist', JSON.stringify(wishlistResponse.wishlist));
            }

            console.log('✅ Data loaded from backend');
          }
        } catch (error) {
          console.error('❌ Error syncing with backend:', error);
          // Continue with localStorage data if backend sync fails
        }
      }
    };

    syncWithBackend();
  }, [user?._id]); // Only run when user ID changes (login/logout)

  // Logout function
  const handleLogout = () => {
    console.log('🚪 Logging out - Clearing all data...');

    // Clear all user data and states
    setUser(null);
    setCart([]);
    setWishlist([]);
    setComparisonCoins([]);

    // Clear all localStorage items
    localStorage.clear(); // Clear everything instead of removing items one by one

    // Clear any sessionStorage
    sessionStorage.clear();

    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log('✅ All data cleared. Redirecting to home...');

    // Show logout message
    setToastMessage('Logged out successfully! All data cleared.');
    setShowToast(true);

    // Small delay to ensure storage is cleared before redirect
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  // Calculate cart totals
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalSavings = cart.reduce((total, item) => total + ((item.originalPrice - item.price) * item.quantity), 0);

  // Cart functions
  const addToCart = async (coin) => {
    const productId = coin._id || coin.id;

    // Update local state first
    setCart(prev => {
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

    // Sync with backend if user is logged in
    if (user && user._id) {
      try {
        await userSyncService.addToCart(productId, 1);
      } catch (error) {
        console.error('Error syncing cart with backend:', error);
      }
    }
  };

  const removeFromCart = async (coinId) => {
    // Update local state first
    setCart(prev => prev.filter(item => {
      const itemId = item._id || item.id;
      return itemId !== coinId;
    }));

    // Sync with backend if user is logged in
    if (user && user._id) {
      try {
        await userSyncService.removeFromCart(coinId);
      } catch (error) {
        console.error('Error syncing cart with backend:', error);
      }
    }
  };

  const updateQuantity = async (coinId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(coinId);
      return;
    }
    const coin = cart.find(c => (c._id || c.id) === coinId);
    const maxQuantity = coin ? coin.inStock : 1;

    // Update local state first
    setCart(prev =>
      prev.map(item => {
        const itemId = item._id || item.id;
        return itemId === coinId
          ? { ...item, quantity: Math.min(newQuantity, maxQuantity) }
          : item;
      })
    );

    // Sync with backend if user is logged in
    if (user && user._id) {
      try {
        await userSyncService.updateCartItem(coinId, Math.min(newQuantity, maxQuantity));
      } catch (error) {
        console.error('Error syncing cart with backend:', error);
      }
    }
  };

  // Wishlist functions
  const addToWishlist = async (coin) => {
    const coinId = coin._id || coin.id;
    let isAdding = false;

    // Update local state first
    setWishlist(prev => {
      const existing = prev.find(item => (item._id || item.id) === coinId);
      if (existing) {
        setToastMessage(`${coin.name} removed from wishlist!`);
        setShowToast(true);
        isAdding = false;
        return prev.filter(item => (item._id || item.id) !== coinId);
      }
      setToastMessage(`${coin.name} added to wishlist!`);
      setShowToast(true);
      isAdding = true;
      return [...prev, coin];
    });

    // Sync with backend if user is logged in
    if (user && user._id) {
      try {
        if (isAdding) {
          await userSyncService.addToWishlist(coinId);
        } else {
          await userSyncService.removeFromWishlist(coinId);
        }
      } catch (error) {
        console.error('Error syncing wishlist with backend:', error);
      }
    }
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
            <Route path="/auth/facebook/success" element={<FacebookAuthSuccess />} />
            <Route path="/auth/facebook/error" element={<FacebookAuthError />} />
            <Route path="/setup-admin" element={<InitialSetup />} />

            {/* Info Pages */}
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogDetail />} />

            {/* Customer Pages */}
            <Route path="/buying-with-us" element={<BuyingWithUs />} />

            {/* Auction Pages */}
            <Route path="/auctions" element={<Auctions />} />
            <Route path="/auction/:id" element={<Auction />} />
            <Route path="/auction-registration" element={<AuctionRegistration />} />
            <Route path="/no-auction" element={<NoAuction />} />

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
              <Route path="auctions" element={<AuctionManagement />} />
              <Route path="auction-registrations" element={<AuctionRegistrationManagement />} />
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
