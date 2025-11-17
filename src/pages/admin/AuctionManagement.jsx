import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Gavel, Users, TrendingUp, Eye, User } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const AuctionManagement = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // all, active, upcoming, ended
  const [formData, setFormData] = useState({
    productId: '',
    title: '',
    description: '',
    image: '',
    startingPrice: '',
    reservePrice: '',
    reserveBidder: '',
    startTime: '',
    endTime: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchAuctions();
    fetchCustomers();
  }, [viewMode]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/admin/customers');
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Fetch customers error:', error);
    }
  };

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const queryParam = viewMode !== 'all' ? `?status=${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}` : '';
      const response = await api.get(`/auctions${queryParam}`);
      setAuctions(response.data.data);
    } catch (error) {
      console.error('Fetch auctions error:', error);
      toast.error('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          image: reader.result // Base64 for upload
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let submitData = { ...formData };

      // Convert datetime-local values to ISO strings
      // datetime-local format: "2025-11-18T21:37" (no timezone - browser interprets as local)
      if (submitData.startTime) {
        const startDate = new Date(submitData.startTime);
        console.log('Start Time Input:', submitData.startTime);
        console.log('Start Time Date Object:', startDate);
        console.log('Start Time ISO:', startDate.toISOString());
        submitData.startTime = startDate.toISOString();
      }
      if (submitData.endTime) {
        const endDate = new Date(submitData.endTime);
        console.log('End Time Input:', submitData.endTime);
        console.log('End Time Date Object:', endDate);
        console.log('End Time ISO:', endDate.toISOString());
        submitData.endTime = endDate.toISOString();
      }

      console.log('Submitting auction data:', submitData);

      // If image is base64, upload it first
      if (formData.image && formData.image.startsWith('data:image/')) {
        try {
          const uploadResponse = await api.post('/upload/base64', { image: formData.image });
          submitData.image = uploadResponse.data.imageUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Failed to upload image');
          return;
        }
      }

      if (selectedAuction) {
        // Update existing auction
        await api.put(`/auctions/${selectedAuction._id}`, submitData);
        toast.success('Auction updated successfully');
      } else {
        // Create new auction
        await api.post('/auctions', submitData);
        toast.success('Auction created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchAuctions();
    } catch (error) {
      console.error('Submit auction error:', error);
      toast.error(error.response?.data?.message || 'Failed to save auction');
    }
  };

  const handleEdit = (auction) => {
    setSelectedAuction(auction);

    // Convert UTC time to IST for display
    const startTimeIST = new Date(auction.startTime);
    const endTimeIST = new Date(auction.endTime);

    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateTimeLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      productId: auction.product?._id || '',
      title: auction.title,
      description: auction.description,
      image: auction.image,
      startingPrice: auction.startingPrice,
      reservePrice: auction.reservePrice || '',
      reserveBidder: auction.reserveBidder?._id || '',
      startTime: formatDateTimeLocal(startTimeIST),
      endTime: formatDateTimeLocal(endTimeIST)
    });
    setImagePreview(auction.image); // Show existing image
    setShowModal(true);
  };

  const handleDelete = async (auctionId) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) {
      return;
    }

    try {
      await api.delete(`/auctions/${auctionId}`);
      toast.success('Auction deleted successfully');
      fetchAuctions();
    } catch (error) {
      console.error('Delete auction error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete auction');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      title: '',
      description: '',
      image: '',
      startingPrice: '',
      reservePrice: '',
      reserveBidder: '',
      startTime: '',
      endTime: ''
    });
    setImageFile(null);
    setImagePreview('');
    setSelectedAuction(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ended':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auction Management</h1>
          <p className="text-gray-600 mt-1">Manage live and upcoming auctions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Auction</span>
        </button>
      </div>

      {/* View Filters */}
      <div className="flex space-x-2 mb-6">
        {['all', 'active', 'upcoming', 'ended'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === mode
                ? 'bg-accent-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Auctions Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Gavel className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No auctions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <div key={auction._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Auction Image */}
              <div className="relative h-48 bg-gray-200">
                {auction.image ? (
                  <img
                    src={auction.image}
                    alt={auction.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gavel className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(auction.status)}`}>
                  {auction.status}
                </div>
              </div>

              {/* Auction Details */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{auction.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{auction.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current Bid:</span>
                    <span className="font-bold text-accent-600">₹{auction.currentBid?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Starting Price:</span>
                    <span className="font-semibold">₹{auction.startingPrice?.toLocaleString()}</span>
                  </div>
                  {auction.reservePrice && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Reserve Price:</span>
                      <span className="font-semibold text-orange-600">₹{auction.reservePrice?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Total Bids:
                    </span>
                    <span className="font-semibold">{auction.totalBids || 0}</span>
                  </div>
                </div>

                <div className="border-t pt-3 mb-3">
                  <div className="flex items-center text-xs text-gray-600 mb-1">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Start: {formatDate(auction.startTime)}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>End: {formatDate(auction.endTime)}</span>
                  </div>
                </div>

                {auction.reserveBidder && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2">
                    <p className="text-xs text-orange-800 font-semibold flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      Reserve Bidder: {auction.reserveBidder.name}
                    </p>
                  </div>
                )}

                {auction.winner && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                    <p className="text-xs text-green-800 font-semibold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Winner: {auction.winner.name}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(auction)}
                    className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(auction._id)}
                    className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedAuction ? 'Edit Auction' : 'Create New Auction'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product ID (Optional)
                    </label>
                    <input
                      type="text"
                      name="productId"
                      value={formData.productId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      placeholder="Enter product ID (optional - leave empty for standalone auction)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      placeholder="Auction title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      placeholder="Auction description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Upload auction image (required if no product linked)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Starting Price (₹)
                      </label>
                      <input
                        type="number"
                        name="startingPrice"
                        value={formData.startingPrice}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="50"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reserve Price (₹)
                      </label>
                      <input
                        type="number"
                        name="reservePrice"
                        value={formData.reservePrice}
                        onChange={handleInputChange}
                        min="0"
                        step="50"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reserve Bidder (Optional)
                    </label>
                    <select
                      name="reserveBidder"
                      value={formData.reserveBidder}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    >
                      <option value="">No Reserve Bidder</option>
                      {customers.map(customer => (
                        <option key={customer._id} value={customer._id}>
                          {customer.name} ({customer.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Reserve bidder will automatically bid if price is below reserve price
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Start Date & Time
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const year = now.getFullYear();
                            const month = String(now.getMonth() + 1).padStart(2, '0');
                            const day = String(now.getDate()).padStart(2, '0');
                            const hours = String(now.getHours()).padStart(2, '0');
                            const minutes = String(now.getMinutes()).padStart(2, '0');
                            const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
                            setFormData(prev => ({ ...prev, startTime: currentDateTime }));
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Use Now
                        </button>
                      </div>
                      <input
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use 24-hour format (e.g., 21:30 for 9:30 PM)
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          End Date & Time
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            now.setDate(now.getDate() + 2); // Default: 2 days from now
                            const year = now.getFullYear();
                            const month = String(now.getMonth() + 1).padStart(2, '0');
                            const day = String(now.getDate()).padStart(2, '0');
                            const hours = String(now.getHours()).padStart(2, '0');
                            const minutes = String(now.getMinutes()).padStart(2, '0');
                            const futureDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
                            setFormData(prev => ({ ...prev, endTime: futureDateTime }));
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          +2 Days
                        </button>
                      </div>
                      <input
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use 24-hour format (e.g., 21:30 for 9:30 PM)
                      </p>
                    </div>
                  </div>

                  {/* Time Conversion Helper */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2">⏰ 24-Hour Format Guide:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                      <div>12:00 AM = 00:00 | 1:00 AM = 01:00 | 6:00 AM = 06:00</div>
                      <div>12:00 PM = 12:00 | 6:00 PM = 18:00 | 9:00 PM = 21:00</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
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
                    {selectedAuction ? 'Update' : 'Create'} Auction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionManagement;
