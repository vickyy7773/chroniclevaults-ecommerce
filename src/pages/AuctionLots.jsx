import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gavel, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuctionLots = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState({}); // Track selected image for each lot

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
        {/* All Lots Listing */}
        {auction.lots && auction.lots.length > 0 ? (
          <div className="space-y-6">
            {auction.lots.map((lot, index) => (
              <div key={lot._id || index} className="bg-white border border-gray-300 rounded-lg p-5 hover:border-accent-400 hover:shadow-lg transition-all duration-200 shadow-sm">
                {/* Lot Header */}
                <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-200">
                  <span className="px-3 py-1 bg-accent-600 text-white text-sm font-semibold rounded">Lot #{lot.lotNumber}</span>
                  <span className="px-3 py-1 bg-amber-600 text-white text-sm font-semibold rounded">{auction.auctionCode || 'AUC50'}</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 text-sm font-semibold rounded">{lot.category || 'Ancient India'}</span>
                  <span className="ml-auto px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">{lot.material || 'Silver'}</span>
                </div>

                {/* Lot Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Image Gallery */}
                  <div className="md:col-span-1">
                    {(() => {
                      // Get images array (support both 'image' and 'images' fields)
                      let images = lot.images && lot.images.length > 0
                        ? lot.images
                        : lot.image
                          ? [lot.image]
                          : [];

                      // DEMO MODE: Add duplicate images to show gallery (TEMPORARY FOR TESTING)
                      // Remove this block after testing
                      if (images.length === 1 && lot.image) {
                        images = [
                          lot.image,
                          lot.image,
                          lot.image
                        ];
                      }

                      const currentIndex = selectedImages[lot._id] || 0;
                      const currentImage = images[currentIndex];

                      return images.length > 0 ? (
                        <>
                          {/* Main Image Display */}
                          <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden mb-2 group">
                            <img
                              src={currentImage}
                              alt={lot.title}
                              className="w-full h-64 sm:h-80 object-contain bg-gray-50"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                            />

                            {/* Navigation Arrows - Only show if multiple images */}
                            {images.length > 1 && (
                              <>
                                <button
                                  onClick={() => {
                                    const newIndex = (currentIndex - 1 + images.length) % images.length;
                                    setSelectedImages(prev => ({ ...prev, [lot._id]: newIndex }));
                                  }}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const newIndex = (currentIndex + 1) % images.length;
                                    setSelectedImages(prev => ({ ...prev, [lot._id]: newIndex }));
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Thumbnail Gallery - Only show if multiple images */}
                          {images.length > 1 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {images.map((img, imgIndex) => (
                                <button
                                  key={imgIndex}
                                  onClick={() => setSelectedImages(prev => ({ ...prev, [lot._id]: imgIndex }))}
                                  className={`relative rounded-lg overflow-hidden border-3 transition-all transform hover:scale-105 ${
                                    currentIndex === imgIndex
                                      ? 'border-amber-500 ring-2 ring-amber-400 shadow-lg'
                                      : 'border-gray-300 hover:border-amber-300 shadow-sm'
                                  }`}
                                >
                                  <div className={`w-full h-20 sm:h-24 p-2 ${
                                    currentIndex === imgIndex ? 'bg-amber-50' : 'bg-white'
                                  }`}>
                                    <img
                                      src={img}
                                      alt={`${lot.title} - Image ${imgIndex + 1}`}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3C/svg%3E';
                                      }}
                                    />
                                  </div>
                                  {/* Selected Indicator Badge */}
                                  {currentIndex === imgIndex && (
                                    <div className="absolute top-1 right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
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
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Estimated Price</p>
                        <p className="text-lg font-bold text-green-700">
                          ₹{lot.estimatedPrice?.min?.toLocaleString('en-IN') || '0'} - ₹{lot.estimatedPrice?.max?.toLocaleString('en-IN') || '0'}
                        </p>
                      </div>

                      {/* Current Bid Info */}
                      <div className="pt-3 border-t border-gray-200">
                        {lot.currentBid && lot.currentBid > 0 ? (
                          <>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Current Bid</p>
                            <p className="text-base font-bold text-gray-900 mb-3">₹{lot.currentBid.toLocaleString('en-IN')}</p>
                            <p className="text-xs font-semibold text-red-600 uppercase mb-1">Next Bid</p>
                            <p className="text-xl font-bold text-red-600">₹{(lot.currentBid + (lot.bidIncrement || 1000)).toLocaleString('en-IN')}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Opening Bid</p>
                            <p className="text-xl font-bold text-gray-900">₹{(lot.startingBid || lot.estimatedPrice?.min || 0).toLocaleString('en-IN')}</p>
                          </>
                        )}
                      </div>

                      {/* Bid Input */}
                      <div>
                        <input
                          type="number"
                          placeholder="Enter bid amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        />
                      </div>

                      {/* Submit Bid Button */}
                      <button
                        onClick={() => navigate(`/auction/${id}?lot=${lot.lotNumber}`)}
                        className="w-full px-4 py-2.5 bg-accent-600 text-white rounded hover:bg-accent-700 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <Gavel className="w-4 h-4" />
                        Submit Bid
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
