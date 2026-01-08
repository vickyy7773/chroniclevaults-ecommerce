import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Trophy, Gavel, ArrowLeft, Home } from 'lucide-react';
import api from '../utils/api';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-400 dark:border-amber-600">
          {/* Header with Icon */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white dark:bg-gray-800 rounded-full p-6 shadow-lg">
                <Gavel className="w-16 h-16 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
              Auction Ended
            </h1>
            <p className="text-xl text-amber-100 font-medium">
              Thank you for participating!
            </p>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                The Auction Has Concluded
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Thank you for your participation in{' '}
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {auction?.title || 'this auction'}
                </span>
                . The bidding has now closed and all lots have been finalized.
              </p>
            </div>

            {/* Auction Details Card */}
            {auction && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 mb-8 border-2 border-amber-200 dark:border-amber-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  Auction Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Auction Name</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {auction.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Lots</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {auction.lots?.length || 0} Lots
                    </p>
                  </div>
                  {auction.startTime && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Started On</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(auction.startTime).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {auction.endTime && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ended On</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(auction.endTime).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* What's Next Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-8 border-2 border-blue-200 dark:border-blue-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                What Happens Next?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Results Processing:</span> Our team is finalizing the auction results and verifying all winning bids.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Winner Notification:</span> If you won any lots, you'll receive an email with payment and collection instructions.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Check Your Dashboard:</span> Visit your dashboard to view your bidding history and any won items.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/user-dashboard')}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <Trophy className="w-5 h-5" />
                View My Bids
              </button>
              <button
                onClick={() => navigate('/auctions')}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <Gavel className="w-5 h-5" />
                Browse Auctions
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
            </div>
          </div>

          {/* Footer Message */}
          <div className="bg-gray-50 dark:bg-gray-900 px-8 py-6 text-center border-t-2 border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              We appreciate your participation and look forward to seeing you at our next auction!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              For any queries, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionEnded;
