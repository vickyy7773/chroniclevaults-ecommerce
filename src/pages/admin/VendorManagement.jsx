import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Eye, Plus, Mail, Phone, MapPin, Building2, CreditCard, FileText, X, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [formData, setFormData] = useState({
    vendorCode: '',
    name: '',
    email: '',
    mobile: '',
    address: '',
    commissionPercentage: 0,
    kycDocuments: {
      aadharCard: '',
      panCard: ''
    },
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: ''
    },
    status: 'Active'
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vendors');
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error('Failed to load vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Strict validation rules
    let sanitizedValue = value;

    // Name fields - only letters, spaces, dots, and hyphens
    if (name === 'name' || name === 'bankDetails.accountHolderName' || name === 'bankDetails.bankName' || name === 'bankDetails.branchName') {
      sanitizedValue = value.replace(/[^a-zA-Z\s.-]/g, '');
    }

    // Mobile number - only digits, max 10
    if (name === 'mobile') {
      sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    }

    // Account number - only digits and letters (some banks use alphanumeric)
    if (name === 'bankDetails.accountNumber') {
      sanitizedValue = value.replace(/[^0-9]/g, '');
    }

    // IFSC Code - uppercase letters and digits only, max 11 characters
    if (name === 'bankDetails.ifscCode') {
      sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    }

    // Commission - only numbers and decimal point
    if (name === 'commissionPercentage') {
      sanitizedValue = value.replace(/[^0-9.]/g, '');
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: sanitizedValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: sanitizedValue
      }));
    }
  };

  const handleFileUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should not exceed 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const uploadResponse = await api.post('/upload/base64', {
            image: reader.result
          });

          setFormData(prev => ({
            ...prev,
            kycDocuments: {
              ...prev.kycDocuments,
              [documentType]: uploadResponse.imageUrl
            }
          }));

          toast.success(`${documentType === 'aadharCard' ? 'Aadhar Card' : 'PAN Card'} uploaded successfully`);
        } catch (error) {
          console.error('Upload error:', error);
          toast.error('Failed to upload document');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to read file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedVendor) {
        await api.put(`/vendors/${selectedVendor._id}`, formData);
        toast.success('Vendor updated successfully');
      } else {
        // Remove vendorCode for new vendors (will be auto-generated)
        const { vendorCode, ...dataToSend } = formData;
        await api.post('/vendors', dataToSend);
        toast.success('Vendor created successfully with auto-generated code');
      }

      setShowModal(false);
      resetForm();
      fetchVendors();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to save vendor');
    }
  };

  const handleEdit = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      vendorCode: vendor.vendorCode,
      name: vendor.name,
      email: vendor.email,
      mobile: vendor.mobile,
      address: vendor.address,
      commissionPercentage: vendor.commissionPercentage,
      kycDocuments: vendor.kycDocuments,
      bankDetails: vendor.bankDetails,
      status: vendor.status
    });
    setShowModal(true);
  };

  const handleView = (vendor) => {
    setSelectedVendor(vendor);
    setShowViewModal(true);
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await api.delete(`/vendors/${vendorId}`);
      toast.success('Vendor deleted successfully');
      fetchVendors();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete vendor');
    }
  };

  const handleStatusChange = async (vendorId, newStatus) => {
    try {
      await api.put(`/vendors/${vendorId}/status`, { status: newStatus });
      toast.success('Vendor status updated successfully');
      fetchVendors();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update vendor status');
    }
  };

  const resetForm = () => {
    setFormData({
      vendorCode: '',
      name: '',
      email: '',
      mobile: '',
      address: '',
      commissionPercentage: 0,
      kycDocuments: {
        aadharCard: '',
        panCard: ''
      },
      bankDetails: {
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branchName: ''
      },
      status: 'Active'
    });
    setSelectedVendor(null);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || vendor.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400 border-green-300 dark:border-green-700';
      case 'Inactive':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
      case 'Suspended':
        return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-400 border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage vendor registrations and details</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text" 
            placeholder="Search by name, code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Vendors Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">No vendors found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vendor Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-accent-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{vendor.vendorCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{vendor.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-300 flex items-center mb-1">
                        <Mail className="w-3 h-3 mr-1 text-gray-400" />
                        {vendor.email}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-300 flex items-center">
                        <Phone className="w-3 h-3 mr-1 text-gray-400" />
                        {vendor.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-accent-600">{vendor.commissionPercentage}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">{formatDate(vendor.registrationDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={vendor.status}
                        onChange={(e) => handleStatusChange(vendor._id, e.target.value)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(vendor.status)}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(vendor)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedVendor && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor Code
                        </label>
                        <input
                          type="text" 
                          name="vendorCode"
                          value={formData.vendorCode}
                          readOnly
                          disabled
                          className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-generated (cannot be changed)</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        pattern="[a-zA-Z\s.-]{2,}"
                        placeholder="Enter vendor name"
                        title="Name should contain only letters, spaces, dots and hyphens"
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Only letters, spaces, dots and hyphens allowed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                        placeholder="vendor@example.com"
                        title="Please enter a valid email address"
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be a valid email format</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        required
                        pattern="[0-9]{10}"
                        placeholder="10-digit mobile number"
                        maxLength="10"
                        title="Mobile number must be exactly 10 digits"
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Only 10 digit numbers allowed</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commission (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number" 
                        name="commissionPercentage"
                        value={formData.commissionPercentage}
                        onChange={handleInputChange}
                        required
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Can be changed for each auction</p>
                    </div>
                  </div>
                </div>

                {/* KYC Documents */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">KYC Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aadhar Card <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, 'aadharCard')}
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      {formData.kycDocuments.aadharCard && (
                        <a
                          href={formData.kycDocuments.aadharCard}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          View uploaded document
                        </a>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PAN Card <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, 'panCard')}
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      {formData.kycDocuments.panCard && (
                        <a
                          href={formData.kycDocuments.panCard}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          View uploaded document
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Holder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="bankDetails.accountHolderName"
                        value={formData.bankDetails.accountHolderName}
                        onChange={handleInputChange}
                        required
                        pattern="[a-zA-Z\s.-]{2,}"
                        placeholder="As per bank account"
                        title="Name should contain only letters, spaces, dots and hyphens"
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Only letters, spaces, dots and hyphens allowed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="bankDetails.accountNumber"
                        value={formData.bankDetails.accountNumber}
                        onChange={handleInputChange}
                        required
                        pattern="[0-9]{9,18}"
                        placeholder="9 to 18 digit account number"
                        title="Account number must be 9-18 digits"
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Only numbers allowed (9-18 digits)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="bankDetails.ifscCode"
                        value={formData.bankDetails.ifscCode}
                        onChange={handleInputChange}
                        required
                        pattern="[A-Z]{4}0[A-Z0-9]{6}"
                        placeholder="e.g., SBIN0001234"
                        maxLength="11"
                        title="IFSC code must be 11 characters (4 letters + 0 + 6 alphanumeric)"
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: 4 letters + 0 + 6 characters (auto uppercase)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="bankDetails.bankName"
                        value={formData.bankDetails.bankName}
                        onChange={handleInputChange}
                        required
                        pattern="[a-zA-Z\s.-]{2,}"
                        placeholder="Enter bank name"
                        title="Bank name should contain only letters, spaces, dots and hyphens"
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Only letters, spaces, dots and hyphens allowed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        name="bankDetails.branchName"
                        value={formData.bankDetails.branchName}
                        onChange={handleInputChange}
                        pattern="[a-zA-Z\s.-]*"
                        placeholder="Enter branch name"
                        title="Branch name should contain only letters, spaces, dots and hyphens"
                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Only letters, spaces, dots and hyphens allowed</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors"
                  >
                    {selectedVendor ? 'Update' : 'Create'} Vendor
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Vendor Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Vendor Code</p>
                      <p className="font-semibold text-accent-600">{selectedVendor.vendorCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                      <p className="font-semibold">{selectedVendor.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-semibold">{selectedVendor.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Mobile</p>
                      <p className="font-semibold">{selectedVendor.mobile}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                      <p className="font-semibold">{selectedVendor.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Commission</p>
                      <p className="font-semibold text-accent-600">{selectedVendor.commissionPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedVendor.status)}`}>
                        {selectedVendor.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Registration Date</p>
                      <p className="font-semibold">{formatDate(selectedVendor.registrationDate)}</p>
                    </div>
                  </div>
                </div>

                {/* KYC Documents */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">KYC Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Aadhar Card</p>
                      {selectedVendor.kycDocuments.aadharCard && (
                        <a
                          href={selectedVendor.kycDocuments.aadharCard}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Document
                        </a>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">PAN Card</p>
                      {selectedVendor.kycDocuments.panCard && (
                        <a
                          href={selectedVendor.kycDocuments.panCard}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Document
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Bank Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Account Holder Name</p>
                      <p className="font-semibold">{selectedVendor.bankDetails.accountHolderName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Account Number</p>
                      <p className="font-semibold">{selectedVendor.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">IFSC Code</p>
                      <p className="font-semibold">{selectedVendor.bankDetails.ifscCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Bank Name</p>
                      <p className="font-semibold">{selectedVendor.bankDetails.bankName}</p>
                    </div>
                    {selectedVendor.bankDetails.branchName && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Branch Name</p>
                        <p className="font-semibold">{selectedVendor.bankDetails.branchName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(selectedVendor);
                  }}
                  className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors"
                >
                  Edit Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
