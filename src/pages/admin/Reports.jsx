import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, CheckCircle, XCircle, ChevronDown, ChevronUp, Download } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [viewType, setViewType] = useState('total'); // 'total', 'sold', 'unsold'
  const [expandedAuctions, setExpandedAuctions] = useState(new Set());
  const [filters, setFilters] = useState({
    auctionId: '',
    startDate: '',
    endDate: '',
    vendorId: ''
  });

  useEffect(() => {
    fetchReports();
  }, [filters]);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await api.get('/auctions');
      setAuctions(response.data || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.auctionId) params.append('auctionId', filters.auctionId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/auctions/admin/sales-reports?${params.toString()}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ auctionId: '', startDate: '', endDate: '', vendorId: '' });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount == null || amount === undefined) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Get unique vendor IDs from all lots
  const getUniqueVendorIds = () => {
    if (!reportData) return [];

    const vendorIds = new Set();
    reportData.auctionWise.forEach(auction => {
      if (auction.lots && auction.lots.length > 0) {
        auction.lots.forEach(lot => {
          if (lot.vendorId) {
            vendorIds.add(lot.vendorId);
          }
        });
      }
    });

    return Array.from(vendorIds).sort();
  };

  // Filter auction data based on view type and vendor
  const getFilteredData = () => {
    if (!reportData) return { auctionWise: [], summary: {} };

    const filteredAuctions = reportData.auctionWise.filter(auction => {
      // Filter by vendor ID (check if any lot has this vendorId)
      if (filters.vendorId) {
        const hasVendor = auction.lots && auction.lots.some(lot => lot.vendorId === filters.vendorId);
        if (!hasVendor) return false;
      }

      // Filter by view type
      if (viewType === 'sold') {
        return auction.soldItems > 0;
      } else if (viewType === 'unsold') {
        return auction.unsoldItems > 0;
      }
      return true; // 'total' shows all
    });

    // Recalculate summary based on filtered auctions
    let totalRevenue = 0;
    let totalSoldItems = 0;
    let totalUnsoldItems = 0;

    filteredAuctions.forEach(auction => {
      totalRevenue += auction.revenue;
      totalSoldItems += auction.soldItems;
      totalUnsoldItems += auction.unsoldItems;
    });

    const summary = {
      totalRevenue,
      totalSoldItems,
      totalUnsoldItems,
      totalItems: totalSoldItems + totalUnsoldItems,
      totalAuctions: filteredAuctions.length,
      averageRevenuePerSoldItem: totalSoldItems > 0 ? totalRevenue / totalSoldItems : 0,
      successRate: (totalSoldItems + totalUnsoldItems) > 0
        ? ((totalSoldItems / (totalSoldItems + totalUnsoldItems)) * 100).toFixed(2)
        : 0
    };

    return { auctionWise: filteredAuctions, summary };
  };

  const filteredData = getFilteredData();

  // Toggle auction expansion
  const toggleAuctionExpansion = (auctionId) => {
    setExpandedAuctions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(auctionId)) {
        newSet.delete(auctionId);
      } else {
        newSet.add(auctionId);
      }
      return newSet;
    });
  };

  // Export to Excel
  const exportToExcel = (type) => {
    try {
      // Get the data based on type
      let dataToExport = [];
      let fileName = '';

      if (type === 'total') {
        dataToExport = filteredData.auctionWise;
        fileName = 'Sales_Report_Total.xlsx';
      } else if (type === 'sold') {
        dataToExport = filteredData.auctionWise.filter(auction => auction.soldItems > 0);
        fileName = 'Sales_Report_Sold.xlsx';
      } else if (type === 'unsold') {
        dataToExport = filteredData.auctionWise.filter(auction => auction.unsoldItems > 0);
        fileName = 'Sales_Report_Unsold.xlsx';
      }

      if (dataToExport.length === 0) {
        toast.warning('No data to export');
        return;
      }

      // Prepare data for Excel
      const excelData = dataToExport.map(auction => ({
        'Auction Number': auction.auctionNumber,
        'Title': auction.title,
        'Type': auction.isLotBidding ? `Lot Bidding (${auction.totalLots})` : 'Regular',
        'Status': auction.status,
        'Revenue (₹)': auction.revenue,
        'Sold Items': auction.soldItems,
        'Unsold Items': auction.unsoldItems,
        'Total Bids': auction.totalBids,
        'Date': formatDate(auction.createdAt)
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Auction Number
        { wch: 40 }, // Title
        { wch: 20 }, // Type
        { wch: 12 }, // Status
        { wch: 15 }, // Revenue
        { wch: 12 }, // Sold Items
        { wch: 12 }, // Unsold Items
        { wch: 12 }, // Total Bids
        { wch: 15 }  // Date
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');

      // Download file
      XLSX.writeFile(wb, fileName);
      toast.success(`Excel file downloaded: ${fileName}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Export lot details to Excel
  const exportLotsToExcel = (auction, type) => {
    try {
      if (!auction.lots || auction.lots.length === 0) {
        toast.warning('No lot data to export');
        return;
      }

      // Filter lots based on type and vendor
      let lotsToExport = [];
      let fileName = '';

      // First filter by vendor if selected
      let vendorFilteredLots = auction.lots;
      if (filters.vendorId) {
        vendorFilteredLots = auction.lots.filter(lot => lot.vendorId === filters.vendorId);
      }

      // Then filter by type
      if (type === 'total') {
        lotsToExport = vendorFilteredLots;
        fileName = `${auction.auctionNumber}_Lots_Total${filters.vendorId ? '_' + filters.vendorId : ''}.xlsx`;
      } else if (type === 'sold') {
        lotsToExport = vendorFilteredLots.filter(lot => lot.status === 'Sold');
        fileName = `${auction.auctionNumber}_Lots_Sold${filters.vendorId ? '_' + filters.vendorId : ''}.xlsx`;
      } else if (type === 'unsold') {
        lotsToExport = vendorFilteredLots.filter(lot => lot.status === 'Unsold' || lot.status === 'Ended');
        fileName = `${auction.auctionNumber}_Lots_Unsold${filters.vendorId ? '_' + filters.vendorId : ''}.xlsx`;
      }

      if (lotsToExport.length === 0) {
        toast.warning(`No ${type} lots to export`);
        return;
      }

      // Prepare data for Excel
      const excelData = lotsToExport.map(lot => ({
        'Auction': auction.auctionNumber,
        'Vendor ID': lot.vendorId || 'N/A',
        'Lot Number': lot.lotNumber,
        'Title': lot.title,
        'Status': lot.status,
        'Opening Bid (₹)': lot.openingBid || 0,
        'Final Price (₹)': lot.currentBid || 0,
        'Total Bids': lot.totalBids || 0
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Auction
        { wch: 25 }, // Vendor
        { wch: 12 }, // Lot Number
        { wch: 40 }, // Title
        { wch: 12 }, // Status
        { wch: 15 }, // Opening Bid
        { wch: 15 }, // Final Price
        { wch: 12 }  // Total Bids
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lot Details');

      // Download file
      XLSX.writeFile(wb, fileName);
      toast.success(`Excel file downloaded: ${fileName}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export lot data');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-accent-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sales Dashboard
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive sales analytics and auction performance metrics
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filter Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Auction Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auction
            </label>
            <select
              value={filters.auctionId}
              onChange={(e) => handleFilterChange('auctionId', e.target.value)}
              className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Auctions</option>
              {auctions.map((auction) => (
                <option key={auction._id} value={auction._id}>
                  {auction.title}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor ID Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vendor ID
            </label>
            <select
              value={filters.vendorId}
              onChange={(e) => handleFilterChange('vendorId', e.target.value)}
              className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Vendors</option>
              {getUniqueVendorIds().map((vendorId) => (
                <option key={vendorId} value={vendorId}>
                  {vendorId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* View Type Tabs with Download Buttons */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          {/* View Type Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewType('total')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                viewType === 'total'
                  ? 'bg-accent-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Total View
            </button>
            <button
              onClick={() => setViewType('sold')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                viewType === 'sold'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Sold Items
            </button>
            <button
              onClick={() => setViewType('unsold')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                viewType === 'unsold'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Unsold Items
            </button>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => exportToExcel('total')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Total
            </button>
            <button
              onClick={() => exportToExcel('sold')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Sold
            </button>
            <button
              onClick={() => exportToExcel('unsold')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Unsold
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
        </div>
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-10 h-10 opacity-80" />
                <TrendingUp className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-sm font-medium opacity-90 mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold mb-2">
                {formatCurrency(filteredData.summary.totalRevenue)}
              </p>
              <p className="text-sm opacity-80">
                Avg per item: {formatCurrency(Math.round(filteredData.summary.averageRevenuePerSoldItem))}
              </p>
            </div>

            {/* Sold Items */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-10 h-10 opacity-80" />
                <Package className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-sm font-medium opacity-90 mb-1">Sold Items</h3>
              <p className="text-3xl font-bold mb-2">
                {filteredData.summary.totalSoldItems.toLocaleString()}
              </p>
              <p className="text-sm opacity-80">
                Success Rate: {filteredData.summary.successRate}%
              </p>
            </div>

            {/* Unsold Items */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <XCircle className="w-10 h-10 opacity-80" />
                <Package className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-sm font-medium opacity-90 mb-1">Unsold Items</h3>
              <p className="text-3xl font-bold mb-2">
                {filteredData.summary.totalUnsoldItems.toLocaleString()}
              </p>
              <p className="text-sm opacity-80">
                Total Auctions: {filteredData.summary.totalAuctions}
              </p>
            </div>
          </div>

          {/* Auction-wise Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Auction-wise Sales Breakdown
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Detailed revenue and performance metrics for each auction
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Auction
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sold
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unsold
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Bids
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.auctionWise.length > 0 ? (
                    filteredData.auctionWise.map((auction) => {
                      const isExpanded = expandedAuctions.has(auction.auctionId);
                      const hasLots = auction.isLotBidding && auction.lots && auction.lots.length > 0;

                      return (
                        <React.Fragment key={auction.auctionId}>
                          <tr
                            onClick={() => hasLots && toggleAuctionExpansion(auction.auctionId)}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              hasLots ? 'cursor-pointer' : ''
                            }`}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {hasLots && (
                                  isExpanded ?
                                    <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> :
                                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {auction.auctionNumber}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                    {auction.title}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                auction.isLotBidding
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}>
                                {auction.isLotBidding ? `Lot Bidding (${auction.totalLots})` : 'Regular'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                auction.status === 'Active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : auction.status === 'Upcoming'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {auction.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatCurrency(auction.revenue)}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-semibold">
                                {auction.soldItems}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-sm font-semibold">
                                {auction.unsoldItems}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {auction.totalBids}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(auction.createdAt)}
                              </p>
                            </td>
                          </tr>

                          {/* Expandable Lot Details */}
                          {isExpanded && hasLots && (() => {
                            // Filter lots by vendor if vendor filter is active
                            const displayLots = filters.vendorId
                              ? auction.lots.filter(lot => lot.vendorId === filters.vendorId)
                              : auction.lots;

                            return (
                            <tr>
                              <td colSpan="8" className="px-4 py-4 bg-gray-50 dark:bg-gray-900">
                                <div className="ml-6 space-y-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                      Lot Details ({displayLots.length} lots{filters.vendorId ? ` - Vendor: ${filters.vendorId}` : ''})
                                    </h4>

                                    {/* Lot Download Buttons */}
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          exportLotsToExcel(auction, 'total');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Total
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          exportLotsToExcel(auction, 'sold');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Sold
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          exportLotsToExcel(auction, 'unsold');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Unsold
                                      </button>
                                    </div>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                      <thead className="bg-gray-100 dark:bg-gray-800">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Lot #
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Title
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Status
                                          </th>
                                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Opening Bid
                                          </th>
                                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Final Price
                                          </th>
                                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                            Bids
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {displayLots.map((lot) => (
                                          <tr key={lot.lotNumber} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                                              Lot {lot.lotNumber}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                              {lot.title}
                                            </td>
                                            <td className="px-3 py-2">
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
                                            <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                                              {formatCurrency(lot.openingBid)}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900 dark:text-white">
                                              {lot.currentBid > 0 ? formatCurrency(lot.currentBid) : '-'}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-center text-gray-600 dark:text-gray-400">
                                              {lot.totalBids}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            );
                          })()}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No auction data available for the selected period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
    </div>
  );
};

export default Reports;
