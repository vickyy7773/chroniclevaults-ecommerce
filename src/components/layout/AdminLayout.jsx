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
  Activity
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

  // Get user permissions
  const { user, permissions, hasPermission, canAccessMenu, isSuperAdmin } = usePermissions();

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
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
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
              <div className="hidden sm:block flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-12 pr-4 py-2 lg:py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 placeholder-gray-500 font-medium text-sm lg:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 lg:p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {darkMode ? (
                  <Sun size={20} className="text-yellow-500" />
                ) : (
                  <Moon size={20} className="text-gray-600" />
                )}
              </button>

              {/* Notifications - Hidden on small mobile */}
              <button className="hidden sm:block p-2 lg:p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
                <Bell size={20} className="text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
              </button>

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
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
