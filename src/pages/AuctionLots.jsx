import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gavel, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { io } from 'socket.io-client';

const AuctionLots = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState({}); // Track selected image for each lot
  const [bidAmounts, setBidAmounts] = useState({}); // Track bid amounts for each lot
  const [submittingBid, setSubmittingBid] = useState({}); // Track submission state for each lot
  const [currentUser, setCurrentUser] = useState(null); // Current logged-in user
  const [bidStatus, setBidStatus] = useState({}); // Track bid status for each lot (success, outbid, winning)

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

  const fetchAuction = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auctions/${id}`);
      setAuction(response.data);
    } catch (error) {
      console.error('Fetch auction error:', error);
      toast.error('Failed to load auction lots');
    } finally {
      setLoading(false);
    }
  };

  // Calculate current increment based on bid slabs
  const getCurrentIncrement = (currentBid, incrementSlabs) => {
    console.log('🔍 CATALOG INCREMENT DEBUG:', {
      currentBid,
      hasSlabs: !!incrementSlabs,
      slabsLength: incrementSlabs?.length || 0
    });

    if (!incrementSlabs || incrementSlabs.length === 0) {
      console.log('⚠️ No slabs provided, using defaults');
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

    console.log('🔍 Checking slabs:', incrementSlabs);

    for (let slab of incrementSlabs) {
      const matches = currentBid >= slab.minPrice && currentBid < slab.maxPrice;
      console.log(`  Slab [${slab.minPrice}-${slab.maxPrice}]: ${currentBid} >= ${slab.minPrice} && ${currentBid} < ${slab.maxPrice} = ${matches}, increment: ${slab.increment}`);
      if (matches) {
        console.log(`  ✅ Matched! Returning increment: ${slab.increment}`);
        return slab.increment;
      }
    }
    // If currentBid is beyond all slabs, use the last slab's increment
    const fallback = incrementSlabs[incrementSlabs.length - 1]?.increment || 100;
    console.log(`  ❌ No match! Using fallback: ${fallback}`);
    return fallback;
  };

  // Auto-redirect to live auction when auction starts
  useEffect(() => {
    if (!auction) return;

    const checkAuctionStatus = () => {
      const now = new Date();
      const startTime = new Date(auction.startTime);

      // If auction has started, redirect to live auction page
      if (now >= startTime) {
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

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleReconnect);
      }
    };
  }, [currentUser]);

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

  // Real-time bid update listener with personalized notifications
  useEffect(() => {
    console.log('🔧 CATALOG - Bid listener useEffect triggered. Socket:', !!socketRef.current, 'User:', currentUser?._id, 'ID:', id);

    if (!socketRef.current || !currentUser) {
      console.warn('⚠️ CATALOG - Cannot setup listeners. Socket:', !!socketRef.current, 'User:', !!currentUser);
      return;
    }

    console.log('✅ CATALOG - All prerequisites met, setting up listeners NOW');

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

        // Check if current user was outbid and get the lot number
        if (data.outbidUser && data.outbidUser.userId === currentUser._id) {
          // Find which lot user was outbid on
          const outbidLotNumber = data.auction.lots?.findIndex(lot =>
            lot.bids?.some(bid =>
              bid.user?.toString() === currentUser._id &&
              bid.amount < lot.currentBid
            )
          ) + 1;

          if (outbidLotNumber > 0) {
            // Show outbid status on card (will persist until new bid)
            setBidStatus(prev => ({ ...prev, [outbidLotNumber]: 'outbid' }));
          }
        }
      }
    };

    // Listen for coin balance updates (when outbid)
    const handleCoinBalanceUpdate = (data) => {
      console.log('💰 Coin balance updated:', data);

      if (data.reason === 'Outbid - coins refunded') {
        // Show toast notification
        toast.warning(`⚠️ Outbid on Lot ${data.lotNumber}! ₹${data.auctionCoins.toLocaleString()} coins refunded`, {
          autoClose: 5000,
          position: 'top-center'
        });

        // Show red OUTBID indicator on card (will persist until new bid)
        if (data.lotNumber) {
          setBidStatus(prev => ({ ...prev, [data.lotNumber]: 'outbid' }));
        }
      } else if (data.reason === 'Bid placed - coins deducted') {
        toast.info(`💰 Coins updated: ₹${data.auctionCoins.toLocaleString()} available`, {
          autoClose: 3000
        });
      }
    };

    // Remove ALL previous listeners before adding new ones (prevents multiple listener accumulation)
    socketRef.current.off('bid-placed');
    socketRef.current.on('bid-placed', handleBidPlaced);
    socketRef.current.off('coin-balance-updated');
    socketRef.current.on('coin-balance-updated', handleCoinBalanceUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('bid-placed');
        socketRef.current.off('coin-balance-updated');
      }
    };
  }, [currentUser, id]);

  // Handle bid submission for a specific lot
  const handlePlaceBid = async (lotNumber) => {
    // Check if user is logged in
    if (!currentUser) {
      toast.info('Please login to place a bid');
      // Save current page URL to redirect back after login
      const returnUrl = `/auction-lots/${id}`;
      navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    const amount = parseInt(bidAmounts[lotNumber]);

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    if (amount % 50 !== 0) {
      toast.error('Bid amount must be divisible by 50');
      return;
    }

    // Find the lot
    const lot = auction?.lots?.find(l => l.lotNumber === lotNumber);
    if (!lot) {
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
      minBid = lot.startingPrice || lot.estimatedPrice?.min || 0;
    }

    if (amount < minBid) {
      toast.error(`Minimum bid is ₹${minBid.toLocaleString('en-IN')}`);
      return;
    }

    try {
      setSubmittingBid(prev => ({ ...prev, [lotNumber]: true }));

      // PROXY BIDDING LOGIC: If amount > minBid, treat as reserve/max bid
      let maxBid = null;
      let actualBid = amount;

      if (amount > minBid) {
        // User entered higher than minimum - this becomes their maximum bid (hidden)
        maxBid = amount;
        actualBid = minBid; // Place minimum bid publicly
        console.log(`🎯 PROXY BID: Public bid ₹${actualBid.toLocaleString()}, Hidden max ₹${maxBid.toLocaleString()}`);
      }

      // Send lot number with bid for catalog phase, and maxBid for proxy bidding
      const response = await api.post(`/auctions/${id}/bid`, { amount: actualBid, maxBid, lotNumber });

      console.log('🎯 BID RESPONSE:', {
        success: response.success,
        hasData: !!response.data,
        hasAuction: !!response.data?.auction,
        lotNumber
      });

      // Response interceptor already extracts data, so check response.success not response.data.success
      if (response.success) {
        console.log('✅ Setting bidStatus to SUCCESS for lot', lotNumber);

        // Show success message with proxy bid info
        if (maxBid) {
          toast.success(`✅ Bid placed with reserve of ₹${maxBid.toLocaleString('en-IN')}! System will auto-bid up to this amount.`);
        } else {
          toast.success('✅ Bid placed successfully!');
        }

        // Show success status on card
        setBidStatus(prev => {
          const newStatus = { ...prev, [lotNumber]: 'success' };
          console.log('✅ New bidStatus:', newStatus);
          return newStatus;
        });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/auction-catalog/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-accent-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Catalog</span>
        </button>

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
                            // Both prices exist and are greater than 0
                            if (lot.startingPrice > 0 && lot.reservePrice > 0) {
                              return `₹${lot.startingPrice.toLocaleString('en-IN')} - ₹${lot.reservePrice.toLocaleString('en-IN')}`;
                            }
                            // Only starting price exists
                            else if (lot.startingPrice > 0) {
                              return `₹${lot.startingPrice.toLocaleString('en-IN')}`;
                            }
                            // Only reserve price exists (rare case)
                            else if (lot.reservePrice > 0) {
                              return `₹${lot.reservePrice.toLocaleString('en-IN')}`;
                            }
                            // Fallback to estimated price
                            else if (lot.estimatedPrice?.min && lot.estimatedPrice?.max) {
                              return `₹${lot.estimatedPrice.min.toLocaleString('en-IN')} - ₹${lot.estimatedPrice.max.toLocaleString('en-IN')}`;
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
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Starting Price</p>
                            <p className="text-xl font-bold text-gray-900">₹{(lot.startingPrice || lot.estimatedPrice?.min || 0).toLocaleString('en-IN')}</p>
                          </>
                        )}
                      </div>

                      {/* Bid Status Badge */}
                      {(() => {
                        if (bidStatus[lot.lotNumber]) {
                          console.log('🎨 RENDERING BID STATUS for lot', lot.lotNumber, ':', bidStatus[lot.lotNumber]);
                        }
                        return bidStatus[lot.lotNumber];
                      })() && (
                        <div className={`p-3 rounded-lg text-center font-bold text-sm animate-pulse ${
                          bidStatus[lot.lotNumber] === 'success'
                            ? 'bg-green-100 text-green-800 border-2 border-green-400'
                            : bidStatus[lot.lotNumber] === 'outbid'
                            ? 'bg-red-100 text-red-800 border-2 border-red-400'
                            : 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                        }`}>
                          {bidStatus[lot.lotNumber] === 'success' && '✅ Bid Placed Successfully!'}
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
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          disabled={submittingBid[lot.lotNumber]}
                        />
                      </div>

                      {/* Submit Bid Button */}
                      <button
                        onClick={() => handlePlaceBid(lot.lotNumber)}
                        disabled={submittingBid[lot.lotNumber]}
                        className="w-full px-4 py-2.5 bg-accent-600 text-white rounded hover:bg-accent-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
