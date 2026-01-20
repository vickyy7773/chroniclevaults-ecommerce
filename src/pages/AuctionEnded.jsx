import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Trophy, Gavel, Home, Calendar, Package } from 'lucide-react';
import api from '../utils/api';
import logo from '../assets/new logo.png';

const AuctionEnded = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      try {
        const response = await api.get(`/auctions/${id}`);
        setAuction(response.data);
      } catch (error) {
        console.error('Error fetching auction:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAuctionDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Chronicle Vaults"
            className="h-16 mx-auto mb-6"
          />
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-full p-5 shadow-lg">
                <Gavel className="w-12 h-12 text-amber-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Auction Ended
            </h1>
            <p className="text-lg text-amber-50">
              Thank you for participating!
            </p>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10">
            {/* Success Message */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                The Auction Has Concluded
              </h2>
              <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Thank you for your participation in{' '}
                <span className="font-semibold text-amber-600">
                  {auction?.title || 'this auction'}
                </span>
                . The bidding has now closed and all lots have been finalized.
              </p>
            </div>

            {/* Auction Details Card */}
            {auction && (
              <div className="bg-amber-50 rounded-xl p-6 mb-8 border border-amber-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Auction Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Auction Name</p>
                      <p className="text-base font-semibold text-gray-800">
                        {auction.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Total Lots</p>
                      <p className="text-base font-semibold text-gray-800">
                        {auction.lots?.length || 0} Lots
                      </p>
                    </div>
                  </div>
                  {auction.startTime && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Started On</p>
                        <p className="text-base font-semibold text-gray-800">
                          {new Date(auction.startTime).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {auction.endTime && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Ended On</p>
                        <p className="text-base font-semibold text-gray-800">
                          {new Date(auction.endTime).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* What's Next Section */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                What Happens Next?
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-gray-700 leading-relaxed">
                      <span className="font-semibold">Results Processing:</span> Our team is finalizing the auction results and verifying all winning bids.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-gray-700 leading-relaxed">
                      <span className="font-semibold">Winner Notification:</span> If you won any lots, you'll receive an email with payment and collection instructions.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-gray-700 leading-relaxed">
                      <span className="font-semibold">Check Your Dashboard:</span> Visit your dashboard to view your bidding history and any won items.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/my-bidding')}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <Trophy className="w-5 h-5" />
                View My Bids
              </button>
              <button
                onClick={() => navigate('/auctions')}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <Gavel className="w-5 h-5" />
                Browse Auctions
              </button>
              <button
                onClick={() => navigate('/auctions')}
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
            </div>
          </div>

          {/* Footer Message */}
          <div className="bg-gray-50 px-8 py-6 text-center border-t border-gray-200">
            <p className="text-gray-600 font-medium">
              We appreciate your participation and look forward to seeing you at our next auction!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              For any queries, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionEnded;
