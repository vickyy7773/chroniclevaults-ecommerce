import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const MyBidding = () => {
  const [selectedAuction, setSelectedAuction] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Bids');
  const [auctions, setAuctions] = useState([]);
  const [biddingData, setBiddingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchAuctions();
    fetchBiddingData();
  }, []);

  useEffect(() => {
    filterData();
  }, [selectedAuction, selectedStatus, biddingData]);

  const fetchAuctions = async () => {
    try {
      const response = await api.get('/auctions');
      setAuctions(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedAuction(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
      // Mock data
      setAuctions([
        { _id: '1', title: 'AUC47', auctionNumber: 'AUC47' },
        { _id: '2', title: 'AUC46', auctionNumber: 'AUC46' }
      ]);
      setSelectedAuction('1');
    }
  };

  const fetchBiddingData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/my-bidding');
      setBiddingData(response.data || []);
    } catch (error) {
      console.error('Error fetching bidding data:', error);
      // Mock data
      setBiddingData([
        {
          srNo: 1,
          lotNo: 478,
          myBidAmount: 11000,
          maxBidAmount: 12000,
          bidDateTime: '2024-07-17T18:37:09',
          soldFor: 26000,
          bidStatus: 'Out Bid',
          auctionId: '1'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...biddingData];

    // Filter by auction
    if (selectedAuction) {
      filtered = filtered.filter(bid => bid.auctionId === selectedAuction);
    }

    // Filter by status
    if (selectedStatus !== 'All Bids') {
      filtered = filtered.filter(bid => {
        if (selectedStatus === 'Highest Bid') {
          return bid.bidStatus === 'Highest Bid' || bid.bidStatus === 'Won';
        } else if (selectedStatus === 'Out Bid') {
          return bid.bidStatus === 'Out Bid';
        }
        return true;
      });
    }

    setFilteredData(filtered);
  };

  const handleSearch = () => {
    filterData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Highest Bid':
      case 'Won':
        return 'bg-green-100 text-green-800';
      case 'Out Bid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Bidding</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Auction Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Auction :
              </label>
              <select
                value={selectedAuction}
                onChange={(e) => setSelectedAuction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="">All Auctions</option>
                {auctions.map((auction) => (
                  <option key={auction._id} value={auction._id}>
                    {auction.auctionNumber || auction.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status :
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="All Bids">All Bids</option>
                <option value="Highest Bid">Highest Bid</option>
                <option value="Out Bid">Out Bid</option>
              </select>
            </div>

            {/* Search Button */}
            <div>
              <button
                onClick={handleSearch}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            {/* Page Size Selector */}
            <div className="md:col-start-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">
                Select Page Size :
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bidding Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Sr No
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Lot No.
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      My Bid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Max Bid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Bid Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Sold For
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Bid Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Bid Now
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No bidding data available
                      </td>
                    </tr>
                  ) : (
                    filteredData.slice(0, pageSize).map((bid, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {bid.srNo}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {bid.lotNo}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {formatCurrency(bid.myBidAmount)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {formatCurrency(bid.maxBidAmount)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {formatDateTime(bid.bidDateTime)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {bid.soldFor ? formatCurrency(bid.soldFor) : '-'}
                        </td>
                        <td className="px-6 py-3 text-sm border-b border-gray-200">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(bid.bidStatus)}`}>
                            {bid.bidStatus}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm border-b border-gray-200">
                          {bid.bidStatus === 'Out Bid' && (
                            <button className="text-accent-600 hover:text-accent-700 font-semibold">
                              →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBidding;
