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
              <div key={lot._id || index} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-accent-300 transition-colors shadow-md">
                {/* Lot Header */}
                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 font-medium">Lot No.{lot.lotNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-bold text-red-700">{auction.auctionCode || 'AUC50'}</p>
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm font-bold text-red-700">{lot.category || 'Ancient India'}</p>
                  </div>
                  <div className="col-span-4 text-right">
                    <p className="text-sm font-bold text-gray-900">{lot.material || 'Silver'}</p>
                  </div>
                </div>

                {/* Lot Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Image */}
                  <div className="md:col-span-1">
                    {lot.image ? (
                      <img
                        src={lot.image}
                        alt={lot.title}
                        className="w-full h-48 object-contain bg-gray-50 rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <p className="text-gray-400 text-sm">No Image Available</p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-1">
                    <div className="text-sm text-gray-700 space-y-2">
                      <p className="font-medium">{lot.title}</p>
                      <p className="text-gray-600 leading-relaxed">
                        {lot.description || 'No description available'}
                      </p>
                      {lot.condition && (
                        <p className="italic text-gray-500">{lot.condition}</p>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Bidding */}
                  <div className="md:col-span-1">
                    <div className="space-y-4">
                      {/* Estimated Price */}
                      <div>
                        <p className="text-sm font-bold text-red-700 mb-1">Estimated Price :</p>
                        <p className="text-base font-bold text-green-700">
                          Rs. {lot.estimatedPrice?.min?.toLocaleString('en-IN') || '0'}-{lot.estimatedPrice?.max?.toLocaleString('en-IN') || '0'}
                        </p>
                      </div>

                      {/* Current Bid Info */}
                      <div>
                        {lot.currentBid && lot.currentBid > 0 ? (
                          <>
                            <p className="text-sm font-bold text-green-700 mb-1">Current Bid :</p>
                            <p className="text-base font-bold text-gray-900">Rs. {lot.currentBid.toLocaleString('en-IN')}</p>
                            <p className="text-sm font-bold text-red-700 mt-2">Next Bid :</p>
                            <p className="text-base font-bold text-red-700">Rs. {(lot.currentBid + (lot.bidIncrement || 1000)).toLocaleString('en-IN')}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-green-700 mb-1">Opening Bid :</p>
                            <p className="text-base font-bold text-gray-900">Rs. {(lot.startingBid || lot.estimatedPrice?.min || 0).toLocaleString('en-IN')}</p>
                          </>
                        )}
                      </div>

                      {/* Bid Input */}
                      <div>
                        <input
                          type="number"
                          placeholder="Enter bid amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        />
                      </div>

                      {/* Submit Bid Button */}
                      <button
                        onClick={() => navigate(`/auction/${id}?lot=${lot.lotNumber}`)}
                        className="w-full px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors font-medium"
                      >
                        Submit Bid
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lot Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-4">
                  <button
                    onClick={() => navigate(`/auction/${id}?lot=${lot.lotNumber}`)}
                    className="text-red-700 hover:text-red-800 font-medium text-sm"
                  >
                    View Lot »
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    className="text-red-700 hover:text-red-800 font-medium text-sm"
                  >
                    Add To Watch List »
                  </button>
                </div>

                {/* Bidding Note */}
                <div className="mt-3 text-center">
                  <p className="text-sm text-blue-600 font-medium">
                    ** You can enter any bid amount more than or equal to the Next Bid **
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
