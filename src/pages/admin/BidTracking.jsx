import { useState, useEffect, useRef } from 'react';
import { Activity, Trophy, TrendingUp, Users, HelpCircle, X, Zap, Hand, AlertTriangle, Info, Crown } from 'lucide-react';
import { bidTrackingService } from '../../services';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const BidTracking = () => {
  const [events, setEvents] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [availableLots, setAvailableLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelpBox, setShowHelpBox] = useState(false);
  const [filters, setFilters] = useState({
    auctionId: '',
    status: '', // event type filter
    lotNumber: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0
  });
  const [newEventCount, setNewEventCount] = useState(0);
  const socketRef = useRef(null);

  // Fetch bids on component mount and filter change
  useEffect(() => {
    fetchBids();
  }, [filters]);

  // Fetch auctions list for dropdown
  useEffect(() => {
    fetchAuctions();
  }, []);

  // Fetch available lots when auction is selected
  useEffect(() => {
    if (filters.auctionId) {
      fetchAuctionLots(filters.auctionId);
    } else {
      setAvailableLots([]);
    }
  }, [filters.auctionId]);

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

      // Increment new event counter
      setNewEventCount(prev => prev + 1);

      // Refresh to get new events
      if (filters.page === 1) {
        fetchBids();
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
      console.log('Events Response:', response);

      // Sort events by seq number in descending order (newest first)
      const sortedEvents = (response.data?.events || []).sort((a, b) => b.seq - a.seq);
      setEvents(sortedEvents);
      setPagination(response.data?.pagination || {});
      setNewEventCount(0); // Reset counter when refreshing
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch bid tracking data');
      setEvents([]);
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

  const fetchAuctionLots = async (auctionId) => {
    try {
      const response = await bidTrackingService.getAuctionDetails(auctionId);
      const auction = response.data;

      // Extract unique lot numbers from auction lots
      if (auction && auction.lots && Array.isArray(auction.lots)) {
        const lotNumbers = auction.lots
          .map(lot => lot.lotNumber)
          .filter(num => num != null) // Filter out null/undefined
          .sort((a, b) => a - b); // Sort numerically

        setAvailableLots([...new Set(lotNumbers)]); // Remove duplicates
      } else {
        setAvailableLots([]);
      }
    } catch (error) {
      console.error('Error fetching auction lots:', error);
      setAvailableLots([]);
    }
  };

  const handleFilterChange = (key, value) => {
    // If auction changes, reset lot filter since lot numbers will be different
    if (key === 'auctionId') {
      setFilters(prev => ({ ...prev, [key]: value, lotNumber: '', page: 1 }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    }
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
            {newEventCount > 0 && (
              <span className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded-full animate-pulse">
                {newEventCount} new
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time event log with complete bid tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelpBox(!showHelpBox)}
            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
            title="How Bidding Works"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">How it works</span>
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* How Bidding Works - Info Box */}
      {showHelpBox && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Info className="w-5 h-5" />
              How Bidding Works
            </h3>
            <button onClick={() => setShowHelpBox(false)} className="text-blue-600 hover:text-blue-800">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Hand className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900 dark:text-white">Manual Bid</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User manually placed a bid by clicking the bid button
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900 dark:text-white">Auto-Bid (System)</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                System automatically bid on behalf of user up to their max limit
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-gray-900 dark:text-white">Outbid</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Someone placed a higher bid, so this bid is no longer winning
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-gray-900 dark:text-white">Winner</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This bidder won the auction with the highest bid when time ended
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>💡 Tip:</strong> "Max Bid (Auto)" shows the maximum amount a user set for auto-bidding.
              The system will automatically bid up to this amount to keep them in the lead.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Current Highest Bid */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Highest Bid</span>
            </div>
            <p className="text-2xl font-bold">
              ₹{Math.max(...events.map(e => e.amount)).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Leading Bidder */}
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Leading Bidder</span>
            </div>
            <p className="text-lg font-bold truncate">
              {events.find(e => e.eventType === 'winner')?.bidder?.name ||
               events.reduce((max, e) => e.amount > max.amount ? e : max, events[0])?.bidder?.name || 'N/A'}
            </p>
          </div>

          {/* Total Bids */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Total Bids</span>
            </div>
            <p className="text-2xl font-bold">{events.filter(e => e.eventType === 'bid_placed' || e.eventType === 'auto_bid').length}</p>
          </div>

          {/* Winners Count */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Winners Declared</span>
            </div>
            <p className="text-2xl font-bold">{events.filter(e => e.eventType === 'winner').length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
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

          {/* Event Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Events</option>
              <option value="bid_placed">Bid Placed</option>
              <option value="auto_bid">Auto-Bid</option>
              <option value="outbid">Outbid</option>
              <option value="winner">Winner 🏆</option>
            </select>
          </div>

          {/* Lot Number Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lot Number
            </label>
            <select
              value={filters.lotNumber}
              onChange={(e) => handleFilterChange('lotNumber', e.target.value)}
              disabled={!filters.auctionId}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {filters.auctionId ? 'All Lots' : 'Select auction first'}
              </option>
              {filters.auctionId && (
                <>
                  <option value="auction-level">Auction Level</option>
                  {availableLots.map(lotNum => (
                    <option key={lotNum} value={lotNum}>
                      Lot #{lotNum}
                    </option>
                  ))}
                </>
              )}
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
        {(filters.auctionId || filters.status || filters.lotNumber || filters.startDate || filters.endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({
                auctionId: '',
                status: '',
                lotNumber: '',
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
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No events found. Event tracking captures all bid activities.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Seq
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Auction ID
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lot No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Max Bid (Auto)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trigger
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {events.map((event) => (
                    <tr key={event._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${event.eventType === 'winner' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500' : ''}`}>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                        {event.seq}
                        {event.eventType === 'winner' && <span className="ml-1">🏆</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-900 dark:text-white font-mono font-semibold">
                          {event.auctionNumber}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]" title={event.auctionTitle}>
                          {event.auctionTitle}
                        </p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center text-gray-900 dark:text-white">
                        {event.lotNumber || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-gray-900 dark:text-white">
                          {new Date(event.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-xs font-medium truncate max-w-[120px] ${event.eventType === 'winner' ? 'text-yellow-700 dark:text-yellow-400 font-bold' : 'text-gray-900 dark:text-white'}`} title={event.bidder.name}>
                          {event.eventType === 'winner' && '🏆 '}
                          {event.bidder.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {event.eventType === 'bid_placed' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 flex items-center gap-1 w-fit" title="User manually placed this bid">
                            <Hand className="w-3 h-3" />
                            Manual Bid
                          </span>
                        )}
                        {event.eventType === 'auto_bid' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400 flex items-center gap-1 w-fit" title="System automatically bid on behalf of user">
                            <Zap className="w-3 h-3" />
                            Auto-Bid (System)
                          </span>
                        )}
                        {event.eventType === 'outbid' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 flex items-center gap-1 w-fit" title="This bid was outbid by a higher amount">
                            <AlertTriangle className="w-3 h-3" />
                            Outbid by Higher Amount
                          </span>
                        )}
                        {event.eventType === 'winner' && (
                          <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-yellow-400 text-yellow-900 animate-pulse flex items-center gap-1 w-fit" title="This bidder won the auction!">
                            <Trophy className="w-4 h-4" />
                            WINNER
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          ₹{event.amount.toLocaleString('en-IN')}
                        </p>
                        {event.originalAmount && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Previous: ₹{event.originalAmount.toLocaleString('en-IN')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" title="Maximum amount user set for auto-bidding">
                        {event.maxBid ? (
                          <div>
                            <p className="text-xs font-bold text-orange-600 dark:text-orange-400">
                              ₹{event.maxBid.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-400">Auto limit</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No auto-bid</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded ${
                          event.trigger === 'Manual' ? 'bg-green-50 text-green-700' :
                          event.trigger === 'Reserve Defense' ? 'bg-purple-50 text-purple-700' :
                          event.trigger === 'Reserve Bidder' ? 'bg-orange-50 text-orange-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {event.trigger === 'Reserve Bidder' ? 'Auto-Bid User' :
                           event.trigger === 'Reserve Defense' ? 'Auto-Bid (System)' :
                           event.trigger}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                          {event.ipAddress}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700 dark:text-gray-300 max-w-[150px]">
                          {event.description}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {events.map((event) => (
                <div key={event._id} className={`p-4 ${event.eventType === 'winner' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${event.eventType === 'winner' ? 'bg-yellow-500' : 'bg-accent-500'}`}>
                      {event.eventType === 'winner' ? '🏆' : `#${event.seq}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-medium ${event.eventType === 'winner' ? 'text-yellow-700 dark:text-yellow-400 font-bold' : 'text-gray-900 dark:text-white'}`}>
                          {event.eventType === 'winner' && '🏆 '}
                          {event.bidder.name}
                        </p>
                        {event.eventType === 'bid_placed' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                            <Hand className="w-3 h-3" />
                            Manual
                          </span>
                        )}
                        {event.eventType === 'auto_bid' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Auto
                          </span>
                        )}
                        {event.eventType === 'outbid' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Outbid
                          </span>
                        )}
                        {event.eventType === 'winner' && (
                          <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-yellow-400 text-yellow-900 animate-pulse flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            WINNER
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Auction: <span className="font-mono font-semibold">{event.auctionNumber}</span> {event.lotNumber && `• Lot #${event.lotNumber}`}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                        {event.auctionTitle}
                      </p>

                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <p className="text-xs text-gray-500">Current Bid</p>
                          <p className="text-lg font-bold text-accent-600 dark:text-accent-400">
                            ₹{event.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        {event.maxBid && (
                          <div>
                            <p className="text-xs text-gray-500">Auto-Bid Limit</p>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                              ₹{event.maxBid.toLocaleString('en-IN')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Bid Type:</span>{' '}
                          <span className={`px-2 py-0.5 rounded ${
                            event.trigger === 'Manual' ? 'bg-green-50 text-green-700' :
                            event.trigger === 'Reserve Defense' ? 'bg-purple-50 text-purple-700' :
                            event.trigger === 'Reserve Bidder' ? 'bg-orange-50 text-orange-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                            {event.trigger === 'Reserve Bidder' ? 'Auto-Bid User' :
                             event.trigger === 'Reserve Defense' ? 'Auto-Bid (System)' :
                             event.trigger}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Description:</span> {event.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-mono">{event.ipAddress}</span>
                        <span>{new Date(event.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}</span>
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
                  {Math.min(pagination.currentPage * filters.limit, pagination.totalEvents)} of{' '}
                  {pagination.totalEvents} events
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
