import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ShoppingBag, MapPin, CreditCard, Package, ChevronRight, ChevronLeft, Edit2, X, Plus } from 'lucide-react';
import { orderService, authService } from '../services';
import paymentService from '../services/paymentService';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get cart items from location state or use empty array
  const [cartItems, setCartItems] = useState(location.state?.cartItems || []);

  // Debug logging
  console.log('🛒 Checkout Page Loaded');
  console.log('📦 Cart Items from Navigation:', cartItems);
  console.log('📦 Cart Items Count:', cartItems.length);

  const [currentStep, setCurrentStep] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',

    // Shipping Address
    address: '',
    city: '',
    state: '',
    pincode: '',

    // Payment Method
    paymentMethod: 'cod',

    // Card Details (if card payment selected)
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const [errors, setErrors] = useState({});

  // Fetch saved addresses and load Razorpay script on component mount
  useEffect(() => {
    fetchSavedAddresses();

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      console.log('📍 Fetching saved addresses...');

      // Get user email from localStorage
      const storedUser = localStorage.getItem('user');
      const userEmail = storedUser ? JSON.parse(storedUser).email : '';
      console.log('📧 User Email from localStorage:', userEmail);

      const response = await authService.getAddresses();
      console.log('📍 Address Response:', response);

      if (response.data && response.data.success && response.data.data) {
        console.log('📍 Found addresses:', response.data.data.length);
        setSavedAddresses(response.data.data);

        // Find and select default address
        const defaultAddress = response.data.data.find(addr => addr.isDefault);
        if (defaultAddress) {
          console.log('📍 Using default address:', defaultAddress);
          setSelectedAddressId(defaultAddress._id);
          // Pre-fill form with default address and user email
          setFormData(prev => ({
            ...prev,
            fullName: defaultAddress.name,
            email: userEmail,
            phone: defaultAddress.phone,
            address: defaultAddress.address,
            city: defaultAddress.city,
            state: defaultAddress.state,
            pincode: defaultAddress.pincode
          }));
        } else if (response.data.data.length > 0) {
          // If no default, select first address
          console.log('📍 Using first address:', response.data.data[0]);
          const firstAddr = response.data.data[0];
          setSelectedAddressId(firstAddr._id);
          setFormData(prev => ({
            ...prev,
            fullName: firstAddr.name,
            email: userEmail,
            phone: firstAddr.phone,
            address: firstAddr.address,
            city: firstAddr.city,
            state: firstAddr.state,
            pincode: firstAddr.pincode
          }));
        } else {
          // No saved addresses, user must enter new one
          console.log('📍 No saved addresses found - showing form');
          setUseNewAddress(true);
          // Still set email for new address form
          setFormData(prev => ({
            ...prev,
            email: userEmail
          }));
        }
      } else {
        console.log('📍 No addresses in response');
        setUseNewAddress(true);
        // Still set email for new address form
        setFormData(prev => ({
          ...prev,
          email: userEmail
        }));
      }
    } catch (error) {
      console.error('❌ Failed to fetch addresses:', error);
      console.error('❌ Error details:', error.response?.data);
      setUseNewAddress(true);
      // Get user email even in error case
      const storedUser = localStorage.getItem('user');
      const userEmail = storedUser ? JSON.parse(storedUser).email : '';
      setFormData(prev => ({
        ...prev,
        email: userEmail
      }));
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address._id);
    setUseNewAddress(false);

    // Get user email from localStorage
    const storedUser = localStorage.getItem('user');
    const userEmail = storedUser ? JSON.parse(storedUser).email : '';

    setFormData(prev => ({
      ...prev,
      fullName: address.name,
      email: userEmail,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode
    }));
  };

  // Calculate totals with REVERSE GST calculation
  // Product prices already include GST, so we need to extract the GST amount
  const priceBreakdown = cartItems.reduce((acc, item) => {
    const priceIncludingGst = item.price * (item.quantity || 1);
    const gstRate = item.gst || 0;

    // Reverse GST calculation: Base = Price / (1 + GST%/100)
    const baseAmount = priceIncludingGst / (1 + gstRate / 100);
    const gstAmount = priceIncludingGst - baseAmount;

    return {
      subtotal: acc.subtotal + baseAmount,
      tax: acc.tax + gstAmount,
      totalGST: acc.totalGST + gstRate
    };
  }, { subtotal: 0, tax: 0, totalGST: 0 });

  const subtotal = priceBreakdown.subtotal;
  const tax = priceBreakdown.tax;

  // Calculate average GST percentage for display
  const averageGST = cartItems.length > 0 ? priceBreakdown.totalGST / cartItems.length : 0;

  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping + tax;
  const discount = 0;

  const steps = [
    { number: 1, title: 'BAG', icon: ShoppingBag },
    { number: 2, title: 'ADDRESS', icon: MapPin },
    { number: 3, title: 'PAYMENT', icon: CreditCard },
    { number: 4, title: 'SUMMARY', icon: Package }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    const newErrors = { ...errors };

    // Full Name - Only alphabetic characters and spaces
    if (name === 'fullName') {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, '');
      if (value !== sanitizedValue && value.length > 0) {
        newErrors.fullName = 'Only alphabetic characters and spaces allowed';
      } else if (sanitizedValue.trim().length === 0 && value.length > 0) {
        newErrors.fullName = 'Full name is required';
      } else {
        delete newErrors.fullName;
      }
    }

    // Phone - Only numbers, max 10 digits
    if (name === 'phone') {
      sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      if (value !== sanitizedValue && value.length > 0) {
        newErrors.phone = 'Only numbers allowed';
      } else if (sanitizedValue.length > 0 && sanitizedValue.length < 10) {
        newErrors.phone = `Enter ${10 - sanitizedValue.length} more digit${10 - sanitizedValue.length > 1 ? 's' : ''}`;
      } else {
        delete newErrors.phone;
      }
    }

    // City/District - Only alphabetic characters and spaces
    if (name === 'city') {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, '');
      if (value !== sanitizedValue && value.length > 0) {
        newErrors.city = 'Only alphabetic characters and spaces allowed';
      } else if (sanitizedValue.trim().length === 0 && value.length > 0) {
        newErrors.city = 'City/District is required';
      } else {
        delete newErrors.city;
      }
    }

    // State - Only alphabetic characters and spaces
    if (name === 'state') {
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
    if (name === 'pincode') {
      sanitizedValue = value.replace(/[^0-9]/g, '');
      if (value !== sanitizedValue && value.length > 0) {
        newErrors.pincode = 'Only numbers allowed';
      } else if (sanitizedValue.trim().length === 0 && value.length > 0) {
        newErrors.pincode = 'Pincode is required';
      } else {
        delete newErrors.pincode;
      }
    }

    // Email validation
    if (name === 'email') {
      if (value.length > 0 && !/\S+@\S+\.\S+/.test(value)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    }

    // Address validation
    if (name === 'address') {
      if (value.trim().length === 0 && value.length > 0) {
        newErrors.address = 'Address is required';
      } else {
        delete newErrors.address;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    setErrors(newErrors);
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Bag validation
      if (!cartItems || cartItems.length === 0) {
        alert('Your cart is empty!');
        return false;
      }
    }

    if (step === 2) {
      // Address validation
      console.log('🔍 Validating Step 2 - Form Data:', formData);

      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      else if (!/^[A-Za-z\s]+$/.test(formData.fullName)) newErrors.fullName = 'Only alphabetic characters allowed';

      if (!formData.email || !formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';

      console.log('🔍 Validation Errors:', newErrors);

      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';

      if (!formData.address.trim()) newErrors.address = 'Address is required';

      if (!formData.city.trim()) newErrors.city = 'City/District is required';
      else if (!/^[A-Za-z\s]+$/.test(formData.city)) newErrors.city = 'Only alphabetic characters allowed';

      if (!formData.state.trim()) newErrors.state = 'State is required';
      else if (!/^[A-Za-z\s]+$/.test(formData.state)) newErrors.state = 'Only alphabetic characters allowed';

      if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
      else if (!/^[0-9]+$/.test(formData.pincode)) newErrors.pincode = 'Only numeric characters allowed';
    }

    if (step === 3) {
      // Payment validation
      if (formData.paymentMethod === 'card') {
        if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
        else if (!/^[0-9]{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) newErrors.cardNumber = 'Invalid card';
        if (!formData.cardName.trim()) newErrors.cardName = 'Card holder name is required';
        if (!formData.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
        if (!formData.cvv.trim()) newErrors.cvv = 'CVV is required';
        else if (!/^[0-9]{3,4}$/.test(formData.cvv)) newErrors.cvv = 'Invalid CVV';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleRemoveItem = (indexToRemove) => {
    const updatedCart = cartItems.filter((_, index) => index !== indexToRemove);
    setCartItems(updatedCart);

    // If cart becomes empty, redirect back to home
    if (updatedCart.length === 0) {
      alert('Your cart is empty! Redirecting to home page.');
      navigate('/');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first to place an order');
        navigate('/authentication');
        return;
      }

      console.log('🛒 Placing order...');
      console.log('📦 Order Data:', {
        cartItems,
        formData,
        subtotal,
        tax,
        shipping,
        total
      });

      // If using new address (not from saved addresses), save it first
      if (useNewAddress && formData.fullName && formData.address) {
        try {
          console.log('💾 Saving new address...');
          const addressData = {
            name: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            type: 'Home', // Default type
            isDefault: savedAddresses.length === 0 // Set as default if first address
          };

          const addressResponse = await authService.addAddress(addressData);
          if (addressResponse.data && addressResponse.data.success) {
            console.log('✅ Address saved successfully');
          }
        } catch (error) {
          console.error('⚠️ Failed to save address (non-critical):', error);
          // Don't stop order placement if address save fails
        }
      }

      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item._id || item.id,
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price,
          image: item.images?.[0] || item.image || '/placeholder.jpg',
          gst: item.gst || 0,
          hsnCode: item.hsnCode || '97050090', // HSN code for collectibles
          description: item.description || item.name
        })),
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.pincode,
          country: 'India'
        },
        paymentMethod: formData.paymentMethod === 'cod' ? 'COD' : 'Card',
        itemsPrice: subtotal,
        taxPrice: tax,
        shippingPrice: shipping,
        totalPrice: total
      };

      console.log('📨 Sending order data:', orderData);

      const response = await orderService.createOrder(orderData);

      console.log('📬 Response received:', response);

      if (response && response.data && response.data.success) {
        setOrderId(response.data.data._id);
        setOrderPlaced(true);
        localStorage.removeItem('cart');
        console.log('✅ Order created successfully:', response.data.data);
      } else {
        const errorMsg = response?.data?.message || response?.message || 'Unknown error occurred';
        console.error('❌ Order failed:', errorMsg);
        alert('Failed to place order: ' + errorMsg);
      }
    } catch (error) {
      console.error('❌ Error placing order:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Network error. Please check your connection and try again.';

      alert('Failed to place order: ' + errorMessage);
    }
  };

  // Order Success Screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={48} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-6">Thank you for your order. Your order has been confirmed.</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Order ID</p>
            <p className="text-2xl font-bold text-amber-600 mb-4">{orderId}</p>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">₹{total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.paymentMethod === 'cod' ? 'COD' : 'Card'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/profile')}
              className="px-8 py-3 border-2 border-amber-500 text-amber-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Checkout Page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Step Indicator */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep >= step.number
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  {/* Step Title */}
                  <p className={`text-xs mt-2 font-semibold ${
                    currentStep >= step.number ? 'text-amber-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 -mt-8 ${
                    currentStep > step.number ? 'bg-amber-500' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left - Step Content */}
          <div className="lg:col-span-2">

            {/* Step 1: BAG */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <ShoppingBag className="w-6 h-6 text-amber-600 mr-2" />
                  Shopping Bag ({cartItems.length} items)
                </h2>

                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 border rounded-lg relative">
                      <img
                        src={item.images?.[0] || item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">Quantity: {item.quantity || 1}</p>
                        <p className="text-lg font-bold text-amber-600">₹{item.price}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="absolute top-2 right-2 p-2 hover:bg-red-50 rounded-full transition-colors group"
                        title="Remove item"
                      >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: ADDRESS */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <MapPin className="w-6 h-6 text-amber-600 mr-2" />
                  Delivery Address
                </h2>

                {/* Show all saved addresses with selection */}
                {savedAddresses.length > 0 && !useNewAddress && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg">Choose Delivery Address</h3>
                      <button
                        onClick={() => {
                          setUseNewAddress(true);
                          setSelectedAddressId(null);
                          const storedUser = localStorage.getItem('user');
                          const userEmail = storedUser ? JSON.parse(storedUser).email : '';
                          setFormData(prev => ({
                            ...prev,
                            fullName: '',
                            email: userEmail,
                            phone: '',
                            address: '',
                            city: '',
                            state: '',
                            pincode: ''
                          }));
                        }}
                        className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Address
                      </button>
                    </div>

                    <div className="space-y-3">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr._id}
                          onClick={() => handleSelectAddress(addr)}
                          className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedAddressId === addr._id
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-amber-300 bg-white'
                          }`}
                        >
                          {/* Radio button */}
                          <div className="flex items-start gap-3">
                            <div className="pt-1">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedAddressId === addr._id
                                  ? 'border-amber-600 bg-amber-600'
                                  : 'border-gray-300'
                              }`}>
                                {selectedAddressId === addr._id && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                            </div>

                            <div className="flex-1">
                              {/* Address Type & Default Badge */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                                  {addr.type || 'Home'}
                                </span>
                                {addr.isDefault && (
                                  <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                                    DEFAULT
                                  </span>
                                )}
                              </div>

                              <p className="font-semibold text-gray-900 mb-1">{addr.name}</p>
                              <p className="text-sm text-gray-700 mb-1">{addr.address}</p>
                              <p className="text-sm text-gray-700 mb-1">{addr.city}, {addr.state} - {addr.pincode}</p>
                              <p className="text-sm text-gray-600">Phone: {addr.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show form only if using new address or no saved addresses */}
                {(useNewAddress || savedAddresses.length === 0) && (
                  <>
                    {savedAddresses.length > 0 && (
                      <div className="mb-4">
                        <button
                          onClick={() => {
                            setUseNewAddress(false);
                            if (savedAddresses.length > 0) {
                              const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
                              handleSelectAddress(defaultAddr);
                            }
                          }}
                          className="flex items-center gap-1 text-amber-600 hover:underline text-sm font-medium"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Use saved address
                        </button>
                      </div>
                    )}
                    <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name *"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email *"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <div className="flex gap-2">
                      <div className="w-20">
                        <input
                          type="text"
                          value="+91"
                          readOnly
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-center font-semibold"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="tel"
                          name="phone"
                          placeholder="10 digit mobile number"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <input
                      type="text"
                      name="address"
                      placeholder="Address (House No, Building, Street) *"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        name="city"
                        placeholder="City / District *"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <input
                        type="text"
                        name="state"
                        placeholder="State *"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          errors.state ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="Pincode *"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.pincode ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                  </div>
                </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: PAYMENT */}
            {currentStep === 3 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <CreditCard className="w-6 h-6 text-amber-600 mr-2" />
                  Payment Options
                </h2>

                <div className="space-y-3">
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === 'cod' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-3 font-medium">Cash on Delivery</span>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === 'card' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-3 font-medium">Credit / Debit Card</span>
                  </label>
                </div>

                {formData.paymentMethod === 'card' && (
                  <div className="mt-6 space-y-4 border-t pt-6">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Card Number"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      maxLength="16"
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      type="text"
                      name="cardName"
                      placeholder="Name on Card"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="text"
                        name="cvv"
                        placeholder="CVV"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        maxLength="4"
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: SUMMARY */}
            {currentStep === 4 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <Package className="w-6 h-6 text-amber-600 mr-2" />
                  Order Summary
                </h2>

                <div className="space-y-6">
                  {/* Delivery Address */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">Delivery Address</h3>
                      <button onClick={() => setCurrentStep(2)} className="text-amber-600 text-sm flex items-center">
                        <Edit2 className="w-4 h-4 mr-1" /> Edit
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">{formData.fullName}</p>
                    <p className="text-sm text-gray-600">{formData.address}</p>
                    <p className="text-sm text-gray-600">{formData.city}, {formData.state} - {formData.pincode}</p>
                    <p className="text-sm text-gray-600">Phone: {formData.phone}</p>
                  </div>

                  {/* Payment Method */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">Payment Method</h3>
                      <button onClick={() => setCurrentStep(3)} className="text-amber-600 text-sm flex items-center">
                        <Edit2 className="w-4 h-4 mr-1" /> Edit
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                    <div className="space-y-3">
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex gap-3 border-b pb-3 last:border-0">
                          <img src={item.images?.[0] || item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                            <p className="text-sm font-bold text-amber-600">₹{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-6">
              {currentStep === 1 ? (
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center px-6 py-3 border-2 border-amber-500 text-amber-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Continue Shopping
                </button>
              ) : (
                <button
                  onClick={handleBack}
                  className="flex items-center px-6 py-3 border-2 border-amber-500 text-amber-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Back
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Place Order
                </button>
              )}
            </div>
          </div>

          {/* Right - Price Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 pb-4 border-b">Price Details</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Bag Total</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">- ₹{discount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-medium">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (GST {averageGST.toFixed(1)}%)</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-amber-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {shipping > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-800">
                      💡 Add ₹{(1000 - subtotal).toFixed(2)} more to get FREE delivery
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
