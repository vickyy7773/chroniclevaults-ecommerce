import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, Calendar, Award, DollarSign, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/index';

const PriceRealization = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all ended lot bidding auctions
  useEffect(() => {
    fetchEndedAuctions();
  }, []);

  // Fetch specific auction if auctionId is provided
  useEffect(() => {
    if (auctionId && auctions.length > 0) {
      const auction = auctions.find(a => a._id === auctionId);
      if (auction) {
        setSelectedAuction(auction);
      }
    }
  }, [auctionId, auctions]);

  const fetchEndedAuctions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auctions/price-realization');
      setAuctions(response.data.auctions || []);
    } catch (error) {
      console.error('Error fetching price realization data:', error);
      toast.error('Failed to load auction results');
    } finally {
      setLoading(false);
    }
  };

  const handleAuctionSelect = (auction) => {
    setSelectedAuction(auction);
    navigate(`/price-realization/${auction._id}`);
  };

  const handleBackToList = () => {
    setSelectedAuction(null);
    navigate('/price-realization');
  };

  // Calculate statistics for an auction
  const calculateStats = (auction) => {
    if (!auction || !auction.lots) return null;

    const soldLots = auction.lots.filter(lot => lot.status === 'Sold');
    const totalLots = auction.lots.length;
    const totalHammerPrice = soldLots.reduce((sum, lot) => sum + (lot.currentBid || 0), 0);
    const totalEstimate = auction.lots.reduce((sum, lot) => sum + (lot.startingPrice || 0), 0);
    const percentSold = totalLots > 0 ? ((soldLots.length / totalLots) * 100).toFixed(2) : 0;

    return {
      totalHammerPrice,
      totalEstimate,
      percentSold,
      soldCount: soldLots.length,
      totalCount: totalLots
    };
  };

  // Format price in Indian format
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Get auction number from ID
  const getAuctionNumber = (id) => {
    return `AUC-${id.toString().slice(-6).toUpperCase()}`;
  };

  // Filter auctions based on search term
  const filteredAuctions = auctions.filter(auction => {
    const auctionNumber = getAuctionNumber(auction._id);
    const searchLower = searchTerm.toLowerCase();
    return (
      auctionNumber.toLowerCase().includes(searchLower) ||
      auction.title?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading auction results...</p>
        </div>
      </div>
    );
  }

  // Show list of auctions
  if (!selectedAuction) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-amber-600" />
              <h1 className="text-3xl font-bold text-gray-900">Price Realization</h1>
            </div>
            <p className="text-gray-600">
              View realized prices for completed auctions. These prices show the final hammer price for each lot,
              without buyer's premium.
            </p>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by auction number or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Auctions List */}
          {filteredAuctions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Auction Results Found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No auctions match your search.' : 'No completed auctions available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuctions.map((auction) => {
                const stats = calculateStats(auction);
                return (
                  <div
                    key={auction._id}
                    onClick={() => handleAuctionSelect(auction)}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4">
                      <h3 className="text-white font-bold text-lg">
                        {getAuctionNumber(auction._id)}
                      </h3>
                      <p className="text-amber-100 text-sm">{auction.title}</p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center text-gray-600 mb-3">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          {new Date(auction.endTime || auction.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {stats && (
                        <div className="space-y-2 border-t pt-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Lots:</span>
                            <span className="font-semibold text-gray-900">{stats.totalCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sold:</span>
                            <span className="font-semibold text-green-600">
                              {stats.soldCount} ({stats.percentSold}%)
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Hammer Price:</span>
                            <span className="font-semibold text-amber-600">
                              ₹{formatPrice(stats.totalHammerPrice)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show detailed auction results
  const stats = calculateStats(selectedAuction);
  const auctionNumber = getAuctionNumber(selectedAuction._id);
  const auctionDate = new Date(selectedAuction.endTime || selectedAuction.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="mb-6 flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Auction List
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Price Realisation of Auction No: {auctionNumber}
              </h1>
              <p className="text-gray-600">Auction Date: {auctionDate}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-600">{auctionNumber}</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              These realized prices shows the final price recorded for each listed lot, which are without the Buyer's premium.
              In some cases the final price may be a bid or a reserve price placed by the consignor and therefore some lots
              may remain unsold at the stated price.
            </p>
          </div>

          {stats && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 font-semibold">
                <DollarSign className="w-5 h-5" />
                <span>
                  Hammer Price of ₹{formatPrice(stats.totalHammerPrice)} on a Pre-sale estimate of ₹{formatPrice(stats.totalEstimate)};
                  Percent Sold - {stats.percentSold}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Lots Grid */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {selectedAuction.lots && selectedAuction.lots.map((lot) => (
              <div
                key={lot._id}
                className={`p-3 rounded-lg border-2 ${
                  lot.status === 'Sold'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-gray-900 mb-1">{lot.lotNumber}</div>
                  <div className={`text-sm font-medium ${
                    lot.status === 'Sold' ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {lot.status === 'Sold' ? `${formatPrice(lot.currentBid)}` : '-----------'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceRealization;
