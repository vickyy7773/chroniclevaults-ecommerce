import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, History, Save, Edit2, X, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import api, { loginHistoryAPI } from '../utils/api';
import { authService } from '../services';
import { toast } from 'react-toastify';

const AuctionProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuctionVerified, setIsAuctionVerified] = useState(false);

  // Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Auction Account Summary
  const [accountSummary, setAccountSummary] = useState({
    auctionCoins: 0,
    frozenCoins: 0,
    totalSpent: 0,
    totalWon: 0
  });

  // Change Password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Show/Hide Password States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Validation Errors
  const [passwordErrors, setPasswordErrors] = useState({});

  // Login History
  const [loginHistory, setLoginHistory] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent('/auction-profile');
        navigate(`/authentication?redirect=${returnUrl}`);
        return;
      }

      setIsLoggedIn(true);
      const response = await authService.getCurrentUser();
      const userData = response.data;

      // Check if user is auction verified
      if (!userData.isAuctionVerified) {
        setIsAuctionVerified(false);
        setLoading(false);
        return; // Will show registration prompt
      }

      setIsAuctionVerified(true);

      // Try to fetch auction registration data
      let registrationData = null;
      try {
        // Note: api.get already unwraps response.data via interceptor
        registrationData = await api.get(`/auction-registration/user/${userData._id}`);
      } catch (regError) {
        // No auction registration found, will use fallback data
      }

      // Get phone and address from auction registration if available
      let phoneNumber = '';
      let addressString = '';

      if (registrationData) {
        // Prefer data from auction registration
        phoneNumber = registrationData.mobile || registrationData.phone || '';

        const billingAddr = registrationData.billingAddress;
        if (billingAddr) {
          addressString = `${billingAddr.addressLine1}${billingAddr.addressLine2 ? ', ' + billingAddr.addressLine2 : ''}, ${billingAddr.city}, ${billingAddr.state}, ${billingAddr.pinCode}`;
        }
      } else {
        // Fallback to savedAddresses if no auction registration
        const defaultAddress = userData.savedAddresses?.find(addr => addr.isDefault) || userData.savedAddresses?.[0];
        addressString = defaultAddress
          ? `${defaultAddress.address}, ${defaultAddress.city}, ${defaultAddress.state}, ${defaultAddress.pincode}`
          : '';
        phoneNumber = userData.mobileNumber || userData.phone || defaultAddress?.phone || '';
      }

      setPersonalInfo({
        name: userData.name || registrationData?.fullName || '',
        email: userData.email || registrationData?.email || '',
        phone: phoneNumber,
        address: addressString
      });

      setAccountSummary({
        auctionCoins: userData.auctionCoins || 0,
        frozenCoins: userData.frozenCoins || 0,
        totalSpent: userData.totalSpent || 0,
        totalWon: userData.totalWon || 0
      });

      // Fetch login history
      try {
        console.log('🔍 Fetching login history...');
        const historyResponse = await loginHistoryAPI.getMyHistory(10);
        console.log('📊 Login history response:', historyResponse);
        if (historyResponse && historyResponse.success && historyResponse.data) {
          console.log('✅ Setting login history:', historyResponse.data);
          setLoginHistory(historyResponse.data);
        } else {
          console.log('⚠️ Response format unexpected:', historyResponse);
        }
      } catch (historyError) {
        console.error('❌ Login history error:', historyError);
        console.error('❌ Error details:', historyError.response || historyError.message);
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      console.error('❌ Error details:', error.response || error.message);
      toast.error('Failed to load profile data');

      // Set empty data instead of dummy data
      setPersonalInfo({
        name: '',
        email: '',
        phone: '',
        address: ''
      });

      setAccountSummary({
        auctionCoins: 0,
        frozenCoins: 0,
        totalSpent: 0,
        totalWon: 0
      });

      setLoginHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonalInfo = async () => {
    try {
      await api.put('/user/profile', personalInfo);
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const validatePassword = (password) => {
    const errors = {};

    if (!password) {
      errors.required = 'Password is required';
    } else {
      if (password.length < 6) {
        errors.length = 'Password must be at least 6 characters';
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
        errors.case = 'Password must contain uppercase and lowercase letters';
      }
      if (!/(?=.*\d)/.test(password)) {
        errors.number = 'Password must contain at least one number';
      }
    }

    return errors;
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData({ ...passwordData, [field]: value });

    // Validate new password in real-time
    if (field === 'newPassword') {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validate new password
    const errors = validatePassword(passwordData.newPassword);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      toast.error('Please fix password validation errors');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    try {
      await api.put('/auth/updatepassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'account', label: 'Account Summary', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'history', label: 'Login History', icon: History }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  // Show registration prompt if user is logged in but not auction verified
  if (isLoggedIn && !isAuctionVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Registration Required Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center border-2 border-amber-200">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-6 shadow-lg">
              <Shield className="w-12 h-12 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Auction Registration Required
            </h1>

            {/* Message */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold text-amber-900 mb-2">Complete Your Auction Registration First</p>
                  <p className="text-sm text-amber-800">
                    To access your auction profile and participate in auctions, you need to complete the auction registration process. This includes submitting your documents and personal information for verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits List */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-bold text-gray-900 mb-3 text-center">After Registration You Can:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Participate in live auctions</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Place bids on exclusive collectibles</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Track your bidding history</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Manage your auction account</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/auction-registration')}
                className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-lg font-bold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  Complete Registration Now
                </span>
              </button>

              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-gray-200 text-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-300 transition-all"
              >
                Go to Home
              </button>
            </div>

            {/* Help Text */}
            <p className="text-sm text-gray-500 mt-6">
              Need help? Contact us at <a href="mailto:support@chroniclevaults.com" className="text-amber-600 hover:underline font-semibold">support@chroniclevaults.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-accent-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded hover:bg-accent-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePersonalInfo}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={personalInfo.name}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:bg-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <textarea
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                    disabled={!editMode}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Account Summary Tab */}
          {activeTab === 'account' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Auction Account Summary</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <p className="text-sm text-green-600 font-semibold mb-2">Auction Coins</p>
                  <p className="text-3xl font-bold text-green-700">₹{formatCurrency(accountSummary.auctionCoins)}</p>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                  <p className="text-sm text-yellow-600 font-semibold mb-2">Frozen Coins</p>
                  <p className="text-3xl font-bold text-yellow-700">₹{formatCurrency(accountSummary.frozenCoins)}</p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <p className="text-sm text-blue-600 font-semibold mb-2">Total Spent</p>
                  <p className="text-3xl font-bold text-blue-700">₹{formatCurrency(accountSummary.totalSpent)}</p>
                </div>

                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                  <p className="text-sm text-purple-600 font-semibold mb-2">Total Won</p>
                  <p className="text-3xl font-bold text-purple-700">{accountSummary.totalWon} Lots</p>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>

              <form onSubmit={handleChangePassword} className="max-w-md">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-accent-600 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      required
                      className={`w-full px-4 py-2 pr-12 border rounded focus:outline-none focus:ring-2 focus:ring-accent-500 ${
                        Object.keys(passwordErrors).length > 0 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-accent-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {Object.keys(passwordErrors).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.values(passwordErrors).map((error, idx) => (
                        <p key={idx} className="text-red-600 text-sm font-semibold flex items-center gap-1">
                          <span className="text-red-500">•</span> {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-accent-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-accent-600 text-white py-2 rounded hover:bg-accent-700 transition-colors font-semibold"
                >
                  Change Password
                </button>
              </form>
            </div>
          )}

          {/* Login History Tab */}
          {activeTab === 'history' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Login History</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                        Device
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No login history available
                        </td>
                      </tr>
                    ) : (
                      loginHistory.map((entry, index) => (
                        <tr key={entry._id || index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                            {formatDate(entry.loginTime)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                            {formatTime(entry.loginTime)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                            {entry.ipAddress}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                            {entry.device} • {entry.browser} • {entry.os}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionProfile;
