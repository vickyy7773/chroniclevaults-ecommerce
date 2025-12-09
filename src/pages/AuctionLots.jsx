import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gavel, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuctionLots = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);

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
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-700 to-accent-800 text-white py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(`/auction-catalog/${id}`)}
            className="flex items-center gap-2 text-accent-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Catalog</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{auction.title}</h1>
              <p className="text-accent-100">Browse All Lots - {auction.auctionCode || 'AUC50'}</p>
            </div>
            <div className="text-right">
              <p className="text-accent-100 text-sm">Total Lots</p>
              <p className="text-4xl font-bold">{auction.lots?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* All Lots Listing */}
        {auction.lots && auction.lots.length > 0 ? (
          <div className="space-y-6">
            {auction.lots.map((lot, index) => (
              <div key={lot._id || index} className="bg-gradient-to-br from-white via-amber-50/30 to-white border-2 border-amber-200 rounded-xl p-8 hover:border-amber-400 hover:shadow-2xl transition-all duration-300 shadow-lg relative overflow-hidden">
                {/* Decorative Corner Elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/10 to-accent-400/10 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent-400/10 to-amber-400/10 rounded-tr-full"></div>

                {/* Lot Header */}
                <div className="grid grid-cols-12 gap-4 mb-6 relative">
                  <div className="col-span-3">
                    <div className="inline-block px-4 py-2 bg-gradient-to-r from-accent-600 to-accent-700 rounded-lg shadow-md">
                      <p className="text-sm text-white font-bold">Lot #{lot.lotNumber}</p>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-md">
                      <p className="text-sm font-bold text-white">{auction.auctionCode || 'AUC50'}</p>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <p className="text-base font-bold text-amber-900 bg-amber-100 px-4 py-2 rounded-lg inline-block">{lot.category || 'Ancient India'}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-2 rounded-lg inline-block">{lot.material || 'Silver'}</p>
                  </div>
                </div>

                {/* Lot Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                  {/* Image */}
                  <div className="md:col-span-1">
                    <div className="relative group">
                      {lot.image ? (
                        <div className="relative overflow-hidden rounded-xl border-4 border-amber-200 shadow-xl group-hover:border-amber-400 transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <img
                            src={lot.image}
                            alt={lot.title}
                            className="w-full h-56 object-contain bg-gradient-to-br from-amber-50 to-white p-4 group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23fef3c7" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23d97706" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-56 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-4 border-amber-200 flex items-center justify-center shadow-xl">
                          <p className="text-amber-600 text-sm font-medium">No Image Available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-1">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-amber-100 shadow-md space-y-3">
                      <h3 className="text-lg font-bold text-amber-900 border-b-2 border-amber-200 pb-2">{lot.title}</h3>
                      <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                        <p className="text-gray-800">
                          {lot.description || 'No description available'}
                        </p>
                        {lot.condition && (
                          <div className="mt-3 pt-3 border-t border-amber-100">
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Condition</p>
                            <p className="italic text-gray-700 bg-amber-50 px-3 py-2 rounded-lg">{lot.condition}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Bidding */}
                  <div className="md:col-span-1">
                    <div className="bg-gradient-to-br from-white to-amber-50/50 rounded-xl p-6 border-2 border-amber-200 shadow-xl space-y-5">
                      {/* Estimated Price */}
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border-l-4 border-emerald-500 shadow-sm">
                        <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Estimated Price</p>
                        <p className="text-xl font-black text-emerald-800">
                          ₹{lot.estimatedPrice?.min?.toLocaleString('en-IN') || '0'} - ₹{lot.estimatedPrice?.max?.toLocaleString('en-IN') || '0'}
                        </p>
                      </div>

                      {/* Current Bid Info */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                        {lot.currentBid && lot.currentBid > 0 ? (
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-bold text-blue-700 uppercase mb-1">Current Bid</p>
                              <p className="text-lg font-bold text-blue-900">₹{lot.currentBid.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="pt-2 border-t border-blue-200">
                              <p className="text-xs font-bold text-rose-700 uppercase mb-1">Next Bid</p>
                              <p className="text-2xl font-black text-rose-700">₹{(lot.currentBid + (lot.bidIncrement || 1000)).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-bold text-blue-700 uppercase mb-2">Opening Bid</p>
                            <p className="text-2xl font-black text-blue-900">₹{(lot.startingBid || lot.estimatedPrice?.min || 0).toLocaleString('en-IN')}</p>
                          </div>
                        )}
                      </div>

                      {/* Bid Input */}
                      <div>
                        <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Your Bid Amount</label>
                        <input
                          type="number"
                          placeholder="Enter your bid"
                          className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm font-semibold text-gray-800 text-lg"
                        />
                      </div>

                      {/* Submit Bid Button */}
                      <button
                        onClick={() => navigate(`/auction/${id}?lot=${lot.lotNumber}`)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-700 hover:via-amber-600 hover:to-amber-700 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <Gavel className="w-5 h-5" />
                        Submit Bid Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bidding Note */}
                <div className="mt-6 pt-6 border-t-2 border-amber-200 text-center">
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl p-4 border-2 border-blue-200 shadow-md inline-block">
                    <p className="text-sm text-blue-800 font-bold flex items-center gap-2 justify-center">
                      <span className="text-blue-600 text-lg">ℹ️</span>
                      You can enter any bid amount greater than or equal to the Next Bid
                    </p>
                  </div>
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
