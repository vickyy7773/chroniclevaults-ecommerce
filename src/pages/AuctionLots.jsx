import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gavel, ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { io } from 'socket.io-client';

const AuctionLots = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const currentUserRef = useRef(null); // Ref to avoid stale closures in socket handlers
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState({}); // Track selected image for each lot
  const [bidAmounts, setBidAmounts] = useState({}); // Track bid amounts for each lot
  const [submittingBid, setSubmittingBid] = useState({}); // Track submission state for each lot
  const [currentUser, setCurrentUser] = useState(null); // Current logged-in user

  // Lightbox states for ended auction catalog view
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxLot, setLightboxLot] = useState(null);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Load bidStatus from localStorage on mount
  const [bidStatus, setBidStatus] = useState(() => {
    try {
      const saved = localStorage.getItem(`bidStatus_${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Filter states
  const [filters, setFilters] = useState({
    keyword: '',
    category: '',
    priceSort: '',
    material: ''
  });

  // Get unique categories from auction lots
  const uniqueCategories = React.useMemo(() => {
    if (!auction?.lots) return [];
    const categories = auction.lots
      .map(lot => lot.category)
      .filter(Boolean); // Remove null/undefined values
    return [...new Set(categories)]; // Get unique categories
  }, [auction?.lots]);

  // Get unique materials from auction lots
  const uniqueMaterials = React.useMemo(() => {
    if (!auction?.lots) return [];
    const materials = auction.lots
      .map(lot => lot.material)
      .filter(Boolean); // Remove null/undefined values
    return [...new Set(materials)]; // Get unique materials
  }, [auction?.lots]);

  // Filter and sort lots based on filter criteria
  const filteredLots = React.useMemo(() => {
    if (!auction?.lots) return [];

    let result = [...auction.lots];

    // Apply keyword filter
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      result = result.filter(lot =>
        lot.title?.toLowerCase().includes(keyword) ||
        lot.description?.toLowerCase().includes(keyword)
      );
    }

    // Apply category filter
    if (filters.category) {
      result = result.filter(lot => lot.category === filters.category);
    }

    // Apply material filter
    if (filters.material) {
      result = result.filter(lot => lot.material === filters.material);
    }

    // Apply price sorting
    if (filters.priceSort === 'low-to-high') {
      result.sort((a, b) => {
        const priceA = a.estimatedPrice?.min || 0;
        const priceB = b.estimatedPrice?.min || 0;
        return priceA - priceB;
      });
    } else if (filters.priceSort === 'high-to-low') {
      result.sort((a, b) => {
        const priceA = a.estimatedPrice?.min || 0;
        const priceB = b.estimatedPrice?.min || 0;
        return priceB - priceA;
      });
    }

    return result;
  }, [auction?.lots, filters]);

  useEffect(() => {
    fetchAuction();
  }, [id]);

  // Save bidStatus to localStorage whenever it changes
  useEffect(() => {
    if (id) {
      localStorage.setItem(`bidStatus_${id}`, JSON.stringify(bidStatus));
    }
  }, [bidStatus, id]);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auctions/${id}`);
      setAuction(response.data);

      // DEBUG: Log auction status
      console.log('🔍 DEBUG - Auction Status:', response.data?.status);
      console.log('🔍 DEBUG - Full Auction Data:', response.data);

      console.log('📦 Auction loaded, currentUser:', currentUser?._id || 'NOT_LOADED');
      // After loading auction, check actual bid status from server
      // (will only work if currentUser is already loaded)
      await checkBidStatusFromServer(response.data);
    } catch (error) {
      console.error('Fetch auction error:', error);
      toast.error('Failed to load auction lots');
    } finally {
      setLoading(false);
    }
  };

  // Check actual bid status from server and update localStorage
  const checkBidStatusFromServer = async (auctionData) => {
    try {
      console.log('🔍 checkBidStatusFromServer called, currentUser:', currentUser?._id || 'NULL', 'auctionData:', !!auctionData);

      if (!currentUser) {
        console.log('⚠️ Skipping bid status check - currentUser not loaded yet');
        return;
      }

      console.log('🔍 Checking bid status from server for user:', currentUser._id);

      // DEBUG: Check what bids look like
      const lotsWithBids = auctionData.lots?.filter(lot => lot.bids && lot.bids.length > 0);
      console.log('🔬 DEBUG: Lots with ANY bids:', lotsWithBids?.length);
      if (lotsWithBids && lotsWithBids.length > 0) {
        const firstLotWithBids = lotsWithBids[0];
        console.log('🔬 DEBUG: First lot with bids - Lot', firstLotWithBids.lotNumber);
        console.log('🔬 DEBUG: Sample bid:', firstLotWithBids.bids[0]);
        console.log('🔬 DEBUG: Sample bid.userId type:', typeof firstLotWithBids.bids[0]?.userId);
        console.log('🔬 DEBUG: currentUser._id type:', typeof currentUser._id);
      }

      // Get all lots where user has placed bids
      const lotsWithUserBids = auctionData.lots?.filter(lot => {
        return lot.bids?.some(bid => {
          // bid.user._id (not bid.userId!) - populated user object
          const bidUserId = String(bid.user?._id || bid.userId || '');
          const currentUserId = String(currentUser._id);
          return bidUserId === currentUserId;
        });
      }) || [];

      console.log('📊 Found', lotsWithUserBids.length, 'lots with user bids');

      if (lotsWithUserBids.length === 0) return;

      // Use functional setState to avoid dependency on bidStatus
      setBidStatus(prevBidStatus => {
        const newBidStatus = { ...prevBidStatus };

        for (const lot of lotsWithUserBids) {
          // Find user's max bid for this lot
          const userBids = lot.bids.filter(bid => {
            const bidUserId = String(bid.user?._id || bid.userId || '');
            return bidUserId === String(currentUser._id);
          });
          const userMaxBid = Math.max(...userBids.map(bid => bid.amount));

          // Get current highest bid
          const currentBid = lot.currentBid || 0;

          // Find current highest bidder
          // Priority: reserve bidder auto-bid > manual bid > timestamp > ObjectId
          const bidsAtCurrentAmount = lot.bids.filter(bid => bid.amount === currentBid);

          console.log(`🔍 LOT ${lot.lotNumber} - Bids at ₹${currentBid}:`, bidsAtCurrentAmount.map(b => ({
            user: b.user?._id || b.user,
            amount: b.amount,
            isReserveBidder: b.isReserveBidder,
            isAutoBid: b.isAutoBid,
            timestamp: b.createdAt || b.timestamp
          })));

          const currentHighestBid = bidsAtCurrentAmount.sort((a, b) => {
              // FIRST: Reserve bidder auto-bid ALWAYS wins (they placed reserve first!)
              const aIsReserve = a.isReserveBidder === true && a.isAutoBid === true;
              const bIsReserve = b.isReserveBidder === true && b.isAutoBid === true;

              console.log(`🔍 Comparing bids:`, {
                bidA: {
                  user: a.user?._id || a.user,
                  isReserveBidder: a.isReserveBidder,
                  isAutoBid: a.isAutoBid,
                  aIsReserve
                },
                bidB: {
                  user: b.user?._id || b.user,
                  isReserveBidder: b.isReserveBidder,
                  isAutoBid: b.isAutoBid,
                  bIsReserve
                }
              });

              if (aIsReserve !== bIsReserve) {
                console.log(`✅ WINNER by RESERVE PRIORITY: ${aIsReserve ? 'Bid A (reserve)' : 'Bid B (reserve)'}`);
                return aIsReserve ? -1 : 1; // reserve bidder auto-bid comes first
              }

              // SECOND: Manual bids win over other auto-bids
              const aIsAuto = a.isAutoBid === true;
              const bIsAuto = b.isAutoBid === true;

              if (aIsAuto !== bIsAuto) {
                console.log(`✅ WINNER by MANUAL PRIORITY: ${!aIsAuto ? 'Bid A (manual)' : 'Bid B (manual)'}`);
                return aIsAuto ? 1 : -1; // non-auto bid comes first
              }

              // THIRD: Oldest timestamp wins
              const timeA = new Date(a.createdAt || a.timestamp).getTime();
              const timeB = new Date(b.createdAt || b.timestamp).getTime();

              if (timeA !== timeB) {
                console.log(`✅ WINNER by TIMESTAMP: ${timeA < timeB ? 'Bid A (older)' : 'Bid B (older)'}`);
                return timeA - timeB;
              }

              // FOURTH: Use ObjectId (earlier ObjectId = earlier bid)
              const idA = a._id || '';
              const idB = b._id || '';
              console.log(`✅ WINNER by OBJECTID: ${idA < idB ? 'Bid A' : 'Bid B'}`);
              return idA.localeCompare(idB);
            })[0];

          console.log(`🎯 LOT ${lot.lotNumber} WINNER:`, {
            user: currentHighestBid?.user?._id || currentHighestBid?.user,
            amount: currentHighestBid?.amount,
            isReserveBidder: currentHighestBid?.isReserveBidder,
            isAutoBid: currentHighestBid?.isAutoBid
          });

          // Handle both cases: user as object {_id, name, email} or user as string (just ID)
          const bidUserId = typeof currentHighestBid?.user === 'string'
            ? currentHighestBid.user
            : currentHighestBid?.user?._id || currentHighestBid?.userId || '';
          const isUserWinning = String(bidUserId) === String(currentUser._id);

          console.log(`📌 Lot ${lot.lotNumber}:`, {
            userMaxBid,
            currentBid,
            isUserWinning,
            currentStatus: prevBidStatus[lot.lotNumber]
          });

          // Update status based on actual situation
          if (isUserWinning) {
            // User is winning
            if (currentBid < userMaxBid) {
              // User has reserve bid
              newBidStatus[lot.lotNumber] = 'reserve-success';
              console.log(`✅ Lot ${lot.lotNumber}: User winning with reserve`);
            } else {
              // User is winning at max bid
              newBidStatus[lot.lotNumber] = 'success';
              console.log(`✅ Lot ${lot.lotNumber}: User winning at max bid`);
            }
          } else {
            // User is NOT winning - outbid!
            newBidStatus[lot.lotNumber] = 'outbid';
            console.log(`🚨 Lot ${lot.lotNumber}: User is OUTBID!`);
          }
        }

        console.log('✅ Bid status updated from server:', newBidStatus);
        return newBidStatus;
      });

    } catch (error) {
      console.error('Error checking bid status:', error);
    }
  };

  // Calculate current increment based on bid slabs
  const getCurrentIncrement = (currentBid, incrementSlabs) => {
    if (!incrementSlabs || incrementSlabs.length === 0) {
      // Default slabs if not provided
      const defaultSlabs = [
        { minPrice: 1, maxPrice: 1999, increment: 100 },
        { minPrice: 2000, maxPrice: 2999, increment: 200 },
        { minPrice: 3000, maxPrice: 4999, increment: 300 },
        { minPrice: 5000, maxPrice: 9999, increment: 500 },
        { minPrice: 10000, maxPrice: 19999, increment: 1000 },
        { minPrice: 20000, maxPrice: 29999, increment: 2000 },
        { minPrice: 30000, maxPrice: 49999, increment: 3000 },
        { minPrice: 50000, maxPrice: 99999, increment: 5000 },
        { minPrice: 100000, maxPrice: 199999, increment: 10000 },
      ];
      incrementSlabs = defaultSlabs;
    }

    for (let slab of incrementSlabs) {
      const matches = currentBid >= slab.minPrice && currentBid < slab.maxPrice;
      if (matches) {
        return slab.increment;
      }
    }
    // If currentBid is beyond all slabs, use the last slab's increment
    const fallback = incrementSlabs[incrementSlabs.length - 1]?.increment || 100;
    return fallback;
  };

  // Auto-redirect to live auction when auction starts (but not for ended auctions)
  useEffect(() => {
    if (!auction) return;

    // Don't redirect if auction has ended
    if (auction.status === 'Ended') return;

    const checkAuctionStatus = () => {
      const now = new Date();
      const startTime = new Date(auction.startTime);

      // If auction has started (and not ended), redirect to live auction page
      if (now >= startTime && auction.status !== 'Ended') {
        console.log('🔴 Auction started! Redirecting to live auction page...');
        toast.info('Auction has started! Redirecting to live auction...', {
          autoClose: 2000
        });
        setTimeout(() => {
          navigate(`/auction/${id}`);
        }, 2000);
      }
    };

    // Check immediately
    checkAuctionStatus();

    // Check every 10 seconds
    const interval = setInterval(checkAuctionStatus, 10000);

    return () => clearInterval(interval);
  }, [auction, id, navigate]);

  // Socket.IO connection setup for real-time updates
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const isProduction = backendUrl.includes('chroniclevaults.com');

    socketRef.current = io(backendUrl, {
      transports: ['polling'], // Use polling only - server doesn't support websocket properly
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // NEVER give up reconnecting!
      path: '/socket.io',
      upgrade: false, // Disable websocket upgrade - server blocking it
      forceNew: false,
      timeout: 20000,
      autoConnect: true,
      pingTimeout: 60000, // Keep connection alive
      pingInterval: 25000 // Send ping every 25 seconds
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to Socket.io server (Catalog Page)');
      if (id) {
        socketRef.current.emit('join-auction', id);
        console.log(`🎯 Joined auction room: ${id}`);
      }
      // Join personal user room for outbid notifications
      if (currentUser && currentUser._id) {
        socketRef.current.emit('join-user-room', currentUser._id);
        console.log(`👤 Joined personal room: user-${currentUser._id}`);
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.io:', reason);
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

  // Join personal room when currentUser loads (for outbid notifications)
  useEffect(() => {
    if (!currentUser || !currentUser._id || !socketRef.current) return;

    // Join immediately if already connected
    if (socketRef.current.connected) {
      socketRef.current.emit('join-user-room', currentUser._id);
      console.log(`👤 [USER LOAD] Joined personal room: user-${currentUser._id}`);
    }

    // Also join on reconnect
    const handleReconnect = () => {
      if (currentUser && currentUser._id) {
        socketRef.current.emit('join-user-room', currentUser._id);
        console.log(`👤 [RECONNECT] Joined personal room: user-${currentUser._id}`);
      }
    };

    socketRef.current.on('connect', handleReconnect);

    // Check bid status from server when user loads (in case they were outbid while away)
    if (auction) {
      console.log('🔍 [useEffect] User and auction both loaded, checking bid status from server...');
      console.log('🔍 [useEffect] currentUser:', currentUser._id, 'auction lots:', auction.lots?.length);
      checkBidStatusFromServer(auction);
    } else {
      console.log('⚠️ [useEffect] User loaded but auction not available yet');
    }

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleReconnect);
      }
    };
  }, [currentUser, auction]);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log('🔍 CATALOG - Fetching current user...');
        const response = await api.get('/auth/me');
        // Response interceptor already extracts data, so response = { success, data }
        if (response.success) {
          console.log('✅ CATALOG - User fetched:', response.data._id);
          setCurrentUser(response.data);
        } else {
          console.warn('⚠️ CATALOG - User fetch unsuccessful:', response);
        }
      } catch (error) {
        console.error('❌ CATALOG - Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Sync currentUserRef with currentUser state
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Real-time bid update listener with personalized notifications
  useEffect(() => {
    console.log('🔧 CATALOG - Bid listener useEffect triggered. Socket:', !!socketRef.current, 'User:', currentUser?._id, 'ID:', id);

    if (!socketRef.current) {
      console.warn('⚠️ CATALOG - Cannot setup listeners. Socket not available');
      return;
    }

    console.log('✅ CATALOG - Setting up listeners (currentUser:', currentUser?._id || 'NOT_LOADED', ')');

    const handleBidPlaced = (data) => {
      console.log('🔴 CATALOG PAGE - Real-time bid update received:', {
        hasAuction: !!data.auction,
        auctionId: data.auction?._id,
        lotCount: data.auction?.lots?.length,
        firstLotBids: data.auction?.lots?.[0]?.bids?.length
      });

      if (data.auction) {
        console.log('✅ CATALOG - Updating auction state with new data');
        // Update auction state with new bid data
        setAuction(data.auction);

        // HYBRID APPROACH: Recalculate status using tie-breaking logic for immediate feedback
        // Coin refund events will override this if they come (they are source of truth)
        if (currentUserRef.current) {
          console.log('🔍 SOCKET - Rechecking bid status with tie-breaking logic (immediate)...');
          checkBidStatusFromServer(data.auction);
        }
      }
    };

    // Listen for coin balance updates (when outbid)
    const handleCoinBalanceUpdate = (data) => {
      console.log('💰💰💰 CATALOG - Coin balance update received:', {
        reason: data.reason,
        lotNumber: data.lotNumber,
        auctionCoins: data.auctionCoins,
        frozenCoins: data.frozenCoins,
        currentUserLoaded: !!currentUserRef.current,
        fullData: JSON.stringify(data)
      });

      // Update currentUser's coin balance in real-time
      if (currentUserRef.current && data.auctionCoins !== undefined) {
        setCurrentUser(prev => ({
          ...prev,
          auctionCoins: data.auctionCoins,
          frozenCoins: data.frozenCoins
        }));
        console.log('✅ Updated currentUser coins:', data.auctionCoins);
      }

      if (data.reason === 'Outbid - coins refunded') {
        console.log('🚨 OUTBID DETECTED! Lot:', data.lotNumber);

        // Show outbid notification (top-right, less intrusive)
        toast.warning(`⚠️ Outbid on Lot ${data.lotNumber}! ₹${data.auctionCoins.toLocaleString()} coins refunded`, {
          autoClose: 5000,
          position: 'top-right'
        });

        // Show red OUTBID indicator on card - status will persist
        if (data.lotNumber) {
          setBidStatus(prev => {
            // Check if there's currently a success or reserve-success status
            const currentStatus = prev[data.lotNumber];

            if (currentStatus === 'success' || currentStatus === 'reserve-success') {
              console.log('⏳ Delaying outbid status - success message is currently showing');

              // Wait 3 seconds before showing outbid, giving user time to see success message
              setTimeout(() => {
                console.log('🎨 Setting bidStatus to OUTBID for lot (delayed)', data.lotNumber);
                setBidStatus(prev2 => {
                  const newStatus = { ...prev2, [data.lotNumber]: 'outbid' };
                  console.log('🎨 New bidStatus:', newStatus);
                  return newStatus;
                });
                // NO AUTO-CLEAR - status will persist until real situation changes
              }, 3000); // 3 second delay

              return prev; // Don't change status immediately
            } else {
              // No success message showing, show outbid immediately
              console.log('🎨 Setting bidStatus to OUTBID for lot', data.lotNumber);
              const newStatus = { ...prev, [data.lotNumber]: 'outbid' };
              console.log('🎨 New bidStatus:', newStatus);

              // NO AUTO-CLEAR - status will persist until real situation changes
              return newStatus;
            }
          });
        }
      } else if (data.reason === 'Bid placed - coins deducted') {
        console.log('✅ Bid placed - coins deducted:', data.auctionCoins);

        // Success indicator already shown in handleBid when API response succeeds
        // This socket event just confirms the coin deduction happened
        // No need to show duplicate notification or status update
      } else {
        console.log('ℹ️ Other coin balance update:', data.reason);
      }
    };

    // Remove ALL previous listeners before adding new ones (prevents multiple listener accumulation)
    socketRef.current.off('bid-placed');
    socketRef.current.on('bid-placed', handleBidPlaced);
    socketRef.current.off('coin-balance-updated');
    socketRef.current.on('coin-balance-updated', handleCoinBalanceUpdate);

    console.log('✅ CATALOG - Listeners registered successfully');

    return () => {
      if (socketRef.current) {
        socketRef.current.off('bid-placed');
        socketRef.current.off('coin-balance-updated');
      }
    };
  }, [id]); // Only re-run when auction ID changes, not when currentUser changes

  // Open lightbox to view all images for a lot
  const openLightbox = (lot) => {
    setLightboxLot(lot);
    setLightboxImageIndex(0);
    setLightboxOpen(true);
  };

  // Close lightbox
  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxLot(null);
    setLightboxImageIndex(0);
  };

  // Navigate to next image in lightbox
  const nextLightboxImage = () => {
    if (!lightboxLot?.images) return;
    setLightboxImageIndex((prev) => (prev + 1) % lightboxLot.images.length);
  };

  // Navigate to previous image in lightbox
  const prevLightboxImage = () => {
    if (!lightboxLot?.images) return;
    setLightboxImageIndex((prev) => (prev - 1 + lightboxLot.images.length) % lightboxLot.images.length);
  };

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxLot]);

  // Handle bid submission for a specific lot
  const handlePlaceBid = async (lotNumber) => {
    // PRESERVE SCROLL POSITION - save current scroll position to prevent auto-scroll to top
    const scrollPosition = window.scrollY || window.pageYOffset;
    console.log('📍 Saving scroll position:', scrollPosition);

    // PREVENT SCROLL DURING BID - lock scroll position during entire process
    const preventScroll = () => {
      window.scrollTo(0, scrollPosition);
    };
    window.addEventListener('scroll', preventScroll);

    // Check if user is logged in
    if (!currentUser) {
      window.removeEventListener('scroll', preventScroll);
      toast.info('Please login to place a bid');
      // Save current page URL to redirect back after login
      const returnUrl = `/auction-lots/${id}`;
      navigate(`/authentication?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    const amount = parseInt(bidAmounts[lotNumber]);

    if (!amount || amount <= 0) {
      window.removeEventListener('scroll', preventScroll);
      toast.error('Please enter a valid bid amount');
      return;
    }

    if (amount % 50 !== 0) {
      window.removeEventListener('scroll', preventScroll);
      toast.error('Bid amount must be divisible by 50');
      return;
    }

    // Find the lot
    const lot = auction?.lots?.find(l => l.lotNumber === lotNumber);
    if (!lot) {
      window.removeEventListener('scroll', preventScroll);
      toast.error('Lot not found');
      return;
    }

    // Calculate minimum bid
    let minBid;
    if (lot.bids && lot.bids.length > 0) {
      // Lot has bids: minimum = currentBid + increment
      const increment = getCurrentIncrement(lot.currentBid, auction.incrementSlabs);
      minBid = lot.currentBid + increment;
    } else {
      // No bids yet: minimum = starting price
      minBid = lot.startingPrice || 0;
    }

    // Validation 1: Minimum bid check
    if (amount < minBid) {
      window.removeEventListener('scroll', preventScroll);
      toast.error(`Minimum bid is ₹${minBid.toLocaleString('en-IN')}`);
      return;
    }

    // Validation 2: Must be divisible by 50
    if (amount % 50 !== 0) {
      window.removeEventListener('scroll', preventScroll);
      toast.error('Bid amount must be divisible by ₹50 (e.g., ₹1050, ₹1100, ₹2000)');
      return;
    }

    try {
      setSubmittingBid(prev => ({ ...prev, [lotNumber]: true }));

      // eBay-STYLE PROXY BIDDING: ALWAYS treat every bid as a max/reserve bid
      // User enters their maximum - system automatically competes for them
      const maxBid = amount;
      const actualBid = amount;

      console.log(`🎯 SENDING PROXY BID: Amount ₹${actualBid.toLocaleString()}, MaxBid ₹${maxBid.toLocaleString()}`);

      // Send lot number with bid for catalog phase, and maxBid for proxy bidding
      const response = await api.post(`/auctions/${id}/bid`, { amount: actualBid, maxBid, lotNumber });

      console.log('🎯 BID RESPONSE:', {
        success: response.success,
        hasData: !!response.data,
        hasAuction: !!response.data?.auction,
        lotNumber
      });

      // Log full response data for debugging
      console.log('📊 FULL BID RESPONSE DATA:', {
        autoBidTriggered: response.data?.autoBidTriggered,
        systemBidPlaced: response.data?.systemBidPlaced,
        currentBid: response.data?.auction?.lots?.[lotNumber - 1]?.currentBid,
        yourBid: actualBid,
        highestBidder: response.data?.auction?.lots?.[lotNumber - 1]?.highestBidder,
        message: response.data?.message
      });

      // Response interceptor already extracts data, so check response.success not response.data.success
      if (response.success) {
        // Check if user was immediately outbid by auto-bid or system reserve bid
        const wasOutbidByBackend = response.data?.autoBidTriggered || response.data?.systemBidPlaced;
        const currentBidAmount = response.data?.auction?.lots?.[lotNumber - 1]?.currentBid || 0;

        // FRONTEND FIX: Backend sometimes incorrectly sets autoBidTriggered even when user is winning
        // If user's bid is HIGHER than current bid, they are NOT outbid (backend bug workaround)
        const actuallyOutbid = wasOutbidByBackend && (actualBid <= currentBidAmount);

        console.log('🔍 OUTBID CHECK:', {
          wasOutbidByBackend,
          actuallyOutbid,
          yourBid: actualBid,
          currentBid: currentBidAmount,
          logic: actualBid > currentBidAmount ? 'You are WINNING!' : 'You are outbid'
        });

        if (actuallyOutbid) {
          console.log('🚨 User was actually outbid - showing outbid status');
          console.log('❓ WHY OUTBID?', {
            autoBidTriggered: response.data?.autoBidTriggered,
            systemBidPlaced: response.data?.systemBidPlaced,
            yourBidAmount: actualBid,
            currentBidNow: currentBidAmount
          });

          // Show outbid status immediately (don't wait for socket event that might not come)
          console.log('🎨 Setting bidStatus to OUTBID for lot', lotNumber);
          setBidStatus(prev => {
            const newStatus = { ...prev, [lotNumber]: 'outbid' };
            console.log('🎨 New bidStatus:', newStatus);
            return newStatus;
          });

          // Show outbid notification
          toast.warning(`⚠️ You were outbid on Lot ${lotNumber}!`, {
            autoClose: 5000,
            position: 'top-right'
          });

          // NO AUTO-CLEAR - status will persist until real situation changes
        } else {
          console.log('✅ Bid placed successfully');

          // Show success indicator immediately - different status based on bid type
          let statusType = 'success';
          if (response.data?.updatedReserve) {
            statusType = 'reserve-updated';
          } else {
            const lotData = response.data?.auction?.lots?.[lotNumber - 1];
            const currentBidAmount = lotData?.currentBid || 0;
            if (currentBidAmount < actualBid) {
              statusType = 'reserve-success'; // Bid in reserve
            } else {
              statusType = 'success'; // Winning bid
            }
          }

          setBidStatus(prev => {
            const newStatus = { ...prev, [lotNumber]: statusType };
            console.log(`🎨 Setting bidStatus to ${statusType.toUpperCase()} for lot`, lotNumber);
            return newStatus;
          });

          // NO AUTO-CLEAR - status will persist until real situation changes

          // Show success toast notification with different messages
          if (response.data?.updatedReserve) {
            // Reserve updated
            toast.success(`🔼 Your reserve updated to ₹${actualBid.toLocaleString()}`, {
              autoClose: 3000
            });
          } else {
            // Check if this is a reserve bid (amount placed is less than max bid)
            const lotData = response.data?.auction?.lots?.[lotNumber - 1];
            const currentBidAmount = lotData?.currentBid || 0;

            if (currentBidAmount < actualBid) {
              // Reserve bid - current bid is less than what user bid
              toast.success(`🎯 Your bid in reserve! Max: ₹${actualBid.toLocaleString()}`, {
                autoClose: 3000
              });
            } else {
              // Normal winning bid
              toast.success(`✅ Bid placed successfully at ₹${actualBid.toLocaleString()}!`, {
                autoClose: 3000
              });
            }
          }
        }

        // Clear the bid amount for this lot
        setBidAmounts(prev => ({ ...prev, [lotNumber]: '' }));

        // Update auction state with the returned auction data (faster than refetching)
        if (response.data?.auction) {
          setAuction(response.data.auction);
          console.log('✅ Auction state updated with new bid data');
        } else {
          // Fallback: Refresh auction data from server
          await fetchAuction();
        }

        // DON'T auto-clear success status - keep showing until someone else bids
        // Status will be updated by Socket.IO listener when another bid comes in
      }
    } catch (error) {
      console.error('Place bid error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to place bid';
      toast.error(errorMessage);
    } finally {
      setSubmittingBid(prev => ({ ...prev, [lotNumber]: false }));

      // RESTORE SCROLL POSITION - remove scroll lock and restore position
      // Use requestAnimationFrame for better timing with browser render cycle
      window.removeEventListener('scroll', preventScroll);
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' });
        console.log('📍 Restored scroll position:', scrollPosition);
      });
    }
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Auction Not Found</h2>
          <button
            onClick={() => navigate('/auctions')}
            className="mt-4 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
          >
            Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  // DEBUG: Log before conditional check
  console.log('🔍 DEBUG - Checking auction status:', auction?.status, 'Is Ended?', auction?.status === 'Ended');

  // Render catalog-style view for ended auctions
  if (auction.status === 'Ended') {
    console.log('✅ DEBUG - Rendering CATALOG view for ended auction');
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/auctions?status=Ended')}
            className="flex items-center gap-2 text-gray-600 hover:text-accent-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Auctions</span>
          </button>

          {/* Auction Header */}
          <div className="bg-gradient-to-r from-accent-700 to-accent-800 text-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{auction.title}</h1>
                <p className="text-accent-100">{auction.auctionCode || 'Auction Results'}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-gray-600 text-white text-sm font-semibold rounded">
                  Auction Ended
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-accent-100 mb-1">Total Lots</p>
                <p className="text-3xl font-bold">{filteredLots?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Lots</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Keyword Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                >
                  <option value="">--Select Category--</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Price Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Sort</label>
                <select
                  value={filters.priceSort}
                  onChange={(e) => setFilters({...filters, priceSort: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                >
                  <option value="">--Select--</option>
                  <option value="low-to-high">Low to High</option>
                  <option value="high-to-low">High to Low</option>
                </select>
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <select
                  value={filters.material}
                  onChange={(e) => setFilters({...filters, material: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                >
                  <option value="">--Select Item Material--</option>
                  {uniqueMaterials.map(material => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setFilters({
                  keyword: '',
                  category: '',
                  priceSort: '',
                  material: ''
                })}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Auction Results Grid */}
          {filteredLots && filteredLots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLots.map((lot, index) => {
                const soldPrice = lot.currentBid || lot.hammerPrice || 0;
                const isSold = lot.bids && lot.bids.length > 0;

                // Get first image and all images
                const lotImages = lot.images && lot.images.length > 0
                  ? lot.images
                  : lot.image
                    ? [lot.image]
                    : [];
                const lotImage = lotImages[0] || null;
                const hasMultipleImages = lotImages.length > 1;

                return (
                  <div
                    key={lot._id || index}
                    onClick={() => openLightbox(lot)}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                  >
                    {/* Lot Image */}
                    <div className="relative w-full h-64 bg-gray-200 group">
                      {lotImage ? (
                        <img
                          src={lotImage}
                          alt={lot.title}
                          className="w-full h-full object-contain"
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
                      {/* Lot Number Badge */}
                      <div className="absolute top-2 left-2 px-3 py-1 bg-accent-600 text-white text-sm font-semibold rounded">
                        Lot #{lot.lotNumber}
                      </div>
                      {/* Status Badge */}
                      <div className={`absolute top-2 right-2 px-3 py-1 text-white text-sm font-semibold rounded ${
                        isSold ? 'bg-green-600' : 'bg-gray-600'
                      }`}>
                        {isSold ? 'SOLD' : 'UNSOLD'}
                      </div>
                      {/* Image Count Badge - show if multiple images */}
                      {hasMultipleImages && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                          {lotImages.length}
                        </div>
                      )}
                      {/* Click to view overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-white/90 px-3 py-1.5 rounded text-sm font-semibold text-gray-900 transition-opacity">
                          Click to view {hasMultipleImages ? 'all images' : 'image'}
                        </span>
                      </div>
                    </div>

                    {/* Lot Info */}
                    <div className="p-4">
                      {/* Category */}
                      {lot.category && (
                        <div className="mb-2">
                          <span className="px-2 py-1 bg-amber-100 text-amber-900 text-xs font-semibold rounded">
                            {lot.category}
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {lot.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {lot.description || 'No description available'}
                      </p>

                      {/* Pricing Information */}
                      <div className="space-y-2 border-t border-gray-200 pt-3">
                        {/* Estimated Price */}
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Estimated Price</p>
                          <p className="text-base font-bold text-gray-900">
                            {(() => {
                              if (lot.startingPrice > 0 && lot.estimatedPrice > 0) {
                                return `₹${lot.startingPrice.toLocaleString('en-IN')} - ₹${lot.estimatedPrice.toLocaleString('en-IN')}`;
                              } else if (lot.startingPrice > 0) {
                                return `₹${lot.startingPrice.toLocaleString('en-IN')}`;
                              } else if (lot.estimatedPrice > 0) {
                                return `₹${lot.estimatedPrice.toLocaleString('en-IN')}`;
                              } else {
                                return 'Price on request';
                              }
                            })()}
                          </p>
                        </div>

                        {/* Sold Price */}
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            {isSold ? 'Sold For' : 'Not Sold'}
                          </p>
                          <p className={`text-lg font-bold ${isSold ? 'text-green-600' : 'text-gray-400'}`}>
                            {isSold
                              ? `₹${soldPrice.toLocaleString('en-IN')}`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Gavel className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Lots Found</h3>
              <p className="text-gray-600">No lots match your filter criteria.</p>
            </div>
          )}

          {/* Lightbox Modal for Viewing All Images */}
          {lightboxOpen && lightboxLot && (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              <div
                className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={closeLightbox}
                  className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors z-10"
                >
                  <X className="w-8 h-8" />
                </button>

                {/* Lot Info Header */}
                <div className="bg-white/10 backdrop-blur-sm text-white p-4 rounded-t-lg mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Lot #{lightboxLot.lotNumber} - {lightboxLot.title}</h3>
                      <p className="text-sm text-gray-200">{lightboxLot.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-200">Image {lightboxImageIndex + 1} of {(lightboxLot.images?.length || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Main Image Container */}
                <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                  {lightboxLot.images && lightboxLot.images.length > 0 ? (
                    <>
                      <img
                        src={lightboxLot.images[lightboxImageIndex]}
                        alt={`${lightboxLot.title} - Image ${lightboxImageIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="20"%3EImage not available%3C/text%3E%3C/svg%3E';
                        }}
                      />

                      {/* Navigation Arrows - Only show if multiple images */}
                      {lightboxLot.images.length > 1 && (
                        <>
                          <button
                            onClick={prevLightboxImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
                          >
                            <ChevronLeft className="w-8 h-8" />
                          </button>
                          <button
                            onClick={nextLightboxImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
                          >
                            <ChevronRight className="w-8 h-8" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-400">
                      <Gavel className="w-24 h-24 mx-auto mb-4 opacity-50" />
                      <p>No images available</p>
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery - Only show if multiple images */}
                {lightboxLot.images && lightboxLot.images.length > 1 && (
                  <div className="mt-4 bg-white/10 backdrop-blur-sm p-3 rounded-b-lg">
                    <div className="flex gap-2 overflow-x-auto">
                      {lightboxLot.images.map((image, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLightboxImageIndex(idx)}
                          className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                            lightboxImageIndex === idx
                              ? 'border-accent-500 ring-2 ring-accent-400'
                              : 'border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-20 h-20 object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23374151" width="80" height="80"/%3E%3C/svg%3E';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lot Details Footer */}
                <div className="mt-2 bg-white/10 backdrop-blur-sm text-white p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300 mb-1">Estimated Price</p>
                      <p className="text-lg font-bold">
                        {(() => {
                          if (lightboxLot.startingPrice > 0 && lightboxLot.estimatedPrice > 0) {
                            return `₹${lightboxLot.startingPrice.toLocaleString('en-IN')} - ₹${lightboxLot.estimatedPrice.toLocaleString('en-IN')}`;
                          } else if (lightboxLot.startingPrice > 0) {
                            return `₹${lightboxLot.startingPrice.toLocaleString('en-IN')}`;
                          } else if (lightboxLot.estimatedPrice > 0) {
                            return `₹${lightboxLot.estimatedPrice.toLocaleString('en-IN')}`;
                          } else {
                            return 'N/A';
                          }
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300 mb-1">
                        {lightboxLot.bids && lightboxLot.bids.length > 0 ? 'Sold For' : 'Not Sold'}
                      </p>
                      <p className={`text-lg font-bold ${
                        lightboxLot.bids && lightboxLot.bids.length > 0 ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {lightboxLot.bids && lightboxLot.bids.length > 0
                          ? `₹${(lightboxLot.currentBid || 0).toLocaleString('en-IN')}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                  {lightboxLot.description && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-gray-300 text-sm">{lightboxLot.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render normal bidding view for active/upcoming auctions
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/auction/${id}/catalog`)}
          className="flex items-center gap-2 text-gray-600 hover:text-accent-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Catalog</span>
        </button>

        {/* Auction Info Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Start:</p>
              <p className="font-semibold text-gray-900">
                {new Date(auction.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(auction.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
            {currentUser && (
              <div>
                <p className="text-sm text-gray-600 mb-1">User:</p>
                <p className="font-semibold text-gray-900">{currentUser.name || currentUser.email}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">ID:</p>
              <p className="font-semibold text-gray-900">{auction.auctionCode || `AUC-${auction._id?.slice(-8)}`}</p>
            </div>
            {currentUser && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Coins:</p>
                <p className="font-semibold text-green-600">₹{(currentUser.auctionCoins || 0).toLocaleString('en-IN')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Lots</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Keyword Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
              <input
                type="text"
                placeholder="Search..."
                value={filters.keyword}
                onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="">--Select Category--</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Price Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Sort</label>
              <select
                value={filters.priceSort}
                onChange={(e) => setFilters({...filters, priceSort: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="">--Select--</option>
                <option value="low-to-high">Low to High</option>
                <option value="high-to-low">High to Low</option>
              </select>
            </div>

            {/* Material */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <select
                value={filters.material}
                onChange={(e) => setFilters({...filters, material: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="">--Select Item Material--</option>
                {uniqueMaterials.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setFilters({
                keyword: '',
                category: '',
                priceSort: '',
                material: ''
              })}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
            <button className="px-4 py-2 bg-accent-600 text-white rounded hover:bg-accent-700 transition-colors">
              Apply Filters
            </button>
          </div>
        </div>

        {/* All Lots Listing */}
        {filteredLots && filteredLots.length > 0 ? (
          <div className="space-y-6">
            {filteredLots.map((lot, index) => (
              <div key={lot._id || index} className="bg-white border border-gray-300 rounded-lg p-5 hover:border-accent-400 hover:shadow-lg transition-all duration-200 shadow-sm">
                {/* Lot Header */}
                <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-200">
                  <span className="px-3 py-1 bg-accent-600 text-white text-sm font-semibold rounded">Lot #{lot.lotNumber}</span>
                  <span className="px-3 py-1 bg-amber-600 text-white text-sm font-semibold rounded">{auction.auctionCode || 'AUC50'}</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 text-sm font-semibold rounded">{lot.category || 'Ancient India'}</span>
                  {lot.material && (
                    <span className="ml-auto px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">{lot.material}</span>
                  )}
                </div>

                {/* Lot Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Image Gallery + Video */}
                  <div className="md:col-span-1">
                    {(() => {
                      // Build media items array (images + video)
                      const mediaItems = [];

                      // Get images array (support both 'image' and 'images' fields)
                      let images = lot.images && lot.images.length > 0
                        ? lot.images
                        : lot.image
                          ? [lot.image]
                          : [];

                      // Add all images to media items
                      images.forEach(img => {
                        mediaItems.push({ type: 'image', url: img });
                      });

                      // Add video to media items if exists
                      if (lot.video) {
                        mediaItems.push({ type: 'video', url: lot.video });
                      }

                      const currentIndex = selectedImages[lot._id] || 0;
                      const currentMedia = mediaItems[currentIndex];

                      return mediaItems.length > 0 ? (
                        <>
                          {/* Main Media Display (Image or Video) */}
                          <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden mb-2 group">
                            {currentMedia?.type === 'image' ? (
                              <img
                                src={currentMedia.url}
                                alt={lot.title}
                                className="w-full h-64 sm:h-80 object-contain bg-gray-50"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            ) : (
                              currentMedia?.url.includes('youtube.com') || currentMedia?.url.includes('youtu.be') ? (
                                <iframe
                                  src={currentMedia.url.replace('watch?v=', 'embed/')}
                                  className="w-full h-64 sm:h-80 rounded"
                                  allowFullScreen
                                  title={lot.title}
                                />
                              ) : (
                                <video
                                  src={currentMedia?.url}
                                  controls
                                  className="w-full h-64 sm:h-80 object-contain bg-gray-50"
                                  title={lot.title}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              )
                            )}

                            {/* Navigation Arrows - Only show if multiple media items */}
                            {mediaItems.length > 1 && (
                              <>
                                <button
                                  onClick={() => {
                                    const newIndex = (currentIndex - 1 + mediaItems.length) % mediaItems.length;
                                    setSelectedImages(prev => ({ ...prev, [lot._id]: newIndex }));
                                  }}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const newIndex = (currentIndex + 1) % mediaItems.length;
                                    setSelectedImages(prev => ({ ...prev, [lot._id]: newIndex }));
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Thumbnail Gallery (Images + Video) - Only show if multiple items */}
                          {mediaItems.length > 1 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {mediaItems.map((item, itemIndex) => (
                                <button
                                  key={itemIndex}
                                  onClick={() => setSelectedImages(prev => ({ ...prev, [lot._id]: itemIndex }))}
                                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                                    currentIndex === itemIndex
                                      ? 'border-amber-500 ring-2 ring-amber-400'
                                      : 'border-gray-200 hover:border-amber-300'
                                  }`}
                                >
                                  {item.type === 'image' ? (
                                    <img
                                      src={item.url}
                                      alt={`View ${itemIndex + 1}`}
                                      className="w-full h-16 sm:h-20 lg:h-24 object-contain"
                                    />
                                  ) : (
                                    <div className="relative w-full h-16 sm:h-20 lg:h-24 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                      <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                      <span className="absolute bottom-0.5 sm:bottom-1 right-0.5 sm:right-1 bg-black/70 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded">
                                        Video
                                      </span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-64 sm:h-80 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <p className="text-gray-400 text-sm">No Image Available</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{lot.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {lot.description || 'No description available'}
                    </p>
                    {lot.condition && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1">Condition:</p>
                        <p className="text-sm italic text-gray-700">{lot.condition}</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Bidding */}
                  <div className="md:col-span-1">
                    <div className="space-y-4">
                      {/* Estimated Price */}
                      <div>
                        <p className="text-xs font-semibold text-black uppercase mb-1">Estimated Price</p>
                        <p className="text-lg font-bold text-black">
                          {(() => {
                            // Show starting price - estimated price range
                            if (lot.startingPrice > 0 && lot.estimatedPrice > 0) {
                              return `₹${lot.startingPrice.toLocaleString('en-IN')} - ₹${lot.estimatedPrice.toLocaleString('en-IN')}`;
                            }
                            // Show only starting price if no estimated price
                            else if (lot.startingPrice > 0) {
                              return `₹${lot.startingPrice.toLocaleString('en-IN')}`;
                            }
                            // Show only estimated price if no starting price
                            else if (lot.estimatedPrice > 0) {
                              return `₹${lot.estimatedPrice.toLocaleString('en-IN')}`;
                            }
                            // Final fallback
                            else {
                              return 'Price on request';
                            }
                          })()}
                        </p>
                      </div>

                      {/* Current Bid Info */}
                      <div className="pt-3 border-t border-gray-200">
                        {lot.bids && lot.bids.length > 0 ? (
                          <>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Current Bid</p>
                            <p className="text-base font-bold text-gray-900 mb-3">₹{lot.currentBid.toLocaleString('en-IN')}</p>
                            <p className="text-xs font-semibold text-green-600 uppercase mb-1">Next Bid</p>
                            <p className="text-xl font-bold text-green-600">₹{(lot.currentBid + getCurrentIncrement(lot.currentBid, auction.incrementSlabs)).toLocaleString('en-IN')}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Opening Bid</p>
                            <p className="text-xl font-bold text-gray-900">₹{(lot.startingPrice || 0).toLocaleString('en-IN')}</p>
                          </>
                        )}
                      </div>

                      {/* Bid Status Badge */}
                      {bidStatus[lot.lotNumber] && (
                        <div className={`p-3 rounded-lg text-center font-bold text-sm ${
                          bidStatus[lot.lotNumber] === 'success'
                            ? 'bg-green-100 text-green-800 border-2 border-green-400'
                            : bidStatus[lot.lotNumber] === 'reserve-success'
                            ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                            : bidStatus[lot.lotNumber] === 'reserve-updated'
                            ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-400'
                            : bidStatus[lot.lotNumber] === 'outbid'
                            ? 'bg-red-100 text-red-800 border-2 border-red-400'
                            : 'bg-purple-100 text-purple-800 border-2 border-purple-400'
                        }`}>
                          {bidStatus[lot.lotNumber] === 'success' && '✅ Bid Placed Successfully!'}
                          {bidStatus[lot.lotNumber] === 'reserve-success' && '🎯 Your Bid In Reserve!'}
                          {bidStatus[lot.lotNumber] === 'reserve-updated' && '🔼 Reserve Updated!'}
                          {bidStatus[lot.lotNumber] === 'outbid' && '⚠️ You Are Outbid!'}
                          {bidStatus[lot.lotNumber] === 'winning' && '🎉 You Are Winning!'}
                        </div>
                      )}

                      {/* Bid Input */}
                      <div>
                        <input
                          type="number"
                          placeholder="Enter bid amount"
                          value={bidAmounts[lot.lotNumber] || ''}
                          onChange={(e) => setBidAmounts(prev => ({ ...prev, [lot.lotNumber]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handlePlaceBid(lot.lotNumber);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          disabled={submittingBid[lot.lotNumber]}
                        />
                      </div>

                      {/* Submit Bid Button - Dynamic Color Based on Bid Status */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePlaceBid(lot.lotNumber);
                        }}
                        disabled={submittingBid[lot.lotNumber]}
                        className={`w-full px-4 py-2.5 rounded transition-colors font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed ${
                          bidStatus[lot.lotNumber] === 'outbid'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : bidStatus[lot.lotNumber] === 'success' || bidStatus[lot.lotNumber] === 'winning'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : bidStatus[lot.lotNumber] === 'reserve-success' || bidStatus[lot.lotNumber] === 'reserve-updated'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300'
                        }`}
                      >
                        {submittingBid[lot.lotNumber] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Placing Bid...
                          </>
                        ) : (
                          <>
                            <Gavel className="w-4 h-4" />
                            Submit Bid
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bidding Note */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-blue-600 text-center">
                    💡 You can enter any bid amount greater than or equal to the Next Bid
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Gavel className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Lots Available</h3>
            <p className="text-gray-600">This auction doesn't have any lots yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionLots;
