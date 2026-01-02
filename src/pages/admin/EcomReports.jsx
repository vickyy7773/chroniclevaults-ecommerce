import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Users, ShoppingCart, Download } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const EcomReports = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'orders', 'products', 'customers'

  // Set default dates to last 30 days
  const getDefaultDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const [filters, setFilters] = useState({
    ...getDefaultDates(),
    status: '',
    category: '',
    search: ''
  });

  // Report data states
  const [salesData, setSalesData] = useState(null);
  const [ordersData, setOrdersData] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [customersData, setCustomersData] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchReportData();
    }
  }, [activeTab, filters]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchReportData = async () => {
    console.log('🔍 fetchReportData called', { activeTab, filters });
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        console.log('📊 Fetching sales report...');
        await fetchSalesReport();
      } else if (activeTab === 'orders') {
        console.log('📦 Fetching orders report...');
        await fetchOrdersReport();
      } else if (activeTab === 'products') {
        console.log('🏷️ Fetching products report...');
        await fetchProductsReport();
      } else if (activeTab === 'customers') {
        console.log('👥 Fetching customers report...');
        await fetchCustomersReport();
      }
      console.log('✅ Report data fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching report:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReport = async () => {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);

    const response = await api.get(`/orders/reports/sales?${params.toString()}`);
    setSalesData(response.data.data);
  };

  const fetchOrdersReport = async () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/orders/reports/orders?${params.toString()}`);
    setOrdersData(response.data.data);
  };

  const fetchProductsReport = async () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.category) params.append('category', filters.category);

    const response = await api.get(`/orders/reports/products?${params.toString()}`);
    setProductsData(response.data.data);
  };

  const fetchCustomersReport = async () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/orders/reports/customers?${params.toString()}`);
    setCustomersData(response.data.data);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ ...getDefaultDates(), status: '', category: '', search: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount == null || amount === undefined) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Excel Export Functions
  const exportSalesToExcel = () => {
    if (!salesData || !salesData.dailyData || salesData.dailyData.length === 0) {
      toast.warning('No sales data to export');
      return;
    }

    const excelData = salesData.dailyData.map(day => ({
      'Date': day.date,
      'Total Orders': day.totalOrders,
      'Completed Orders': day.completedOrders,
      'Cancelled Orders': day.cancelledOrders,
      'Gross Sales (₹)': day.grossSales,
      'Total Discount (₹)': day.totalDiscount,
      'Total Tax (₹)': day.totalTax,
      'Shipping (₹)': day.totalShipping,
      'Net Sales (₹)': day.netSales
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    XLSX.writeFile(wb, `Sales_Report_${filters.startDate}_to_${filters.endDate}.xlsx`);
    toast.success('Excel file downloaded');
  };

  const exportOrdersToExcel = () => {
    if (!ordersData || !ordersData.orders || ordersData.orders.length === 0) {
      toast.warning('No orders data to export');
      return;
    }

    const excelData = ordersData.orders.map(order => ({
      'Order ID': order.orderId,
      'Order Date': formatDate(order.orderDate),
      'Customer Name': order.customerName,
      'Customer Email': order.customerEmail,
      'Customer Phone': order.customerPhone,
      'Order Amount (₹)': order.orderAmount,
      'Payment Method': order.paymentMethod,
      'Payment Status': order.paymentStatus,
      'Order Status': order.orderStatus,
      'Items Count': order.itemsCount
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders Report');
    XLSX.writeFile(wb, `Orders_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file downloaded');
  };

  const exportProductsToExcel = () => {
    if (!productsData || productsData.length === 0) {
      toast.warning('No products data to export');
      return;
    }

    const excelData = productsData.map(product => ({
      'Product Name': product.productName,
      'Category': product.category,
      'Selling Price (₹)': product.sellingPrice,
      'Units Sold': product.unitsSold,
      'Total Revenue (₹)': product.totalRevenue,
      'Current Stock': product.currentStock,
      'Stock Status': product.stockStatus
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products Report');
    XLSX.writeFile(wb, `Products_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file downloaded');
  };

  const exportCustomersToExcel = () => {
    if (!customersData || customersData.length === 0) {
      toast.warning('No customers data to export');
      return;
    }

    const excelData = customersData.map(customer => ({
      'Customer Name': customer.customerName,
      'Email': customer.email,
      'Phone': customer.phone,
      'Total Orders': customer.totalOrders,
      'Total Spent (₹)': customer.totalSpent,
      'Last Order Date': formatDate(customer.lastOrderDate),
      'Customer Type': customer.customerType
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers Report');
    XLSX.writeFile(wb, `Customers_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file downloaded');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-accent-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            E-Commerce Reports
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive sales, orders, products, and customer analytics
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date *
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {activeTab === 'orders' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Customer
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Name, email, phone..."
                  className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'sales'
                  ? 'bg-accent-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Sales Report
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Orders Report
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Package className="w-4 h-4" />
              Products Report
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'customers'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Customers Report
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
        </div>
      ) : (
        <>
          {/* Sales Report Tab */}
          {activeTab === 'sales' && salesData && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-10 h-10 opacity-80" />
                  </div>
                  <h3 className="text-sm font-medium opacity-90 mb-1">Net Sales</h3>
                  <p className="text-3xl font-bold">
                    {formatCurrency(salesData.summary?.netSales || 0)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <ShoppingCart className="w-10 h-10 opacity-80" />
                  </div>
                  <h3 className="text-sm font-medium opacity-90 mb-1">Total Orders</h3>
                  <p className="text-3xl font-bold">
                    {salesData.summary?.totalOrders || 0}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-10 h-10 opacity-80" />
                  </div>
                  <h3 className="text-sm font-medium opacity-90 mb-1">Gross Sales</h3>
                  <p className="text-3xl font-bold">
                    {formatCurrency(salesData.summary?.grossSales || 0)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Package className="w-10 h-10 opacity-80" />
                  </div>
                  <h3 className="text-sm font-medium opacity-90 mb-1">Total Tax</h3>
                  <p className="text-3xl font-bold">
                    {formatCurrency(salesData.summary?.totalTax || 0)}
                  </p>
                </div>
              </div>

              {/* Export Button */}
              <div className="mb-4 flex justify-end">
                <button
                  onClick={exportSalesToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Excel
                </button>
              </div>

              {/* Sales Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Orders</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Completed</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Gross Sales</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Discount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tax</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Net Sales</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {salesData.dailyData && salesData.dailyData.map((day, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{day.date}</td>
                          <td className="px-4 py-4 text-sm text-center text-gray-600 dark:text-gray-400">{day.totalOrders}</td>
                          <td className="px-4 py-4 text-sm text-center text-gray-600 dark:text-gray-400">{day.completedOrders}</td>
                          <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(day.grossSales)}</td>
                          <td className="px-4 py-4 text-sm text-right text-red-600 dark:text-red-400">{formatCurrency(day.totalDiscount)}</td>
                          <td className="px-4 py-4 text-sm text-right text-gray-600 dark:text-gray-400">{formatCurrency(day.totalTax)}</td>
                          <td className="px-4 py-4 text-sm text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(day.netSales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders Report Tab */}
          {activeTab === 'orders' && ordersData && (
            <div>
              {/* Export Button */}
              <div className="mb-4 flex justify-end">
                <button
                  onClick={exportOrdersToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Excel
                </button>
              </div>

              {/* Orders Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Order ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Payment</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {ordersData.orders && ordersData.orders.map((order, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{order.orderId}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(order.orderDate)}</td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{order.customerName}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{order.customerPhone || order.customerEmail}</td>
                          <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(order.orderAmount)}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.paymentStatus === 'Paid'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.orderStatus === 'Delivered'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : order.orderStatus === 'Cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {ordersData.pagination && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing page {ordersData.pagination.currentPage} of {ordersData.pagination.totalPages} ({ordersData.pagination.totalOrders} total orders)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Report Tab */}
          {activeTab === 'products' && productsData && (
            <div>
              {/* Export Button */}
              <div className="mb-4 flex justify-end">
                <button
                  onClick={exportProductsToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Excel
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Units Sold</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {productsData.map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{product.productName}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{product.category}</td>
                          <td className="px-4 py-4 text-sm text-right text-gray-600 dark:text-gray-400">{formatCurrency(product.sellingPrice)}</td>
                          <td className="px-4 py-4 text-sm text-center font-semibold text-gray-900 dark:text-white">{product.unitsSold}</td>
                          <td className="px-4 py-4 text-sm text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(product.totalRevenue)}</td>
                          <td className="px-4 py-4 text-sm text-center text-gray-600 dark:text-gray-400">{product.currentStock}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.stockStatus === 'In Stock'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : product.stockStatus === 'Low Stock'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {product.stockStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Customers Report Tab */}
          {activeTab === 'customers' && customersData && (
            <div>
              {/* Export Button */}
              <div className="mb-4 flex justify-end">
                <button
                  onClick={exportCustomersToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Excel
                </button>
              </div>

              {/* Customers Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Orders</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Spent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Last Order</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {customersData.map((customer, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{customer.customerName}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{customer.phone || customer.email}</td>
                          <td className="px-4 py-4 text-sm text-center font-semibold text-gray-900 dark:text-white">{customer.totalOrders}</td>
                          <td className="px-4 py-4 text-sm text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(customer.totalSpent)}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(customer.lastOrderDate)}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              customer.customerType === 'Returning'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {customer.customerType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* No data message */}
          {(!filters.startDate || !filters.endDate) && (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
              Please select start and end dates to view reports
            </div>
          )}

          {/* Empty state when data is null but dates are set */}
          {filters.startDate && filters.endDate && !loading && (
            <>
              {activeTab === 'sales' && !salesData && (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No sales data available</p>
                  <p className="text-sm">Try adjusting the date range</p>
                </div>
              )}
              {activeTab === 'orders' && !ordersData && (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No orders data available</p>
                  <p className="text-sm">Try adjusting the filters</p>
                </div>
              )}
              {activeTab === 'products' && !productsData && (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No products data available</p>
                  <p className="text-sm">Try adjusting the filters</p>
                </div>
              )}
              {activeTab === 'customers' && !customersData && (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No customers data available</p>
                  <p className="text-sm">Try adjusting the date range</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default EcomReports;
