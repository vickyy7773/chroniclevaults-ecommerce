import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const AuctionRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Personal Information
    title: 'Mr.',
    fullName: '',
    companyName: '',
    dateOfBirth: '',
    gstNumber: '',
    stateCode: '',

    // Billing Address
    billingAddress: {
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      country: 'India',
      state: '',
      city: '',
      pinCode: ''
    },

    // Shipping Address
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

    // Contact Details
    mobile: '',
    email: '',
    phone: '',
    website: '',

    // Documents
    panCard: null,
    idProof: {
      proofType: 'aadhar',
      file: null
    },

    // Collecting Interests
    collectingInterests: '',

    // References
    references: [
      { name: '', city: '', mobile: '' },
      { name: '', city: '', mobile: '' },
      { name: '', city: '', mobile: '' }
    ]
  });

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

    // Convert to base64
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
      // Prepare data for submission
      const submitData = {
        ...formData,
        idProof: {
          proofType: formData.idProof.proofType,
          url: formData.idProof.file
        },
        panCard: formData.panCard
      };

      const response = await api.post('/auction-registration', submitData);

      setMessage(response.data.message);
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Auction Registration Form</h1>
        <p className="text-sm text-red-600 mb-6">
          * Only Indian Residents / NRI having valid address in India can register.
        </p>
        <p className="text-xs text-gray-600 mb-8 italic">
          Items over 100 years old cannot be taken out of India without permission from the Director General, Archaeological Survey of India.
        </p>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{message}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-600">*</span>
                </label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Miss">Miss</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State Code
                </label>
                <input
                  type="text"
                  name="stateCode"
                  value={formData.stateCode}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Billing Address */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Billing Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="billing.addressLine1"
                  value={formData.billingAddress.addressLine1}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="billing.addressLine2"
                  value={formData.billingAddress.addressLine2}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 3
                </label>
                <input
                  type="text"
                  name="billing.addressLine3"
                  value={formData.billingAddress.addressLine3}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="billing.country"
                  value={formData.billingAddress.country}
                  onChange={handleChange}
                  required
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="billing.state"
                  value={formData.billingAddress.state}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="billing.city"
                  value={formData.billingAddress.city}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Shipping Address</h2>

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="sameAsBilling"
                  checked={formData.sameAsBilling}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Same as Billing Address
                </span>
              </label>
            </div>

            {!formData.sameAsBilling && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="shipping.addressLine1"
                    value={formData.shippingAddress.addressLine1}
                    onChange={handleChange}
                    required={!formData.sameAsBilling}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="shipping.addressLine2"
                    value={formData.shippingAddress.addressLine2}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 3
                  </label>
                  <input
                    type="text"
                    name="shipping.addressLine3"
                    value={formData.shippingAddress.addressLine3}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="shipping.state"
                    value={formData.shippingAddress.state}
                    onChange={handleChange}
                    required={!formData.sameAsBilling}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="shipping.city"
                    value={formData.shippingAddress.city}
                    onChange={handleChange}
                    required={!formData.sameAsBilling}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Contact Details */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Documents */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Document Attachment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Card Photo <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg cursor-pointer hover:bg-amber-700">
                    <Upload size={18} />
                    <span>Upload PAN Card</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'panCard')}
                      required
                      className="hidden"
                    />
                  </label>
                  {formData.panCard && (
                    <span className="text-sm text-green-600">✓ File uploaded</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="idProofType"
                  value={formData.idProof.proofType}
                  onChange={handleChange}
                  required
                  className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="aadhar">Aadhar Card</option>
                  <option value="govt-id">Government ID Proof</option>
                  <option value="passport">Passport</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload ID Proof <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg cursor-pointer hover:bg-amber-700">
                    <Upload size={18} />
                    <span>Upload ID Proof</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'idProof')}
                      required
                      className="hidden"
                    />
                  </label>
                  {formData.idProof.file && (
                    <span className="text-sm text-green-600">✓ File uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Collecting Interests */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Collecting Interests</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please describe your collecting interests
              </label>
              <textarea
                name="collectingInterests"
                value={formData.collectingInterests}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Ancient coins, Mughal era coins, British India coins, etc."
              />
            </div>
          </section>

          {/* References */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
              References (2-3 Dealer/Collector References)
            </h2>
            <p className="text-sm text-gray-600 mb-4">If no references, write "NA"</p>
            {formData.references.map((ref, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Reference {index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={ref.name}
                      onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={ref.city}
                      onChange={(e) => handleReferenceChange(index, 'city', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                    <input
                      type="tel"
                      value={ref.mobile}
                      onChange={(e) => handleReferenceChange(index, 'mobile', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuctionRegistration;
