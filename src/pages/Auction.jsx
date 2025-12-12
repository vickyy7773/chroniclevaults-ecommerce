import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Gavel, Clock, TrendingUp, Users, AlertCircle, CheckCircle,
  Coins, User, Hash, Shield, ArrowLeft
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
  const [callNumber, setCallNumber] = useState(0); // Phase: 1, 2, or 3
  const [phaseMessage, setPhaseMessage] = useState(''); // Going Once, Going Twice, SOLD/UNSOLD
  const [phaseTimer, setPhaseTimer] = useState(0); // 10-second countdown per phase
  const [selectedLotIndex, setSelectedLotIndex] = useState(null); // Track which lot is selected for viewing

  // 2-PHASE AUCTION SYSTEM: Track auction phase (catalog/live/ended)
  const [auctionPhase, setAuctionPhase] = useState('catalog'); // 'catalog', 'live', or 'ended'
  const [catalogTimeRemaining, setCatalogTimeRemaining] = useState(''); // Time until live auction starts

  // Phase Detection: Determine if auction is in Catalog or Live phase
  useEffect(() => {
    if (!auction) return;

    const detectPhase = () => {
      const now = new Date();
      const startTime = new Date(auction.startTime);
      const endTime = auction.endTime ? new Date(auction.endTime) : null;

      // Check if catalog bidding is enabled
      const isCatalogEnabled = auction.catalogBiddingEnabled === true;

      if (now < startTime && isCatalogEnabled) {
        // Catalog Phase: Before start time with catalog enabled
        setAuctionPhase('catalog');

        // Calculate time remaining until live auction
        const diff = startTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setCatalogTimeRemaining(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setCatalogTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setCatalogTimeRemaining(`${minutes}m`);
        }
      } else if (now >= startTime && (!endTime || now < endTime)) {
        // Live Phase: After start time
        setAuctionPhase('live');
      } else {
        // Ended Phase
        setAuctionPhase('ended');
      }
    };

    detectPhase();

    // Update phase every 30 seconds
    const interval = setInterval(detectPhase, 30000);

    return () => clearInterval(interval);
  }, [auction]);

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

      // Join user's personal room for coin updates
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

      if (currentUser?._id) {
        socketRef.current.emit('join-user-room', currentUser._id);
        console.log(`💰 Joining personal room: user-${currentUser._id}`);
      }

      if (id) {
        socketRef.current.emit('join-auction', id);
      }
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to Socket.io after', attemptNumber, 'attempts');
      errorCount = 0;

      // Rejoin user's personal room for coin updates
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

      if (currentUser?._id) {
        socketRef.current.emit('join-user-room', currentUser._id);
        console.log(`💰 Rejoining personal room: user-${currentUser._id}`);
      }

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
                          data.auction.bids.some(bid => bid.user?._id === currentUser?._id);
      const userIsReserveBidder = data.auction && data.auction.reserveBidder === currentUser?._id;
      const userHasParticipated = userHasBids || userIsReserveBidder;

      setAuction(data.auction);

      const currentIncrement = getCurrentIncrement(data.auction);
      const suggestedBid = data.auction.currentBid + currentIncrement;
      setBidAmount(suggestedBid.toString());

      const isLastBidMine = data.auction.bids.length > 0 &&
                            data.auction.bids[data.auction.bids.length - 1].user?._id === currentUser?._id;
      const someoneElseHasHigherReserveBid = data.auction.highestReserveBid &&
                                             data.auction.reserveBidder &&
                                             data.auction.reserveBidder !== currentUser?._id &&
                                             data.auction.highestReserveBid > data.auction.currentBid;
      const isStillWinning = isLastBidMine && !someoneElseHasHigherReserveBid;

      // Guard clause: Validate latestBid data structure
      if (!data.latestBid || !data.latestBid.user) {
        console.warn('Invalid bid data received:', data);
        return;
      }

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

  // Real-time coin balance update listener
  useEffect(() => {
    if (!socketRef.current) return;

    const handleCoinBalanceUpdate = (data) => {
      console.log('💰 REAL-TIME COIN UPDATE:', data);

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

      if (currentUser) {
        // Update user's coin balance in state
        const updatedUser = {
          ...currentUser,
          auctionCoins: data.auctionCoins,
          frozenCoins: data.frozenCoins
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Show toast notification
        if (data.reason.includes('refunded') || data.reason.includes('Outbid')) {
          toast.success(`💰 ${data.reason} - Balance: ₹${data.auctionCoins.toLocaleString()}`, {
            autoClose: 3000
          });
        }

        console.log(`✅ Updated coin balance: ₹${data.auctionCoins.toLocaleString()} (Frozen: ₹${data.frozenCoins.toLocaleString()})`);
      }
    };

    socketRef.current.off('coin-balance-updated', handleCoinBalanceUpdate);
    socketRef.current.on('coin-balance-updated', handleCoinBalanceUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('coin-balance-updated', handleCoinBalanceUpdate);
      }
    };
  }, [user]);

  // 3-Phase Timer listener
  useEffect(() => {
    if (!socketRef.current || !auction) return;

    const handlePhaseTick = (data) => {
      console.log('🔔 PHASE TICK:', data);

      if (data.auctionId === auction._id) {
        setCallNumber(data.callNumber);
        setPhaseMessage(data.phaseMessage);
        setPhaseTimer(data.phaseTimer);

        // Show toast on phase change
        if (data.callNumber === 1 && data.phaseTimer === 10) {
          toast.warning(`⚠️ Going Once! Place your bid now!`, {
            autoClose: 3000,
            position: 'top-center'
          });
        } else if (data.callNumber === 2 && data.phaseTimer === 10) {
          toast.error(`🚨 Going Twice! Last chance to bid!`, {
            autoClose: 3000,
            position: 'top-center'
          });
        } else if (data.callNumber === 3 && data.phaseTimer === 10) {
          // Phase 3 started
          if (data.phaseMessage === 'SOLD') {
            toast.success(`🎉 SOLD!`, {
              autoClose: 2000,
              position: 'top-center'
            });
          } else {
            toast.warning(`❌ UNSOLD`, {
              autoClose: 2000,
              position: 'top-center'
            });
          }
        }

        // When phase 3 ends (timer = 0), refresh auction
        if (data.callNumber === 3 && data.phaseTimer === 0) {
          setTimeout(() => {
            setCallNumber(0);
            setPhaseMessage('');
            setPhaseTimer(0);
            fetchAuction();
          }, 1000);
        }
      }
    };

    const handlePhaseReset = (data) => {
      console.log('🔄 PHASE RESET:', data);

      if (data.auctionId === auction._id) {
        setCallNumber(data.callNumber);
        setPhaseTimer(data.phaseTimer);
        toast.info(`New bid! Timer reset to ${data.phaseTimer}s`, {
          autoClose: 2000,
          position: 'top-center'
        });
      }
    };

    const handleLotChanged = (data) => {
      console.log('📦 LOT CHANGED:', data);

      if (data.auctionId === auction._id) {
        // Dismiss any active toasts
        toast.dismiss();

        // Reset timer state for new lot
        setCallNumber(0);
        setPhaseMessage('');
        setPhaseTimer(0);

        // Update auction with new lot values
        if (data.currentLotStartTime !== undefined && data.lastBidTime !== undefined) {
          setAuction(prev => ({
            ...prev,
            currentLotStartTime: data.currentLotStartTime,
            lastBidTime: data.lastBidTime,
            lotNumber: data.lotNumber,
            callNumber: 1, // Reset to phase 1 for new lot
            phaseTimer: 10
          }));

          console.log(`✅ Updated auction state for Lot ${data.lotNumber}:`, {
            currentLotStartTime: data.currentLotStartTime,
            lastBidTime: data.lastBidTime,
            lotNumber: data.lotNumber
          });
        }

        toast.info(`🚀 Lot ${data.lotNumber} has started!`, {
          autoClose: 5000,
          position: 'top-center'
        });

        // Fetch full auction data after a delay
        setTimeout(() => {
          fetchAuction();
        }, 1000);
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

    socketRef.current.off('auction-phase-tick', handlePhaseTick);
    socketRef.current.off('auction-phase-reset', handlePhaseReset);
    socketRef.current.off('lot-changed', handleLotChanged);
    socketRef.current.off('lot-started', handleLotChanged);
    socketRef.current.off('auction-completed', handleAuctionCompleted);

    socketRef.current.on('auction-phase-tick', handlePhaseTick);
    socketRef.current.on('auction-phase-reset', handlePhaseReset);
    socketRef.current.on('lot-changed', handleLotChanged);
    socketRef.current.on('lot-started', handleLotChanged);
    socketRef.current.on('auction-completed', handleAuctionCompleted);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('auction-phase-tick', handlePhaseTick);
        socketRef.current.off('auction-phase-reset', handlePhaseReset);
        socketRef.current.off('lot-changed', handleLotChanged);
        socketRef.current.off('lot-started', handleLotChanged);
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
      }, 100); // Update every 100ms for smooth countdown
      return () => clearInterval(timer);
    }
  }, [auction, phaseTimer, callNumber]); // Include phaseTimer and callNumber to prevent stale closure

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

  const getCurrentIncrement = (auctionData, currentBidValue = null) => {
    const currentBid = currentBidValue !== null ? currentBidValue : auctionData.currentBid;
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

    // 2-PHASE SYSTEM: In Catalog Phase, show countdown to live auction
    if (auctionPhase === 'catalog') {
      setTimeRemaining(`📚 Catalog Bidding • Live in: ${catalogTimeRemaining}`);
      return;
    }

    // FOR LOT BIDDING: Show phase timer if active (Live Phase only)
    if (auction.isLotBidding && auctionPhase === 'live') {
      // Priority 1: If phase timer is active, show it with phase message
      if (callNumber > 0 && phaseTimer !== undefined) {
        const phaseLabels = {
          1: 'Going Once',
          2: 'Going Twice',
          3: phaseMessage || 'Final'
        };

        setTimeRemaining(`${phaseLabels[callNumber]}: ${phaseTimer}s`);
        return;
      }

      // Priority 2: Show normal countdown (waiting for first bid or between bids)
      const now = new Date();
      const currentLotIndex = (auction.lotNumber || 1) - 1;
      const currentLot = auction.lots && auction.lots[currentLotIndex];
      const hasBids = currentLot && currentLot.bids && currentLot.bids.length > 0;

      if (hasBids && auction.lastBidTime) {
        // Show simple "Waiting for bids..." when timer hasn't started
        setTimeRemaining('Waiting for bids...');
        return;
      } else if (auction.currentLotStartTime) {
        // Before first bid: show waiting message
        setTimeRemaining('Place a bid to start timer');
        return;
      }

      // Fallback
      setTimeRemaining('Starting soon...');
      return;
    }

    // For regular auctions, use endTime
    const now = new Date();
    const endTime = new Date(auction.endTime);
    const diff = endTime - now;

    if (diff <= 0) {
      setTimeRemaining('Auction Ended');
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

    // FOR LOT BIDDING: Use flexible validation (any amount > current bid, divisible by 50)
    // FOR NORMAL AUCTION: Use increment slab validation
    let minBid;
    let maxBid = null;

    if (auction.isLotBidding) {
      // LOT BIDDING: Use increment slab validation
      const currentLotIndex = (auction.lotNumber || 1) - 1;
      const currentLot = auction.lots && auction.lots[currentLotIndex];
      const currentLotBid = currentLot?.currentBid || auction.currentBid;

      // Get current increment based on slab (pass currentLotBid for correct calculation)
      const currentIncrement = getCurrentIncrement(auction, currentLotBid);
      minBid = currentLotBid + currentIncrement;

      // Must be divisible by 50
      if (amount % 50 !== 0) {
        toast.error('Bid amount must be divisible by 50');
        return;
      }

      // If amount > minBid, treat as max reserve bid
      maxBid = amount > minBid ? amount : null;

      if (amount < minBid) {
        toast.error(`Minimum bid is ₹${minBid.toLocaleString()}`);
        return;
      }
    } else {
      // NORMAL AUCTION: Use increment slab validation
      const currentIncrement = getCurrentIncrement(auction);
      minBid = auction.currentBid + currentIncrement;

      // If amount > minBid, treat as max reserve bid
      maxBid = amount > minBid ? amount : null;

      if (amount < minBid) {
        toast.error(`Minimum bid is ₹${minBid.toLocaleString()}`);
        return;
      }
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
    if (!lastBid || !lastBid.user) return false; // Guard clause
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
    return auction.bids.filter(bid => bid.user?._id === user._id).length;
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
        <h2 className="text-3xl font-bold text-gray-900">Auction not found</h2>
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

  // Get the lot to display - either selected lot or current active lot
  const displayLot = selectedLotIndex !== null && auction.lots
    ? auction.lots[selectedLotIndex]
    : currentLot;

  // Use display lot's bid or auction's currentBid
  const displayCurrentBid = displayLot ? displayLot.currentBid : auction.currentBid;
  const displayStartingPrice = displayLot ? displayLot.startingPrice : auction.startingPrice;

  const currentIncrement = getCurrentIncrement(auction);
  const minBid = displayCurrentBid + currentIncrement;

  // FOR LOT BIDDING: Use display lot's image
  let auctionImages;
  if (auction.isLotBidding && displayLot && displayLot.image) {
    auctionImages = [displayLot.image];
  } else {
    // Fix: Backend uses auction.image (singular), not auction.images (plural)
    auctionImages = auction.image ? [auction.image] : [];
  }

  // Handle lot click - show selected lot details
  const handleLotClick = (lotIndex) => {
    setSelectedLotIndex(lotIndex);
    setSelectedImage(0); // Reset image selection
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 transition-all duration-300 ease-in-out">
        <div className="w-full mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/auctions')}
              className="flex items-center gap-2 text-gray-600 hover:text-accent-600 transition-colors text-base font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Auctions</span>
            </button>

            {/* Start Time */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Start:</span>
              <span className="font-bold text-green-700 text-sm">{formatDate(auction.startTime)}</span>
            </div>
          </div>

          {user && user.isAuctionVerified && (
            <div className="flex items-center gap-3 text-base">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-gray-800">{user.name}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                <Hash className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">ID:</span>
                <span className="font-bold text-blue-700">{user.auctionId || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-600 font-medium">Coins:</span>
                <span className="font-bold text-amber-700">₹{user.auctionCoins?.toLocaleString() || 0}</span>
              </div>
            </div>
          )}

          {user && !user.isAuctionVerified && (
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-600" />
              <span className="text-base font-medium text-yellow-800">Registration Required</span>
              <button
                onClick={() => navigate('/auction-registration')}
                className="ml-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm font-semibold hover:bg-yellow-700"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full mx-auto px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left Column - Auction Images & Details */}
          <div className="space-y-2">
            {/* Auction Image Gallery */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                {auctionImages.length > 0 ? (
                  <img
                    src={auctionImages[selectedImage]}
                    alt={auction.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gavel className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {/* Status Badge on Image */}
                <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-full font-bold text-base shadow-lg ${
                  auction.status === 'Active'
                    ? 'bg-green-500 text-white'
                    : auction.status === 'Upcoming'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {auction.status === 'Active' && <span className="inline-block w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></span>}
                  {auction.status}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {auctionImages.length > 1 && (
                <div className="p-2 border-t flex gap-1.5 overflow-x-auto">
                  {auctionImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
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
            <div className="bg-white rounded-lg shadow-lg p-3">
              {/* FOR LOT BIDDING: Show display lot title */}
              {auction.isLotBidding && auction.lots && displayLot ? (
                <>
                  <div className="mb-2 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-accent-100 text-accent-700 rounded-full text-base font-bold">
                      Lot {displayLot.lotNumber} of {auction.totalLots}
                    </span>
                    {selectedLotIndex !== null && selectedLotIndex !== (auction.lotNumber - 1) && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        👁️ Viewing
                      </span>
                    )}
                    {displayLot.status === 'Active' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        🔴 LIVE NOW
                      </span>
                    )}
                    <span className="text-base text-gray-500">Sequential Lot Bidding</span>
                  </div>
                  <h1 className="text-lg font-bold text-gray-900 mb-2">
                    {displayLot.title || auction.title}
                  </h1>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {displayLot.description || auction.description}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-lg font-bold text-gray-900 mb-2">{auction.title}</h1>
                  <p className="text-gray-600 text-sm leading-relaxed">{auction.description}</p>
                </>
              )}

            </div>

          </div>

          {/* Right Column - Bidding Section */}
          <div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Time Remaining Header - Phase-aware styling */}
              {(auction.status === 'Active' || auctionPhase === 'catalog') && (
                <div className={`p-2.5 text-white ${
                  auctionPhase === 'catalog'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500'
                }`}>
                  <p className="text-white/80 text-base uppercase tracking-wide mb-0.5">
                    {auctionPhase === 'catalog' ? 'Catalog Phase' : 'Time Remaining'}
                  </p>
                  <p className="text-2xl font-bold font-mono">{timeRemaining}</p>
                  {auctionPhase === 'catalog' && (
                    <p className="text-xs text-white/70 mt-1">
                      Place your bids now • Live auction starts soon
                    </p>
                  )}
                </div>
              )}

              <div className="p-3 space-y-2.5">
                {/* Current Bid Display */}
                <div className="text-center py-2.5 border-b border-gray-100">
                  <p className="text-gray-500 text-base uppercase tracking-wide mb-1">Current Bid</p>
                  <p className="text-3xl font-black text-accent-600">
                    ₹{displayCurrentBid.toLocaleString()}
                  </p>
                </div>

                {/* Bid Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Starting Price</p>
                    <p className="font-bold text-gray-900 text-sm">₹{displayStartingPrice.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Total Bids</p>
                    <p className="font-bold text-gray-900 text-sm">{auction.totalBids || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-sm text-green-600 uppercase tracking-wide">Next Min Bid</p>
                    <p className="font-bold text-green-700 text-sm">₹{minBid.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Increment</p>
                    <p className="font-bold text-gray-900 text-sm">₹{currentIncrement.toLocaleString()}</p>
                  </div>
                  {/* Reserve Price - LOT BIDDING ONLY */}
                  {auction.isLotBidding && displayLot && displayLot.reservePrice > 0 && (
                    <div className="col-span-2 bg-orange-50 border border-orange-200 rounded-lg p-2">
                      <p className="text-sm text-orange-600 uppercase tracking-wide flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Reserve Price (Min to Sell)
                      </p>
                      <p className="font-bold text-orange-700 text-sm">₹{displayLot.reservePrice.toLocaleString()}</p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        {displayCurrentBid >= displayLot.reservePrice
                          ? '✅ Reserve met - Will sell if no higher bid'
                          : '⚠️ Reserve not met - Won\'t sell below this'}
                      </p>
                    </div>
                  )}
                </div>

                {/* User Bid Stats */}
                {user && getUserBidCount() > 0 && (
                  <div className="bg-accent-50 rounded-lg p-2">
                    <p className="text-sm text-accent-600 uppercase tracking-wide">Your Bids</p>
                    <p className="font-bold text-accent-700 text-sm">{getUserBidCount()} bids placed</p>
                  </div>
                )}

                {/* Winning Status */}
                {user && auction.status === 'Active' && getUserBidCount() > 0 && (
                  isUserWinning() ? (
                    <div className="bg-green-100 border border-green-300 rounded-lg p-2">
                      <p className="text-green-800 font-bold text-sm flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        You are winning!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-2">
                      <p className="text-red-800 font-bold text-sm flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        You are outbid!
                      </p>
                    </div>
                  )
                )}

                {/* Bid Form */}
                {auction.status === 'Active' ? (
                  user && user.isAuctionVerified ? (
                    <form onSubmit={handlePlaceBid} className="space-y-2">
                      <div>
                        <label className="block text-base font-semibold text-gray-700 mb-1">
                          Your Bid / Max Reserve (₹)
                        </label>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          min={minBid}
                          step="50"
                          required
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-lg font-bold text-center"
                          placeholder={minBid.toString()}
                        />
                        <p className="text-sm text-gray-500 mt-0.5 text-center">
                          Min: ₹{minBid.toLocaleString()}
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingBid}
                        className="w-full bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-base shadow-lg hover:shadow-xl"
                      >
                        {submittingBid ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Placing Bid...</span>
                          </>
                        ) : (
                          <>
                            <Gavel className="w-4 h-4" />
                            <span>Place Bid</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-3">
                      <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium mb-2 text-sm">
                        {user ? 'Complete auction registration to bid' : 'Login to place bids'}
                      </p>
                      <button
                        onClick={() => navigate(user ? '/auction-registration' : '/authentication')}
                        className="px-4 py-2 bg-accent-600 text-white rounded-lg text-sm font-semibold hover:bg-accent-700 transition-colors"
                      >
                        {user ? 'Register for Auctions' : 'Login / Sign Up'}
                      </button>
                    </div>
                  )
                ) : auction.status === 'Upcoming' ? (
                  <div className="text-center py-3 bg-blue-50 rounded-lg">
                    <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-800 font-bold text-sm">Auction hasn't started</p>
                    <p className="text-blue-600 text-base mt-0.5">Check back at start time</p>
                  </div>
                ) : (
                  <div className="text-center py-3 bg-gray-50 rounded-lg">
                    <Gavel className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-800 font-bold text-sm">Auction Ended</p>
                    {auction.winner && (
                      <p className="text-gray-600 text-base mt-0.5">
                        Winner: <span className="font-semibold">{auction.winner.name}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <p className="text-sm text-amber-800 flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>All bids are final. Review carefully before submitting.</span>
                  </p>
                </div>

                {/* Bid History */}
                <div className="border-t border-gray-200 pt-2.5">
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center justify-between">
                    <span>Bid History</span>
                    <span className="text-base font-normal text-gray-500">{auction.bids.length} bids</span>
                  </h3>

                  {auction.bids.length === 0 ? (
                    <div className="text-center py-4">
                      <Gavel className="w-8 h-8 text-gray-200 mx-auto mb-1.5" />
                      <p className="text-gray-500 font-medium text-base">No bids yet</p>
                      <p className="text-gray-400 text-sm">Be the first to place a bid!</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {[...auction.bids].reverse().map((bid, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                            index === 0
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              index === 0 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                            }`}>
                              <User className="w-3 h-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-base truncate">
                                Bidder #{auction.bids.length - index}
                                {index === 0 && (
                                  <span className="ml-1 text-sm bg-green-600 text-white px-1.5 py-0.5 rounded-full">
                                    Leading
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
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
                            <p className={`font-bold text-sm ${index === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                              ₹{bid.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Lots Strip at Bottom */}
        {auction.isLotBidding && auction.lots && auction.lots.length > 0 && (
          <div className="mt-2 bg-white border-t border-gray-200 rounded-lg shadow overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                All Lots ({auction.lots.length})
              </h3>
              {/* Lot Progress Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Lot <span className="font-bold text-gray-900">{auction.lotNumber || 1}</span> of <span className="font-bold text-gray-900">{auction.totalLots}</span>
                </span>
                <div className="w-24 bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-gradient-to-r from-accent-500 to-accent-600 h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${((auction.lotNumber || 1) / auction.totalLots) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Horizontal Scrolling Lots */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              <div className="flex gap-3 p-3 min-w-min">
                {auction.lots.map((lot, index) => (
                  <div
                    key={index}
                    onClick={() => handleLotClick(index)}
                    className={`flex-shrink-0 w-80 rounded-lg p-3 border-2 transition-all cursor-pointer hover:shadow-lg h-40 ${
                      selectedLotIndex === index
                        ? 'bg-accent-50 border-accent-500 shadow-lg ring-2 ring-accent-300'
                        : lot.status === 'Active'
                        ? 'bg-green-50 border-green-500'
                        : lot.status === 'Ended'
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-blue-50 border-blue-300'
                    }`}
                  >
                    <div className="flex gap-3 h-full">
                      {/* Lot Image */}
                      <div className="w-32 h-full rounded-lg flex-shrink-0 overflow-hidden border-2 border-gray-200 bg-gray-100">
                        {lot.image ? (
                          <img
                            src={lot.image}
                            alt={lot.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="104"%3E%3Crect fill="%23f3f4f6" width="96" height="104"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Lot Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                              lot.status === 'Active'
                                ? 'bg-green-500 text-white'
                                : lot.status === 'Sold'
                                ? 'bg-emerald-500 text-white'
                                : lot.status === 'Unsold'
                                ? 'bg-red-500 text-white'
                                : lot.status === 'Ended'
                                ? 'bg-gray-500 text-white'
                                : 'bg-blue-500 text-white'
                            }`}>
                              #{lot.lotNumber}
                            </span>
                            <span className={`text-sm font-bold ${
                              lot.status === 'Active'
                                ? 'text-green-700'
                                : lot.status === 'Sold'
                                ? 'text-emerald-700'
                                : lot.status === 'Unsold'
                                ? 'text-red-700'
                                : lot.status === 'Ended'
                                ? 'text-gray-600'
                                : 'text-blue-700'
                            }`}>
                              {lot.status === 'Active' && '🔴 LIVE'}
                              {lot.status === 'Sold' && '✅ SOLD'}
                              {lot.status === 'Unsold' && '❌ UNSOLD'}
                              {lot.status === 'Ended' && '✅ ENDED'}
                              {lot.status === 'Upcoming' && '⏳ UPCOMING'}
                            </span>
                          </div>

                          <h4 className="font-bold text-base text-gray-900 truncate mb-1">
                            {lot.title}
                          </h4>
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm text-gray-500">
                            Start: <span className="font-semibold text-gray-700">₹{lot.startingPrice.toLocaleString()}</span>
                          </div>

                          {/* Personalized Status for Ended Lots */}
                          {(lot.status === 'Sold' || lot.status === 'Unsold') && user && (() => {
                            // Check if current user is the winner
                            const isWinner = lot.status === 'Sold' && lot.winner && lot.winner.toString() === user._id.toString();

                            // Check if current user bid on this lot
                            const userBid = lot.bids?.find(bid => bid.user && bid.user.toString() === user._id.toString());
                            const didUserBid = !!userBid;

                            if (isWinner) {
                              return (
                                <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                  🎉 You Win!
                                </div>
                              );
                            } else if (didUserBid) {
                              return (
                                <div className="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                  ⚠️ You are Outbid
                                </div>
                              );
                            } else {
                              // User didn't bid - show nothing
                              return null;
                            }
                          })()}

                          {/* Reserve Price for Active/Upcoming Lots */}
                          {(lot.status === 'Active' || lot.status === 'Upcoming') && lot.reservePrice > 0 && (
                            <div className="text-sm text-orange-600 font-medium">
                              Reserve: <span className="font-semibold">₹{lot.reservePrice.toLocaleString()}</span>
                            </div>
                          )}

                          <div className="text-sm text-gray-600 font-medium">
                            {lot.status === 'Active' || lot.status === 'Upcoming' ? 'Current: ' : 'Final: '}
                            <span className={`font-bold text-base ${
                              lot.status === 'Sold' ? 'text-emerald-600' :
                              lot.status === 'Unsold' ? 'text-red-600' :
                              'text-gray-900'
                            }`}>
                              ₹{lot.currentBid.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {lot.bids?.length || 0} bid{(lot.bids?.length || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionPage;
