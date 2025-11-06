import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import posterImage from '../../assets/poster.png';
import { API_BASE_URL } from '../../constants/api';
import CenterNotification from '../../components/common/CenterNotification';

const Authentication = ({ setUser }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('welcome');

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For name field, allow only alphabets and spaces
    if (name === 'name') {
      const onlyAlphabets = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({
        ...formData,
        [name]: onlyAlphabets
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation (for signup)
    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!isLogin && formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase and lowercase letters';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm password validation (for signup)
    if (!isLogin && !formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOtp = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setShowOtpInput(true);
        alert(`OTP sent to ${formData.email}! Check your email.`);
      } else {
        setErrors({ ...errors, email: data.message || 'Failed to send OTP' });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setErrors({ ...errors, email: 'Failed to send OTP. Please try again.' });
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowOtpInput(false);
        setSubmitted(true);

        // Store user data
        const userData = {
          name: data.data.name,
          email: data.data.email,
          role: data.data.role
        };

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.data.token);

        if (setUser) {
          setUser(userData);
        }

        // Show welcome notification
        setNotificationMessage('Welcome to Chronicle Vaults');
        setNotificationType('welcome');
        setShowNotification(true);

        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setErrors({ ...errors, otp: data.message || 'Invalid OTP. Please try again.' });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setErrors({ ...errors, otp: 'Failed to verify OTP. Please try again.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // For signup, send OTP
    if (!isLogin) {
      sendOtp();
    } else {
      // For login, call backend API
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (data.success) {
          setSubmitted(true);

          // Store user data
          const userData = {
            name: data.data.name,
            email: data.data.email,
            role: data.data.role,
            legacyRole: data.data.legacyRole,
            isAdmin: data.data.isAdmin,
            isSuperAdmin: data.data.isSuperAdmin
          };

          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('token', data.data.token);

          if (setUser) {
            setUser(userData);
          }

          // Show login notification
          setNotificationMessage('Welcome Back!');
          setNotificationType('login');
          setShowNotification(true);

          console.log('Login Data:', data.data);
          console.log('Is Admin?', data.data.isAdmin);
          console.log('Is Super Admin?', data.data.isSuperAdmin);
          console.log('Legacy Role:', data.data.legacyRole);

          setTimeout(() => {
            // Redirect based on role
            if (data.data.isAdmin || data.data.isSuperAdmin || data.data.legacyRole === 'admin' || data.data.legacyRole === 'superadmin') {
              console.log('Redirecting to admin dashboard...');
              navigate('/admin/dashboard');
            } else {
              console.log('Redirecting to home...');
              navigate('/');
            }
          }, 3000);
        } else {
          setErrors({ ...errors, email: data.message || 'Invalid credentials' });
        }
      } catch (error) {
        console.error('Login error:', error);
        setErrors({ ...errors, email: 'Login failed. Please try again.' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-scale-in overflow-hidden">
            <img src={posterImage} alt="Chronicle Vaults" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-5xl font-black mb-2 animate-slide-up">
            <span className="text-gradient">Welcome Back!</span>
          </h1>
          <p className="text-neutral-700 text-lg font-semibold">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="card-premium p-2 mb-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setIsLogin(true);
                setSubmitted(false);
              }}
              className={`py-3 px-4 rounded-xl font-bold transition-all ₹{
                isLogin
                  ? 'btn-primary'
                  : 'bg-primary-100 text-neutral-900 hover:bg-primary-200'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setSubmitted(false);
              }}
              className={`py-3 px-4 rounded-xl font-bold transition-all ₹{
                !isLogin
                  ? 'btn-primary'
                  : 'bg-primary-100 text-neutral-900 hover:bg-primary-200'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Sign Up
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="card-premium p-8">
          {submitted && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6 shadow-soft">
              <p className="font-black">
                {isLogin ? 'Login successful!' : 'Account created successfully!'}
              </p>
              <p className="text-sm font-semibold">
                {isLogin ? 'Redirecting to dashboard...' : 'Please check your email to verify your account.'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name Field - Only for Sign Up */}
            {!isLogin && !showOtpInput && (
              <div className="mb-4">
                <label className="block text-neutral-900 font-bold mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-modern w-full pl-10 pr-4 ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1 font-semibold">{errors.name}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            {!showOtpInput && (
              <div className="mb-4">
                <label className="block text-neutral-900 font-bold mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-modern w-full pl-10 pr-4 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="your.email@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1 font-semibold">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password Field */}
            {!showOtpInput && (
              <div className="mb-4">
                <label className="block text-neutral-900 font-bold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-modern w-full pl-10 pr-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-600 hover:text-accent-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1 font-semibold">{errors.password}</p>
                )}
              </div>
            )}

            {/* Confirm Password - Only for Sign Up */}
            {!isLogin && !showOtpInput && (
              <div className="mb-4">
                <label className="block text-neutral-900 font-bold mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-modern w-full pl-10 pr-12 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-neutral-600 hover:text-accent-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1 font-semibold">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* OTP Input - Only for Sign Up after form submission */}
            {!isLogin && showOtpInput && (
              <div className="mb-4">
                <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 mb-4">
                  <p className="text-blue-900 font-bold mb-1">Email Verification Required</p>
                  <p className="text-blue-700 text-sm">
                    A 6-digit OTP has been sent to <strong>{formData.email}</strong>
                  </p>
                </div>
                <label className="block text-neutral-900 font-bold mb-2">Enter OTP</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-600" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                      if (errors.otp) {
                        setErrors({ ...errors, otp: '' });
                      }
                    }}
                    className={`input-modern w-full pl-10 pr-4 ${errors.otp ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                  />
                </div>
                {errors.otp && (
                  <p className="text-red-600 text-sm mt-1 font-semibold">{errors.otp}</p>
                )}
                {otpSent && (
                  <p className="text-green-600 text-sm mt-1 font-semibold">
                    OTP sent to {formData.email}
                  </p>
                )}
                <button
                  type="button"
                  onClick={verifyOtp}
                  className="btn-primary w-full mt-4 py-3 px-6 rounded-xl font-bold"
                >
                  Verify OTP
                </button>
                <button
                  type="button"
                  onClick={sendOtp}
                  className="btn-secondary w-full mt-2 py-2 px-6 rounded-xl font-semibold text-sm"
                >
                  Resend OTP
                </button>
              </div>
            )}

            {/* Remember Me & Forgot Password - Only for Login */}
            {isLogin && (
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 w-4 h-4 rounded accent-accent-500" />
                  <span className="text-sm text-neutral-700 font-semibold">Remember me</span>
                </label>
                <a href="#" className="text-sm text-accent-600 hover:text-accent-700 font-bold">
                  Forgot password?
                </a>
              </div>
            )}

            {/* Terms - Only for Sign Up */}
            {!isLogin && (
              <div className="mb-6">
                <label className="flex items-start">
                  <input type="checkbox" required className="mr-2 mt-1 w-4 h-4 rounded accent-accent-500" />
                  <span className="text-sm text-neutral-700 font-semibold">
                    I agree to the{' '}
                    <a href="#" className="text-accent-600 hover:text-accent-700 font-bold underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-accent-600 hover:text-accent-700 font-bold underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>
            )}

            {/* Submit Button - Hide when OTP screen is showing */}
            {!showOtpInput && (
              <button
                type="submit"
                className="btn-primary w-full py-3.5 px-6 rounded-xl font-bold text-lg"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            )}
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t-2 border-primary-300"></div>
            <span className="px-4 text-sm text-neutral-700 font-bold">OR</span>
            <div className="flex-1 border-t-2 border-primary-300"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button className="btn-secondary w-full py-3 px-6 rounded-xl flex items-center justify-center gap-3 font-bold hover:scale-105">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button className="btn-secondary w-full py-3 px-6 rounded-xl flex items-center justify-center gap-3 font-bold hover:scale-105">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continue with Facebook
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-6 text-center text-sm text-neutral-700 font-semibold">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setSubmitted(false);
            }}
            className="text-accent-600 hover:text-accent-700 font-black underline"
          >
            {isLogin ? 'Sign up here' : 'Login here'}
          </button>
        </div>
      </div>

      {/* Center Notification */}
      <CenterNotification
        message={notificationMessage}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        type={notificationType}
      />
    </div>
  );
};

export default Authentication;
