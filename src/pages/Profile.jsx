import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Package, Heart, ShoppingBag, Settings, LogOut, Camera, Lock, Truck, CheckCircle, Clock, ArrowLeft, Award, TrendingUp, CreditCard } from 'lucide-react';
import { orderService, authService } from '../services';

const Profile = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddressForm, setNewAddressForm] = useState({
    type: 'Home',
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [profileData, setProfileData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: user?.phone || '+91 9876543210',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    dateOfBirth: user?.dateOfBirth || '1990-01-15',
    gender: user?.gender || 'Male',
    bio: user?.bio || 'Passionate coin collector and numismatist',
    joinedDate: user?.joinedDate || 'January 2024'
  });

  const [addresses, setAddresses] = useState([]);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showInvoiceNotification, setShowInvoiceNotification] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch user's orders and addresses on mount
  useEffect(() => {
    fetchMyOrders();
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      console.log('📍 Profile: Fetching addresses...');
      const response = await authService.getAddresses();
      console.log('📍 Profile: Address Response:', response);

      if (response.data && response.data.success && response.data.data) {
        console.log('📍 Profile: Setting addresses:', response.data.data);
        setAddresses(response.data.data || []);
      } else {
        console.log('📍 Profile: No addresses found');
        setAddresses([]);
      }
    } catch (error) {
      console.error('❌ Profile: Failed to fetch addresses:', error);
      setAddresses([]);
    }
  };

  const fetchMyOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await orderService.getMyOrders();

      console.log('📦 Orders API Response:', response);

      // Handle different response formats
      const ordersData = response?.data?.data || response?.data || [];
      const isSuccess = response?.data?.success !== false && response?.success !== false;

      console.log('📦 Orders Data:', ordersData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && ordersData && ordersData.length > 0) {
        // Transform orders to match component format
        const transformedOrders = ordersData.map(order => ({
          id: order.orderNumber,
          _id: order._id,
          date: order.createdAt,
          items: order.orderItems.length,
          total: order.totalPrice,
          status: order.orderStatus,
          statusColor: order.orderStatus === 'Delivered' ? 'green' : 'blue',
          trackingNumber: order.trackingNumber || 'TBA',
          courierCompany: order.courierCompany || 'Not assigned',
          paymentMethod: order.paymentMethod,
          deliveryAddress: {
            name: user?.name || 'N/A',
            address: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            pincode: order.shippingAddress.zipCode,
            phone: user?.phone || 'N/A'
          },
          orderItems: order.orderItems.map(item => ({
            id: item._id,
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity
          })),
          timeline: (() => {
            // Define all possible timeline steps (removed Order Confirmed)
            const allSteps = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered'];

            // Get completed steps from statusHistory
            const completedSteps = order.statusHistory && order.statusHistory.length > 0
              ? order.statusHistory
                  .filter(entry => entry.status !== 'Order Confirmed') // Filter out Order Confirmed
                  .map(entry => ({
                    status: entry.status,
                    date: new Date(entry.timestamp).toLocaleString(),
                    completed: true
                  }))
              : [{ status: 'Order Placed', date: new Date(order.createdAt).toLocaleString(), completed: true }];

            // Get list of completed step names
            const completedStepNames = completedSteps.map(s => s.status);

            // Add pending steps
            const pendingSteps = allSteps
              .filter(step => !completedStepNames.includes(step))
              .map(step => ({
                status: step,
                date: 'Pending',
                completed: false
              }));

            // Combine and return
            return [...completedSteps, ...pendingSteps];
          })()
        }));

        console.log('✅ Transformed Orders:', transformedOrders);
        setOrders(transformedOrders);
      } else {
        console.log('⚠️ No orders found or API failed');
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error);
      console.error('Error details:', error.response || error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };


  const [editedData, setEditedData] = useState(profileData);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(profileData);
  };

  const handleSave = async () => {
    try {
      const response = await authService.updateProfile(editedData);
      if (response.success) {
        setProfileData(editedData);
        setIsEditing(false);
        setShowEditModal(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile: ' + response.message);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile: ' + error.message);
    }
  };

  const handleCancel = () => {
    setEditedData(profileData);
    setIsEditing(false);
    setShowEditModal(false);
  };

  const handleChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleDownloadInvoice = (order) => {
    // Check if order is delivered
    if (order.status !== 'Delivered') {
      setShowInvoiceNotification(true);
      setTimeout(() => {
        setShowInvoiceNotification(false);
      }, 3000);
      return;
    }

    // Navigate to invoice page in new tab
    window.open(`/invoice/${order._id}`, '_blank');
    return;

    const invoiceWindow = window.open('', '_blank');
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 40px; background: #f5f5f5; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { border-bottom: 3px solid #d97706; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #d97706; font-size: 32px; margin-bottom: 5px; font-weight: 600; }
          .header p { color: #666; }
          .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .detail-box { padding: 15px; background: #EFE0C3; border-radius: 8px; }
          .detail-box h3 { color: #1f2937; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
          .detail-box p { color: #4b5563; margin: 5px 0; font-size: 14px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .items-table thead { background: #d97706; color: white; }
          .items-table th { padding: 12px; text-align: left; font-weight: 600; }
          .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .items-table tbody tr:hover { background: #EFE0C3; }
          .totals { margin-top: 30px; text-align: right; }
          .totals table { margin-left: auto; width: 300px; }
          .totals td { padding: 8px; }
          .totals .total-row { font-weight: bold; font-size: 18px; color: #d97706; border-top: 2px solid #d97706; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .status-delivered { background: #d1fae5; color: #065f46; }
          .status-transit { background: #dbeafe; color: #1e40af; }
          @media print {
            body { background: white; padding: 0; }
            .invoice-container { box-shadow: none; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>Chronicle Vaults</h1>
            <p>Vintage Coins & Collectibles</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 10px;">INVOICE</h2>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="color: #6b7280; margin: 5px 0;"><strong>Invoice #:</strong> ${order.id}</p>
                <p style="color: #6b7280; margin: 5px 0;"><strong>Date:</strong> ${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <span class="status-badge ${order.statusColor === 'green' ? 'status-delivered' : 'status-transit'}">
                ${order.status}
              </span>
            </div>
          </div>

          <div class="invoice-details">
            <div class="detail-box">
              <h3>Bill To:</h3>
              <p><strong>${order.deliveryAddress.name}</strong></p>
              <p>${order.deliveryAddress.address}</p>
              <p>${order.deliveryAddress.city}, ${order.deliveryAddress.state}</p>
              <p>${order.deliveryAddress.pincode}</p>
              <p>Phone: ${order.deliveryAddress.phone}</p>
            </div>
            <div class="detail-box">
              <h3>Payment & Shipping:</h3>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              <p><strong>Tracking #:</strong> ${order.trackingNumber}</p>
              <p><strong>Courier:</strong> ${order.courierCompany}</p>
              <p><strong>Status:</strong> ${order.status}</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price.toFixed(2)}</td>
                  <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td>₹${order.total.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Shipping:</td>
                <td>FREE</td>
              </tr>
              <tr class="total-row">
                <td>Total Amount:</td>
                <td>₹${order.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p style="margin-top: 10px;">Chronicle Vaults - Your trusted source for vintage coins and collectibles</p>
            <p style="margin-top: 5px;">Email: support@chroniclevaults.com | Phone: +91 1800-123-4567</p>
            <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 30px; background: #d97706; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
              Print Invoice
            </button>
          </div>
        </div>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      const response = await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        setPasswordSuccess(true);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(false);
        }, 2000);
      } else {
        setPasswordError(response.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      setPasswordError(error.message || 'Failed to update password');
    }
  };

  const handleAddressInputChange = (field, value) => {
    let sanitizedValue = value;
    const newErrors = { ...addressErrors };

    // Full Name - Only alphabetic characters and spaces
    if (field === 'name') {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, '');
      if (value !== sanitizedValue && value.length > 0) {
        newErrors.name = 'Only alphabetic characters and spaces allowed';
      } else if (sanitizedValue.trim().length === 0 && value.length > 0) {
        newErrors.name = 'Full name is required';
      } else {
        delete newErrors.name;
      }
    }

    // Phone - Only numbers, max 10 digits
    if (field === 'phone') {
      sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      if (value !== sanitizedValue && value.length > 0) {
        newErrors.phone = 'Only numbers allowed';
      } else if (sanitizedValue.length > 0 && sanitizedValue.length < 10) {
        newErrors.phone = `Enter ${10 - sanitizedValue.length} more digit${10 - sanitizedValue.length > 1 ? 's' : ''}`;
      } else {
        delete newErrors.phone;
      }
    }

    // City - Only alphabetic characters and spaces
    if (field === 'city') {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, '');
      if (value !== sanitizedValue && value.length > 0) {
        newErrors.city = 'Only alphabetic characters and spaces allowed';
      } else if (sanitizedValue.trim().length === 0 && value.length > 0) {
        newErrors.city = 'City is required';
      } else {
        delete newErrors.city;
      }
    }

    // State - Only alphabetic characters and spaces
    if (field === 'state') {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, '');
      if (value !== sanitizedValue && value.length > 0) {
        newErrors.state = 'Only alphabetic characters and spaces allowed';
      } else if (sanitizedValue.trim().length === 0 && value.length > 0) {
        newErrors.state = 'State is required';
      } else {
        delete newErrors.state;
      }
    }

    // Pincode - Numeric only
    if (field === 'pincode') {
      sanitizedValue = value.replace(/[^0-9]/g, '');
      if (value !== sanitizedValue && value.length > 0) {
        newErrors.pincode = 'Only numbers allowed';
      } else if (sanitizedValue.trim().length === 0 && value.length > 0) {
        newErrors.pincode = 'Pincode is required';
      } else {
        delete newErrors.pincode;
      }
    }

    // Address validation
    if (field === 'address') {
      if (value.trim().length === 0 && value.length > 0) {
        newErrors.address = 'Address is required';
      } else {
        delete newErrors.address;
      }
    }

    setNewAddressForm(prev => ({ ...prev, [field]: sanitizedValue }));
    setAddressErrors(newErrors);
  };

  const handleAddAddress = async () => {
    if (!newAddressForm.name || !newAddressForm.address || !newAddressForm.city || !newAddressForm.state || !newAddressForm.pincode || !newAddressForm.phone) {
      alert('Please fill all fields');
      return;
    }

    try {
      const response = await authService.addAddress({
        ...newAddressForm,
        isDefault: addresses.length === 0
      });

      console.log('➕ Add Address Response:', response);

      if (response.data && response.data.success && response.data.data) {
        setAddresses(response.data.data || []);
        setNewAddressForm({
          type: 'Home',
          name: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          phone: ''
        });
        setShowAddressModal(false);
        alert('Address added successfully!');
      }
    } catch (error) {
      alert('Failed to add address: ' + error.message);
    }
  };

  const handleEditAddress = async () => {
    if (!newAddressForm.name || !newAddressForm.address || !newAddressForm.city || !newAddressForm.state || !newAddressForm.pincode || !newAddressForm.phone) {
      alert('Please fill all fields');
      return;
    }

    try {
      const response = await authService.updateAddress(editingAddress._id, newAddressForm);
      console.log('✏️ Update Address Response:', response);

      if (response.data && response.data.success && response.data.data) {
        setAddresses(response.data.data || []);
        setNewAddressForm({
          type: 'Home',
          name: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          phone: ''
        });
        setEditingAddress(null);
        setShowAddressModal(false);
        alert('Address updated successfully!');
      }
    } catch (error) {
      alert('Failed to update address: ' + error.message);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const response = await authService.deleteAddress(addressId);
        console.log('🗑️ Delete Address Response:', response);

        if (response.data && response.data.success && response.data.data) {
          setAddresses(response.data.data || []);
          alert('Address deleted successfully!');
        }
      } catch (error) {
        alert('Failed to delete address: ' + error.message);
      }
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const response = await authService.setDefaultAddress(addressId);
      console.log('⭐ Set Default Address Response:', response);

      if (response.data && response.data.success && response.data.data) {
        setAddresses(response.data.data || []);
        alert('Default address updated successfully!');
      }
    } catch (error) {
      alert('Failed to set default address: ' + error.message);
    }
  };

  const openAddAddressModal = () => {
    setEditingAddress(null);
    setNewAddressForm({
      type: 'Home',
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: ''
    });
    setShowAddressModal(true);
  };

  const openEditAddressModal = (address) => {
    setEditingAddress(address);
    setNewAddressForm({
      type: address.type,
      name: address.name,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone
    });
    setShowAddressModal(true);
  };

  const tabs = [
    { id: 'orders', name: 'Orders', icon: Package },
    { id: 'addresses', name: 'Addresses', icon: MapPin },
    { id: 'wishlist', name: 'Wishlist', icon: Heart }
  ];

  // Calculate stats
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const deliveredOrders = orders.filter(order => order.status === 'Delivered').length;

  return (
    <div className="min-h-screen bg-cream-100 py-8" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-charcoal-700 hover:text-amber-700 font-semibold transition-all hover:gap-3"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        {/* Profile Header - Vintage Elegant Design */}
        <div className="bg-gradient-to-br from-amber-50 via-cream-50 to-orange-50 rounded-2xl shadow-lg mb-6 overflow-hidden border-2 border-amber-200/50">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">

              {/* Left Section - Profile Picture */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="relative">
                  {/* Decorative Frame */}
                  <div className="absolute -inset-3 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-full opacity-20 blur-xl"></div>

                  {/* Profile Image with Elegant Border */}
                  <div className="relative w-40 h-40 rounded-full p-2 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 shadow-xl">
                    <img
                      src={profileData.avatar}
                      alt={profileData.name}
                      className="w-full h-full rounded-full object-cover border-4 border-white"
                    />
                    {/* Camera Button */}
                    <button className="absolute bottom-2 right-2 bg-white text-amber-600 p-2.5 rounded-full shadow-lg hover:bg-amber-600 hover:text-white transition-all hover:scale-110 border-2 border-amber-200">
                      <Camera size={18} />
                    </button>
                  </div>
                </div>

                {/* Premium Badge */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-md">
                  <Award size={18} className="animate-pulse" />
                  <span className="text-sm font-medium">Premium Member</span>
                </div>
              </div>

              {/* Right Section - User Info */}
              <div className="flex-1 min-w-0">
                {/* Name and Email */}
                <div className="mb-6">
                  <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">{profileData.name}</h1>

                  <div className="flex flex-wrap items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-amber-100">
                      <Mail size={16} className="text-amber-600 flex-shrink-0" />
                      <span className="text-sm">{profileData.email}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-amber-100">
                      <Calendar size={16} className="text-amber-600 flex-shrink-0" />
                      <span className="text-sm">Member since {profileData.joinedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={16} className="text-blue-600" />
                      <span className="text-xs text-gray-600">Orders</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{totalOrders}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-green-600" />
                      <span className="text-xs text-gray-600">Spent</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">₹{(totalSpent/1000).toFixed(1)}k</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-all col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-xs text-gray-600">Delivered</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{deliveredOrders}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      setIsEditing(true);
                      setEditedData(profileData);
                    }}
                    className="px-5 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 hover:scale-105"
                  >
                    <Edit2 size={18} />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => {
                      if (onLogout) onLogout();
                      navigate('/');
                    }}
                    className="px-5 py-2.5 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center gap-2 hover:scale-105"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden border border-cream-200">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? 'bg-cream-100 text-amber-700'
                    : 'text-charcoal-600 hover:bg-cream-50'
                }`}
              >
                <tab.icon size={20} />
                {tab.name}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600 rounded-t"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-cream-200">
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-medium text-charcoal-900 mb-6">Order History</h2>
              {loadingOrders ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                  <p className="text-charcoal-600">Loading your orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={48} className="text-cream-300" />
                  </div>
                  <p className="text-charcoal-600 text-lg font-semibold">No orders yet</p>
                  <p className="text-charcoal-500 text-sm mt-2">Start shopping to see your order history</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all shadow-md hover:scale-105"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                  <div key={order.id} className="border-2 border-cream-200 rounded-xl p-5 hover:shadow-lg hover:border-amber-300 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-charcoal-900 text-lg">Order #{order.id}</h3>
                        <p className="text-sm text-charcoal-600">{new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        order.statusColor === 'green' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-charcoal-700">
                        <span className="font-semibold">{order.items} items</span> • Total: <span className="font-semibold text-amber-700 text-lg">₹{order.total.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        className="px-5 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all text-sm shadow-md hover:scale-105"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-medium text-charcoal-900">Saved Addresses</h2>
                <button
                  onClick={openAddAddressModal}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all flex items-center gap-2 shadow-md hover:scale-105"
                >
                  <MapPin size={18} />
                  Add New Address
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.length > 0 ? (
                  addresses.map(address => (
                    <div key={address._id} className="border-2 border-cream-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-lg transition-all relative">
                      {address.isDefault && (
                        <span className="absolute top-3 right-3 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                          DEFAULT
                        </span>
                      )}
                      <div className="mb-3">
                        <span className="inline-block px-3 py-1 bg-cream-100 text-charcoal-700 text-sm font-semibold rounded-lg mb-2">
                          {address.type}
                        </span>
                        <h3 className="font-medium text-charcoal-900">{address.name}</h3>
                      </div>
                      {user?.email && <p className="text-sm text-charcoal-600 mb-1">Email: {user.email}</p>}
                      <p className="text-sm text-charcoal-700 mb-1">{address.address}</p>
                      <p className="text-sm text-charcoal-700 mb-1">{address.city}, {address.state} - {address.pincode}</p>
                      <p className="text-sm text-charcoal-600 mb-3">Phone: {address.phone}</p>
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => openEditAddressModal(address)}
                          className="flex-1 px-3 py-2 border-2 border-amber-600 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-all text-sm hover:scale-105"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address._id)}
                          className="flex-1 px-3 py-2 border-2 border-red-600 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-all text-sm hover:scale-105"
                        >
                          Delete
                        </button>
                      </div>
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(address._id)}
                          className="w-full px-3 py-2 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all text-sm shadow-md hover:scale-105"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="font-semibold">No saved addresses yet</p>
                    <p className="text-sm mt-2">Add your first address to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div>
              <h2 className="text-2xl font-medium text-charcoal-900 mb-6">My Wishlist</h2>
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart size={48} className="text-cream-300" />
                </div>
                <p className="text-charcoal-600 text-lg font-semibold">Your wishlist is empty</p>
                <p className="text-charcoal-500 text-sm mt-2">Add items you love to your wishlist</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-6 px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all shadow-md hover:scale-105"
                >
                  Start Shopping
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm"
            onClick={() => setShowOrderDetails(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 animate-fade-in border border-cream-200">
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Order Details</h2>
                  <p className="text-sm text-amber-50 mt-1">Order #{selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="bg-amber-50 rounded-xl p-5 mb-6 border-2 border-amber-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-charcoal-900 text-lg">Order Status</h3>
                      <p className="text-sm text-charcoal-600">Placed on {new Date(selectedOrder.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <span className={`px-5 py-2 rounded-full text-sm font-medium ${
                      selectedOrder.statusColor === 'green' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-charcoal-700 bg-white rounded-lg p-3">
                      <Truck size={18} className="text-amber-600" />
                      <span className="font-semibold">Tracking Number:</span>
                      <span className="font-mono">{selectedOrder.trackingNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-charcoal-700 bg-white rounded-lg p-3">
                      <Package size={18} className="text-blue-600" />
                      <span className="font-semibold">Courier Company:</span>
                      <span className="font-medium">{selectedOrder.courierCompany}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-charcoal-900 text-lg mb-4">Order Timeline</h3>
                  <div className="space-y-3">
                    {selectedOrder.timeline.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`mt-1 ${item.completed ? 'text-green-600' : 'text-gray-300'}`}>
                          {item.completed ? <CheckCircle size={20} /> : <Clock size={20} />}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${item.completed ? 'text-charcoal-900' : 'text-gray-400'}`}>
                            {item.status}
                          </p>
                          <p className={`text-sm ${item.completed ? 'text-charcoal-600' : 'text-gray-400'}`}>
                            {item.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-charcoal-900 text-lg mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.orderItems.map((item) => (
                      <div key={item.id} className="flex gap-4 border-2 border-cream-200 rounded-xl p-4 hover:border-amber-300 transition-all">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-charcoal-900">{item.name}</h4>
                          <p className="text-sm text-charcoal-600 mt-1">Quantity: {item.quantity}</p>
                          <p className="text-lg font-semibold text-amber-700 mt-1">₹{item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-charcoal-900 text-lg mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-amber-600" />
                    Delivery Address
                  </h3>
                  <div className="bg-cream-50 rounded-xl p-4 border-2 border-cream-200">
                    <p className="font-semibold text-charcoal-900">{selectedOrder.deliveryAddress.name}</p>
                    <p className="text-sm text-charcoal-700 mt-1">{selectedOrder.deliveryAddress.address}</p>
                    <p className="text-sm text-charcoal-700">{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} - {selectedOrder.deliveryAddress.pincode}</p>
                    <p className="text-sm text-charcoal-600 mt-1">Phone: {selectedOrder.deliveryAddress.phone}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-charcoal-900 text-lg mb-4">Payment Information</h3>
                  <div className="bg-cream-50 rounded-xl p-4 border-2 border-cream-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-charcoal-700">Payment Method:</span>
                      <span className="font-semibold text-charcoal-900">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="border-t-2 border-cream-200 pt-3">
                      <div className="flex items-center justify-between text-xl">
                        <span className="font-medium text-charcoal-900">Total Amount:</span>
                        <span className="font-semibold text-amber-700">₹{selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-cream-50 p-4 rounded-b-2xl flex gap-3 justify-end border-t-2 border-cream-200">
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="px-6 py-2.5 border-2 border-charcoal-300 text-charcoal-700 rounded-xl font-semibold hover:bg-charcoal-50 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  disabled={selectedOrder.status !== 'Delivered'}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md ${
                    selectedOrder.status === 'Delivered'
                      ? 'bg-amber-600 text-white hover:bg-amber-700 hover:scale-105 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                  title={selectedOrder.status !== 'Delivered' ? 'Invoice available only after delivery' : 'Download Invoice'}
                >
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm"
            onClick={() => {
              setShowPasswordModal(false);
              setPasswordError('');
              setPasswordSuccess(false);
            }}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in border border-cream-200">
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={24} />
                  <h2 className="text-2xl font-semibold">Change Password</h2>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess(false);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {passwordSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-xl font-medium text-charcoal-900 mb-2">Password Updated!</h3>
                    <p className="text-charcoal-600">Your password has been changed successfully</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passwordError && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-2">
                        <X className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-red-700">{passwordError}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-cream-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-cream-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-cream-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                      <p className="text-sm text-amber-900 font-semibold mb-2">
                        Password Requirements:
                      </p>
                      <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                        <li>At least 6 characters long</li>
                        <li>Should not match your current password</li>
                        <li>Confirmation must match new password</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {!passwordSuccess && (
                <div className="bg-cream-50 p-4 rounded-b-2xl flex gap-3 justify-end border-t-2 border-cream-200">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordError('');
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="px-6 py-2.5 border-2 border-charcoal-300 text-charcoal-700 rounded-xl font-semibold hover:bg-charcoal-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all shadow-md hover:scale-105"
                  >
                    Update Password
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Address Modal */}
      {showAddressModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm"
            onClick={() => {
              setShowAddressModal(false);
              setEditingAddress(null);
              setNewAddressForm({
                type: 'Home',
                name: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
                phone: ''
              });
            }}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 animate-fade-in border border-cream-200">
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={24} />
                  <h2 className="text-2xl font-semibold">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    setEditingAddress(null);
                    setNewAddressForm({
                      type: 'Home',
                      name: '',
                      address: '',
                      city: '',
                      state: '',
                      pincode: '',
                      phone: ''
                    });
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Address Type
                    </label>
                    <div className="flex gap-3">
                      {['Home', 'Office', 'Other'].map(type => (
                        <button
                          key={type}
                          onClick={() => setNewAddressForm(prev => ({ ...prev, type }))}
                          className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                            newAddressForm.type === type
                              ? 'bg-amber-600 text-white shadow-md scale-105'
                              : 'bg-cream-100 text-charcoal-700 hover:bg-cream-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newAddressForm.name}
                      onChange={(e) => handleAddressInputChange('name', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all ${
                        addressErrors.name ? 'border-red-500 focus:border-red-500' : 'border-cream-300 focus:border-amber-500'
                      }`}
                      placeholder="Enter full name"
                    />
                    {addressErrors.name && <p className="text-red-500 text-xs mt-1">{addressErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      value={newAddressForm.address}
                      onChange={(e) => handleAddressInputChange('address', e.target.value)}
                      rows="2"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all ${
                        addressErrors.address ? 'border-red-500 focus:border-red-500' : 'border-cream-300 focus:border-amber-500'
                      }`}
                      placeholder="House No, Building Name, Street"
                    />
                    {addressErrors.address && <p className="text-red-500 text-xs mt-1">{addressErrors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={newAddressForm.city}
                        onChange={(e) => handleAddressInputChange('city', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all ${
                          addressErrors.city ? 'border-red-500 focus:border-red-500' : 'border-cream-300 focus:border-amber-500'
                        }`}
                        placeholder="Enter city"
                      />
                      {addressErrors.city && <p className="text-red-500 text-xs mt-1">{addressErrors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        value={newAddressForm.state}
                        onChange={(e) => handleAddressInputChange('state', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all ${
                          addressErrors.state ? 'border-red-500 focus:border-red-500' : 'border-cream-300 focus:border-amber-500'
                        }`}
                        placeholder="Enter state"
                      />
                      {addressErrors.state && <p className="text-red-500 text-xs mt-1">{addressErrors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={newAddressForm.pincode}
                        onChange={(e) => handleAddressInputChange('pincode', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all ${
                          addressErrors.pincode ? 'border-red-500 focus:border-red-500' : 'border-cream-300 focus:border-amber-500'
                        }`}
                        placeholder="Enter pincode"
                      />
                      {addressErrors.pincode && <p className="text-red-500 text-xs mt-1">{addressErrors.pincode}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="flex gap-2">
                        <div className="w-20">
                          <input
                            type="text"
                            value="+91"
                            readOnly
                            className="w-full px-3 py-3 border-2 border-cream-300 rounded-xl bg-gray-50 text-center font-semibold"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="tel"
                            value={newAddressForm.phone}
                            onChange={(e) => handleAddressInputChange('phone', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all ${
                              addressErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-cream-300 focus:border-amber-500'
                            }`}
                            placeholder="10 digit mobile number"
                          />
                        </div>
                      </div>
                      {addressErrors.phone && <p className="text-red-500 text-xs mt-1">{addressErrors.phone}</p>}
                    </div>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-900">
                      <strong>Note:</strong> All fields marked with * are required.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cream-50 p-4 rounded-b-2xl flex gap-3 justify-end border-t-2 border-cream-200">
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    setEditingAddress(null);
                    setNewAddressForm({
                      type: 'Home',
                      name: '',
                      address: '',
                      city: '',
                      state: '',
                      pincode: '',
                      phone: ''
                    });
                  }}
                  className="px-6 py-2.5 border-2 border-charcoal-300 text-charcoal-700 rounded-xl font-semibold hover:bg-charcoal-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={editingAddress ? handleEditAddress : handleAddAddress}
                  className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all shadow-md hover:scale-105"
                >
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invoice Notification Popup */}
      {showInvoiceNotification && (
        <div className="fixed top-24 right-4 z-[100] animate-fade-in">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-red-400 flex items-center gap-3 max-w-md">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Package size={24} />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">Invoice Not Available</p>
              <p className="text-xs text-red-50">Invoice can only be downloaded after order is delivered</p>
            </div>
            <button
              onClick={() => setShowInvoiceNotification(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Edit2 size={24} />
                    Edit Profile & Settings
                  </h2>
                  <p className="text-sm text-amber-50 mt-1">Update your personal information and preferences</p>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-white/90 hover:text-white hover:scale-110 transition-all p-2 hover:bg-white/20 rounded-xl"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Personal Information Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editedData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={editedData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={editedData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={editedData.dateOfBirth}
                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        value={editedData.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        value={editedData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        rows="3"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Settings Section */}
                <div className="pt-8 border-t-2 border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h3>
                  <div className="space-y-4">
                    {/* Change Password */}
                    <div className="border-2 border-gray-200 rounded-xl p-5 hover:border-amber-300 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock size={20} className="text-amber-600" />
                        <h4 className="font-medium text-gray-900">Change Password</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Update your password to keep your account secure</p>
                      <button
                        onClick={() => {
                          setShowPasswordModal(true);
                          setShowEditModal(false);
                        }}
                        className="px-5 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-all shadow-md hover:scale-105"
                      >
                        Update Password
                      </button>
                    </div>

                    {/* Email Notifications */}
                    <div className="border-2 border-gray-200 rounded-xl p-5 hover:border-amber-300 transition-all">
                      <h4 className="font-medium text-gray-900 mb-3">Email Notifications</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500" />
                          <span className="text-sm text-gray-700">Order updates</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500" />
                          <span className="text-sm text-gray-700">Promotional emails</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500" />
                          <span className="text-sm text-gray-700">New arrivals</span>
                        </label>
                      </div>
                    </div>

                    {/* Delete Account */}
                    <div className="border-2 border-red-300 rounded-xl p-5 bg-red-50 hover:border-red-400 transition-all">
                      <h4 className="font-semibold text-red-900 mb-2">Delete Account</h4>
                      <p className="text-sm text-red-700 mb-4">Permanently delete your account and all associated data</p>
                      <button className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all shadow-md hover:scale-105">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3 justify-end border-t-2 border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-md hover:scale-105 flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Profile;
