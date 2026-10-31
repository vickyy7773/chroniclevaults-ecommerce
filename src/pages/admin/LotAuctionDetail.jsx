import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Upload, RefreshCw, X, FileDown, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import lotAuctionService from '../../services/lotAuctionService';

// ── Status helpers ──────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['Draft', 'LotBidding', 'Paused', 'ResultsPending', 'Completed', 'Cancelled'];

const statusColors = {
  Draft: 'bg-gray-100 text-gray-700',
  LotBidding: 'bg-green-100 text-green-700',
  Paused: 'bg-yellow-100 text-yellow-700',
  ResultsPending: 'bg-orange-100 text-orange-700',
  Completed: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const lotStatusColors = {
  Active: 'bg-green-100 text-green-700',
  Sold: 'bg-blue-100 text-blue-700',
  Unsold: 'bg-gray-100 text-gray-600',
  Withdrawn: 'bg-red-100 text-red-700',
};

const StatusBadge = ({ status, colorMap = statusColors }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colorMap[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

// ── Bids Modal ────────────────────────────────────────────────────────────
const BidsModal = ({ lot, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Bids — Lot #{lot.lotNumber}</h2>
          <p className="text-sm text-gray-500">{lot.title}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">
        {(!lot.bids || lot.bids.length === 0) ? (
          <p className="text-gray-400 text-sm text-center py-8">No bids placed yet.</p>
        ) : (
          <div className="space-y-2">
            {[...lot.bids].sort((a, b) => b.amount - a.amount).map((bid, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg px-4 py-3 border ${i === 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-100'}`}>
                <div>
                  <div className="font-medium text-sm text-gray-800">{bid.bidderName || bid.user?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-400">{bid.bidderEmail || bid.user?.email || ''}</div>
                  {bid.isReserve && <span className="inline-block mt-0.5 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Reserve bid</span>}
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${i === 0 ? 'text-orange-600' : 'text-gray-700'}`}>
                    ₹{bid.amount?.toLocaleString()}
                  </div>
                  {bid.maxAmount && (
                    <div className="text-xs text-gray-400">Max: ₹{bid.maxAmount?.toLocaleString()}</div>
                  )}
                  <div className="text-xs text-gray-400">
                    {bid.createdAt ? new Date(bid.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const LotAuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [showBids, setShowBids] = useState(false);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState(null);

  const fetchAuction = async () => {
    setLoading(true);
    try {
      const res = await lotAuctionService.getById(id);
      setAuction(res?.data || res);
    } catch (err) {
      toast.error('Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAuction(); }, [id]);

  const handleExportExcel = () => {
    if (!auction?.lots?.length) { toast.error('No lots to export'); return; }
    const rows = auction.lots.map(lot => {
      // StartPrice = last (highest) bid amount across ALL bids (regular + auto-proxy reserve)
      const activeBids = (lot.bids || []).filter(b => b.amount > 0);
      const startPrice = activeBids.length > 0
        ? Math.max(...activeBids.map(b => b.amount))
        : (lot.startingPrice || '');
      // ReservePrice = reserve bidder's maxBid, but only if it did NOT exceed the final bid
      const reserveBids = (lot.bids || []).filter(b => b.isReserveBid && b.maxBid != null && b.maxBid > 0);
      const topReserveMax = reserveBids.length > 0 ? Math.max(...reserveBids.map(b => b.maxBid)) : null;
      const reservePrice = (topReserveMax != null && topReserveMax > startPrice) ? topReserveMax : '';
      return {
        Title: lot.title || '',
        Description: lot.description || '',
        StartPrice: startPrice,
        ReservePrice: reservePrice,
        LowEstimate: '',
        HighEstimate: lot.estimatedPrice || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 25 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 13 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lots');
    XLSX.writeFile(wb, `${auction.title || 'lot-auction'}-lots.xlsx`);
    toast.success('Excel exported!');
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await lotAuctionService.updateStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      fetchAuction();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openBids = (lot) => { setSelectedLot(lot); setShowBids(true); };

  const handleGenerateInvoices = async () => {
    if (!window.confirm('Generate invoices for all platform winners? This will create one invoice per buyer.')) return;
    setGeneratingInvoices(true);
    try {
      const res = await lotAuctionService.generateInvoices(id);
      const data = res?.data || res;
      setInvoiceResult(data);
      toast.success(`Invoices generated: ${data.created?.length || 0} new, ${data.updated?.length || 0} updated`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate invoices');
    } finally {
      setGeneratingInvoices(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Auction not found</p>
          <button onClick={() => navigate('/admin/lot-auctions')} className="mt-4 text-orange-500 hover:underline text-sm">
            Back to Lot Auctions
          </button>
        </div>
      </div>
    );
  }

  const lots = auction.lots || [];
  const endTimePassed = auction.lotBiddingEndTime && new Date(auction.lotBiddingEndTime) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/lot-auctions')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Lot Auctions
      </button>

      {/* Auction header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-800">{auction.title}</h1>
              <StatusBadge status={auction.status} />
            </div>
            {auction.description && (
              <p className="text-gray-500 text-sm mt-2">{auction.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              {auction.externalPlatformName && (
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Platform:</span>
                  <span>{auction.externalPlatformName}</span>
                  {auction.externalPlatformLink && (
                    <a href={auction.externalPlatformLink} target="_blank" rel="noreferrer" className="text-orange-500 hover:text-orange-700">
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              )}
              {auction.lotBiddingEndTime && (
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Bidding ends:</span>
                  <span className={endTimePassed ? 'text-red-500' : ''}>
                    {new Date(auction.lotBiddingEndTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    {endTimePassed && ' (Ended)'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Lots:</span>
                <span>{lots.length}</span>
              </div>
            </div>
          </div>
          {/* Status changer */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">Change Status</label>
            <select
              value={auction.status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-60"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors justify-center"
            >
              <FileDown size={14} />
              Export Excel
            </button>
            <button
              onClick={() => navigate(`/admin/lot-auctions`, { state: { uploadResults: auction._id } })}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors justify-center"
            >
              <Upload size={14} />
              Upload Results
            </button>
            {auction.status === 'Completed' && (
              <>
                <button
                  onClick={handleGenerateInvoices}
                  disabled={generatingInvoices}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors justify-center"
                >
                  <CheckCircle size={14} />
                  {generatingInvoices ? 'Generating...' : 'Generate Invoices'}
                </button>
                <button
                  onClick={() => navigate(`/admin/auction-invoices?lotAuction=${auction._id}`)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors justify-center"
                >
                  View Invoices
                </button>
              </>
            )}
            <button
              onClick={fetchAuction}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors justify-center"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Invoice generation result */}
      {invoiceResult && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            Invoice Generation Result
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{invoiceResult.created?.length || 0}</div>
              <div className="text-gray-500">New Invoices</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{invoiceResult.updated?.length || 0}</div>
              <div className="text-gray-500">Updated</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{invoiceResult.skipped?.length || 0}</div>
              <div className="text-gray-500">Skipped</div>
            </div>
          </div>
          {invoiceResult.skipped?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Skipped lots (external winners):</p>
              {invoiceResult.skipped.map((s, i) => (
                <div key={i} className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Lot #{s.lotNumber} — {s.reason}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setInvoiceResult(null)}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Results verification table (shown when Completed) */}
      {auction.status === 'Completed' && lots.some(l => l.status === 'Sold') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Results Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs">
                  <th className="pb-2 pr-4">Lot #</th>
                  <th className="pb-2 pr-4">Title</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Hammer Price</th>
                  <th className="pb-2">Winner</th>
                </tr>
              </thead>
              <tbody>
                {[...lots].sort((a, b) => a.lotNumber - b.lotNumber).map(lot => (
                  <tr key={lot.lotNumber} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-orange-500">#{lot.lotNumber}</td>
                    <td className="py-2 pr-4 text-gray-700">{lot.title}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        lot.status === 'Sold' ? 'bg-blue-100 text-blue-700' :
                        lot.status === 'Unsold' ? 'bg-gray-100 text-gray-500' :
                        'bg-gray-100 text-gray-500'
                      }`}>{lot.status || 'Pending'}</span>
                    </td>
                    <td className="py-2 pr-4 font-semibold text-gray-800">
                      {lot.hammerPrice ? `₹${lot.hammerPrice.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2 text-gray-600 text-xs">
                      {lot.isExternalWinner
                        ? <span className="text-amber-600">{lot.winnerName || 'External'} (external)</span>
                        : lot.winner
                          ? <span className="text-green-700">{lot.winner?.name || 'Platform user'}</span>
                          : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lots grid */}
      {lots.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-lg font-medium">No lots added yet</p>
          <p className="text-sm mt-1">Go back to manage lots for this auction</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {lots.map(lot => {
            const bidsCount = lot.bids?.length || 0;
            const topBid = lot.bids?.length
              ? Math.max(...lot.bids.map(b => b.amount || 0))
              : null;
            return (
              <div
                key={lot.lotNumber}
                onClick={() => openBids(lot)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer overflow-hidden group"
              >
                {/* Image placeholder or actual image */}
                {lot.image ? (
                  <img src={lot.image} alt={lot.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-orange-200">#{lot.lotNumber}</span>
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-orange-500">Lot #{lot.lotNumber}</span>
                    <StatusBadge status={lot.status || 'Active'} colorMap={lotStatusColors} />
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2">{lot.title}</h3>
                  <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                    {lot.startingPrice && (
                      <div>Start: <span className="text-gray-700 font-medium">₹{lot.startingPrice?.toLocaleString()}</span></div>
                    )}
                    {topBid && (
                      <div>Top Bid: <span className="text-orange-600 font-semibold">₹{topBid?.toLocaleString()}</span></div>
                    )}
                    {lot.hammerPrice && (
                      <div>Hammer: <span className="text-blue-600 font-semibold">₹{lot.hammerPrice?.toLocaleString()}</span></div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {bidsCount} bid{bidsCount !== 1 ? 's' : ''} · Click to view
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bids Modal */}
      {showBids && selectedLot && (
        <BidsModal lot={selectedLot} onClose={() => { setShowBids(false); setSelectedLot(null); }} />
      )}
    </div>
  );
};

export default LotAuctionDetail;
