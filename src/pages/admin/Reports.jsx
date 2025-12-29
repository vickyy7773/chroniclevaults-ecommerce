import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [filters, setFilters] = useState({
    auctionId: '',
    startDate: '',
    endDate: ''
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
    setFilters({ auctionId: '', startDate: '', endDate: '' });
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
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-accent-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sales Reports
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                {formatCurrency(reportData.summary.totalRevenue)}
              </p>
              <p className="text-sm opacity-80">
                Avg per item: {formatCurrency(Math.round(reportData.summary.averageRevenuePerSoldItem))}
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
                {reportData.summary.totalSoldItems.toLocaleString()}
              </p>
              <p className="text-sm opacity-80">
                Success Rate: {reportData.summary.successRate}%
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
                {reportData.summary.totalUnsoldItems.toLocaleString()}
              </p>
              <p className="text-sm opacity-80">
                Total Auctions: {reportData.summary.totalAuctions}
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
                  {reportData.auctionWise.length > 0 ? (
                    reportData.auctionWise.map((auction) => (
                      <tr
                        key={auction.auctionId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {auction.auctionNumber}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {auction.title}
                            </p>
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
                    ))
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
