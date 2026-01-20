import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, User, Building2, Calendar, FileText, MapPin, Phone, Mail, Globe, Image, Shield, Users, AlertCircle, Info } from 'lucide-react';
import api from '../utils/api';

const AuctionRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: 'Mr.',
    fullName: '',
    companyName: '',
    dateOfBirth: '',
    gstNumber: '',
    stateCode: '',
    billingAddress: {
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      country: 'India',
      state: '',
      city: '',
      pinCode: ''
    },
    sameAsBilling: true,
    shippingAddress: {
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      country: 'India',
      state: '',
      city: '',
      pinCode: ''
    },
    mobile: '',
    email: '',
    phone: '',
    website: '',
    panCard: null,
    panNumber: '',
    idProof: {
      proofType: 'aadhar',
      file: null
    },
    collectingInterests: '',
    references: [
      { name: '', city: '', mobile: '' },
      { name: '', city: '', mobile: '' },
      { name: '', city: '', mobile: '' }
    ]
  });

  // Pre-fill user data from localStorage and check if already verified
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);

        // If user is already auction verified, redirect to auctions
        if (user.isAuctionVerified) {
          setError('You are already registered for auctions!');
          setTimeout(() => {
            navigate('/auctions?status=Active');
          }, 2000);
          return;
        }

        setFormData(prev => ({
          ...prev,
          fullName: user.name || '',
          email: user.email || '',
          mobile: user.phone || ''
        }));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('billing.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value
        }
      }));
    } else if (name.startsWith('shipping.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [field]: value
        }
      }));
    } else if (name === 'sameAsBilling') {
      setFormData(prev => ({
        ...prev,
        sameAsBilling: checked
      }));
    } else if (name === 'idProofType') {
      setFormData(prev => ({
        ...prev,
        idProof: {
          ...prev.idProof,
          proofType: value
        }
      }));
    } else if (name === 'panNumber') {
      // Soft validation: just convert to uppercase, allow any input
      const upperValue = value.toUpperCase();
      setFormData(prev => ({
        ...prev,
        panNumber: upperValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleReferenceChange = (index, field, value) => {
    setFormData(prev => {
      const newReferences = [...prev.references];
      newReferences[index][field] = value;
      return { ...prev, references: newReferences };
    });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (fieldName === 'panCard') {
        setFormData(prev => ({ ...prev, panCard: reader.result }));
      } else if (fieldName === 'idProof') {
        setFormData(prev => ({
          ...prev,
          idProof: {
            ...prev.idProof,
            file: reader.result
          }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Check at least 1 reference is filled
      const hasAtLeastOneReference = formData.references.some(ref =>
        ref.name.trim() !== '' || ref.city.trim() !== '' || ref.mobile.trim() !== ''
      );

      if (!hasAtLeastOneReference) {
        setError('Please provide at least 1 reference (or write "NA" if no references)');
        setLoading(false);
        return;
      }

      // Soft validation - allow submission even if fields are incomplete
      const submitData = {
        ...formData,
        idProof: {
          proofType: formData.idProof.proofType,
          url: formData.idProof.file
        },
        panCard: formData.panCard
      };

      console.log('📤 Submitting auction registration:', submitData);
      const response = await api.post('/auction-registration', submitData);
      console.log('✅ Response:', response);

      setMessage(response.message);
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      console.error('❌ Auction registration error:', err);
      console.error('Response data:', err.response?.data);
      console.error('Status:', err.response?.status);

      const errorMsg = err.response?.message || 'Error submitting registration';
      const validationErrors = err.response?.validationErrors;

      if (validationErrors) {
        console.error('Validation errors:', validationErrors);
        setError(`${errorMsg}\n${validationErrors.map(e => `${e.field}: ${e.message}`).join('\n')}`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-4 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Auction Registration</h1>
          <p className="text-lg text-gray-600">Join Chronicle Vaults Exclusive Auction Platform</p>
        </div>

        {/* Important Notices */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 mb-1">Registration Eligibility</p>
              <p className="text-sm text-red-700">Only Indian Residents / NRI having valid address in India can register.</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg shadow-md">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 mb-1">Export Restrictions</p>
              <p className="text-sm text-blue-700 italic">Items over 100 years old cannot be taken out of India without permission from the Director General, Archaeological Survey of India.</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg shadow-md animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">{message}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-md animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-amber-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-amber-200">
              <div className="p-3 bg-amber-100 rounded-lg">
                <User className="w-6 h-6 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 text-amber-600" />
                  Title <span className="text-red-600">*</span>
                </label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Miss">Miss</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 text-amber-600" />
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  Date of Birth <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  State Code
                </label>
                <input
                  type="text"
                  name="stateCode"
                  value={formData.stateCode}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-amber-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-amber-200">
              <div className="p-3 bg-amber-100 rounded-lg">
                <MapPin className="w-6 h-6 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Billing Address</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  Address Line 1 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="billing.addressLine1"
                  value={formData.billingAddress.addressLine1}
                  onChange={handleChange}
                  required
                  placeholder="Street address, P.O. box"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="billing.addressLine2"
                    value={formData.billingAddress.addressLine2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, unit, building"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    Address Line 3
                  </label>
                  <input
                    type="text"
                    name="billing.addressLine3"
                    value={formData.billingAddress.addressLine3}
                    onChange={handleChange}
                    placeholder="Additional address information"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    Country <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="billing.country"
                    value={formData.billingAddress.country}
                    onChange={handleChange}
                    required
                    readOnly
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    State <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="billing.state"
                    value={formData.billingAddress.state}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Gujarat, Maharashtra"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    City <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="billing.city"
                    value={formData.billingAddress.city}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Ahmedabad, Mumbai"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    Pin Code <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="billing.pinCode"
                    value={formData.billingAddress.pinCode}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{6}"
                    placeholder="6-digit PIN code"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-amber-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-amber-200">
              <div className="p-3 bg-amber-100 rounded-lg">
                <MapPin className="w-6 h-6 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Shipping Address</h2>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="sameAsBilling"
                  checked={formData.sameAsBilling}
                  onChange={handleChange}
                  className="w-5 h-5 text-amber-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-amber-600 transition-colors">
                  Same as Billing Address
                </span>
              </label>
            </div>

            {!formData.sameAsBilling && (
              <div className="grid grid-cols-1 gap-6 animate-fade-in">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    Address Line 1 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="shipping.addressLine1"
                    value={formData.shippingAddress.addressLine1}
                    onChange={handleChange}
                    required={!formData.sameAsBilling}
                    placeholder="Street address, P.O. box"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Address Line 2</label>
                    <input
                      type="text"
                      name="shipping.addressLine2"
                      value={formData.shippingAddress.addressLine2}
                      onChange={handleChange}
                      placeholder="Apartment, suite, unit"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Address Line 3</label>
                    <input
                      type="text"
                      name="shipping.addressLine3"
                      value={formData.shippingAddress.addressLine3}
                      onChange={handleChange}
                      placeholder="Additional information"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      State <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="shipping.state"
                      value={formData.shippingAddress.state}
                      onChange={handleChange}
                      required={!formData.sameAsBilling}
                      placeholder="e.g., Gujarat"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      City <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="shipping.city"
                      value={formData.shippingAddress.city}
                      onChange={handleChange}
                      required={!formData.sameAsBilling}
                      placeholder="e.g., Ahmedabad"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Pin Code <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="shipping.pinCode"
                      value={formData.shippingAddress.pinCode}
                      onChange={handleChange}
                      required={!formData.sameAsBilling}
                      pattern="[0-9]{6}"
                      placeholder="6-digit PIN code"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-amber-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-amber-200">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Phone className="w-6 h-6 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Contact Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 text-amber-600" />
                  Mobile Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 text-amber-600" />
                  Email ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 text-amber-600" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Globe className="w-4 h-4 text-amber-600" />
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-amber-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-amber-200">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Image className="w-6 h-6 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Document Attachment</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                  <FileText className="w-5 h-5 text-amber-600" />
                  PAN Card Photo
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl cursor-pointer hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl">
                    <Upload className="w-5 h-5" />
                    <span className="font-semibold">Upload PAN Card</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'panCard')}
                      className="hidden"
                    />
                  </label>
                  {formData.panCard && (
                    <span className="flex items-center gap-2 text-green-700 font-medium bg-green-100 px-4 py-2 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      File uploaded
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    PAN Number
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="ABCDE1234F"
                    className="w-full md:w-1/2 border-2 border-amber-300 rounded-xl px-4 py-3 font-bold text-lg uppercase focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all tracking-wider"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-300">AAAAA-9999-A</span>
                    <span className="text-xs text-gray-600">Format: 5 letters, 4 numbers, 1 letter (optional)</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                  <Shield className="w-5 h-5 text-blue-600" />
                  ID Proof <span className="text-red-600">*</span>
                </label>

                <div className="mb-4">
                  <select
                    name="idProofType"
                    value={formData.idProof.proofType}
                    onChange={handleChange}
                    required
                    className="w-full md:w-auto border-2 border-blue-300 rounded-xl px-6 py-3 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="aadhar">Aadhar Card</option>
                    <option value="govt-id">Government ID Proof</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                    <Upload className="w-5 h-5" />
                    <span className="font-semibold">Upload ID Proof</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'idProof')}
                      className="hidden"
                    />
                  </label>
                  {formData.idProof.file && (
                    <span className="flex items-center gap-2 text-green-700 font-medium bg-green-100 px-4 py-2 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      File uploaded
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Collecting Interests */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-amber-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-amber-200">
              <div className="p-3 bg-amber-100 rounded-lg">
                <FileText className="w-6 h-6 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Collecting Interests</h2>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Please describe your collecting interests
              </label>
              <textarea
                name="collectingInterests"
                value={formData.collectingInterests}
                onChange={handleChange}
                rows={5}
                placeholder="e.g., Ancient coins, Mughal era coins, British India coins, commemorative coins, etc."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* References */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-amber-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-amber-200">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Users className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">References <span className="text-red-600">*</span></h2>
                <p className="text-sm text-gray-600 mt-1">At least 1 reference required (write "NA" if no references)</p>
              </div>
            </div>

            <div className="space-y-6">
              {formData.references.map((ref, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Reference {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 text-gray-600" />
                        Name
                      </label>
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                        placeholder="Reference name or NA"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        City
                      </label>
                      <input
                        type="text"
                        value={ref.city}
                        onChange={(e) => handleReferenceChange(index, 'city', e.target.value)}
                        placeholder="City or NA"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        Mobile
                      </label>
                      <input
                        type="tel"
                        value={ref.mobile}
                        onChange={(e) => handleReferenceChange(index, 'mobile', e.target.value)}
                        placeholder="Mobile or NA"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={loading}
              className="group relative px-12 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-lg font-bold rounded-2xl hover:from-amber-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Registration...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6" />
                  Submit Registration
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuctionRegistration;
