import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import posterImage from '../../assets/poster.jpg';
import { API_BASE_URL } from '../../constants/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
      <div className="max-w-md w-full animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-scale-in overflow-hidden">
            <img src={posterImage} alt="Chronicle Vaults" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-black mb-2 animate-slide-up text-gray-900">
            Forgot Password?
          </h1>
          <p className="text-neutral-700 text-base font-semibold">
            No worries! Enter your email and we'll send you reset instructions.
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
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-2 font-medium">
                We've sent password reset instructions to:
              </p>
              <p className="text-accent-600 font-bold mb-6 text-lg">
                {email}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please check your inbox and spam folder. The link will expire in 1 hour.
              </p>
              <Link
                to="/authentication"
                className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-700 font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-neutral-900 font-bold mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className={`input-modern w-full pl-10 pr-4 ${
                      error ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="your.email@example.com"
                    disabled={loading}
                  />
                </div>
                {error && (
                  <p className="text-red-600 text-sm mt-2 font-semibold">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 px-6 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>

              <div className="mt-6 text-center">
                <Link
                  to="/authentication"
                  className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-700 font-bold text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-neutral-700">
          <p className="font-semibold">
            Need help?{' '}
            <Link to="/contact" className="text-accent-600 hover:text-accent-700 font-black underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
