import { useState, useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { bidTrackingService } from '../../services';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const BidTracking = () => {
  const [bids, setBids] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    auctionId: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBids: 0
  });
  const [newBidCount, setNewBidCount] = useState(0);
  const socketRef = useRef(null);

  // Fetch bids on component mount and filter change
  useEffect(() => {
    fetchBids();
  }, [filters]);

  // Fetch auctions list for dropdown
  useEffect(() => {
    fetchAuctions();
  }, []);

  // Socket.io real-time updates
  useEffect(() => {
    // Remove /api path from VITE_API_URL to get base server URL for socket.io
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    socketRef.current = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to bid tracking socket');
      // Join admin bid tracking room
      socketRef.current.emit('join-room', 'admin-bid-tracking');
    });

    socketRef.current.on('new-bid', (data) => {
      console.log('🆕 New bid received:', data);

      // Show notification
      toast.info(`New bid: ₹${data.amount.toLocaleString()} by ${data.bidder.name}`, {
        position: 'top-right',
        autoClose: 3000
      });

      // Increment new bid counter
      setNewBidCount(prev => prev + 1);

      // If on first page, update bids list
      if (filters.page === 1) {
        setBids(prevBids => {
          // Add new bid at the top
          const updatedBids = [data, ...prevBids];

          // Update existing bids for the same auction/lot to show "outbid by" info
          const finalBids = updatedBids.map(bid => {
            // Skip if this is the new bid itself
            if (bid._id === data._id) return bid;

            // Check if this bid is for the same auction/lot
            const sameAuctionLot = bid.auctionId === data.auctionId &&
              bid.lotNumber === data.lotNumber;

            if (sameAuctionLot && bid.amount < data.amount) {
              // This bid has been outbid by the new bid
              return {
                ...bid,
                outbidBy: {
                  name: data.bidder.name,
                  amount: data.amount
                },
                isWinning: false
              };
            }

            return bid;
          });

          return finalBids.slice(0, filters.limit);
        });
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from bid tracking socket');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', 'admin-bid-tracking');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [filters.page, filters.limit]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const response = await bidTrackingService.getAllBids(filters);
      console.log('Bids Response:', response);

      setBids(response.data?.bids || []);
      setPagination(response.data?.pagination || {});
      setNewBidCount(0); // Reset counter when refreshing
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to fetch bid tracking data');
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await bidTrackingService.getAuctionsList();
      setAuctions(response.data || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    fetchBids();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Activity className="inline-block" />
            Bid Tracking
            {newBidCount > 0 && (
              <span className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded-full animate-pulse">
                {newBidCount} new
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time bid monitoring with IP tracking
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Auction Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auction
            </label>
            <select
              value={filters.auctionId}
              onChange={(e) => handleFilterChange('auctionId', e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Auctions</option>
              {auctions.map(auction => (
                <option key={auction._id} value={auction._id}>
                  {auction.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="winner">Winner 🏆</option>
              <option value="bid_placed">Bid Placed</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.auctionId || filters.status || filters.startDate || filters.endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({
                auctionId: '',
                status: '',
                startDate: '',
                endDate: '',
                page: 1,
                limit: 50
              })}
              className="px-4 py-2 text-xs md:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Bids Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
          </div>
        ) : bids.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No bids found. IP tracking only captures new bids from today onwards.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Bidder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Auction/Lot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {bids.map((bid) => (
                    <tr key={bid._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center text-white font-bold mr-3">
                            {bid.bidder.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {bid.bidder.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {bid.bidder.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {bid.auctionTitle}
                        </p>
                        {bid.lotNumber && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Lot #{bid.lotNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          ₹{bid.amount.toLocaleString('en-IN')}
                        </p>
                        {bid.maxBid && bid.maxBid > bid.amount && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Max: ₹{bid.maxBid.toLocaleString('en-IN')}
                          </p>
                        )}
                        {bid.isAutoBid && (
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            Auto-bid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(bid.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                          {bid.ipAddress}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bid.status === 'winner' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
                            🏆 Winner
                          </span>
                        ) : bid.outbidBy ? (
                          <div>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400">
                              Outbid by {bid.outbidBy.name}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ₹{bid.outbidBy.amount.toLocaleString('en-IN')}
                            </p>
                          </div>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                            Bid Placed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {bids.map((bid) => (
                <div key={bid._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {bid.bidder.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {bid.bidder.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {bid.bidder.email}
                      </p>

                      <p className="text-sm text-gray-900 dark:text-white font-semibold">
                        {bid.auctionTitle}
                        {bid.lotNumber && ` - Lot #${bid.lotNumber}`}
                      </p>

                      <p className="text-lg font-bold text-accent-600 dark:text-accent-400 mt-1">
                        ₹{bid.amount.toLocaleString('en-IN')}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {bid.status === 'winner' ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
                            🏆 Winner
                          </span>
                        ) : bid.outbidBy ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400">
                            Outbid by {bid.outbidBy.name} @ ₹{bid.outbidBy.amount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                            Bid Placed
                          </span>
                        )}
                        {bid.isAutoBid && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                            Auto-bid
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-mono">{bid.ipAddress}</span>
                        <span>{new Date(bid.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * filters.limit, pagination.totalBids)} of{' '}
                  {pagination.totalBids} bids
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BidTracking;
