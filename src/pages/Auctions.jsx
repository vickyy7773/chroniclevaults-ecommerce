import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Gavel, Clock, TrendingUp, Users, Filter, BookOpen, LayoutDashboard, FileText, User } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuctionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get initial filter from URL query params or default to 'Active'
  const initialFilter = searchParams.get('status') || 'Active';
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    // Update filter when URL changes
    const urlStatus = searchParams.get('status');
    if (urlStatus && urlStatus !== filter) {
      setFilter(urlStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAuctions();
  }, [filter]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const queryParam = filter !== 'All' ? `?status=${filter}` : '';
      const response = await api.get(`/auctions${queryParam}`);
      setAuctions(response.data || []); // Response interceptor already returns data
    } catch (error) {
      console.error('Fetch auctions error:', error);
      toast.error('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ended':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-accent-600 to-accent-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
            <Gavel className="w-12 h-12 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Live Auctions</h1>
          </div>
          <p className="text-center text-lg text-white/90 max-w-2xl mx-auto">
            Discover rare collectibles and bid on exclusive items in real-time auctions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Filter className="w-5 h-5 text-gray-600" />
          {['All', 'Active', 'Upcoming', 'Ended'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-accent-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-600"></div>
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <Gavel className="w-20 h-20 mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Auctions Found</h3>
            <p className="text-gray-600">
              {filter === 'All'
                ? 'There are no auctions available at the moment.'
                : `No ${filter.toLowerCase()} auctions available.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {auctions.map((auction) => (
              <div
                key={auction._id}
                onClick={() => navigate(`/auction/${auction._id}/catalog`)}
                className="rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
              >
                {/* Auction Highlight Banner Image */}
                <div className="relative w-full h-[500px] bg-gray-200">
                  {auction.highlightImage || auction.image ? (
                    <img
                      src={auction.highlightImage || auction.image}
                      alt={auction.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Gavel className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionsPage;
