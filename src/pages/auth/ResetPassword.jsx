import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import posterImage from '../../assets/poster.jpg';
import { API_BASE_URL } from '../../constants/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();
        setTokenValid(data.success);
      } catch (error) {
        console.error('Token verification error:', error);
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');

    // Validate password in real-time
    if (name === 'password') {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    const errors = validatePassword(formData.password);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    if (!formData.confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/authentication');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mb-4"></div>
          <p className="text-gray-600 font-semibold">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
        <div className="max-w-md w-full">
          <div className="card-premium p-8 bg-white rounded-2xl shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Invalid or Expired Link
            </h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="btn-primary inline-block py-3 px-6 rounded-xl font-bold"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
      <div className="max-w-md w-full animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-scale-in overflow-hidden">
            <img src={posterImage} alt="Chronicle Vaults" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-black mb-2 animate-slide-up text-gray-900">
            Reset Password
          </h1>
          <p className="text-neutral-700 text-base font-semibold">
            Enter your new password below
          </p>
        </div>

        {/* Form Card */}
        <div className="card-premium p-8 bg-white rounded-2xl shadow-xl">
          {success ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Password Reset Successful!
              </h2>
              <p className="text-gray-600 mb-6">
                Your password has been reset successfully. Redirecting to login...
              </p>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Password Field */}
              <div className="mb-4">
                <label className="block text-neutral-900 font-bold mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-modern w-full pl-10 pr-12 ${
                      Object.keys(passwordErrors).length > 0 ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-600 hover:text-accent-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {Object.keys(passwordErrors).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Object.values(passwordErrors).map((error, idx) => (
                      <p key={idx} className="text-red-600 text-sm font-semibold">{error}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="mb-6">
                <label className="block text-neutral-900 font-bold mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-modern w-full pl-10 pr-12 ${
                      error ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-neutral-600 hover:text-accent-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm mt-2 font-semibold">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || Object.keys(passwordErrors).length > 0}
                className="btn-primary w-full py-3.5 px-6 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <div className="mt-6 text-center">
                <Link
                  to="/authentication"
                  className="text-accent-600 hover:text-accent-700 font-bold text-sm"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
