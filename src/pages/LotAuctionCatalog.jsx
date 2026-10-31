import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Gavel, ChevronRight, BookOpen, Info, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const LotAuctionCatalog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    fetchAuction();
  }, [id]);

  useEffect(() => {
    if (!auction?.lotBiddingEndTime) return;
    const calc = () => {
      const diff = new Date(auction.lotBiddingEndTime) - new Date();
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [auction]);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lot-auction/public/${id}`);
      const data = res.data?.data || res.data;
      setAuction(data);

      // Build categories from lots
      if (data?.lots?.length > 0) {
        const map = {};
        data.lots.forEach(lot => {
          const cat = lot.category || lot.title?.split(' ')[0] || 'General';
          if (!map[cat]) map[cat] = { name: cat, startLot: lot.lotNumber, endLot: lot.lotNumber, count: 0 };
          map[cat].endLot = lot.lotNumber;
          map[cat].count++;
        });
        setCategories(Object.values(map));
      }
    } catch (err) {
      toast.error('Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const handleBid = (lotNumber = null) => {
    const url = lotNumber ? `/lot-auction/${id}?lot=${lotNumber}` : `/lot-auction/${id}`;
    navigate(url);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-600"></div>
    </div>
  );

  if (!auction) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Auction Not Found</h2>
        <button onClick={() => navigate('/auctions')} className="mt-4 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700">
          Back to Auctions
        </button>
      </div>
    </div>
  );

  const biddingTimeOver = auction.lotBiddingEndTime && new Date(auction.lotBiddingEndTime) < new Date();
  const isBiddingClosed = biddingTimeOver || auction.status === 'Completed' || auction.status === 'Paused';
  const resultsPublished = auction.status === 'Completed';

  if (isBiddingClosed) {
    const platform = auction.externalPlatformName;
    const platformLink = auction.externalPlatformLink;

    return (
      <div className="h-[calc(100vh-var(--header-h,140px))] bg-[#F5EDD6] flex items-center justify-center px-4 overflow-hidden">
        <div className="w-full max-w-3xl">
          {/* Main card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-200">
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-accent-600 via-amber-500 to-accent-600" />

            <div className="px-8 py-8 flex flex-col md:flex-row items-center gap-8">
              {/* Left: image or gavel */}
              <div className="flex-shrink-0 flex flex-col items-center gap-4">
                {auction.image ? (
                  <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-amber-300 shadow-md">
                    <img src={auction.image} alt={auction.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center border-2 border-amber-300">
                    <Gavel className="w-12 h-12 text-amber-600" />
                  </div>
                )}
                <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Chronicle Vaults</span>
              </div>

              {/* Right: content */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-accent-600 mb-1">Bidding Closed</p>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Thank You for Bidding!</h1>
                <p className="text-gray-500 font-medium mb-5">{auction.title}</p>

                {/* Divider */}
                <div className="border-t border-amber-200 mb-5" />

                {/* Platform section */}
                {platform ? (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                      {resultsPublished ? 'Results Available On' : 'Live Bidding Platform'}
                    </p>
                    {platformLink ? (
                      <a
                        href={platformLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-bold text-base transition-colors shadow-md"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {platform}
                      </a>
                    ) : (
                      <p className="text-accent-700 font-bold text-xl">{platform}</p>
                    )}
                  </div>
                ) : null}

                {/* Status info */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3 text-left mb-5">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {resultsPublished
                      ? 'The auction results have been officially announced.'
                      : platform
                        ? <>Results will appear here once <strong>{platform}</strong> announces them after the live session.</>
                        : 'Results will be published here once the live auction concludes.'}
                  </p>
                </div>

                {/* Back button */}
                <button
                  onClick={() => navigate('/auctions')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Browse Other Auctions
                </button>
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="h-1 bg-gradient-to-r from-accent-600 via-amber-500 to-accent-600 opacity-40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-700 to-accent-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-3xl md:text-4xl font-bold">{auction.title}</h1>
            {auction.catalogPdf && (
              <a href={auction.catalogPdf} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white text-accent-700 rounded-lg hover:bg-accent-50 transition-colors font-semibold">
                <BookOpen className="w-5 h-5" />
                <span>View Catalog PDF</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auction Highlights */}
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-accent-50 rounded-lg shadow-xl p-8 border-2 border-amber-400 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-600 to-amber-600 transform rotate-45 translate-x-16 -translate-y-16 opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-600 to-accent-600 transform rotate-45 -translate-x-16 translate-y-16 opacity-20"></div>

              <div className="relative">
                <h3 className="text-2xl font-bold text-amber-900 mb-8 flex items-center gap-3 border-b-2 border-amber-300 pb-4">
                  <Gavel className="w-7 h-7 text-amber-700" />
                  Auction Highlights
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Poster Image */}
                  {auction.image && (
                    <div className="md:col-span-1 flex flex-col gap-3">
                      <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-accent-600">
                        <img src={auction.image} alt={auction.title}
                          className="w-full h-auto object-contain"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                      </div>
                      {auction.catalogPdf ? (
                        <a href={auction.catalogPdf} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-accent-600 to-amber-600 text-white rounded-lg hover:from-accent-700 hover:to-amber-700 font-bold text-sm">
                          <BookOpen className="w-4 h-4" />
                          View Catalog
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-300 text-gray-500 rounded-lg text-sm font-bold cursor-not-allowed">
                          <BookOpen className="w-4 h-4" />
                          No PDF Available
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info Cards */}
                  <div className={`${auction.image ? 'md:col-span-3' : 'md:col-span-4'} grid grid-cols-1 md:grid-cols-2 gap-5`}>
                    {/* Bidding End Time */}
                    {auction.lotBiddingEndTime && (
                      <div className="bg-white/80 rounded-lg p-5 shadow-md border border-amber-200 flex items-center">
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-14 h-14 bg-gradient-to-br from-accent-600 to-accent-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-1">Bidding Ends</p>
                            <p className="text-base font-bold text-gray-900">{formatDate(auction.lotBiddingEndTime)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Website */}
                    <div className="bg-white/80 rounded-lg p-5 shadow-md border border-amber-200 flex items-center">
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <Gavel className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium mb-1">Visit Our Website</p>
                          <a href="https://chroniclevaults.com" target="_blank" rel="noopener noreferrer"
                            className="text-base font-bold text-blue-600 hover:underline">chroniclevaults.com</a>
                        </div>
                      </div>
                    </div>

                    {/* Total Lots + Countdown */}
                    <div className="bg-white/80 rounded-lg p-5 shadow-md border border-amber-200">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-bold text-white">{auction.lots?.length || 0}</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium mb-1">Total Lots</p>
                          <p className="text-base font-bold text-gray-900">Numismatic Treasures</p>
                        </div>
                      </div>
                      {timeLeft && (
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-200">
                          <p className="text-xs text-gray-600 font-medium mb-2 text-center">Bidding Ends In</p>
                          <div className="grid grid-cols-4 gap-2">
                            {[['days','Days'],['hours','Hours'],['minutes','Mins'],['seconds','Secs']].map(([k,l]) => (
                              <div key={k} className="text-center">
                                <div className="bg-white rounded-md py-1 px-1 border border-red-300">
                                  <p className="text-lg font-bold text-red-600">{String(timeLeft[k]).padStart(2,'0')}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{l}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Why Join */}
                    <div className="bg-white/80 rounded-lg p-5 shadow-md border border-amber-200">
                      <h4 className="text-base font-bold text-amber-900 mb-4">Why Join This Auction?</h4>
                      <div className="space-y-3">
                        {[['accent','Rare & Authentic'],['green','Live & Online'],['purple','Secure & Trusted']].map(([color, label]) => (
                          <div key={label} className="flex items-center gap-3">
                            <div className={`w-6 h-6 bg-gradient-to-br from-${color}-600 to-${color}-700 rounded-full flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white text-sm font-bold">✓</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="md:col-span-2">
                      <button onClick={() => handleBid()}
                        className="w-full px-8 py-4 bg-gradient-to-r from-accent-600 to-amber-600 text-white rounded-lg hover:from-accent-700 hover:to-amber-700 transition-all text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105">
                        🔨 Start Bidding Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auction Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-6 h-6 text-accent-600" />
                <h2 className="text-2xl font-bold text-gray-900">Auction Details</h2>
              </div>
              <div className="space-y-4">
                {auction.lotBiddingEndTime && (
                  <div className="border-l-4 border-accent-600 pl-4">
                    <p className="text-sm text-gray-600 font-medium">Bidding Ends</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(auction.lotBiddingEndTime)}</p>
                  </div>
                )}

                <div className="border-l-4 border-green-600 pl-5 py-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Gavel className="w-6 h-6 text-green-600" />
                    <p className="text-base text-gray-700 font-semibold">Bidding Information</p>
                  </div>
                  <p className="text-sm italic text-gray-500">
                    Browse all lots and place your bids before the auction ends. Register in advance for a seamless experience.
                  </p>
                </div>

                {auction.description && (
                  <div className="border-l-4 border-blue-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      <p className="text-sm text-gray-600 font-medium">About This Auction</p>
                    </div>
                    <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: auction.description }} />
                  </div>
                )}

                {auction.externalPlatformName && (
                  <div className="border-l-4 border-purple-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <p className="text-sm text-gray-600 font-medium">Also Available On</p>
                    </div>
                    {auction.externalPlatformLink ? (
                      <a href={auction.externalPlatformLink} target="_blank" rel="noopener noreferrer"
                        className="text-purple-600 font-semibold hover:underline">{auction.externalPlatformName}</a>
                    ) : (
                      <p className="text-gray-900 font-semibold">{auction.externalPlatformName}</p>
                    )}
                  </div>
                )}

                <div className="border-l-4 border-red-600 pl-5 py-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-6 h-6 text-red-600" />
                    <p className="text-base text-gray-700 font-semibold">Buyer's Premium</p>
                  </div>
                  <p className="text-base text-gray-900 font-medium leading-relaxed">
                    Buyers Premium 10% + GST On Hammer 5% + GST On Service 18%
                  </p>
                  <p className="text-sm text-gray-500 mt-3 italic">
                    As per Government rules and regulation any changes in GST slab will be applicable to the buyer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Gavel className="w-6 h-6 text-accent-600" />
                <h2 className="text-2xl font-bold text-gray-900">Lot Categories</h2>
              </div>

              {categories.length > 0 ? (
                <div className="space-y-2">
                  {categories.map((cat, idx) => (
                    <div key={idx} onClick={() => handleBid(cat.startLot)}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-accent-50 rounded-lg cursor-pointer transition-colors group">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-accent-700">{cat.name}</p>
                        <p className="text-sm text-gray-600">Lots {cat.startLot}–{cat.endLot}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-accent-600" />
                    </div>
                  ))}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="bg-accent-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 mb-2">Total Lots</p>
                      <p className="text-3xl font-bold text-accent-700">{auction.lots?.length || 0}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No lots available</p>
              )}

              <button onClick={() => handleBid()}
                className="w-full mt-6 px-4 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors flex items-center justify-center gap-2 font-semibold">
                <Gavel className="w-5 h-5" />
                <span>Start Bidding Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotAuctionCatalog;
