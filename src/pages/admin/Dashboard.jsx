import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Eye, ArrowUp, ArrowDown, Activity, Clock, UserCheck } from 'lucide-react';
import { productService, orderService, activityService } from '../../services';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [activityStats, setActivityStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activeAdmins, setActiveAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      console.log('📊 Fetching dashboard data...');

      // Fetch products
      let productsResponse;
      try {
        productsResponse = await productService.getAllProducts({ limit: 5 });
        console.log('📦 Products Response:', productsResponse);

        // Handle different response formats
        const productsData = productsResponse?.data?.data || productsResponse?.data || [];
        setRecentProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        setRecentProducts([]);
        productsResponse = { data: [], total: 0 };
      }

      // Fetch orders
      try {
        const ordersResponse = await orderService.getAllOrders();
        console.log('📋 Orders Response:', ordersResponse);

        // Handle different response formats
        const ordersData = ordersResponse?.data?.data || ordersResponse?.data || [];
        const ordersArray = Array.isArray(ordersData) ? ordersData : [];

        setRecentOrders(ordersArray.slice(0, 5));

        // Calculate stats
        const totalRevenue = ordersArray.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const pendingOrders = ordersArray.filter(order => order.orderStatus === 'Pending').length;

        setStats({
          totalProducts: productsResponse?.data?.total || productsResponse?.total || 0,
          totalOrders: ordersArray.length,
          totalRevenue,
          pendingOrders
        });
      } catch (error) {
        console.error('❌ Error fetching orders:', error);
        // Orders might fail if not admin, set defaults
        setRecentOrders([]);
        setStats({
          totalProducts: productsResponse?.data?.total || productsResponse?.total || 0,
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0
        });
      }

      // Fetch admin activity data (only for superadmin)
      if (currentUser.isSuperAdmin) {
        try {
          const [statsResponse, timelineResponse] = await Promise.all([
            activityService.getActivityStats(),
            activityService.getActivityTimeline(7)
          ]);

          console.log('📊 Activity Stats:', statsResponse);
          console.log('📋 Activity Timeline:', timelineResponse);

          setActivityStats(statsResponse.data);
          setRecentActivities(timelineResponse.data || []);
          setActiveAdmins(statsResponse.data?.activeAdmins || []);
        } catch (error) {
          console.error('❌ Error fetching activity data:', error);
          setActivityStats(null);
          setRecentActivities([]);
          setActiveAdmins([]);
        }
      }

    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      console.error('Error details:', error.response || error);
      // Set safe defaults
      setRecentProducts([]);
      setRecentOrders([]);
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, trend, trendUp = true }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 md:p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${color} opacity-5 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
            <Icon size={20} className="md:w-6 md:h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs font-bold ${
              trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
            }`}>
              {trendUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white break-words">{value}</h3>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white">
            Dashboard <span className="text-accent-600">Overview</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2 font-medium">Welcome back! Here's what's happening with your store today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard
            icon={Package}
            title="Total Products"
            value={stats.totalProducts}
            color="from-primary-500 to-primary-600"
            trend="12%"
            trendUp={true}
          />
          <StatCard
            icon={ShoppingCart}
            title="Total Orders"
            value={stats.totalOrders}
            color="from-accent-400 to-accent-500"
            trend="8%"
            trendUp={true}
          />
          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            color="from-accent-500 to-accent-600"
            trend="15%"
            trendUp={true}
          />
          <StatCard
            icon={Eye}
            title="Pending Orders"
            value={stats.pendingOrders}
            color="from-primary-600 to-accent-600"
            trend="3%"
            trendUp={false}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Link
            to="/admin/products/add"
            className="group bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <Package size={32} className="md:w-10 md:h-10 mb-3 md:mb-4 relative z-10" />
            <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 relative z-10">Add New Product</h3>
            <p className="text-sm md:text-base text-accent-50 relative z-10">Create a new product listing</p>
          </Link>

          <Link
            to="/admin/products"
            className="group bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <Package size={32} className="md:w-10 md:h-10 mb-3 md:mb-4 relative z-10" />
            <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 relative z-10">Manage Products</h3>
            <p className="text-sm md:text-base text-primary-50 relative z-10">View and edit all products</p>
          </Link>

          <Link
            to="/admin/orders"
            className="group bg-gradient-to-br from-accent-400 to-accent-500 text-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 relative overflow-hidden sm:col-span-2 md:col-span-1"
          >
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <ShoppingCart size={32} className="md:w-10 md:h-10 mb-3 md:mb-4 relative z-10" />
            <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 relative z-10">Manage Orders</h3>
            <p className="text-sm md:text-base text-accent-50 relative z-10">View and process orders</p>
          </Link>
        </div>

        {/* Recent Products & Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Products */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">Recent Products</h2>
              <Link to="/admin/products" className="text-accent-600 dark:text-accent-400 hover:text-accent-700 text-xs md:text-sm font-semibold flex items-center gap-1">
                View All <ArrowUp size={14} className="md:w-4 md:h-4 rotate-45" />
              </Link>
            </div>
            <div className="space-y-2 md:space-y-3">
              {recentProducts.map((product) => (
                <div key={product._id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">₹{product.price.toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                    product.inStock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                  }`}>
                    {product.inStock > 0 ? `Stock: ${product.inStock}` : 'Out'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
              <Link to="/admin/orders" className="text-accent-600 dark:text-accent-400 hover:text-accent-700 text-xs md:text-sm font-semibold flex items-center gap-1">
                View All →
              </Link>
            </div>
            <div className="space-y-2 md:space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-2 md:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate">Order #{order._id.slice(-6)}</p>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-sm md:text-base text-gray-900 dark:text-white">₹{order.totalPrice.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full inline-block ${
                        order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                        order.orderStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm md:text-base">No orders yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Admin Activity Section (Super Admin Only) */}
        {currentUser.isSuperAdmin && activityStats && (
          <>
            {/* Activity Stats Cards */}
            <div className="mt-6 md:mt-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">Admin Activity Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Total Activities */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl md:rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 mb-1">Total Activities</p>
                      <h3 className="text-3xl md:text-4xl font-bold">{activityStats.totalActivities || 0}</h3>
                    </div>
                    <Activity className="w-12 h-12 opacity-50" />
                  </div>
                </div>

                {/* Active Admins */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl md:rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 mb-1">Active Admins</p>
                      <h3 className="text-3xl md:text-4xl font-bold">{activeAdmins.length}</h3>
                      <p className="text-xs opacity-75 mt-1">Currently online</p>
                    </div>
                    <UserCheck className="w-12 h-12 opacity-50" />
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl md:rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 mb-1">Last 7 Days</p>
                      <h3 className="text-3xl md:text-4xl font-bold">{recentActivities.length}</h3>
                      <p className="text-xs opacity-75 mt-1">Actions performed</p>
                    </div>
                    <Clock className="w-12 h-12 opacity-50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Admins & Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
              {/* Active Admins List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Active Admins
                  </h2>
                  <Link to="/admin/admin-activities" className="text-accent-600 dark:text-accent-400 hover:text-accent-700 text-xs md:text-sm font-semibold">
                    View All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {activeAdmins.length > 0 ? (
                    activeAdmins.map((admin) => (
                      <div key={admin._id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                          {admin.adminName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{admin.adminName}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{admin.adminEmail}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(admin.lastActivityTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No active admins</p>
                  )}
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                  <Link to="/admin/admin-activities" className="text-accent-600 dark:text-accent-400 hover:text-accent-700 text-xs md:text-sm font-semibold">
                    View All →
                  </Link>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentActivities.slice(0, 10).map((activity) => {
                    const activityIcons = {
                      login: '🔐',
                      logout: '👋',
                      create: '➕',
                      update: '✏️',
                      delete: '🗑️',
                      view: '👁️'
                    };

                    const activityColors = {
                      login: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                      logout: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700',
                      create: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                      update: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                      delete: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                      view: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                    };

                    return (
                      <div key={activity._id} className={`p-3 rounded-lg border ${activityColors[activity.activityType] || 'bg-gray-50 dark:bg-gray-900/20'}`}>
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">{activityIcons[activity.activityType]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.adminName || activity.admin?.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.action}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {activity.module && (
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                  {activity.module}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(activity.timestamp).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {recentActivities.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
};

export default Dashboard;

