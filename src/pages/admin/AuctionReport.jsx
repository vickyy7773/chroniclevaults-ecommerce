import React, { useState, useEffect } from 'react';
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const AuctionReport = () => {
  const [loading, setLoading] = useState(false);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [expandedLots, setExpandedLots] = useState(new Set());

  useEffect(() => {
    fetchAuctions();
  }, []);

  useEffect(() => {
    if (selectedAuctionId) {
      fetchAuctionReport(selectedAuctionId);
    }
  }, [selectedAuctionId]);

  const fetchAuctions = async () => {
    try {
      const response = await api.get('/auctions');
      setAuctions(response.data || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast.error('Failed to fetch auctions');
    }
  };

  const fetchAuctionReport = async (auctionId) => {
    try {
      setLoading(true);
      const response = await api.get(`/auctions/${auctionId}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching auction report:', error);
      toast.error('Failed to fetch auction report');
    } finally {
      setLoading(false);
    }
  };

  const toggleLotExpansion = (lotNumber) => {
    setExpandedLots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lotNumber)) {
        newSet.delete(lotNumber);
      } else {
        newSet.add(lotNumber);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount) => {
    if (amount == null || amount === undefined) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateSummary = () => {
    if (!reportData || !reportData.isLotBidding || !reportData.lots) {
      return {
        totalLots: 0,
        soldLots: 0,
        unsoldLots: 0,
        totalRevenue: 0
      };
    }

    const soldLots = reportData.lots.filter(lot => lot.status === 'Sold');
    const unsoldLots = reportData.lots.filter(lot => lot.status === 'Unsold' || lot.status === 'Ended');
    const totalRevenue = soldLots.reduce((sum, lot) => sum + (lot.currentBid || 0), 0);

    return {
      totalLots: reportData.lots.length,
      soldLots: soldLots.length,
      unsoldLots: unsoldLots.length,
      totalRevenue
    };
  };

  const exportToExcel = () => {
    if (!reportData || !reportData.lots) {
      toast.warning('No data to export');
      return;
    }

    try {
      const excelData = reportData.lots.map(lot => ({
        'Lot Number': lot.lotNumber,
        'Title': lot.title,
        'Starting Price': lot.startingPrice,
        'Reserve Price': lot.reservePrice || 0,
        'Final Price': lot.currentBid || 0,
        'Status': lot.status,
        'Winner': lot.winner?.name || 'N/A',
        'Total Bids': lot.bids?.length || 0
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 10 },
        { wch: 40 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 20 },
        { wch: 12 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Auction Report');

      const fileName = `Auction_Report_${reportData.auctionNumber || reportData._id}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Excel file downloaded: ${fileName}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const summary = calculateSummary();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-accent-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Auction Report
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Detailed auction results and lot-wise breakdown
        </p>
      </div>

      {/* Auction Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Auction
        </label>
        <select
          value={selectedAuctionId}
          onChange={(e) => setSelectedAuctionId(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">-- Select an Auction --</option>
          {auctions.map((auction) => (
            <option key={auction._id} value={auction._id}>
              {auction.title} ({auction.status})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
        </div>
      ) : reportData ? (
        <>
          {/* Auction Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Auction Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Auction ID</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {reportData.auctionNumber || `AUC-${reportData._id.toString().slice(-6).toUpperCase()}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Auction Name</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">{reportData.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {formatDate(reportData.startTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">End Date</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {formatDate(reportData.endTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  reportData.status === 'Active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : reportData.status === 'Upcoming'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {reportData.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {reportData.isLotBidding ? 'Lot Bidding' : 'Regular Auction'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {reportData.isLotBidding && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <p className="text-sm opacity-90 mb-1">Total Lots</p>
                <p className="text-3xl font-bold">{summary.totalLots}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <p className="text-sm opacity-90 mb-1">Sold Lots</p>
                <p className="text-3xl font-bold">{summary.soldLots}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                <p className="text-sm opacity-90 mb-1">Unsold Lots</p>
                <p className="text-3xl font-bold">{summary.unsoldLots}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <p className="text-sm opacity-90 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
              </div>
            </div>
          )}

          {/* Download Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Excel
            </button>
            {/* PDF download will be added later */}
          </div>

          {/* Lot-wise Results Table */}
          {reportData.isLotBidding && reportData.lots && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Lot-wise Results
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Lot #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Title
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Start Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Reserve Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Final Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Winner
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Bids
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.lots.map((lot) => {
                      const isExpanded = expandedLots.has(lot.lotNumber);
                      const hasBids = lot.bids && lot.bids.length > 0;

                      return (
                        <React.Fragment key={lot.lotNumber}>
                          <tr
                            onClick={() => hasBids && toggleLotExpansion(lot.lotNumber)}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${hasBids ? 'cursor-pointer' : ''}`}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {hasBids && (
                                  isExpanded ?
                                    <ChevronUp className="w-4 h-4 text-gray-500" /> :
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  Lot {lot.lotNumber}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                              {lot.title}
                            </td>
                            <td className="px-4 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                              {formatCurrency(lot.startingPrice)}
                            </td>
                            <td className="px-4 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                              {formatCurrency(lot.reservePrice)}
                            </td>
                            <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(lot.currentBid)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                              {lot.winner?.name || '-'}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                lot.status === 'Sold'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : lot.status === 'Unsold'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {lot.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-center text-gray-600 dark:text-gray-400">
                              {lot.bids?.length || 0}
                            </td>
                          </tr>

                          {/* Expandable Bid History */}
                          {isExpanded && hasBids && (
                            <tr>
                              <td colSpan="8" className="px-4 py-4 bg-gray-50 dark:bg-gray-900">
                                <div className="ml-6">
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Bid History ({lot.bids.length} bids)
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                      <thead className="bg-gray-100 dark:bg-gray-800">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Time
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Bidder
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Action
                                          </th>
                                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Amount
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {lot.bids.map((bid, index) => (
                                          <tr key={index}>
                                            <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                                              {formatDate(bid.timestamp)}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                              {bid.user?.name || 'Anonymous'}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                                              {bid.isAutoBid ? 'Auto Bid' : bid.isSystemBid ? 'System Bid' : 'Manual Bid'}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                                              {formatCurrency(bid.amount)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select an auction to view the report</p>
        </div>
      )}
    </div>
  );
};

export default AuctionReport;
