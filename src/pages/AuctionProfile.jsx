import React, { useState, useEffect } from 'react';
import { User, Lock, History, FileText, Save, Edit2, X, Upload, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';
import { authService } from '../services';
import { toast } from 'react-toastify';

const AuctionProfile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

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

  // Login History
  const [loginHistory, setLoginHistory] = useState([]);

  // KYC Documents
  const [kycDocuments, setKycDocuments] = useState({
    idProof: null,
    addressProof: null,
    panCard: null
  });
  const [kycStatus, setKycStatus] = useState({
    idProof: 'pending',
    addressProof: 'pending',
    panCard: 'pending'
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();
      const userData = response.data;

      // Get address from savedAddresses if available
      const defaultAddress = userData.savedAddresses?.find(addr => addr.isDefault) || userData.savedAddresses?.[0];
      const addressString = defaultAddress
        ? `${defaultAddress.address}, ${defaultAddress.city}, ${defaultAddress.state}, ${defaultAddress.pincode}`
        : '';

      setPersonalInfo({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.mobileNumber || userData.phone || '',
        address: addressString
      });

      setAccountSummary({
        auctionCoins: userData.auctionCoins || 0,
        frozenCoins: userData.frozenCoins || 0,
        totalSpent: userData.totalSpent || 0,
        totalWon: userData.totalWon || 0
      });

      // Fetch login history
      const historyResponse = await api.get('/user/login-history');
      setLoginHistory(historyResponse.data || []);

      // Fetch KYC status
      const kycResponse = await api.get('/user/kyc-status');
      setKycStatus(kycResponse.data || {
        idProof: 'pending',
        addressProof: 'pending',
        panCard: 'pending'
      });
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

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long!');
      return;
    }

    try {
      await api.post('/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleFileUpload = async (docType, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', docType);

    try {
      await api.post('/user/upload-kyc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(`${docType} uploaded successfully!`);

      // Update KYC status
      setKycStatus(prev => ({ ...prev, [docType]: 'uploaded' }));
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'uploaded':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'account', label: 'Account Summary', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'history', label: 'Login History', icon: History },
    { id: 'kyc', label: 'KYC Documents', icon: FileText }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-600"></div>
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
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
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
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                            {entry.date}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                            {entry.time}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                            {entry.ipAddress}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                            {entry.device}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KYC Documents Tab */}
          {activeTab === 'kyc' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">KYC Documents</h2>

              <div className="space-y-6">
                {/* ID Proof */}
                <div className="border border-gray-300 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">ID Proof</h3>
                    {getStatusIcon(kycStatus.idProof)}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a government-issued ID (Aadhar Card, Passport, Driver's License, etc.)
                  </p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('idProof', e.target.files[0])}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-accent-50 file:text-accent-700
                      hover:file:bg-accent-100"
                  />
                  <p className="text-xs text-gray-500 mt-2">Status: {kycStatus.idProof}</p>
                </div>

                {/* Address Proof */}
                <div className="border border-gray-300 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Address Proof</h3>
                    {getStatusIcon(kycStatus.addressProof)}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload address proof (Utility Bill, Bank Statement, etc.)
                  </p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('addressProof', e.target.files[0])}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-accent-50 file:text-accent-700
                      hover:file:bg-accent-100"
                  />
                  <p className="text-xs text-gray-500 mt-2">Status: {kycStatus.addressProof}</p>
                </div>

                {/* PAN Card */}
                <div className="border border-gray-300 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">PAN Card</h3>
                    {getStatusIcon(kycStatus.panCard)}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload PAN Card for tax purposes
                  </p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('panCard', e.target.files[0])}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-accent-50 file:text-accent-700
                      hover:file:bg-accent-100"
                  />
                  <p className="text-xs text-gray-500 mt-2">Status: {kycStatus.panCard}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionProfile;
