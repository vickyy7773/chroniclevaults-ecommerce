import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Download, MapPin, Calendar, Clock, Info,
  Phone, BookOpen, Gavel, ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import vintagePoster from '../assets/images/WhatsApp Image 2025-12-09 at 20.27.36.jpeg';

const AuctionCatalog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuctionCatalog();
  }, [id]);

  const fetchAuctionCatalog = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auctions/${id}`);
      const auctionData = response.data;
      setAuction(auctionData);

      // Group lots by category
      if (auctionData.lots && auctionData.lots.length > 0) {
        const categoryMap = {};

        auctionData.lots.forEach(lot => {
          const category = lot.category || 'Miscellaneous';
          if (!categoryMap[category]) {
            categoryMap[category] = {
              name: category,
              startLot: lot.lotNumber,
              endLot: lot.lotNumber,
              count: 0
            };
          }
          categoryMap[category].endLot = lot.lotNumber;
          categoryMap[category].count++;
        });

        setCategories(Object.values(categoryMap));
      }
    } catch (error) {
      console.error('Fetch auction catalog error:', error);
      toast.error('Failed to load auction catalog');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
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
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-700 to-accent-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{auction.title}</h1>
              <p className="text-accent-100">{auction.auctionCode || 'Auction Catalog'}</p>
            </div>
            <div className="flex gap-3">
              {auction.catalogPDF && (
                <a
                  href={auction.catalogPDF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-accent-700 rounded-lg hover:bg-accent-50 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download PDF</span>
                </a>
              )}
              {auction.errataPDF && (
                <a
                  href={auction.errataPDF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span>Auction Errata</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3-Column Layout: Cover, Poster, Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Cover Image */}
              {auction.coverImage && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={auction.coverImage}
                    alt="Catalog Cover"
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-3 text-center">
                    <p className="text-xs text-gray-600">Catalog Cover</p>
                  </div>
                </div>
              )}

              {/* Vintage Poster */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-accent-600">
                <img
                  src={vintagePoster}
                  alt="Numismatic Treasures Auction"
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Auction Highlights */}
              <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-accent-50 rounded-lg shadow-lg p-4 border-2 border-amber-400 relative overflow-hidden">
                {/* Decorative corner ribbon */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent-600 to-amber-600 transform rotate-45 translate-x-10 -translate-y-10"></div>

                <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-amber-700" />
                  Why Join This Auction?
                </h3>

                <div className="space-y-3">
                  {/* Highlight 1 */}
                  <div className="flex items-start gap-3 bg-white/70 rounded-lg p-2 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-gradient-to-br from-accent-600 to-accent-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white font-bold text-xs">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Rare Collection</p>
                      <p className="text-xs text-gray-600">{auction.lots?.length || 0} authentic numismatic treasures</p>
                    </div>
                  </div>

                  {/* Highlight 2 */}
                  <div className="flex items-start gap-3 bg-white/70 rounded-lg p-2 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white font-bold text-xs">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Live & Online</p>
                      <p className="text-xs text-gray-600">Bid from anywhere, real-time</p>
                    </div>
                  </div>

                  {/* Highlight 3 */}
                  <div className="flex items-start gap-3 bg-white/70 rounded-lg p-2 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white font-bold text-xs">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Expert Verified</p>
                      <p className="text-xs text-gray-600">Authenticated by specialists</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => navigate(`/auction/${id}`)}
                    className="w-full mt-3 px-4 py-2.5 bg-gradient-to-r from-accent-600 to-amber-600 text-white rounded-lg hover:from-accent-700 hover:to-amber-700 transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🔨 Start Bidding Now
                  </button>
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
                {/* Date */}
                <div className="border-l-4 border-accent-600 pl-4">
                  <p className="text-sm text-gray-600 font-medium">Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(auction.startTime)}
                  </p>
                  <p className="text-sm text-gray-600">{auction.venue?.city}, {auction.venue?.state}</p>
                </div>

                {/* Venue */}
                {auction.venue && (
                  <div className="border-l-4 border-blue-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <p className="text-sm text-gray-600 font-medium">Auction Venue</p>
                    </div>
                    <p className="text-gray-900 font-medium">{auction.venue.location}</p>
                    {auction.venue.address && (
                      <p className="text-sm text-gray-600">{auction.venue.address}</p>
                    )}
                    {auction.venue.contactPhone && (
                      <div className="flex items-center gap-2 mt-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600">{auction.venue.contactPhone}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bidding Information - Always Visible */}
                <div className="border-l-4 border-green-600 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gavel className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-gray-600 font-medium">Bidding Information</p>
                  </div>
                  <div className="text-sm text-gray-500 space-y-2">
                    <p className="font-medium">
                      Join us for Live Bidding starting at {new Date(auction.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} on auction day.
                    </p>
                    <p>
                      Bid from anywhere using our online platform, or experience the excitement live at the venue. Both online and floor bids are accepted simultaneously in real-time.
                    </p>
                    <p className="text-xs italic">
                      View lots during the preview period and register in advance for a seamless bidding experience.
                    </p>
                  </div>
                </div>

                {/* Lot Viewing */}
                {auction.lotViewing && auction.lotViewing.length > 0 && (
                  <div className="border-l-4 border-green-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-gray-600 font-medium">Lot Viewing</p>
                    </div>
                    {auction.lotViewing.map((viewing, idx) => (
                      <div key={idx} className="mb-2">
                        <p className="text-gray-900">
                          {formatDateOnly(viewing.startDate)} to {formatDateOnly(viewing.endDate)}
                        </p>
                        <p className="text-sm text-gray-600">{viewing.time}</p>
                        {viewing.location && (
                          <p className="text-sm text-gray-600">{viewing.location}</p>
                        )}
                        {viewing.notes && (
                          <p className="text-sm text-gray-500 italic">{viewing.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Online Bidding */}
                {auction.onlineBiddingEndTime && (
                  <div className="border-l-4 border-purple-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <p className="text-sm text-gray-600 font-medium">Online Bidding Ends</p>
                    </div>
                    <p className="text-gray-900 font-semibold">{formatDate(auction.onlineBiddingEndTime)}</p>
                  </div>
                )}

                {/* Buyer's Premium */}
                {auction.buyersPremium && (
                  <div className="border-l-4 border-red-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-gray-600 font-medium">Buyer's Premium</p>
                    </div>
                    <p className="text-gray-900">
                      {auction.buyersPremium.percentage}% Buyers Premium plus {auction.buyersPremium.gstOnPremium}% GST on Buyers Premium plus {auction.buyersPremium.gstOnHammer}% GST on Hammer, {auction.buyersPremium.totalPremium}% Total Buyers Premium
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      HSN Code: {auction.buyersPremium.hsnCode}
                    </p>
                    {auction.buyersPremium.notes && (
                      <p className="text-sm text-gray-500 mt-2">{auction.buyersPremium.notes}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2 italic">
                      As per Government rules and regulation any changes in GST slab will be applicable to the buyer.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Gavel className="w-6 h-6 text-accent-600" />
                <h2 className="text-2xl font-bold text-gray-900">Lot Categories</h2>
              </div>

              {categories.length > 0 ? (
                <div className="space-y-2">
                  {categories.map((category, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(`/auction/${id}?lot=${category.startLot}`)}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-accent-50 rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-accent-700">
                          {category.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Lots {category.startLot}–{category.endLot}
                        </p>
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

              {/* View Auction Button */}
              <button
                onClick={() => navigate(`/auction/${id}`)}
                className="w-full mt-6 px-4 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Gavel className="w-5 h-5" />
                <span>Start Bidding</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionCatalog;
