import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Edit, Trash2, Eye, UserPlus, Mail, Phone, MapPin, ShoppingBag, Users, X, Coins } from 'lucide-react';
import { customerService } from '../../services';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const CustomerManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive, blocked
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCoinsModal, setShowCoinsModal] = useState(false);
  const [editingCoins, setEditingCoins] = useState(0);
  const [updatingCoins, setUpdatingCoins] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Auto-open coins modal if userId in URL
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && customers.length > 0) {
      const customer = customers.find(c => c._id === userId);
      if (customer) {
        // Auto-open coins modal for this customer
        setSelectedCustomer(customer);
        setEditingCoins(customer.auctionCoins || 0);
        setShowCoinsModal(true);
        // Clear the URL parameter
        setSearchParams({});
      }
    }
  }, [customers, searchParams, setSearchParams]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      console.log('👥 Fetching customers...');
      const response = await customerService.getAllCustomers();

      console.log('👥 Customers Response:', response);

      // Response interceptor already returns response.data
      const customersData = response?.data || [];
      const isSuccess = response?.success !== false;

      console.log('👥 Customers Data:', customersData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(customersData)) {
        setCustomers(customersData);
        console.log(`✅ Loaded ${customersData.length} customers`);
      } else {
        console.warn('⚠️ No customers found or invalid format');
        setCustomers([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch customers:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Network error. Please check your connection.';

      // Don't show alert every time, just log
      console.error('Customer fetch error:', errorMessage);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await customerService.deleteCustomer(customerId);

        // Response interceptor already returns response.data
        const isSuccess = response?.success !== false;

        if (isSuccess) {
          setCustomers(customers.filter(c => c._id !== customerId));
          alert('Customer deleted successfully!');
        } else {
          const errorMsg = response?.message || 'Failed to delete customer';
          alert(errorMsg);
        }
      } catch (error) {
        console.error('Failed to delete customer:', error);
        const errorMessage = error.response?.data?.message
          || error.response?.data?.error
          || error.message
          || 'Failed to delete customer';
        alert(errorMessage);
      }
    }
  };

  const handleStatusChange = async (customerId, newStatus) => {
    try {
      const response = await customerService.updateCustomerStatus(customerId, newStatus);

      // Response interceptor already returns response.data
      const isSuccess = response?.success !== false;

      if (isSuccess) {
        setCustomers(customers.map(c =>
          c._id === customerId ? { ...c, status: newStatus } : c
        ));
        setSelectedCustomer(prev => prev ? { ...prev, status: newStatus } : null);
        alert('Customer status updated successfully!');
      } else {
        const errorMsg = response?.message || 'Failed to update status';
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Failed to update customer status:', error);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to update status';
      alert(errorMessage);
    }
  };

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const openCoinsModal = (customer) => {
    setSelectedCustomer(customer);
    setEditingCoins(customer.auctionCoins || 0);
    setShowCoinsModal(true);
  };

  const handleUpdateCoins = async () => {
    if (editingCoins < 0 || isNaN(editingCoins)) {
      toast.error('Please enter a valid number (0 or greater)');
      return;
    }

    try {
      setUpdatingCoins(true);
      const response = await api.put(`/users/${selectedCustomer._id}/auction-coins`, {
        auctionCoins: editingCoins
      });

      toast.success('Auction coins updated successfully!');
      setShowCoinsModal(false);
      fetchCustomers(); // Refresh customer list
    } catch (error) {
      console.error('Error updating coins:', error);
      toast.error(error.response?.data?.message || 'Failed to update coins');
    } finally {
      setUpdatingCoins(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' },
      blocked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Blocked' }
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
              Customer <span className="text-accent-600">Management</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Manage your customers and their information</p>
          </div>
          <button className="group bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex items-center gap-3 font-bold">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <UserPlus size={24} className="relative z-10" />
            <span className="relative z-10">Add Customer</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
                  <Users size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Total Customers</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{customers.length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-400 to-accent-500 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 shadow-lg">
                  <UserPlus size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Active Customers</p>
                <h3 className="text-3xl font-black text-accent-600 dark:text-accent-400">
                  {customers.filter(c => c.status === 'active').length}
                </h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-500 to-accent-600 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg">
                  <ShoppingBag size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Total Orders</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                  {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
                </h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-600 to-accent-600 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-lg">
                  <ShoppingBag size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Total Revenue</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                  ₹{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-800 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 placeholder-gray-500 font-medium"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border-b-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Auction Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {customer.avatar ? (
                            <img
                              src={customer.avatar}
                              alt={customer.name}
                              className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700">
                              <span className="text-white font-bold text-lg">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{customer.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Joined: {new Date(customer.registeredDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          <Mail size={14} className="text-accent-500" />
                          {customer.email}
                        </div>
                        {customer.phone ? (
                          <a
                            href={`tel:${customer.phone}`}
                            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors hover:underline"
                          >
                            <Phone size={14} className="text-primary-500" />
                            {customer.phone}
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            <Phone size={14} className="text-gray-400" />
                            Not provided
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.isAuctionVerified ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                              ✓ Verified
                            </span>
                          </div>
                          <div className="text-sm font-bold text-accent-600">
                            {customer.auctionId || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-semibold">
                            <Coins className="w-3 h-3" />
                            Coins: <span className="text-accent-600 font-bold">{customer.auctionCoins || 0}</span>
                            <button
                              onClick={() => openCoinsModal(customer)}
                              className="p-1 hover:bg-accent-100 rounded text-accent-600"
                              title="Edit Coins"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Not registered
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{customer.totalOrders}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last: {new Date(customer.lastOrderDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        ₹{customer.totalSpent.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewCustomerDetails(customer)}
                          className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:shadow-lg rounded-xl transition-all transform hover:-translate-y-0.5"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="p-2.5 bg-gradient-to-br from-accent-400 to-accent-500 text-white hover:shadow-lg rounded-xl transition-all transform hover:-translate-y-0.5"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id)}
                          className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-lg rounded-xl transition-all transform hover:-translate-y-0.5"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl mb-4">
                <UserPlus size={64} className="text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xl font-bold mb-2">No customers found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Customer Details Modal */}
        {showModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp border-2 border-gray-100 dark:border-gray-800">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white">Customer <span className="text-accent-600">Details</span></h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all transform hover:rotate-90"
                  >
                    <X size={24} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl">
                    <div className="relative">
                      {selectedCustomer.avatar ? (
                        <img
                          src={selectedCustomer.avatar}
                          alt={selectedCustomer.name}
                          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-700 shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center ring-4 ring-white dark:ring-gray-700 shadow-lg">
                          <span className="text-white font-bold text-4xl">
                            {selectedCustomer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-900"></div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{selectedCustomer.name}</h3>
                      {getStatusBadge(selectedCustomer.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <Mail size={14} className="text-accent-500" />
                        Email
                      </p>
                      <p className="text-gray-900 dark:text-white font-semibold">{selectedCustomer.email}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <Phone size={14} className="text-primary-500" />
                        Phone
                      </p>
                      {selectedCustomer.phone ? (
                        <a
                          href={`tel:${selectedCustomer.phone}`}
                          className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors hover:underline"
                        >
                          {selectedCustomer.phone}
                        </a>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 font-semibold">Not provided</p>
                      )}
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Total Orders</p>
                      <p className="text-gray-900 dark:text-white font-bold text-2xl">{selectedCustomer.totalOrders}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Total Spent</p>
                      <p className="text-accent-600 dark:text-accent-400 font-bold text-2xl">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Registered Date</p>
                      <p className="text-gray-900 dark:text-white font-semibold">
                        {new Date(selectedCustomer.registeredDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Last Order</p>
                      <p className="text-gray-900 dark:text-white font-semibold">
                        {new Date(selectedCustomer.lastOrderDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <MapPin size={14} className="text-primary-500" />
                      Address
                    </p>
                    <p className="text-gray-900 dark:text-white font-medium leading-relaxed">
                      {selectedCustomer.address ? (
                        typeof selectedCustomer.address === 'string'
                          ? selectedCustomer.address
                          : `${selectedCustomer.address.street || ''}, ${selectedCustomer.address.city || ''}, ${selectedCustomer.address.state || ''} ${selectedCustomer.address.zipCode || ''}, ${selectedCustomer.address.country || ''}`
                      ) : 'No address provided'}
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4 border-t-2 border-gray-200 dark:border-gray-800">
                    <select
                      value={selectedCustomer.status}
                      onChange={(e) => handleStatusChange(selectedCustomer._id, e.target.value)}
                      className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-bold"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <button className="px-8 py-4 bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-xl hover:shadow-xl transition-all font-bold transform hover:-translate-y-0.5">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Coins Modal */}
        {showCoinsModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-accent-600 to-accent-700 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Coins className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Edit Auction Coins</h2>
                </div>
                <button
                  onClick={() => setShowCoinsModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Customer: {selectedCustomer.name}
                  </label>
                  <p className="text-xs text-gray-600">{selectedCustomer.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Auction Coins
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingCoins}
                    onChange={(e) => setEditingCoins(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-accent-600 focus:outline-none text-lg font-semibold"
                    placeholder="Enter coins amount"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Current: <span className="font-bold text-accent-600">{selectedCustomer.auctionCoins || 0}</span> coins
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCoinsModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                    disabled={updatingCoins}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCoins}
                    disabled={updatingCoins}
                    className="flex-1 bg-accent-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-accent-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {updatingCoins ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Coins className="w-5 h-5" />
                        Update Coins
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default CustomerManagement;
