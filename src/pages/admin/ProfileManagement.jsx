import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save, Upload, X } from 'lucide-react';
import usePermissions from '../../hooks/usePermissions';

const ProfileManagement = () => {
  const { user, isSuperAdmin } = usePermissions();

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    avatar: '/api/placeholder/150/150'
  });

  // Load user data from localStorage on component mount
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || 'Admin User',
        email: user.email || 'admin@vintagecoin.com',
        phone: user.phone || '+91 9876543210',
        address: user.address || '123 Admin Street, Mumbai, Maharashtra 400001',
        role: user.role?.displayName || (user.legacyRole === 'superadmin' ? 'Super Admin' : 'Admin'),
        avatar: user.avatar || '/api/placeholder/150/150'
      });
      setAvatarPreview(user.avatar || '/api/placeholder/150/150');
    }
  }, [user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(profileData.avatar);
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Add API call here
    setTimeout(() => {
      setLoading(false);
      alert('Profile updated successfully!');
    }, 1000);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setLoading(true);
    // Add API call here
    setTimeout(() => {
      setLoading(false);
      alert('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            Profile <span className="text-accent-600">Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Manage your admin profile and account settings</p>
        </div>

        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border-2 border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
              <User size={24} className="text-white" />
            </div>
            Profile Information
          </h2>

          <form onSubmit={handleProfileUpdate} className="space-y-8">
            {/* Avatar Upload */}
            <div className="flex items-center gap-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl">
              <div className="relative">
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-xl ring-2 ring-gray-200 dark:ring-gray-600"
                />
                <label
                  htmlFor="avatar"
                  className="absolute bottom-0 right-0 p-3 bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-xl hover:shadow-xl cursor-pointer transition-all transform hover:-translate-y-0.5"
                >
                  <Upload size={20} />
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{profileData.name}</h3>
                <p className="text-accent-600 dark:text-accent-400 font-bold mb-1">{profileData.role}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Click the upload button to change your avatar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-primary-500" />
                    Full Name
                  </div>
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-accent-500" />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-primary-600" />
                    Phone Number
                  </div>
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                  Role
                </label>
                <input
                  type="text"
                  value={profileData.role}
                  disabled
                  className="w-full px-6 py-4 bg-gray-200 dark:bg-gray-700 border-0 rounded-xl cursor-not-allowed text-gray-600 dark:text-gray-400 font-semibold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-accent-600" />
                    Address
                  </div>
                </label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  rows="3"
                  className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t-2 border-gray-200 dark:border-gray-800">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-xl hover:shadow-xl transition-all font-bold disabled:opacity-50 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border-2 border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <Lock size={24} className="text-white" />
            </div>
            Change Password
          </h2>

          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-red-500" />
                  Current Password
                </div>
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-red-500 dark:text-white text-gray-900 font-semibold"
                placeholder="Enter current password"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-accent-500" />
                    New Password
                  </div>
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-primary-500" />
                    Confirm New Password
                  </div>
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white text-gray-900 font-semibold"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t-2 border-gray-200 dark:border-gray-800">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:shadow-xl transition-all font-bold disabled:opacity-50 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-2xl shadow-lg p-6 border-2 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-500 rounded-xl">
              <Lock size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-yellow-900 dark:text-yellow-200 mb-2">Security Tip</h3>
              <p className="text-yellow-800 dark:text-yellow-300 leading-relaxed">
                Use a strong password with at least 8 characters, including uppercase and lowercase letters, numbers, and special characters. Never share your password with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
