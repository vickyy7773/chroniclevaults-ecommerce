import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Gavel, Clock, TrendingUp, Users, Filter, BookOpen, LayoutDashboard, FileText, User, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuctionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [thankYouAuction, setThankYouAuction] = useState(null);
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

  // Map LotAuction to filter tabs — same rule as Live Auction
  const lotAuctionFilterStatus = (a) => {
    const now = new Date();
    const posterUntil = a.posterDisplayUntil ? new Date(a.posterDisplayUntil) : null;
    const biddingEnd = a.lotBiddingEndTime ? new Date(a.lotBiddingEndTime) : null;
    // posterDisplayUntil in future → Upcoming
    if (posterUntil && now < posterUntil) return 'Upcoming';
    // lotBiddingEndTime passed OR status Paused/Completed → Ended
    if ((biddingEnd && now >= biddingEnd) || a.status === 'Paused' || a.status === 'Completed') return 'Ended';
    return 'Active';
  };

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const queryParam = filter !== 'All' ? `?status=${filter}` : '';
      const [liveRes, lotRes] = await Promise.allSettled([
        api.get(`/auctions${queryParam}`),
        api.get('/lot-auction/public'),
      ]);

      let liveData = [];
      if (liveRes.status === 'fulfilled') {
        const r = liveRes.value;
        if (Array.isArray(r)) liveData = r;
        else if (Array.isArray(r?.data)) liveData = r.data;
        else if (Array.isArray(r?.data?.data)) liveData = r.data.data;
      }
      liveData = liveData.map(a => ({ ...a, _auctionType: 'live' }));

      let lotData = [];
      if (lotRes.status === 'fulfilled') {
        const r = lotRes.value;
        if (Array.isArray(r?.data)) lotData = r.data;
        else if (Array.isArray(r?.data?.data)) lotData = r.data.data;
      }
      // Filter lot auctions by the selected tab
      lotData = lotData
        .map(a => ({ ...a, _auctionType: 'lot' }))
        .filter(a => filter === 'All' || lotAuctionFilterStatus(a) === filter);

      setAuctions([...liveData, ...lotData]);
    } catch (error) {
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
      <div className="bg-gradient-to-r from-accent-600 to-accent-700 text-white py-12 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
            <Gavel className="w-12 h-12 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Live Auctions</h1>
          </div>
          <p className="text-center text-lg text-white/90 max-w-2xl mx-auto">
            Discover rare collectibles and bid on exclusive items in real-time auctions
          </p>
          {/* iCollector.com badge */}
          <div className="flex justify-center mt-5">
            <a
              href="https://www.icollector.com/"
              title="View Online Auctions"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all flex items-center gap-3 group"
            >
              <img
                src="https://www.icollector.com/graphics/logos/link_logo.png"
                alt="iCollector.com"
                className="h-7 w-auto"
              />
              <span className="text-sm font-semibold text-gray-700 group-hover:text-accent-600 transition-colors whitespace-nowrap">
                Register &amp; Bid on iCollector
              </span>
            </a>
          </div>
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
            {auctions.map((auction) => {
              const now = new Date();
              const posterUntil = auction.posterDisplayUntil ? new Date(auction.posterDisplayUntil) : null;
              const isLotType = auction._auctionType === 'lot';
              // Non-clickable: Live Upcoming OR Lot Auction with posterDisplayUntil in future
              const isUpcoming = isLotType
                ? (!!posterUntil && now < posterUntil)
                : auction.status === 'Upcoming';
              const isClickable = !isUpcoming;

              const handleClick = () => {
                if (!isClickable) return;
                if (isLotType) {
                  navigate(`/lot-auction/${auction._id}`);
                } else if (auction.status === 'Ended') {
                  if (auction.isEndedPublic) {
                    navigate(`/auction-lots/${auction._id}`);
                  } else {
                    setThankYouAuction(auction);
                  }
                } else {
                  navigate(`/auction/${auction._id}/catalog`);
                }
              };

              return (
              <div
                key={auction._id}
                onClick={handleClick}
                className={`rounded-lg shadow-md overflow-hidden transition-all ${
                  isClickable
                    ? 'cursor-pointer hover:shadow-xl transform hover:-translate-y-1'
                    : 'cursor-default'
                }`}
              >
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
                  {isLotType && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                      Lot Bidding
                    </span>
                  )}
                </div>
              </div>
              );
            })}
          </div>

        )}

        {/* Thank You Modal for Ended Auctions */}
        {thankYouAuction && (
            <div
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
              onClick={() => setThankYouAuction(null)}
            >
              <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Top banner image */}
                {(thankYouAuction.highlightImage || thankYouAuction.image) && (
                  <div className="w-full h-52 overflow-hidden">
                    <img
                      src={thankYouAuction.highlightImage || thankYouAuction.image}
                      alt={thankYouAuction.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={() => setThankYouAuction(null)}
                  className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full p-1 shadow hover:bg-opacity-100 transition"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>

                {/* Message */}
                <div className="px-8 py-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-accent-100 rounded-full p-4">
                      <Gavel className="w-10 h-10 text-accent-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Thank You for Your Participation!
                  </h2>
                  <p className="text-gray-500 text-sm mb-4">{thankYouAuction.title}</p>
                  <p className="text-gray-700 text-base leading-relaxed">
                    We sincerely appreciate your enthusiasm and participation in this auction.
                    The results will be announced shortly. Please stay tuned for updates.
                  </p>
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <p className="text-xs text-gray-400">
                      — Chronicle Vaults Auction House
                    </p>
                  </div>
                  <button
                    onClick={() => setThankYouAuction(null)}
                    className="mt-5 px-8 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-full font-semibold transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default AuctionsPage;
