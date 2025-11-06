import { useState, useEffect } from 'react';
import { Star, Search, Eye, Trash2, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [filterRating, setFilterRating] = useState('all'); // all, 5, 4, 3, 2, 1
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    // Simulated data - replace with actual API call
    setTimeout(() => {
      setReviews([
        {
          _id: '1',
          productName: 'Ancient Roman Coin',
          productImage: '/api/placeholder/100/100',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          rating: 5,
          title: 'Excellent Quality',
          comment: 'The coin is in perfect condition and exactly as described. Very happy with my purchase!',
          status: 'approved',
          createdAt: '2024-01-15T10:30:00',
          helpful: 12,
          notHelpful: 1
        },
        {
          _id: '2',
          productName: 'Vintage Indian Note',
          productImage: '/api/placeholder/100/100',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          rating: 4,
          title: 'Good but shipping was slow',
          comment: 'The product is great, but delivery took longer than expected.',
          status: 'pending',
          createdAt: '2024-01-16T14:20:00',
          helpful: 5,
          notHelpful: 0
        },
        {
          _id: '3',
          productName: 'Medieval Gold Coin',
          productImage: '/api/placeholder/100/100',
          customerName: 'Mike Johnson',
          customerEmail: 'mike@example.com',
          rating: 3,
          title: 'Average quality',
          comment: 'The coin looks different from the photos. Not what I expected.',
          status: 'rejected',
          createdAt: '2024-01-17T09:15:00',
          helpful: 2,
          notHelpful: 8
        }
      ]);
      setLoading(false);
    }, 500);
  };

  const handleApprove = async (reviewId) => {
    setReviews(reviews.map(review =>
      review._id === reviewId ? { ...review, status: 'approved' } : review
    ));
  };

  const handleReject = async (reviewId) => {
    setReviews(reviews.map(review =>
      review._id === reviewId ? { ...review, status: 'rejected' } : review
    ));
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      setReviews(reviews.filter(review => review._id !== reviewId));
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch =
      review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchesRating = filterRating === 'all' || review.rating === parseInt(filterRating);
    return matchesSearch && matchesStatus && matchesRating;
  });

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            Review <span className="text-accent-600">Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Manage and moderate customer reviews</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
                  <MessageSquare size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Total Reviews</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{reviews.length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-500 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg">
                  <Eye size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Pending Review</p>
                <h3 className="text-3xl font-black text-yellow-600 dark:text-yellow-400">
                  {reviews.filter(r => r.status === 'pending').length}
                </h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-400 to-accent-500 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 shadow-lg">
                  <CheckCircle size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Approved</p>
                <h3 className="text-3xl font-black text-accent-600 dark:text-accent-400">
                  {reviews.filter(r => r.status === 'approved').length}
                </h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-600 to-accent-600 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-lg">
                  <Star size={24} className="text-white fill-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Average Rating</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0).toFixed(1)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-800 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 placeholder-gray-500 font-medium"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Rating Filter */}
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div
              key={review._id}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-800 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Product Info */}
                <div className="flex gap-4 lg:w-1/4">
                  <img
                    src={review.productImage}
                    alt={review.productName}
                    className="w-24 h-24 object-cover rounded-2xl ring-2 ring-gray-200 dark:ring-gray-700 shadow-lg"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{review.productName}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">{review.customerName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{review.customerEmail}</p>
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex gap-1">{renderStars(review.rating)}</div>
                    {getStatusBadge(review.status)}
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">{review.title}</h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{review.comment}</p>

                  <div className="flex items-center gap-6 text-sm">
                    <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-bold">
                      👍 {review.helpful} Helpful
                    </span>
                    <span className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-bold">
                      👎 {review.notHelpful} Not Helpful
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-3">
                  {review.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(review._id)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-accent-400 to-accent-500 text-white rounded-xl hover:shadow-xl transition-all text-sm font-bold transform hover:-translate-y-0.5"
                      >
                        <CheckCircle size={18} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(review._id)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl hover:shadow-xl transition-all text-sm font-bold transform hover:-translate-y-0.5"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                    </>
                  )}
                  {review.status === 'approved' && (
                    <button
                      onClick={() => handleReject(review._id)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl hover:shadow-xl transition-all text-sm font-bold transform hover:-translate-y-0.5"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  )}
                  {review.status === 'rejected' && (
                    <button
                      onClick={() => handleApprove(review._id)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-accent-400 to-accent-500 text-white rounded-xl hover:shadow-xl transition-all text-sm font-bold transform hover:-translate-y-0.5"
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:shadow-xl transition-all text-sm font-bold transform hover:-translate-y-0.5"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredReviews.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800">
              <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl mb-4">
                <MessageSquare size={64} className="text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xl font-bold mb-2">No reviews found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
  );
};

export default ReviewManagement;
