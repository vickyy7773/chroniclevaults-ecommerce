import { useState, useEffect } from 'react';
import { Save, Store, Bell, Lock, Palette, Globe } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    // Store Settings
    storeName: 'VintageCoin Store',
    storeEmail: 'admin@vintagecoin.com',
    storePhone: '+91 9876543210',
    storeAddress: '123 Coin Street, Mumbai, India',

    // Notifications
    emailNotifications: true,
    orderNotifications: true,
    lowStockAlerts: true,

    // Security
    twoFactorAuth: false,
    sessionTimeout: '30',

    // Appearance
    theme: 'light',
    accentColor: 'amber',
  });

  const [saving, setSaving] = useState(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('settings', JSON.stringify(settings));

    setTimeout(() => {
      setSaving(false);
      alert('✅ Settings saved successfully!');
    }, 1000);
  };

  return (
    <div className="p-8">
        {/* Header - Hidden */}
        {/* <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            Settings <span className="text-amber-600">& Configuration</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Manage your store settings and preferences</p>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Menu */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-800 sticky top-8">
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Quick Links</h2>
              <nav className="space-y-2">
                <a href="#store" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold">
                  <Store size={20} />
                  Store Settings
                </a>
                <a href="#notifications" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold">
                  <Bell size={20} />
                  Notifications
                </a>
                <a href="#security" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold">
                  <Lock size={20} />
                  Security
                </a>
                <a href="#appearance" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold">
                  <Palette size={20} />
                  Appearance
                </a>
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Settings */}
            <div id="store" className="bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Store size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Store Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    value={settings.storeName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Store Email
                  </label>
                  <input
                    type="email"
                    name="storeEmail"
                    value={settings.storeEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Store Phone
                  </label>
                  <input
                    type="tel"
                    name="storePhone"
                    value={settings.storePhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Store Address
                  </label>
                  <textarea
                    name="storeAddress"
                    value={settings.storeAddress}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div id="notifications" className="bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <Bell size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Notifications</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Email Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive email updates about orders and activity</p>
                  </div>
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Order Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when new orders are placed</p>
                  </div>
                  <input
                    type="checkbox"
                    name="orderNotifications"
                    checked={settings.orderNotifications}
                    onChange={handleChange}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Low Stock Alerts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Alert when product stock is running low</p>
                  </div>
                  <input
                    type="checkbox"
                    name="lowStockAlerts"
                    checked={settings.lowStockAlerts}
                    onChange={handleChange}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                </label>
              </div>
            </div>

            {/* Security */}
            <div id="security" className="bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Lock size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Security</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
                  </div>
                  <input
                    type="checkbox"
                    name="twoFactorAuth"
                    checked={settings.twoFactorAuth}
                    onChange={handleChange}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                </label>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <select
                    name="sessionTimeout"
                    value={settings.sessionTimeout}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-white font-medium"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div id="appearance" className="bg-white dark:bg-gray-900 rounded-2xl p-8 border-2 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                  <Palette size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Appearance</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    name="theme"
                    value={settings.theme}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-white font-medium"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Accent Color
                  </label>
                  <div className="grid grid-cols-6 gap-3">
                    {['amber', 'blue', 'green', 'purple', 'red', 'pink'].map(color => (
                      <button
                        key={color}
                        onClick={() => setSettings(prev => ({ ...prev, accentColor: color }))}
                        className={`h-12 rounded-xl bg-${color}-500 hover:scale-110 transition-transform ${
                          settings.accentColor === color ? 'ring-4 ring-offset-2 ring-' + color + '-500' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 shadow-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={24} />
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Settings;
