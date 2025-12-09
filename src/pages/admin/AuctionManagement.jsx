import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Gavel, Users, TrendingUp, Eye, User, Package, X, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AuctionManagement = () => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [products, setProducts] = useState([]);
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
    startTime: '',
    endTime: '',
    isLotBidding: false,
    totalLots: 1,
    lotDuration: 10,
    lots: []
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageInputType, setImageInputType] = useState('file'); // 'file' or 'url'
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchAuctions();
    fetchCustomers();
    fetchProducts();
  }, [viewMode]);

  // Check for pre-filled lots from Bulk Upload
  useEffect(() => {
    const savedLots = localStorage.getItem('newAuctionLots');
    if (savedLots) {
      try {
        const { lots, timestamp } = JSON.parse(savedLots);

        // Check if data is not too old (within 10 minutes)
        const age = Date.now() - new Date(timestamp).getTime();
        if (age < 10 * 60 * 1000) {
          // Process lots to set imageInputType to 'url' for lots with image URLs
          const processedLots = lots.map(lot => ({
            ...lot,
            // If lot has an image URL (from CSV), set imageInputType to 'url'
            imageInputType: lot.image ? 'url' : 'file'
          }));

          // Set form data with pre-filled lots
          setFormData(prev => ({
            ...prev,
            isLotBidding: true, // Auto-enable lot bidding
            lots: processedLots,
            totalLots: processedLots.length
          }));

          // Open the create auction modal
          setShowModal(true);
          setSelectedAuction(null);

          toast.success(`${lots.length} lots loaded from bulk upload! Review and create auction.`, {
            autoClose: 5000
          });
        }

        // Clear the saved lots data
        localStorage.removeItem('newAuctionLots');
      } catch (error) {
        console.error('Error loading pre-filled lots:', error);
        localStorage.removeItem('newAuctionLots');
      }
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Fetch products error:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/users');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Fetch customers error:', error);
    }
  };

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const queryParam = viewMode !== 'all' ? `?status=${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}` : '';
      const response = await api.get(`/auctions${queryParam}`);
      setAuctions(response.data || []);
    } catch (error) {
      console.error('Fetch auctions error:', error);
      toast.error('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Auto-enable Going Going Gone timer when lot bidding is enabled
    if (name === 'isLotBidding' && checked) {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        isGoingGoingGoneEnabled: true // Automatically enable timer for lot bidding
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleLotChange = (index, field, value) => {
    const updatedLots = [...formData.lots];
    updatedLots[index] = {
      ...updatedLots[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, lots: updatedLots }));
  };

  const addLot = () => {
    setFormData(prev => ({
      ...prev,
      lots: [
        ...prev.lots,
        {
          lotNumber: prev.lots.length + 1,
          title: '',
          description: '',
          category: 'Miscellaneous',
          productId: '',
          image: '',
          vendorId: '',
          startingPrice: '',
          status: 'Upcoming'
        }
      ]
    }));
  };

  const removeLot = (index) => {
    const updatedLots = formData.lots.filter((_, i) => i !== index);
    // Renumber lots
    const renumberedLots = updatedLots.map((lot, i) => ({
      ...lot,
      lotNumber: i + 1
    }));
    setFormData(prev => ({
      ...prev,
      lots: renumberedLots
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          image: reader.result
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
      if (submitData.startTime) {
        submitData.startTime = new Date(submitData.startTime).toISOString();
      }
      if (submitData.endTime) {
        submitData.endTime = new Date(submitData.endTime).toISOString();
      }

      console.log('Submitting auction data:', submitData);

      // If image is base64, upload it first
      if (formData.image && formData.image.startsWith('data:image/')) {
        try {
          const uploadResponse = await api.post('/upload/base64', { image: formData.image });
          submitData.image = uploadResponse.imageUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Failed to upload image');
          return;
        }
      }

      // If lot bidding, process lots data
      if (submitData.isLotBidding) {
        submitData.totalLots = submitData.lots.length;
        submitData.lotNumber = 1; // Start with first lot

        // Process each lot
        const processedLots = await Promise.all(submitData.lots.map(async (lot) => {
          let lotData = { ...lot };

          // If lot has product, get product details
          if (lot.productId) {
            const product = products.find(p => p._id === lot.productId);
            if (product) {
              lotData.image = lotData.image || product.images[0];
              lotData.description = lotData.description || product.description;
            }
          }

          // Upload lot image if it's base64
          if (lotData.image && lotData.image.startsWith('data:image/')) {
            try {
              const uploadResponse = await api.post('/upload/base64', { image: lotData.image });
              lotData.image = uploadResponse.imageUrl;
            } catch (error) {
              console.error('Lot image upload error:', error);
            }
          }

          return {
            ...lotData,
            currentBid: lotData.startingPrice,
            bids: []
          };
        }));

        submitData.lots = processedLots;
        // Set main auction fields from first lot
        if (processedLots.length > 0) {
          submitData.startingPrice = processedLots[0].startingPrice;
          submitData.currentBid = processedLots[0].startingPrice;
        }
      }

      if (selectedAuction) {
        await api.put(`/auctions/${selectedAuction._id}`, submitData);
        toast.success('Auction updated successfully');
      } else {
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

    const startTimeIST = new Date(auction.startTime);
    const endTimeIST = auction.endTime ? new Date(auction.endTime) : null;

    const formatDateTimeLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Ensure all lots have a category field (for backward compatibility with old lots)
    const lotsWithCategory = (auction.lots || []).map(lot => ({
      ...lot,
      category: lot.category || 'Miscellaneous' // Add category if missing
    }));

    setFormData({
      productId: auction.product?._id || '',
      title: auction.title,
      description: auction.description,
      image: auction.image,
      startingPrice: auction.startingPrice,
      reservePrice: auction.reservePrice || '',
      startTime: formatDateTimeLocal(startTimeIST),
      endTime: endTimeIST ? formatDateTimeLocal(endTimeIST) : '',
      isLotBidding: auction.isLotBidding || false,
      totalLots: auction.totalLots || 1,
      lotDuration: auction.lotDuration || 10,
      lots: lotsWithCategory
    });
    setImagePreview(auction.image);
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
      endTime: '',
      isLotBidding: false,
      totalLots: 1,
      lotDuration: 10,
      lots: []
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Auction Management</h1>
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
            <div key={auction._id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
                {auction.isLotBidding && (
                  <div className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold border bg-purple-100 text-purple-800 border-purple-300">
                    {auction.totalLots} Lots
                  </div>
                )}
              </div>

              {/* Auction Details */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{auction.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{auction.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Current Bid:</span>
                    <span className="font-bold text-accent-600">₹{auction.currentBid?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Starting Price:</span>
                    <span className="font-semibold">₹{auction.startingPrice?.toLocaleString()}</span>
                  </div>
                  {auction.reservePrice && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Reserve Price:</span>
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
                  {auction.isLotBidding && auction.lots && auction.lots.length > 0 && (
                    <div className="flex items-start justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Vendors:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {Array.from(new Set(auction.lots.map(lot => lot.vendorId).filter(Boolean))).length > 0 ? (
                          Array.from(new Set(auction.lots.map(lot => lot.vendorId).filter(Boolean))).map((vendorId, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-md text-xs font-semibold">
                              {vendorId}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">No vendors</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 mb-3">
                  <div className="flex items-center text-xs text-gray-600 mb-1">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Start: {formatDate(auction.startTime)}</span>
                  </div>
                  {auction.endTime && (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>End: {formatDate(auction.endTime)}</span>
                    </div>
                  )}
                  {!auction.endTime && auction.isLotBidding && (
                    <div className="flex items-center text-xs text-green-600">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Ends via Going Gone timer</span>
                    </div>
                  )}
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
                <div className="flex flex-col space-y-2">
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
                  {/* Show "View Invoices" button for ended lot bidding auctions */}
                  {auction.isLotBidding && auction.status === 'Ended' && (
                    <button
                      onClick={() => navigate(`/admin/auction-invoices?auction=${auction._id}`)}
                      className="w-full flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Invoices</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedAuction ? 'Edit Auction' : 'Create New Auction'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Lot Bidding Toggle */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isLotBidding"
                        checked={formData.isLotBidding}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm font-bold text-purple-900">Enable Lot Bidding</span>
                        <p className="text-xs text-purple-700">Create multiple lots that auction sequentially</p>
                      </div>
                    </label>
                  </div>

                  {/* Regular Auction Fields */}
                  {!formData.isLotBidding && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product (Optional)
                        </label>
                        <select
                          name="productId"
                          value={formData.productId}
                          onChange={handleInputChange}
                          className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        >
                          <option value="">No Product (Standalone Auction)</option>
                          {products.map(product => (
                            <option key={product._id} value={product._id}>
                              {product.name} - ₹{product.price.toLocaleString()}
                            </option>
                          ))}
                        </select>
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
                          className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
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
                          className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          placeholder="Auction description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auction Image
                        </label>

                        {/* Image Input Type Selector */}
                        <div className="flex gap-4 mb-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="imageInputType"
                              checked={imageInputType === 'file'}
                              onChange={() => setImageInputType('file')}
                              className="mr-2"
                            />
                            <span className="text-sm">File Upload</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="imageInputType"
                              checked={imageInputType === 'url'}
                              onChange={() => setImageInputType('url')}
                              className="mr-2"
                            />
                            <span className="text-sm">Image URL</span>
                          </label>
                        </div>

                        {/* Conditional Input Based on Selection */}
                        {imageInputType === 'file' ? (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload an image file directly</p>
                          </>
                        ) : (
                          <>
                            <input
                              type="text" 
                              name="image"
                              value={formData.image || ''}
                              onChange={handleInputChange}
                              className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                              placeholder="https://chroniclevaults.com/api/uploads/img-123456.jpg"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              💡 Use Image Upload Manager to upload images and paste URL here
                            </p>
                          </>
                        )}

                        {/* Image Preview */}
                        {(imagePreview || (imageInputType === 'url' && formData.image)) && (
                          <div className="mt-2">
                            <img
                              src={imageInputType === 'file' ? imagePreview : formData.image}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        )}
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
                            className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                            className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Lot Bidding Fields */}
                  {formData.isLotBidding && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auction Title
                        </label>
                        <input
                          type="text" 
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          placeholder="Overall auction title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auction Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                          rows={2}
                          className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          placeholder="Overall auction description"
                        />
                      </div>

                      {/* Lots Management */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Package className="w-5 h-5 mr-2 text-purple-600" />
                            Lots ({formData.lots.length})
                          </h3>
                          <button
                            type="button"
                            onClick={addLot}
                            className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Lot</span>
                          </button>
                        </div>

                        {formData.lots.length === 0 && (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <Package className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600 dark:text-gray-400">No lots added yet</p>
                            <button
                              type="button"
                              onClick={addLot}
                              className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
                            >
                              Add your first lot
                            </button>
                          </div>
                        )}

                        <div className="space-y-4">
                          {formData.lots.map((lot, index) => (
                            <div key={index} className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-purple-900">Lot {index + 1}</h4>
                                {formData.lots.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeLot(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Product
                                  </label>
                                  <select
                                    value={lot.productId || ''}
                                    onChange={(e) => {
                                      handleLotChange(index, 'productId', e.target.value);
                                      // Auto-fill from product
                                      const product = products.find(p => p._id === e.target.value);
                                      if (product) {
                                        handleLotChange(index, 'title', `Lot ${index + 1}: ${product.name}`);
                                        handleLotChange(index, 'description', product.description);
                                        handleLotChange(index, 'image', product.images[0]);
                                        handleLotChange(index, 'startingPrice', Math.floor(product.price * 0.7));
                                      }
                                    }}
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                  >
                                    <option value="">No Product (Manual Entry)</option>
                                    {products.map(product => (
                                      <option key={product._id} value={product._id}>
                                        {product.name} - ₹{product.price.toLocaleString()}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lot Title
                                  </label>
                                  <input
                                    type="text" 
                                    value={lot.title || ''}
                                    onChange={(e) => handleLotChange(index, 'title', e.target.value)}
                                    required
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                    placeholder={`Lot ${index + 1} title`}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lot Description
                                  </label>
                                  <textarea
                                    value={lot.description || ''}
                                    onChange={(e) => handleLotChange(index, 'description', e.target.value)}
                                    rows={2}
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                    placeholder={`Description for lot ${index + 1}`}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                  </label>
                                  <input
                                    type="text"
                                    value={lot.category || 'Miscellaneous'}
                                    onChange={(e) => handleLotChange(index, 'category', e.target.value)}
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                    placeholder="e.g., Ancient India, Mughals, British India"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Enter category for grouping lots in catalog (e.g., Ancient India, Princely States)</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Starting Price (₹)
                                    </label>
                                    <input
                                      type="number" 
                                      value={lot.startingPrice || ''}
                                      onChange={(e) => handleLotChange(index, 'startingPrice', e.target.value)}
                                      required
                                      min="0"
                                      className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="0"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Reserve Price (₹)
                                    </label>
                                    <input
                                      type="number" 
                                      value={lot.reservePrice || ''}
                                      onChange={(e) => handleLotChange(index, 'reservePrice', e.target.value)}
                                      min="0"
                                      className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="0 (optional)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Min bid to sell</p>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vendor ID
                                  </label>
                                  <input
                                    type="text" 
                                    value={lot.vendorId || ''}
                                    onChange={(e) => handleLotChange(index, 'vendorId', e.target.value)}
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                    placeholder="e.g., VEN001 (optional)"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Vendor identifier for tracking (admin only)</p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lot Image
                                  </label>

                                  {/* Image Input Type Selector */}
                                  <div className="flex gap-4 mb-2">
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`imageType-${index}`}
                                        checked={lot.imageInputType === 'file' || !lot.imageInputType}
                                        onChange={() => handleLotChange(index, 'imageInputType', 'file')}
                                        className="mr-2"
                                      />
                                      <span className="text-sm">File Upload</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`imageType-${index}`}
                                        checked={lot.imageInputType === 'url'}
                                        onChange={() => handleLotChange(index, 'imageInputType', 'url')}
                                        className="mr-2"
                                      />
                                      <span className="text-sm">Image URL</span>
                                    </label>
                                  </div>

                                  {/* Conditional Input Based on Selection */}
                                  {(lot.imageInputType === 'file' || !lot.imageInputType) ? (
                                    <>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              handleLotChange(index, 'image', reader.result);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Upload an image file directly</p>
                                    </>
                                  ) : (
                                    <>
                                      <input
                                        type="text" 
                                        value={lot.image || ''}
                                        onChange={(e) => handleLotChange(index, 'image', e.target.value)}
                                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                        placeholder="https://chroniclevaults.com/api/uploads/img-123456.jpg"
                                      />
                                      <p className="text-xs text-blue-600 mt-1">
                                        💡 Use Image Upload Manager to upload images and paste URL here
                                      </p>
                                    </>
                                  )}
                                </div>

                                {lot.image && (
                                  <div className="mt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Image Preview Lot {index + 1}
                                    </label>
                                    <img
                                      src={lot.image}
                                      alt={`Lot ${index + 1}`}
                                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Common Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local" 
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                      className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Auction will end based on bidding activity via Going Gone timer
                    </p>
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
