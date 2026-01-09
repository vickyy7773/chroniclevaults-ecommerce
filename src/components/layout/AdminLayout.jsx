import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  Search,
  ChevronRight,
  Image,
  FolderTree,
  Shield,
  UserCog,
  Filter,
  Activity,
  Gavel,
  FileText,
  Upload,
  Building2
} from 'lucide-react';
import usePermissions from '../../hooks/usePermissions';
import posterImage from '../../assets/poster.jpg';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [darkMode, setDarkMode] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Notifications functionality
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Get user permissions
  const { user, permissions, hasPermission, canAccessMenu, isSuperAdmin } = usePermissions();

  // Search function
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchResults(true);

    try {
      // Import API dynamically
      const { default: api } = await import('../../utils/api');

      const results = [];
      const searchLower = query.toLowerCase();

      // Search Menu Pages
      const matchedPages = [];
      visibleMenuItems.forEach(item => {
        // Search main menu items
        if (item.label.toLowerCase().includes(searchLower)) {
          if (item.path) {
            matchedPages.push({
              id: item.path,
              title: item.label,
              subtitle: 'Navigate to page',
              type: 'Page',
              path: item.path,
              icon: 'Menu'
            });
          }
        }

        // Search submenu items
        if (item.submenu) {
          item.submenu.forEach(subItem => {
            if (subItem.label.toLowerCase().includes(searchLower)) {
              matchedPages.push({
                id: subItem.path,
                title: `${item.label} → ${subItem.label}`,
                subtitle: 'Navigate to page',
                type: 'Page',
                path: subItem.path,
                icon: 'Menu'
              });
            }
          });
        }
      });
      results.push(...matchedPages.slice(0, 3));

      // Search Products (if has permission)
      if (canAccessMenu('products')) {
        try {
          const productsRes = await api.get('/products');
          const matchedProducts = productsRes.products
            .filter(p =>
              p.name?.toLowerCase().includes(searchLower) ||
              p.productCode?.toLowerCase().includes(searchLower) ||
              p.description?.toLowerCase().includes(searchLower)
            )
            .slice(0, 5)
            .map(p => ({
              id: p._id,
              title: p.name,
              subtitle: `Code: ${p.productCode || 'N/A'}`,
              type: 'Product',
              path: `/admin/products/edit/${p._id}`,
              icon: 'Package'
            }));
          results.push(...matchedProducts);
        } catch (err) {
          console.error('Product search error:', err);
        }
      }

      // Search Orders (if has permission)
      if (canAccessMenu('orders')) {
        try {
          const ordersRes = await api.get('/orders');
          const matchedOrders = ordersRes.orders
            .filter(o =>
              o.orderNumber?.toLowerCase().includes(searchLower) ||
              o.customerName?.toLowerCase().includes(searchLower) ||
              o.customerEmail?.toLowerCase().includes(searchLower)
            )
            .slice(0, 5)
            .map(o => ({
              id: o._id,
              title: `Order #${o.orderNumber}`,
              subtitle: `${o.customerName} - ₹${o.total}`,
              type: 'Order',
              path: `/admin/orders`,
              icon: 'ShoppingCart'
            }));
          results.push(...matchedOrders);
        } catch (err) {
          console.error('Order search error:', err);
        }
      }

      // Search Customers (if has permission)
      if (canAccessMenu('users')) {
        try {
          const customersRes = await api.get('/users/customers');
          const matchedCustomers = customersRes.customers
            .filter(c =>
              c.name?.toLowerCase().includes(searchLower) ||
              c.email?.toLowerCase().includes(searchLower) ||
              c.phone?.toLowerCase().includes(searchLower)
            )
            .slice(0, 5)
            .map(c => ({
              id: c._id,
              title: c.name,
              subtitle: c.email,
              type: 'Customer',
              path: `/admin/customers`,
              icon: 'Users'
            }));
          results.push(...matchedCustomers);
        } catch (err) {
          console.error('Customer search error:', err);
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Navigate to result
  const handleResultClick = (result) => {
    navigate(result.path);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const menuItems = [
    {
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      color: 'from-primary-600 to-primary-700',
      resource: 'dashboard'
    },
    {
      label: 'Categories',
      icon: FolderTree,
      color: 'from-accent-500 to-accent-600',
      resource: 'categories',
      submenu: [
        { path: '/admin/categories', label: 'All Categories' },
        { path: '/admin/categories/add', label: 'Add Category', requiresCreate: true }
      ]
    },
    {
      path: '/admin/filter-options',
      icon: Filter,
      label: 'Filter Options',
      color: 'from-purple-500 to-purple-600',
      resource: 'products', // Tied to products permission
      superAdminOnly: false
    },
    {
      label: 'Products',
      icon: Package,
      color: 'from-primary-500 to-primary-600',
      resource: 'products',
      submenu: [
        { path: '/admin/products', label: 'All Products' },
        { path: '/admin/products/add', label: 'Add Product', requiresCreate: true }
      ]
    },
    {
      label: 'Orders',
      icon: ShoppingCart,
      color: 'from-accent-400 to-accent-500',
      resource: 'orders',
      submenu: [
        { path: '/admin/orders/new', label: 'New Orders' },
        { path: '/admin/orders/history', label: 'Order History' },
        { path: '/admin/orders', label: 'All Orders' }
      ]
    },
    {
      path: '/admin/reviews',
      icon: ChevronRight,
      label: 'Reviews',
      color: 'from-primary-400 to-accent-400',
      resource: 'products' // Reviews tied to products
    },
    {
      path: '/admin/customers',
      icon: Users,
      label: 'Customers',
      color: 'from-accent-500 to-accent-600',
      resource: 'users'
    },
    {
      path: '/admin/vendors',
      icon: Building2,
      label: 'Vendors',
      color: 'from-amber-500 to-orange-600',
      resource: 'users' // Tied to users permission
    },
    {
      path: '/admin/sliders',
      icon: Image,
      label: 'Sliders',
      color: 'from-primary-500 to-accent-500',
      resource: 'sliders' // Slider management permission
    },
    {
      path: '/admin/banners',
      icon: Image,
      label: 'Today in History',
      color: 'from-amber-500 to-amber-600',
      resource: 'sliders' // Using sliders permission for banners too
    },
    {
      label: 'Blog',
      icon: ChevronRight,
      color: 'from-primary-600 to-accent-600',
      resource: 'blogs',
      submenu: [
        { path: '/admin/blog', label: 'All Posts' },
        { path: '/admin/blog/add', label: 'Add Post', requiresCreate: true }
      ]
    },
    {
      label: 'Auctions',
      icon: Gavel,
      color: 'from-orange-500 to-red-600',
      resource: 'products', // Tied to products permission
      submenu: [
        { path: '/admin/auctions', label: 'Auction Management' },
        { path: '/admin/auction-registrations', label: 'Registrations' },
        { path: '/admin/auction-invoices', label: 'Customer Invoices' },
        { path: '/admin/bid-tracking', label: 'Bid Tracking' },
        { path: '/admin/sales-dashboard', label: 'Sales Dashboard' },
        { path: '/admin/auction-report', label: 'Auction Report' },
        { path: '/admin/ecom-reports', label: 'E-Commerce Reports' },
        { path: '/admin/vendor-invoices', label: 'Vendor Invoices' },
        { path: '/admin/lot-transfer', label: 'Lot Transfer' },
        { path: '/admin/image-upload', label: 'Image Upload' },
        { path: '/admin/video-upload', label: 'Video Upload' },
        { path: '/admin/bulk-lot-upload', label: 'Bulk Lot Upload' }
      ]
    },
    {
      path: '/admin/profile',
      icon: Users,
      label: 'Profile',
      color: 'from-neutral-600 to-charcoal-700',
      resource: null, // Everyone can access profile
      alwaysShow: true
    },
    {
      path: '/admin/users-roles',
      icon: UserCog,
      label: 'Users & Roles',
      color: 'from-purple-500 to-purple-600',
      resource: 'roles', // Only if has role permissions
      superAdminOnly: true // Only super admin
    },
    {
      path: '/admin/admin-activities',
      icon: Activity,
      label: 'Admin Activities',
      color: 'from-indigo-500 to-indigo-600',
      resource: null,
      superAdminOnly: true // Only super admin can see activity logs
    },
    // Settings - Hidden
    // {
    //   path: '/admin/settings',
    //   icon: Settings,
    //   label: 'Settings',
    //   color: 'from-neutral-600 to-charcoal-700'
    // },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const toggleSubmenu = (label) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
  };

  // Check if user can see this menu item
  const canShowMenuItem = (item) => {
    // Always show items marked as alwaysShow
    if (item.alwaysShow) return true;

    // Super admin only items
    if (item.superAdminOnly && !isSuperAdmin) return false;

    // If no resource specified, show it
    if (!item.resource) return true;

    // Check permission for the resource
    return canAccessMenu(item.resource);
  };

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(canShowMenuItem);

  const handleLogout = async () => {
    try {
      // Import authService dynamically to avoid circular dependency
      const { authService } = await import('../../services');
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/');
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const { default: api } = await import('../../utils/api');
      const response = await api.get('/admin-notifications/all?limit=10');

      if (response.success) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const { default: api } = await import('../../utils/api');
      await api.patch(`/admin-notifications/${notificationId}/read`);

      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Don't auto-close sidebar on desktop
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-950' : 'bg-gray-100'}`}>
      <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-gray-100'}`}>
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
          ${sidebarOpen ? 'w-72' : isMobile ? '-translate-x-full' : 'w-20'}
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transition-all duration-300 flex flex-col shadow-xl
        `}>
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-5 border-b border-gray-200 dark:border-gray-800">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <img
                  src={posterImage}
                  alt="Chronicle Vaults Logo"
                  className="w-9 h-9 rounded-lg object-cover"
                />
                <div>
                  <h1 className="text-base font-bold text-gray-900 dark:text-white">
                    Chronicle <span className="text-accent-600">Vaults</span>
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Admin Dashboard</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${!sidebarOpen ? 'mx-auto' : ''}`}
            >
              {sidebarOpen ? (
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu size={20} className="text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {visibleMenuItems.map((item, index) => {
              // Check if item has submenu
              if (item.submenu) {
                const isOpen = openSubmenus[item.label];
                const hasActiveSubmenu = isSubmenuActive(item.submenu);

                return (
                  <div key={index}>
                    {/* Parent menu item with submenu */}
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 w-full ${
                        hasActiveSubmenu
                          ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <item.icon size={22} className={hasActiveSubmenu ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                      {sidebarOpen && (
                        <>
                          <span className="font-semibold flex-1 text-left">{item.label}</span>
                          <ChevronRight size={18} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        </>
                      )}
                    </button>

                    {/* Submenu items */}
                    {sidebarOpen && isOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu
                          .filter(subItem => {
                            // If submenu requires create permission, check it
                            if (subItem.requiresCreate) {
                              return isSuperAdmin || hasPermission(item.resource, 'create');
                            }
                            return true;
                          })
                          .map((subItem) => {
                            const subActive = isActive(subItem.path);
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                                  subActive
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 font-semibold'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                              >
                                <ChevronRight size={16} />
                                <span className="text-sm">{subItem.label}</span>
                              </Link>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Regular menu item without submenu
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <item.icon size={22} className={active ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                    {sidebarOpen && (
                      <>
                        <span className="font-semibold flex-1">{item.label}</span>
                        {active && <ChevronRight size={18} />}
                      </>
                    )}
                    {!sidebarOpen && active && (
                      <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full"></div>
                    )}
                  </Link>
                );
              }
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 w-full transition-colors font-semibold"
            >
              <LogOut size={22} />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-16 lg:h-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-8 shadow-sm">
            {/* Mobile Menu Button + Search */}
            <div className="flex items-center gap-3 flex-1">
              {/* Mobile Hamburger */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu size={24} className="text-gray-600 dark:text-gray-400" />
              </button>

              {/* Search Bar - Hidden on small mobile, visible on tablet+ */}
              <div className="hidden sm:block flex-1 max-w-xl relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products, orders, customers..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                    className="w-full pl-12 pr-4 py-2 lg:py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 placeholder-gray-500 font-medium text-sm lg:text-base"
                  />
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                    {searchLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-600 mx-auto"></div>
                        <p className="mt-2 text-sm">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className="w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left flex items-start gap-3"
                          >
                            <div className="flex-shrink-0 mt-1">
                              {result.icon === 'Package' && <Package size={18} className="text-accent-600" />}
                              {result.icon === 'ShoppingCart' && <ShoppingCart size={18} className="text-green-600" />}
                              {result.icon === 'Users' && <Users size={18} className="text-blue-600" />}
                              {result.icon === 'Menu' && <ChevronRight size={18} className="text-purple-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {result.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {result.subtitle}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                              {result.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        <Search size={32} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No results found for "{searchQuery}"</p>
                        <p className="text-xs mt-1 text-gray-400">Try different keywords</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative p-2 lg:p-3 rounded-xl transition-all duration-300 ${
                  darkMode
                    ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <div className="relative">
                  {darkMode ? (
                    <Sun size={20} className="text-yellow-500 animate-spin-slow" />
                  ) : (
                    <Moon size={20} className="text-gray-600" />
                  )}
                </div>
              </button>

              <style>{`
                @keyframes spin-slow {
                  from {
                    transform: rotate(0deg);
                  }
                  to {
                    transform: rotate(360deg);
                  }
                }
                .animate-spin-slow {
                  animation: spin-slow 20s linear infinite;
                }
              `}</style>

              {/* Notifications - Hidden on small mobile */}
              <div className="hidden sm:block relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      fetchNotifications();
                    }
                  }}
                  className="p-2 lg:p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                >
                  <Bell size={20} className="text-gray-600 dark:text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Bell size={18} />
                          Notifications
                          {unreadCount > 0 && (
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </h3>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                      {notificationsLoading ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {notifications.map((notification) => (
                            <button
                              key={notification._id}
                              onClick={() => {
                                if (!notification.isRead) {
                                  markAsRead(notification._id);
                                }
                                // Navigate to customer management with user filter
                                setShowNotifications(false);
                                const userId = notification.user?._id || notification.user;
                                navigate(`/admin/customer-management?userId=${userId}`);
                              }}
                              className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                !notification.isRead ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                  !notification.isRead ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    {notification.type === 'coin_limit_request' ? '💰 Coin Limit Request' : 'Notification'}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  {notification.auctionTitle && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Auction: {notification.auctionTitle}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    {new Date(notification.createdAt).toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <button
                          onClick={() => {
                            fetchNotifications();
                          }}
                          className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium w-full text-center"
                        >
                          Refresh Notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-3 ml-2 lg:ml-3 border-l border-gray-200 dark:border-gray-800">
                {/* User text - Hidden on mobile */}
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || 'admin@chroniclevaults.com'}
                  </p>
                  {user?.role?.displayName && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      {user.role.displayName}
                    </p>
                  )}
                </div>
                {/* Avatar */}
                <div className={`w-9 h-9 lg:w-11 lg:h-11 ${
                  isSuperAdmin
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                    : 'bg-gradient-to-br from-primary-500 to-accent-600'
                } rounded-xl flex items-center justify-center text-white font-bold text-base lg:text-lg shadow-lg`}>
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className={`flex-1 overflow-y-auto transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
