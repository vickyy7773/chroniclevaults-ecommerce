import { useState } from 'react';
import { Shield, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { authService } from '../../services';
import { useNavigate } from 'react-router-dom';

const InitialSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // First register the user
      const registerResponse = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (registerResponse.success) {
        // Save token
        localStorage.setItem('token', registerResponse.data.token);
        localStorage.setItem('user', JSON.stringify(registerResponse.data));

        // Show success message with instructions
        setSuccess(true);
        setStep(2);
      } else {
        setError(registerResponse.message || 'Failed to create account');
      }
    } catch (err) {
      setError(err.message || 'Failed to create Super Admin account');
    } finally {
      setLoading(false);
    }
  };

  if (success && step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={48} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">Account Created! 🎉</h1>
            <p className="text-gray-600 mb-6">Your account has been created successfully.</p>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-bold text-amber-900 mb-3 text-lg">⚠️ Important - Final Step Required!</h3>

              <div className="space-y-3 text-sm text-amber-800">
                <p className="font-semibold">
                  To become Super Admin, you need to update your account in the database:
                </p>

                <div className="bg-white rounded-lg p-4 border border-amber-300">
                  <p className="font-bold mb-2">Option 1: MongoDB Compass (Recommended)</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Open MongoDB Compass</li>
                    <li>Connect to your database</li>
                    <li>Find your database → users collection</li>
                    <li>Find your user by email: <code className="bg-amber-100 px-1 rounded">{formData.email}</code></li>
                    <li>Click Edit button</li>
                    <li>Change <code className="bg-amber-100 px-1 rounded">legacyRole</code> from "user" to "superadmin"</li>
                    <li>Save changes</li>
                  </ol>
                </div>

                <div className="bg-white rounded-lg p-4 border border-amber-300">
                  <p className="font-bold mb-2">Option 2: MongoDB Shell</p>
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                    db.users.updateOne(<br/>
                    &nbsp;&nbsp;{'{'} email: "{formData.email}" {'}'},<br/>
                    &nbsp;&nbsp;{'{'} $set: {'{'} legacyRole: "superadmin" {'}'} {'}'}<br/>
                    )
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="text-red-800 font-semibold text-xs">
                    ⚠️ After updating the database, logout and login again to get Super Admin access!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  navigate('/authentication');
                }}
                className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="flex-1 px-6 py-3 border-2 border-amber-600 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors font-semibold"
              >
                Try Dashboard
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Your credentials are saved. After database update, you can login.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Super Admin</h1>
          <p className="text-gray-600">Setup your first administrator account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateSuperAdmin} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  placeholder="Admin User"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password * (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will create a regular account. You'll need to update it to Super Admin in the database (instructions will be shown after creation).
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/authentication')}
                className="text-amber-600 hover:text-amber-700 font-semibold"
              >
                Login here
              </button>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Secure • Encrypted • Admin Access</p>
        </div>
      </div>
    </div>
  );
};

export default InitialSetup;
