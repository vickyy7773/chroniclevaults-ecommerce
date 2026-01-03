import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Gavel, Eye, List, FileText, User } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [auctionData, setAuctionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);

  // Navigation tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/userdashboard' },
    { id: 'bidding', label: 'My Bidding', icon: Gavel, path: '/my-bidding' },
    { id: 'watchlist', label: 'My Watchlist', icon: Eye, path: '/my-watchlist' },
    { id: 'wantlist', label: 'My WantList', icon: List, path: '/my-wantlist' },
    { id: 'invoice', label: 'My Invoice', icon: FileText, path: '/my-invoice' },
    { id: 'profile', label: 'My Profile', icon: User, path: '/auction-profile' }
  ];

  // Fetch auction bidding data
  useEffect(() => {
    fetchAuctionData();
  }, []);

  const fetchAuctionData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/auction-bidding-info');
      setAuctionData(response.data || []);
    } catch (error) {
      console.error('Error fetching auction data:', error);
      setAuctionData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleTabClick = (tab) => {
    navigate(tab.path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Size Selector */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Select Page Size :</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Auction Wise Bidding Limit Information Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Table Header */}
          <div className="bg-accent-100 text-gray-800 py-3 px-4">
            <h2 className="text-lg font-semibold text-center">
              Auction Wise Bidding Limit Information
            </h2>
          </div>

          {/* Table */}
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
                      Allocation Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Bidding Limit Allocated
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Bid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Remaining Bidding Limit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auctionData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No coin allocation data available
                      </td>
                    </tr>
                  ) : (
                    auctionData.slice(0, pageSize).map((allocation, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {formatDate(allocation.allocationDate)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {formatCurrency(allocation.biddingLimit)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {allocation.bidAmount > 0 ? formatCurrency(allocation.bidAmount) : ''}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {formatCurrency(allocation.remainingLimit)}
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

export default UserDashboard;
