import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, Clock, TrendingUp, Users, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuctionsPage = () => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active'); // Active, Upcoming, Ended, All

  useEffect(() => {
    fetchAuctions();
  }, [filter]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const queryParam = filter !== 'All' ? `?status=${filter}` : '';
      const response = await api.get(`/auctions${queryParam}`);
      setAuctions(response.data.data);
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
                onClick={() => navigate(`/auction/${auction._id}`)}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
              >
                {/* Auction Image */}
                <div className="relative h-56 bg-gray-200">
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

                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(auction.status)}`}>
                    {auction.status}
                  </div>

                  {/* Time Remaining Badge for Active Auctions */}
                  {auction.status === 'Active' && (
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {getTimeRemaining(auction.endTime)}
                    </div>
                  )}
                </div>

                {/* Auction Details */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {auction.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {auction.description}
                  </p>

                  {/* Price Information */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Bid:</span>
                      <span className="text-lg font-bold text-accent-600">
                        ₹{auction.currentBid?.toLocaleString()}
                      </span>
                    </div>

                    {auction.status === 'Active' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Bids:
                        </span>
                        <span className="font-semibold">{auction.totalBids || 0}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/auction/${auction._id}`);
                    }}
                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                      auction.status === 'Active'
                        ? 'bg-accent-600 hover:bg-accent-700 text-white'
                        : auction.status === 'Upcoming'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {auction.status === 'Active' ? (
                      <>
                        <Gavel className="w-4 h-4" />
                        <span>Place Bid</span>
                      </>
                    ) : auction.status === 'Upcoming' ? (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>View Details</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        <span>View Results</span>
                      </>
                    )}
                  </button>

                  {/* Start/End Time */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {auction.status === 'Upcoming' ? (
                      <p className="text-xs text-gray-600 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Starts: {formatDate(auction.startTime)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {auction.status === 'Active' ? 'Ends' : 'Ended'}: {formatDate(auction.endTime)}
                      </p>
                    )}
                  </div>
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
