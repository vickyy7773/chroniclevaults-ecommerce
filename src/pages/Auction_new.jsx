import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Gavel, Clock, TrendingUp, Users, AlertCircle, CheckCircle, History,
  Coins, User, Hash, Timer, Award, Shield, Package, ArrowLeft, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { io } from 'socket.io-client';

const AuctionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [user, setUser] = useState(null);
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [goingWarning, setGoingWarning] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [nextWarningTime, setNextWarningTime] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [selectedLotIndex, setSelectedLotIndex] = useState(null);
  const [showLotsSidebar, setShowLotsSidebar] = useState(false);

  // ... (keep all existing useEffect hooks and functions)
  // Reuse all the logic from the original file

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Compact Header with Back Button */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between">
          <button
            onClick={() => navigate('/auctions')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {user && user.isAuctionVerified && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-white font-medium">{user.name}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-900/30 rounded-lg">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-amber-100 font-bold">₹{user.auctionCoins?.toLocaleString() || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Single Screen Layout - Fixed Height */}
      <div className="max-w-7xl mx-auto px-3 py-3">
        <div className="grid grid-cols-12 gap-3" style={{ height: 'calc(100vh - 100px)' }}>

          {/* Left: Product Image & Info - 4 columns */}
          <div className="col-span-4 flex flex-col gap-3">
            {/* Image */}
            <div className="bg-gray-800 rounded-lg overflow-hidden flex-shrink-0" style={{ height: '45%' }}>
              <div className="relative w-full h-full bg-gray-900">
                {auctionImages?.length > 0 ? (
                  <img
                    src={auctionImages[selectedImage]}
                    alt={auction?.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gavel className="w-16 h-16 text-gray-600" />
                  </div>
                )}

                {/* Status Badge */}
                {auction && (
                  <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold ${
                    auction.status === 'Active' ? 'bg-green-500 text-white' :
                    auction.status === 'Upcoming' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {auction.status === 'Active' && <span className="inline-block w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></span>}
                    {auction.status}
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-gray-800 rounded-lg p-4 flex-1 overflow-y-auto">
              {auction && displayLot && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs font-bold">
                      Lot {displayLot.lotNumber}/{auction.totalLots}
                    </span>
                    {displayLot.status === 'Active' && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs font-bold">
                        🔴 LIVE
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{displayLot.title || auction.title}</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">{displayLot.description || auction.description}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="bg-gray-700/50 rounded p-2">
                      <p className="text-xs text-gray-400">Start Time</p>
                      <p className="text-xs text-white font-semibold">{formatDate(auction.startTime)}</p>
                    </div>
                    <div className="bg-gray-700/50 rounded p-2">
                      <p className="text-xs text-gray-400">End Time</p>
                      <p className="text-xs text-white font-semibold">{formatDate(auction.endTime)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Middle: Bid History - 4 columns */}
          <div className="col-span-4 bg-gray-800 rounded-lg flex flex-col overflow-hidden">
            <div className="bg-gray-700/50 px-4 py-2 flex items-center justify-between border-b border-gray-600 flex-shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                Bid History
              </h3>
              <span className="text-xs text-gray-400">{auction?.bids?.length || 0} bids</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {auction?.bids?.length === 0 ? (
                <div className="text-center py-12">
                  <Gavel className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No bids yet</p>
                </div>
              ) : (
                [...(auction?.bids || [])].reverse().map((bid, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2.5 rounded-lg ${
                      index === 0
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                      }`}>
                        {index === 0 ? <Award className="w-4 h-4" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Bidder #{auction.bids.length - index}
                          {index === 0 && (
                            <span className="ml-1.5 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded">Leading</span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(bid.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${index === 0 ? 'text-green-400' : 'text-white'}`}>
                      ₹{bid.amount.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Bidding Panel - 4 columns */}
          <div className="col-span-4 bg-gray-800 rounded-lg flex flex-col overflow-hidden">
            {/* Time Remaining */}
            {auction?.status === 'Active' && (
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-3 flex-shrink-0">
                <p className="text-white/80 text-xs uppercase tracking-wide">Time Remaining</p>
                <p className="text-2xl font-bold text-white font-mono">{timeRemaining}</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Current Bid */}
              <div className="text-center py-4 bg-gray-700/30 rounded-lg">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current Bid</p>
                <p className="text-4xl font-black text-amber-400">
                  ₹{displayCurrentBid?.toLocaleString() || 0}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-700/50 rounded p-2">
                  <p className="text-[10px] text-gray-400 uppercase">Starting Price</p>
                  <p className="font-bold text-white text-sm">₹{displayStartingPrice?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-gray-700/50 rounded p-2">
                  <p className="text-[10px] text-gray-400 uppercase">Total Bids</p>
                  <p className="font-bold text-white text-sm">{auction?.totalBids || 0}</p>
                </div>
                <div className="bg-green-500/10 rounded p-2 border border-green-500/30">
                  <p className="text-[10px] text-green-400 uppercase">Next Min Bid</p>
                  <p className="font-bold text-green-300 text-sm">₹{minBid?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-gray-700/50 rounded p-2">
                  <p className="text-[10px] text-gray-400 uppercase">Increment</p>
                  <p className="font-bold text-white text-sm">₹{currentIncrement?.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* User Status */}
              {user && getUserBidCount && getUserBidCount() > 0 && auction?.status === 'Active' && (
                isUserWinning && isUserWinning() ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2.5">
                    <p className="text-green-300 font-bold text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      You are winning!
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
                    <p className="text-red-300 font-bold text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      You are outbid!
                    </p>
                  </div>
                )
              )}

              {/* Bid Form */}
              {auction?.status === 'Active' ? (
                user && user.isAuctionVerified ? (
                  <form onSubmit={handlePlaceBid} className="space-y-2">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={minBid}
                      step="50"
                      required
                      className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg font-bold text-center text-white placeholder-gray-500"
                      placeholder={minBid?.toString() || '0'}
                    />
                    <p className="text-[10px] text-gray-400 text-center">
                      Min: ₹{minBid?.toLocaleString() || 0}
                    </p>
                    <button
                      type="submit"
                      disabled={submittingBid}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      {submittingBid ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Placing...</span>
                        </>
                      ) : (
                        <>
                          <Gavel className="w-4 h-4" />
                          <span>Place Bid</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <Shield className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm mb-3">
                      {user ? 'Register to bid' : 'Login to bid'}
                    </p>
                    <button
                      onClick={() => navigate(user ? '/auction-registration' : '/authentication')}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors text-sm"
                    >
                      {user ? 'Register' : 'Login'}
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-4 bg-gray-700/30 rounded-lg">
                  <Clock className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-300 font-bold text-sm">
                    {auction?.status === 'Upcoming' ? 'Not Started' : 'Auction Ended'}
                  </p>
                </div>
              )}

              {/* Lots Button */}
              {auction?.isLotBidding && auction?.lots?.length > 0 && (
                <button
                  onClick={() => setShowLotsSidebar(true)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Package className="w-4 h-4" />
                  View All Lots ({auction.lots.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lots Sidebar Modal */}
      {showLotsSidebar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={() => setShowLotsSidebar(false)}>
          <div className="bg-gray-800 h-full w-96 overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                All Lots ({auction.lots.length})
              </h3>
              <button
                onClick={() => setShowLotsSidebar(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {auction.lots.map((lot, index) => (
                <div
                  key={index}
                  onClick={() => {
                    handleLotClick(index);
                    setShowLotsSidebar(false);
                  }}
                  className={`rounded-lg p-3 cursor-pointer transition-all ${
                    selectedLotIndex === index
                      ? 'bg-amber-500/20 border-2 border-amber-500'
                      : lot.status === 'Active'
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-gray-700/50 border border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Lot Image */}
                    <div className="w-16 h-16 rounded bg-gray-900 flex-shrink-0 overflow-hidden">
                      {lot.image ? (
                        <img
                          src={lot.image}
                          alt={lot.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Lot Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          lot.status === 'Active' ? 'bg-green-500 text-white' :
                          lot.status === 'Sold' ? 'bg-emerald-500 text-white' :
                          lot.status === 'Unsold' ? 'bg-red-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          Lot {lot.lotNumber}
                        </span>
                        <span className="text-xs font-semibold text-gray-300">
                          {lot.status === 'Active' && '🔴 LIVE'}
                          {lot.status === 'Sold' && '✅ SOLD'}
                          {lot.status === 'Unsold' && '❌ UNSOLD'}
                          {lot.status === 'Upcoming' && '⏳ UPCOMING'}
                        </span>
                      </div>

                      <h4 className="font-semibold text-sm text-white truncate mb-1">
                        {lot.title}
                      </h4>

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Starting:</span>
                          <span className="font-semibold text-gray-300">₹{lot.startingPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">
                            {lot.status === 'Active' || lot.status === 'Upcoming' ? 'Current:' : 'Final:'}
                          </span>
                          <span className={`font-bold ${
                            lot.status === 'Sold' ? 'text-emerald-400' :
                            lot.status === 'Unsold' ? 'text-red-400' :
                            'text-white'
                          }`}>
                            ₹{lot.currentBid.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Bids:</span>
                          <span className="font-bold text-white">{lot.bids?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="mt-4 bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Progress</span>
                <span className="font-bold text-white">
                  Lot {auction.lotNumber || 1} of {auction.totalLots}
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all"
                  style={{ width: `${((auction.lotNumber || 1) / auction.totalLots) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionPage;
