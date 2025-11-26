import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Gavel, Clock, TrendingUp, Users, AlertCircle, CheckCircle, History,
  Coins, User, Hash, ArrowLeft, Timer, Award, Shield, Package, CheckCircle2, Circle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { io } from 'socket.io-client';

const AuctionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [user, setUser] = useState(null);
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [goingWarning, setGoingWarning] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          // Fetch fresh user data from API to get latest auctionId and auctionCoins
          const response = await api.get('/auth/me');
          const userData = response.data || response;
          if (userData) {
            const updatedUser = { ...parsedUser, ...userData };
            console.log('Updated user with auction data:', updatedUser.auctionId, updatedUser.auctionCoins);
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } else {
            setUser(parsedUser);
          }
        } catch (error) {
          console.error('Error loading user:', error);
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        }
      }
    };
    fetchUserData();
  }, []);

  // Socket.io connection setup
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const isProduction = backendUrl.includes('chroniclevaults.com');

    socketRef.current = io(backendUrl, {
      transports: isProduction ? ['polling'] : ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
      path: '/socket.io',
      upgrade: !isProduction,
      forceNew: false,
      timeout: 20000,
      autoConnect: true
    });

    let errorCount = 0;
    const MAX_ERRORS_TO_LOG = 3;

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
      errorCount = 0;
      if (id) {
        socketRef.current.emit('join-auction', id);
      }
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to Socket.io after', attemptNumber, 'attempts');
      errorCount = 0;
      if (id) {
        socketRef.current.emit('join-auction', id);
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.io:', reason);
      if (reason === 'io server disconnect') {
        socketRef.current.connect();
      }
    });

    socketRef.current.on('connect_error', (error) => {
      errorCount++;
      if (errorCount <= MAX_ERRORS_TO_LOG) {
        console.error('Socket connection error:', error.message);
        if (errorCount === MAX_ERRORS_TO_LOG) {
          console.log('...further socket errors will be suppressed');
        }
      }
    });

    socketRef.current.on('reconnect_failed', () => {
      console.warn('⚠️ Socket.io reconnection failed after 5 attempts. Please refresh the page for live updates.');
    });

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

  // Bid placed listener
  useEffect(() => {
    if (!socketRef.current) return;

    const handleBidPlaced = (data) => {
      console.log('🔴 LIVE BID UPDATE:', data);

      let currentUser = user;
      if (!currentUser) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            currentUser = JSON.parse(savedUser);
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
          }
        }
      }

      // Check if current user got outbid and received their coins back
      if (data.outbidUser && currentUser && data.outbidUser.userId === currentUser._id) {
        console.log('🔓 Coins unfrozen! New balance:', data.outbidUser.newBalance);
        const updatedUser = { ...currentUser, auctionCoins: data.outbidUser.newBalance };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      const userHasBids = data.auction && data.auction.bids &&
                          data.auction.bids.some(bid => bid.user._id === currentUser?._id);
      const userIsReserveBidder = data.auction && data.auction.reserveBidder === currentUser?._id;
      const userHasParticipated = userHasBids || userIsReserveBidder;

      setAuction(data.auction);

      const currentIncrement = getCurrentIncrement(data.auction);
      const suggestedBid = data.auction.currentBid + currentIncrement;
      setBidAmount(suggestedBid.toString());

      const isLastBidMine = data.auction.bids.length > 0 &&
                            data.auction.bids[data.auction.bids.length - 1].user._id === currentUser?._id;
      const someoneElseHasHigherReserveBid = data.auction.highestReserveBid &&
                                             data.auction.reserveBidder &&
                                             data.auction.reserveBidder !== currentUser?._id &&
                                             data.auction.highestReserveBid > data.auction.currentBid;
      const isStillWinning = isLastBidMine && !someoneElseHasHigherReserveBid;

      if (data.latestBid.user._id === currentUser?._id) {
        if (data.autoBidTriggered && data.latestBid.isAutoBid) {
          toast.success(`Auto-bid placed: ₹${data.latestBid.amount.toLocaleString()}`);
        }
      } else {
        if (userHasParticipated && !isStillWinning) {
          toast.warning(`⚠️ You are outbid! New bid placed: ₹${data.latestBid.amount.toLocaleString()}`, {
            autoClose: 5000
          });
        } else if (!userHasParticipated) {
          toast.info(`New bid placed: ₹${data.latestBid.amount.toLocaleString()}`);
        }
      }
    };

    socketRef.current.off('bid-placed', handleBidPlaced);
    socketRef.current.on('bid-placed', handleBidPlaced);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('bid-placed', handleBidPlaced);
      }
    };
  }, [user]);

  // Going, Going, Gone warning listener
  useEffect(() => {
    if (!socketRef.current || !auction) return;

    const handleAuctionWarning = (data) => {
      console.log('🔔 AUCTION WARNING:', data);

      if (data.auctionId === auction._id) {
        setGoingWarning(data.warning);
        setWarningMessage(data.message);

        if (data.warning === 1) {
          toast.warning('⚠️ GOING ONCE! 🔨 Place your bid now!', {
            autoClose: 5000,
            position: 'top-center'
          });
        } else if (data.warning === 2) {
          toast.error('🚨 GOING TWICE! 🔨🔨 Last chance to bid!', {
            autoClose: 5000,
            position: 'top-center'
          });
        } else if (data.final) {
          toast.success('🎉 SOLD! 🎉 Auction has ended!', {
            autoClose: 1000,
            position: 'top-center'
          });
          // Refresh auction data
          setTimeout(() => {
            fetchAuction();
          }, 1000);
        }
      }
    };

    const handleWarningReset = (data) => {
      console.log('🔄 WARNING RESET:', data);

      if (data.auctionId === auction._id) {
        setGoingWarning(0);
        setWarningMessage('');
      }
    };

    const handleLotChanged = (data) => {
      console.log('📦 LOT CHANGED:', data);

      if (data.auctionId === auction._id) {
        // Dismiss any active toasts (like SOLD message)
        toast.dismiss();

        // Reset warning overlay (hide SOLD screen)
        setGoingWarning(0);

        toast.info(`🚀 Lot ${data.currentLot} has started!`, {
          autoClose: 5000,
          position: 'top-center'
        });
        // Refresh auction data to show new lot
        setTimeout(() => {
          fetchAuction();
        }, 500);
      }
    };

    const handleAuctionCompleted = (data) => {
      console.log('🏁 AUCTION COMPLETED:', data);

      if (data.auctionId === auction._id) {
        toast.success('🎉 All lots completed! Auction has ended!', {
          autoClose: 7000,
          position: 'top-center'
        });
        setTimeout(() => {
          fetchAuction();
        }, 1000);
      }
    };

    socketRef.current.off('auction-warning', handleAuctionWarning);
    socketRef.current.off('auction-warning-reset', handleWarningReset);
    socketRef.current.off('lot-changed', handleLotChanged);
    socketRef.current.off('auction-completed', handleAuctionCompleted);

    socketRef.current.on('auction-warning', handleAuctionWarning);
    socketRef.current.on('auction-warning-reset', handleWarningReset);
    socketRef.current.on('lot-changed', handleLotChanged);
    socketRef.current.on('auction-completed', handleAuctionCompleted);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('auction-warning', handleAuctionWarning);
        socketRef.current.off('auction-warning-reset', handleWarningReset);
        socketRef.current.off('lot-changed', handleLotChanged);
        socketRef.current.off('auction-completed', handleAuctionCompleted);
      }
    };
  }, [auction]);

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
      setAuction(response.data);
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

    // FOR LOT BIDDING: Use currentLotEndTime instead of auction endTime
    let endTime;
    if (auction.isLotBidding && auction.currentLotEndTime) {
      endTime = new Date(auction.currentLotEndTime);
    } else {
      endTime = new Date(auction.endTime);
    }

    const diff = endTime - now;

    if (diff <= 0) {
      if (auction.isLotBidding) {
        setTimeRemaining('Lot Ending...');
      } else {
        setTimeRemaining('Auction Ended');
      }
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

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    if (amount % 50 !== 0) {
      toast.error('Bid amount must be divisible by 50');
      return;
    }

    const currentIncrement = getCurrentIncrement(auction);
    const minBid = auction.currentBid + currentIncrement;

    // If amount > minBid, treat as max reserve bid
    const maxBid = amount > minBid ? amount : null;

    if (amount < minBid) {
      toast.error(`Minimum bid is ₹${minBid.toLocaleString()}`);
      return;
    }

    // If maxBid is set, actual bid is minBid, coin deduction is based on minBid
    const actualBid = maxBid ? minBid : amount;
    const coinDeduction = actualBid - auction.currentBid;

    if (user.auctionCoins < coinDeduction) {
      toast.error(`Insufficient coins! You have ${user.auctionCoins?.toLocaleString() || 0} coins but need ${coinDeduction.toLocaleString()} for this bid`);
      return;
    }

    try {
      setSubmittingBid(true);
      const response = await api.post(`/auctions/${auction._id}/bid`, { amount: actualBid, maxBid });
      setAuction(response.data.auction);
      const newIncrement = getCurrentIncrement(response.data.auction);
      const nextSuggestedBid = response.data.auction.currentBid + newIncrement;
      setBidAmount(nextSuggestedBid.toString());
      setMaxBidAmount('');

      // Update user's remaining coins in state and localStorage
      if (response.data.remainingCoins !== undefined) {
        const updatedUser = { ...user, auctionCoins: response.data.remainingCoins };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (maxBid) {
          toast.success(`Bid placed with reserve of ₹${maxBid.toLocaleString()}! Remaining coins: ${response.data.remainingCoins.toLocaleString()}`);
        } else {
          toast.success(`Bid placed! Remaining coins: ${response.data.remainingCoins.toLocaleString()}`);
        }
      }
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
    const isLastBidMine = lastBid.user._id === user._id;
    const someoneElseHasHigherReserveBid = auction.highestReserveBid &&
                                           auction.reserveBidder &&
                                           auction.reserveBidder !== user._id &&
                                           auction.highestReserveBid > auction.currentBid;
    return isLastBidMine && !someoneElseHasHigherReserveBid;
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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-200 border-t-accent-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Auction not found</h2>
        <button
          onClick={() => navigate('/auctions')}
          className="mt-4 px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
        >
          Back to Auctions
        </button>
      </div>
    );
  }

  // FOR LOT BIDDING: Get current lot data
  const currentLot = auction.isLotBidding && auction.lots && auction.lotNumber
    ? auction.lots[auction.lotNumber - 1]
    : null;

  // Use current lot's bid or auction's currentBid
  const displayCurrentBid = currentLot ? currentLot.currentBid : auction.currentBid;
  const displayStartingPrice = currentLot ? currentLot.startingPrice : auction.startingPrice;

  const currentIncrement = getCurrentIncrement(auction);
  const minBid = displayCurrentBid + currentIncrement;

  // FOR LOT BIDDING: Use current lot's image
  let auctionImages;
  if (auction.isLotBidding && currentLot && currentLot.image) {
    auctionImages = [currentLot.image];
  } else {
    auctionImages = auction.images?.length > 0 ? auction.images : (auction.image ? [auction.image] : []);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <button
            onClick={() => navigate('/auctions')}
            className="flex items-center gap-2 text-gray-600 hover:text-accent-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Auctions</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* User Info Card - Shows logged in user's auction details */}
        {user && user.isAuctionVerified && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-accent-600 to-accent-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">{user.name}</h3>
                  <p className="text-white/80 text-xs sm:text-sm">Verified Auction Member</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-6">
                <div className="bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-sm">
                  <div>
                    <p className="text-white/70 text-[10px] sm:text-xs uppercase tracking-wide">Auction ID</p>
                    <p className="font-bold text-sm sm:text-base font-mono">{user.auctionId || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                    <div>
                      <p className="text-white/70 text-[10px] sm:text-xs uppercase tracking-wide">Available Coins</p>
                      <p className="font-bold text-sm sm:text-base">{user.auctionCoins?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Going, Going, Gone Warning Banner */}
        {auction && auction.status === 'Active' && goingWarning > 0 && (
          <div className={`mb-4 sm:mb-6 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border-2 animate-pulse ${
            goingWarning === 1
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-300'
              : goingWarning === 2
              ? 'bg-gradient-to-r from-red-500 to-pink-600 border-red-300'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-300'
          }`}>
            <div className="flex items-center justify-center gap-3 text-white">
              {goingWarning === 1 && (
                <>
                  <Gavel className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                  <div className="text-center">
                    <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-wider">
                      GOING ONCE! 🔨
                    </h3>
                    <p className="text-sm sm:text-base font-medium mt-1">
                      30 seconds to next warning!
                    </p>
                  </div>
                  <Gavel className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                </>
              )}
              {goingWarning === 2 && (
                <>
                  <Gavel className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                  <Gavel className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                  <div className="text-center">
                    <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-wider">
                      GOING TWICE! 🔨🔨
                    </h3>
                    <p className="text-sm sm:text-base font-medium mt-1">
                      Last 30 seconds! Place your bid NOW!
                    </p>
                  </div>
                  <Gavel className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                  <Gavel className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                </>
              )}
              {goingWarning === 3 && (
                <>
                  <Award className="w-8 h-8 sm:w-10 sm:h-10" />
                  <div className="text-center">
                    <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-wider">
                      SOLD! 🎉
                    </h3>
                    <p className="text-sm sm:text-base font-medium mt-1">
                      Auction has ended!
                    </p>
                  </div>
                  <Award className="w-8 h-8 sm:w-10 sm:h-10" />
                </>
              )}
            </div>
          </div>
        )}

        {/* Not verified message */}
        {user && !user.isAuctionVerified && (
          <div className="mb-4 sm:mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-800">Auction Registration Required</h3>
                <p className="text-yellow-700 text-sm mt-1">You need to register for auctions to participate in bidding.</p>
                <button
                  onClick={() => navigate('/auction-registration')}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 transition-colors"
                >
                  Register Now
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Auction Images & Details */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Auction Image Gallery */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
              <div className="relative aspect-square sm:aspect-[4/3] bg-gray-100">
                {auctionImages.length > 0 ? (
                  <img
                    src={auctionImages[selectedImage]}
                    alt={auction.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gavel className="w-20 h-20 sm:w-24 sm:h-24 text-gray-300" />
                  </div>
                )}

                {/* Status Badge on Image */}
                <div className={`absolute top-3 sm:top-4 left-3 sm:left-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg ${
                  auction.status === 'Active'
                    ? 'bg-green-500 text-white'
                    : auction.status === 'Upcoming'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {auction.status === 'Active' && <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>}
                  {auction.status}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {auctionImages.length > 1 && (
                <div className="p-3 sm:p-4 border-t flex gap-2 overflow-x-auto">
                  {auctionImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-accent-600 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auction Information */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              {/* FOR LOT BIDDING: Show current lot title */}
              {auction.isLotBidding && auction.lots && auction.lotNumber ? (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm font-bold">
                      Lot {auction.lotNumber} of {auction.totalLots}
                    </span>
                    <span className="text-sm text-gray-500">Sequential Lot Bidding</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                    {auction.lots[auction.lotNumber - 1]?.title || auction.title}
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    {auction.lots[auction.lotNumber - 1]?.description || auction.description}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{auction.title}</h1>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{auction.description}</p>
                </>
              )}

              {/* Auction Timeline */}
              <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Start Time</p>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">{formatDate(auction.startTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Timer className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">End Time</p>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">{formatDate(auction.endTime)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-accent-600" />
                Bid History
                <span className="ml-auto text-sm font-normal text-gray-500">{auction.bids.length} bids</span>
              </h3>

              {auction.bids.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Gavel className="w-12 h-12 sm:w-16 sm:h-16 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No bids yet</p>
                  <p className="text-gray-400 text-sm">Be the first to place a bid!</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto pr-2">
                  {[...auction.bids].reverse().map((bid, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all ${
                        index === 0
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          index === 0 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index === 0 ? <Award className="w-4 h-4 sm:w-5 sm:h-5" /> : <User className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            Bidder #{auction.bids.length - index}
                            {index === 0 && (
                              <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                Leading
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500">
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
                        <p className={`font-bold text-sm sm:text-lg ${index === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          ₹{bid.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Bidding Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden lg:sticky lg:top-20">
              {/* Time Remaining Header */}
              {auction.status === 'Active' && (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 sm:p-6 text-white">
                  <p className="text-white/80 text-xs sm:text-sm uppercase tracking-wide mb-1">Time Remaining</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono">{timeRemaining}</p>
                </div>
              )}

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Current Bid Display */}
                <div className="text-center py-4 sm:py-6 border-b-2 border-gray-100">
                  <p className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide mb-2">Current Bid</p>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-accent-600">
                    ₹{displayCurrentBid.toLocaleString()}
                  </p>
                </div>

                {/* Bid Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Starting Price</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">₹{displayStartingPrice.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Total Bids</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">{auction.totalBids || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-green-600 uppercase tracking-wide">Next Min Bid</p>
                    <p className="font-bold text-green-700 text-sm sm:text-base">₹{minBid.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Increment</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">₹{currentIncrement.toLocaleString()}</p>
                  </div>
                </div>

                {/* User Bid Stats */}
                {user && getUserBidCount() > 0 && (
                  <div className="bg-accent-50 rounded-xl p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-accent-600 uppercase tracking-wide">Your Bids</p>
                    <p className="font-bold text-accent-700 text-sm sm:text-base">{getUserBidCount()} bids placed</p>
                  </div>
                )}

                {/* Winning Status */}
                {user && auction.status === 'Active' && getUserBidCount() > 0 && (
                  isUserWinning() ? (
                    <div className="bg-green-100 border-2 border-green-300 rounded-xl p-3 sm:p-4">
                      <p className="text-green-800 font-bold text-sm sm:text-base flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        You are winning!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-100 border-2 border-red-300 rounded-xl p-3 sm:p-4">
                      <p className="text-red-800 font-bold text-sm sm:text-base flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        You are outbid!
                      </p>
                    </div>
                  )
                )}

                {/* Bid Form */}
                {auction.status === 'Active' ? (
                  user && user.isAuctionVerified ? (
                    <form onSubmit={handlePlaceBid} className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                          Your Bid / Max Reserve (₹)
                        </label>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          min={minBid}
                          step="50"
                          required
                          className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-lg sm:text-xl font-bold text-center"
                          placeholder={minBid.toString()}
                        />
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 text-center">
                          Min: ₹{minBid.toLocaleString()} • Enter higher amount to set as max reserve
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingBid}
                        className="w-full bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 sm:py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg hover:shadow-xl"
                      >
                        {submittingBid ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Placing Bid...</span>
                          </>
                        ) : (
                          <>
                            <Gavel className="w-5 h-5" />
                            <span>Place Bid</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-6">
                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-3">
                        {user ? 'Complete auction registration to bid' : 'Login to place bids'}
                      </p>
                      <button
                        onClick={() => navigate(user ? '/auction-registration' : '/authentication')}
                        className="px-6 py-3 bg-accent-600 text-white rounded-xl font-semibold hover:bg-accent-700 transition-colors"
                      >
                        {user ? 'Register for Auctions' : 'Login / Sign Up'}
                      </button>
                    </div>
                  )
                ) : auction.status === 'Upcoming' ? (
                  <div className="text-center py-6 bg-blue-50 rounded-xl">
                    <Clock className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <p className="text-blue-800 font-bold">Auction hasn't started</p>
                    <p className="text-blue-600 text-sm mt-1">Check back at start time</p>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-800 font-bold">Auction Ended</p>
                    {auction.winner && (
                      <p className="text-gray-600 text-sm mt-1">
                        Winner: <span className="font-semibold">{auction.winner.name}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>All bids are final. Review carefully before submitting.</span>
                  </p>
                </div>

                {/* Lot Bidding Sidebar - Show all lots */}
                {auction.isLotBidding && auction.lots && auction.lots.length > 0 && (
                  <div className="border-t-2 border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5 text-accent-600" />
                      All Lots ({auction.lots.length})
                    </h3>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {auction.lots.map((lot, index) => (
                        <div
                          key={index}
                          className={`rounded-xl p-3 border-2 transition-all ${
                            lot.status === 'Active'
                              ? 'bg-green-50 border-green-500 shadow-md'
                              : lot.status === 'Ended'
                              ? 'bg-gray-50 border-gray-300'
                              : 'bg-blue-50 border-blue-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Lot Icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              lot.status === 'Active'
                                ? 'bg-green-500 text-white'
                                : lot.status === 'Ended'
                                ? 'bg-gray-400 text-white'
                                : 'bg-blue-400 text-white'
                            }`}>
                              {lot.status === 'Ended' ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : lot.status === 'Active' ? (
                                <Gavel className="w-5 h-5 animate-pulse" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </div>

                            {/* Lot Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  lot.status === 'Active'
                                    ? 'bg-green-500 text-white'
                                    : lot.status === 'Ended'
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-blue-500 text-white'
                                }`}>
                                  Lot {lot.lotNumber}
                                </span>
                                <span className={`text-xs font-semibold ${
                                  lot.status === 'Active'
                                    ? 'text-green-700'
                                    : lot.status === 'Ended'
                                    ? 'text-gray-600'
                                    : 'text-blue-700'
                                }`}>
                                  {lot.status === 'Active' && '🔴 LIVE'}
                                  {lot.status === 'Ended' && '✅ SOLD'}
                                  {lot.status === 'Upcoming' && '⏳ UPCOMING'}
                                </span>
                              </div>

                              <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">
                                {lot.title}
                              </h4>

                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-gray-500">Current:</span>
                                  <span className="font-bold text-gray-900 ml-1">
                                    ₹{lot.currentBid.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Bids:</span>
                                  <span className="font-bold text-gray-900 ml-1">
                                    {lot.bids?.length || 0}
                                  </span>
                                </div>
                              </div>

                              {lot.status === 'Ended' && lot.winner && (
                                <div className="mt-1 text-xs text-gray-600">
                                  <span className="font-semibold">Winner:</span> {lot.winner.name || 'N/A'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Lot Progress Indicator */}
                    <div className="mt-4 bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>Progress</span>
                        <span className="font-bold">
                          Lot {auction.lotNumber || 1} of {auction.totalLots}
                        </span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-accent-500 to-accent-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${((auction.lotNumber || 1) / auction.totalLots) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;
