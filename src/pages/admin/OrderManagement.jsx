import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Package, Truck, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { orderService } from '../../services';

const OrderManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierCompany, setCourierCompany] = useState('');

  // Determine initial tab based on route
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/orders/new')) return 'new';
    if (path.includes('/orders/history')) return 'history';
    if (path.includes('/orders')) return 'all';
    return 'new';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  const statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  // Calculate tab counts
  const newOrdersCount = orders.filter(o => ['Pending', 'Processing'].includes(o.orderStatus)).length;
  const historyCount = orders.filter(o => ['Delivered', 'Cancelled'].includes(o.orderStatus)).length;
  const allOrdersCount = orders.length;

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update active tab when route changes
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/orders/new')) {
      setActiveTab('new');
    } else if (path.includes('/orders/history')) {
      setActiveTab('history');
    } else if (path.includes('/orders')) {
      setActiveTab('all');
    }
  }, [location.pathname]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      console.log('📋 Fetching admin orders...');
      const response = await orderService.getAllOrders();

      console.log('📋 Admin Orders Response:', response);

      // Response interceptor already returns response.data, so response = {success, count, data}
      const ordersData = response?.data || [];
      const isSuccess = response?.success !== false;

      console.log('📋 Orders Data:', ordersData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(ordersData)) {
        // Transform data to include calculated fields
        const transformedOrders = ordersData.map(order => ({
          ...order,
          customerName: order.user?.name || 'Unknown',
          customerEmail: order.user?.email || 'N/A',
          customerPhone: order.user?.phone || 'N/A',
          items: order.orderItems?.length || 0,
          orderNumber: order.orderNumber || `ORD-${order._id?.slice(-6).toUpperCase()}`
        }));

        setOrders(transformedOrders);
        console.log(`✅ Loaded ${transformedOrders.length} orders`);
      } else {
        console.warn('⚠️ No orders found or invalid format');
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to fetch orders';

      console.error('Order fetch error:', errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      console.log(`🔄 Updating order ${orderId} status to ${newStatus}`);
      const response = await orderService.updateOrderStatus(orderId, newStatus);

      console.log('Status Update Response:', response);

      // Response is already unwrapped by interceptor, so response = { success, message, data }
      const isSuccess = response?.success !== false;

      if (isSuccess) {
        // Update local state
        setOrders(orders.map(order =>
          order._id === orderId ? { ...order, orderStatus: newStatus } : order
        ));
        alert('Order status updated successfully!');
        console.log('✅ Order status updated');
      } else {
        const errorMsg = response?.message || 'Failed to update order status';
        alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Failed to update order status:', error);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to update order status';
      alert(errorMessage);
    }
  };

  const handleUpdateTracking = async () => {
    if (!trackingNumber || !courierCompany) {
      alert('Please fill both tracking number and courier company');
      return;
    }

    try {
      console.log(`📦 Updating tracking for order ${selectedOrder._id}`);
      const response = await orderService.updateOrderTracking(selectedOrder._id, {
        trackingNumber,
        courierCompany
      });

      console.log('Tracking Update Response:', response);

      // Response is already unwrapped by interceptor
      const isSuccess = response?.success !== false;

      if (isSuccess) {
        // Update local state
        setOrders(orders.map(order =>
          order._id === selectedOrder._id
            ? { ...order, trackingNumber, courierCompany }
            : order
        ));
        setSelectedOrder({ ...selectedOrder, trackingNumber, courierCompany });
        alert('Tracking information updated successfully!');
        console.log('✅ Tracking info updated');
      } else {
        const errorMsg = response?.message || 'Failed to update tracking information';
        alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Failed to update tracking info:', error);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to update tracking information';
      alert(errorMessage);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock size={16} />;
      case 'Processing': return <Package size={16} />;
      case 'Shipped': return <Truck size={16} />;
      case 'Delivered': return <CheckCircle size={16} />;
      case 'Cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Shipped': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Filter by tab first
  const tabFilteredOrders = orders.filter(order => {
    if (activeTab === 'new') {
      return ['Pending', 'Processing'].includes(order.orderStatus);
    } else if (activeTab === 'history') {
      return ['Delivered', 'Cancelled'].includes(order.orderStatus);
    }
    return true; // 'all' tab shows everything
  });

  // Then apply status and search filters
  const filteredOrders = tabFilteredOrders.filter(order =>
    (statusFilter === 'All' || order.orderStatus === statusFilter) &&
    (order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            Order <span className="text-amber-600">Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Track and manage customer orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Pending</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {orders.filter(o => o.orderStatus === 'Pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Processing</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {orders.filter(o => o.orderStatus === 'Processing').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Truck size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Shipped</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {orders.filter(o => o.orderStatus === 'Shipped').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Delivered</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {orders.filter(o => o.orderStatus === 'Delivered').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex border-b-2 border-gray-200 dark:border-gray-800">
              {/* New Orders Tab */}
              <button
                onClick={() => navigate('/admin/orders/new')}
                className={`flex-1 px-6 py-4 font-bold text-sm sm:text-base transition-all relative ${
                  activeTab === 'new'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock size={18} />
                  <span>New Orders</span>
                  {newOrdersCount > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-black ${
                      activeTab === 'new'
                        ? 'bg-white text-amber-600'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {newOrdersCount}
                    </span>
                  )}
                </div>
              </button>

              {/* Order History Tab */}
              <button
                onClick={() => navigate('/admin/orders/history')}
                className={`flex-1 px-6 py-4 font-bold text-sm sm:text-base transition-all relative ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={18} />
                  <span>Order History</span>
                  {historyCount > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-black ${
                      activeTab === 'history'
                        ? 'bg-white text-amber-600'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {historyCount}
                    </span>
                  )}
                </div>
              </button>

              {/* All Orders Tab */}
              <button
                onClick={() => navigate('/admin/orders')}
                className={`flex-1 px-6 py-4 font-bold text-sm sm:text-base transition-all relative ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Package size={18} />
                  <span>All Orders</span>
                  {allOrdersCount > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-black ${
                      activeTab === 'all'
                        ? 'bg-white text-amber-600'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {allOrdersCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-gray-50 dark:bg-gray-800 dark:text-white"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{order.customerName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{order.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      {order.items}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">
                      ₹{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg ${getStatusColor(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setTrackingNumber(order.trackingNumber || '');
                          setCourierCompany(order.courierCompany || '');
                          setShowDetailsModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg font-semibold transition-colors"
                      >
                        <Eye size={18} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No orders found</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 font-medium">
          <p>Showing {filteredOrders.length} of {orders.length} orders</p>
        </div>

        {/* Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200 dark:border-gray-800">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    Order Details
                  </h2>
                  <p className="text-amber-600 font-bold mt-1">{selectedOrder.orderNumber}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Customer & Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Package size={18} className="text-amber-600" />
                      Customer Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Name:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-white">{selectedOrder.customerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-white">{selectedOrder.customerPhone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-white">{selectedOrder.customerEmail}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Order Date:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                          {new Date(selectedOrder.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Status & Payment */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Truck size={18} className="text-amber-600" />
                      Order Status & Payment
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">Current Status:</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg ${getStatusColor(selectedOrder.orderStatus)}`}>
                          {getStatusIcon(selectedOrder.orderStatus)}
                          {selectedOrder.orderStatus}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 block mb-2">Update Status:</span>
                        <select
                          value={selectedOrder.orderStatus}
                          onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                        >
                          {statuses.filter(s => s !== 'All').map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                          {selectedOrder.paymentMethod || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                        <span className={`ml-2 font-semibold ${selectedOrder.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedOrder.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Truck size={18} className="text-amber-600" />
                    Shipping Address
                  </h3>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress || 'N/A'}
                  </p>
                  {selectedOrder.shippingAddress?.city && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </p>
                  )}
                  {selectedOrder.shippingAddress?.country && (
                    <p className="text-gray-600 dark:text-gray-400">{selectedOrder.shippingAddress.country}</p>
                  )}
                </div>

                {/* Courier Copy Section */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border-2 border-green-300 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Package size={18} className="text-green-600" />
                      Courier Details (Copy & Paste)
                    </h3>
                    <button
                      onClick={() => {
                        const courierText = `Order: ${selectedOrder.orderNumber}\nName: ${selectedOrder.customerName}\nPhone: ${selectedOrder.customerPhone}\nAddress: ${selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress || 'N/A'}\n${selectedOrder.shippingAddress?.city ? `${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.state} ${selectedOrder.shippingAddress.zipCode}` : ''}\n${selectedOrder.shippingAddress?.country || ''}`;
                        navigator.clipboard.writeText(courierText);
                        alert('Courier details copied to clipboard!');
                      }}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy All
                    </button>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-green-200 dark:border-gray-700 font-mono text-sm">
                    <p className="text-gray-900 dark:text-white"><span className="font-bold text-green-600">Order:</span> {selectedOrder.orderNumber}</p>
                    <p className="text-gray-900 dark:text-white mt-1"><span className="font-bold text-green-600">Name:</span> {selectedOrder.customerName}</p>
                    <p className="text-gray-900 dark:text-white mt-1"><span className="font-bold text-green-600">Phone:</span> {selectedOrder.customerPhone}</p>
                    <p className="text-gray-900 dark:text-white mt-2"><span className="font-bold text-green-600">Address:</span></p>
                    <p className="text-gray-900 dark:text-white pl-4">{selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress || 'N/A'}</p>
                    {selectedOrder.shippingAddress?.city && (
                      <p className="text-gray-900 dark:text-white pl-4">
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                      </p>
                    )}
                    {selectedOrder.shippingAddress?.country && (
                      <p className="text-gray-900 dark:text-white pl-4">{selectedOrder.shippingAddress.country}</p>
                    )}
                  </div>
                </div>

                {/* Tracking Information */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border-2 border-blue-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Truck size={18} className="text-blue-600" />
                    Shipping & Tracking Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Courier Company
                      </label>
                      <input
                        type="text"
                        value={courierCompany}
                        onChange={(e) => setCourierCompany(e.target.value)}
                        placeholder="e.g., FedEx, DHL, Blue Dart"
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleUpdateTracking}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <Truck size={18} />
                      Update Tracking Information
                    </button>
                    {(selectedOrder.trackingNumber || selectedOrder.courierCompany) && (
                      <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Information:</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-semibold">Tracking:</span> {selectedOrder.trackingNumber || 'Not set'}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-semibold">Courier:</span> {selectedOrder.courierCompany || 'Not set'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Package size={18} className="text-amber-600" />
                    Order Items ({selectedOrder.orderItems?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.orderItems?.map((item, index) => (
                      <div key={index} className="flex gap-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Quantity: <span className="font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                            </span>
                            <span className="font-bold text-amber-600">₹{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border-2 border-amber-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Items Price:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₹{(selectedOrder.itemsPrice || selectedOrder.totalPrice).toLocaleString()}
                      </span>
                    </div>
                    {selectedOrder.taxPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ₹{selectedOrder.taxPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900 dark:text-white text-lg">Total Amount:</span>
                        <span className="font-black text-amber-600 text-xl">
                          ₹{selectedOrder.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default OrderManagement;
