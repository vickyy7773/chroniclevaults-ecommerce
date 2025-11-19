import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gavel, Clock, TrendingUp, Users, AlertCircle, CheckCircle, History } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { io } from 'socket.io-client';

const AuctionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // Get user from localStorage
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
  }, []);
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Socket.io connection setup
  useEffect(() => {
    // Connect to Socket.io server (use BACKEND_URL without /api)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    // Use only polling in production to avoid WebSocket errors on LiteSpeed
    const isProduction = backendUrl.includes('chroniclevaults.com');

    socketRef.current = io(backendUrl, {
      transports: isProduction ? ['polling'] : ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      path: '/socket.io',
      upgrade: !isProduction, // Disable upgrade to websocket in production
      forceNew: true, // Create new connection each time
      timeout: 20000
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
      if (id) {
        socketRef.current.emit('join-auction', id);
      }
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to Socket.io after', attemptNumber, 'attempts');
      if (id) {
        socketRef.current.emit('join-auction', id);
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.io:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        socketRef.current.connect();
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      // Don't spam console with repetitive errors
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        if (id) {
          socketRef.current.emit('leave-auction', id);
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [id]);

  // Separate useEffect for bid-placed listener that depends on user and auction
  useEffect(() => {
    if (!socketRef.current) return;

    // Handler function with latest user and auction state
    const handleBidPlaced = (data) => {
      console.log('🔴 LIVE BID UPDATE:', data);

      // Get current user from localStorage directly to ensure latest value
      let currentUser = user;
      if (!currentUser) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            currentUser = JSON.parse(savedUser);
            console.log('📦 Loaded user from localStorage:', currentUser._id);
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
          }
        }
      }

      console.log('Current user ID:', currentUser?._id);
      console.log('Latest bidder ID:', data.latestBid?.user?._id);

      // Check if current user has placed any bids in the UPDATED auction data (from socket)
      const userHasBids = data.auction && data.auction.bids &&
                          data.auction.bids.some(bid => bid.user._id === currentUser?._id);
      console.log('User has bids:', userHasBids);

      // Update auction data with new bid
      setAuction(data.auction);

      // Update suggested bid amount
      const currentIncrement = getCurrentIncrement(data.auction);
      const suggestedBid = data.auction.currentBid + currentIncrement;
      setBidAmount(suggestedBid.toString());

      // Check if current user is still winning after this bid
      const isStillWinning = data.auction.bids.length > 0 &&
                             data.auction.bids[data.auction.bids.length - 1].user._id === currentUser?._id;
      console.log('User still winning:', isStillWinning);

      // Show notification for new bid
      if (data.latestBid.user._id === currentUser?._id) {
        // Current user placed the bid
        console.log('✅ Current user placed bid');

        // Skip notification if this is auto-bid from reserve bidder
        // (API response already showed appropriate message)
        if (!data.latestBid.isAutoBid) {
          if (data.autoBidTriggered) {
            toast.success(`Auto-bid placed: ₹${data.latestBid.amount.toLocaleString()}`);
          } else {
            toast.success('Bid placed successfully!');
          }
        }
      } else {
        // Someone else placed the bid
        console.log('❌ Someone else placed bid');
        console.log('Check: userHasBids && !isStillWinning =', userHasBids && !isStillWinning);

        if (userHasBids && !isStillWinning) {
          // Current user has bid but is not winning - show outbid message
          console.log('🚨 Showing OUTBID message');
          toast.warning(`⚠️ You are outbid! New bid: ₹${data.latestBid.amount.toLocaleString()} by ${data.latestBid.user.name}`, {
            autoClose: 5000
          });
        } else if (!userHasBids) {
          // User hasn't bid yet - show general notification
          console.log('ℹ️ Showing INFO message');
          toast.info(`New bid: ₹${data.latestBid.amount.toLocaleString()} by ${data.latestBid.user.name}`);
        } else {
          console.log('✅ User is winning, no notification');
        }
      }
    };

    // Remove old listener and add new one with updated closure
    socketRef.current.off('bid-placed', handleBidPlaced);
    socketRef.current.on('bid-placed', handleBidPlaced);

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off('bid-placed', handleBidPlaced);
      }
    };
  }, [user, auction]);

  useEffect(() => {
    if (id) {
      fetchAuction();
    }
  }, [id]);

  useEffect(() => {
    if (auction && auction.status === 'Active') {
      const timer = setInterval(() => {
        updateTimeRemaining();
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [auction]);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auctions/${id}`);
      setAuction(response.data); // Response interceptor already returns data

      // Set suggested bid amount
      const currentIncrement = getCurrentIncrement(response.data);
      const suggestedBid = response.data.currentBid + currentIncrement;
      setBidAmount(suggestedBid.toString());
    } catch (error) {
      console.error('Fetch auction error:', error);
      toast.error('Failed to load auction');
      navigate('/auctions');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentIncrement = (auctionData) => {
    const currentBid = auctionData.currentBid;
    const slabs = auctionData.incrementSlabs || [];

    for (let slab of slabs) {
      if (currentBid >= slab.minPrice && currentBid < slab.maxPrice) {
        return slab.increment;
      }
    }

    return slabs[slabs.length - 1]?.increment || 50;
  };

  const updateTimeRemaining = () => {
    if (!auction) return;

    const now = new Date();
    const endTime = new Date(auction.endTime);
    const diff = endTime - now;

    if (diff <= 0) {
      setTimeRemaining('Auction Ended');
      // Refresh auction data to get updated status
      fetchAuction();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let timeStr = '';
    if (days > 0) timeStr += `${days}d `;
    timeStr += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    setTimeRemaining(timeStr);
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to place a bid');
      navigate('/login');
      return;
    }

    const amount = parseInt(bidAmount);
    const maxBid = maxBidAmount ? parseInt(maxBidAmount) : null;

    // Validate bid amount
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    if (amount % 50 !== 0) {
      toast.error('Bid amount must be divisible by 50');
      return;
    }

    // Validate max bid if provided
    if (maxBid && maxBid < amount) {
      toast.error('Maximum bid must be greater than or equal to your bid');
      return;
    }

    if (maxBid && maxBid % 50 !== 0) {
      toast.error('Maximum bid must be divisible by 50');
      return;
    }

    const currentIncrement = getCurrentIncrement(auction);
    const minBid = auction.currentBid + currentIncrement;

    if (amount < minBid) {
      toast.error(`Minimum bid is ₹${minBid.toLocaleString()}`);
      return;
    }

    try {
      setSubmittingBid(true);
      const response = await api.post(`/auctions/${auction._id}/bid`, { amount, maxBid });

      // Check if auto-bid was triggered
      if (response.data.autoBidTriggered && maxBid) {
        // User placed reserve bid and it triggered previous reserve bid
        toast.success('Bid placed! Another bidder\'s max bid was triggered.');
      } else if (maxBid) {
        toast.success(`Bid placed with max bid of ₹${maxBid.toLocaleString()}!`);
      } else {
        // Always show success for normal bid placement
        // WebSocket will show outbid notification if needed
        toast.success('Bid placed successfully!');
      }

      // Update auction with new bid
      setAuction(response.data.auction); // Response interceptor already returns data

      // Set next suggested bid
      const newIncrement = getCurrentIncrement(response.data.auction);
      const nextSuggestedBid = response.data.auction.currentBid + newIncrement;
      setBidAmount(nextSuggestedBid.toString());
      setMaxBidAmount(''); // Clear max bid after placing bid
    } catch (error) {
      console.error('Place bid error:', error);
      toast.error(error.response?.data?.message || 'Failed to place bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  const isUserWinning = () => {
    if (!user || !auction || auction.bids.length === 0) return false;
    const lastBid = auction.bids[auction.bids.length - 1];

    // Check if user placed the last bid
    const isLastBidMine = lastBid.user._id === user._id;

    // Check if user has active reserve bid that is higher than current bid
    const hasActiveReserveBid = isUserReserveBidder() &&
                                 auction.highestReserveBid &&
                                 auction.highestReserveBid > auction.currentBid;

    // User is winning if they placed last bid OR have active reserve bid
    return isLastBidMine || hasActiveReserveBid;
  };

  const isUserReserveBidder = () => {
    if (!user || !auction) return false;
    return auction.reserveBidder && auction.reserveBidder === user._id;
  };

  const getUserBidCount = () => {
    if (!user || !auction) return 0;
    return auction.bids.filter(bid => bid.user._id === user._id).length;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Auction not found</h2>
      </div>
    );
  }

  const currentIncrement = getCurrentIncrement(auction);
  const minBid = auction.currentBid + currentIncrement;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Left Column - Auction Image & Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Auction Image */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative h-64 sm:h-96 bg-gray-200">
                {auction.image ? (
                  <img
                    src={auction.image}
                    alt={auction.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gavel className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Auction Information */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{auction.title}</h1>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">{auction.description}</p>

              {/* Auction Timeline */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Start: {formatDate(auction.startTime)}</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>End: {formatDate(auction.endTime)}</span>
                </div>
              </div>

              {/* Bid History */}
              <div className="border-t pt-4 sm:pt-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Bid History ({auction.bids.length})
                </h3>

                {auction.bids.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 sm:py-6 text-sm">No bids yet. Be the first to bid!</p>
                ) : (
                  <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                    {[...auction.bids].reverse().map((bid, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-2 sm:p-3 rounded-lg ${
                          index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            index === 0 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
                          }`}>
                            {index === 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <Users className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                              {bid.user.name}
                              {bid.isReserveBidder && (
                                <span className="ml-1 sm:ml-2 text-xs bg-orange-100 text-orange-800 px-1 sm:px-2 py-0.5 rounded-full">
                                  Reserve
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {new Date(bid.timestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`font-bold text-xs sm:text-base ${index === 0 ? 'text-green-600 sm:text-lg' : 'text-gray-900'}`}>
                            ₹{bid.amount.toLocaleString()}
                          </p>
                          {index === 0 && (
                            <p className="text-xs text-green-600 font-semibold hidden sm:block">Highest Bid</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Bidding Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:sticky lg:top-4">
              {/* Status Badge */}
              <div className={`text-center py-2 px-4 rounded-lg mb-3 sm:mb-4 font-bold text-sm sm:text-base ${
                auction.status === 'Active'
                  ? 'bg-green-100 text-green-800'
                  : auction.status === 'Upcoming'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {auction.status}
              </div>

              {/* Time Remaining */}
              {auction.status === 'Active' && (
                <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-gray-700 mb-1">Time Remaining</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-800">{timeRemaining}</p>
                </div>
              )}

              {/* Current Bid Info */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Current Bid</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-600">
                    ₹{auction.currentBid.toLocaleString()}
                  </p>
                </div>

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Starting Price:</span>
                  <span className="font-semibold">₹{auction.startingPrice.toLocaleString()}</span>
                </div>

                {auction.reservePrice && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Reserve Price:</span>
                    <span className="font-semibold text-orange-600">₹{auction.reservePrice.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Next Minimum Bid:</span>
                  <span className="font-semibold text-green-600">₹{minBid.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Bid Increment:</span>
                  <span className="font-semibold">₹{currentIncrement.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Total Bids:
                  </span>
                  <span className="font-semibold">{auction.totalBids || 0}</span>
                </div>

                {user && getUserBidCount() > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Your Bids:</span>
                    <span className="font-semibold">{getUserBidCount()}</span>
                  </div>
                )}
              </div>

              {/* Winning Status */}
              {user && auction.status === 'Active' && getUserBidCount() > 0 && (
                <>
                  {isUserWinning() ? (
                    <div className="bg-green-100 border border-green-300 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                      <p className="text-green-800 font-semibold text-xs sm:text-sm flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        You are currently winning!
                      </p>
                      {isUserReserveBidder() && auction.highestReserveBid && (
                        <p className="text-orange-700 text-xs mt-1 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Your reserve bid: ₹{auction.highestReserveBid.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                      <p className="text-red-800 font-semibold text-xs sm:text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        You are outbid! Place a higher bid to win.
                      </p>
                      {isUserReserveBidder() && auction.highestReserveBid && (
                        <p className="text-orange-700 text-xs mt-1 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Your reserve bid active: ₹{auction.highestReserveBid.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Bid Form */}
              {auction.status === 'Active' ? (
                <form onSubmit={handlePlaceBid} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Your Bid Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={minBid}
                      step="50"
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-base sm:text-lg font-semibold"
                      placeholder={minBid.toString()}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must be divisible by 50 and at least ₹{minBid.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Maximum Bid (Optional) (₹)
                    </label>
                    <input
                      type="number"
                      value={maxBidAmount}
                      onChange={(e) => setMaxBidAmount(e.target.value)}
                      min={bidAmount || minBid}
                      step="50"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-base sm:text-lg font-semibold"
                      placeholder="Enter your maximum bid"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>Auto-bidding:</strong> System will automatically bid on your behalf up to this amount
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBid}
                    className="w-full bg-accent-600 hover:bg-accent-700 disabled:bg-gray-400 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    {submittingBid ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        <span>Placing Bid...</span>
                      </>
                    ) : (
                      <>
                        <Gavel className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Place Bid</span>
                      </>
                    )}
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                    <p className="text-xs text-blue-800 flex items-start">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        All bids are final. Make sure to review your bid amount before submitting.
                      </span>
                    </p>
                  </div>
                </form>
              ) : auction.status === 'Upcoming' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-blue-800 font-semibold text-sm sm:text-base">Auction hasn't started yet</p>
                  <p className="text-xs sm:text-sm text-blue-600 mt-1">Check back at the start time</p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-gray-800 font-semibold text-sm sm:text-base">Auction has ended</p>
                  {auction.winner && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Winner: {auction.winner.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;
