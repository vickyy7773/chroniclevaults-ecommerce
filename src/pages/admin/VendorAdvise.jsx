import { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const VendorAdvise = () => {
  const [vendors, setVendors] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedAuction, setSelectedAuction] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
    fetchAuctions();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/vendors');
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error('Failed to load vendors');
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await api.get('/auctions');
      setAuctions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
      toast.error('Failed to load auctions');
    }
  };

  const handlePreSalePDF = () => {
    if (!selectedVendor || !selectedAuction) {
      toast.error('Please select both vendor and auction');
      return;
    }

    const url = `/api/vendor-invoices/vendor/${selectedVendor}/auction/${selectedAuction}/pre-sale-pdf`;
    window.open(url, '_blank');
    toast.success('Opening Pre-Sale Vendor Advise PDF...');
  };

  const handlePostSalePDF = async () => {
    if (!selectedVendor || !selectedAuction) {
      toast.error('Please select both vendor and auction');
      return;
    }

    try {
      setLoading(true);

      // Fetch vendor invoice to get invoice ID
      const response = await api.get('/vendor-invoices', {
        params: {
          vendor: selectedVendor,
          auction: selectedAuction
        }
      });

      if (!response.data || response.data.length === 0) {
        toast.error('No vendor invoice found for this auction');
        return;
      }

      const invoice = response.data[0];
      const url = `/api/vendor-invoices/${invoice._id}/post-sale-pdf`;
      window.open(url, '_blank');
      toast.success('Opening Post-Sale Vendor Advise PDF...');
    } catch (error) {
      console.error('Error opening post-sale PDF:', error);
      toast.error(error.response?.data?.message || 'Failed to open PDF');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendorCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Advise</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Download Pre-Sale and Post-Sale vendor advise in PDF format</p>
      </div>

      {/* Selection Card */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vendor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Select Vendor <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Vendor --</option>
              {filteredVendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.vendorCode} - {vendor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Auction Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Select Auction <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedAuction}
              onChange={(e) => setSelectedAuction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-9"
            >
              <option value="">-- Select Auction --</option>
              {auctions.map((auction) => (
                <option key={auction._id} value={auction._id}>
                  {auction.auctionCode || auction.auctionNumber} - {auction.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={handlePreSalePDF}
            disabled={!selectedVendor || !selectedAuction || loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            {loading ? 'Opening...' : 'Download Pre-Sale Advise (PDF)'}
          </button>

          <button
            onClick={handlePostSalePDF}
            disabled={!selectedVendor || !selectedAuction || loading}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            {loading ? 'Opening...' : 'Download Post-Sale Advise (PDF)'}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pre-Sale Info */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-400">Pre-Sale Vendor Advise</h3>
              <p className="text-sm text-green-700 dark:text-green-500">Before auction starts</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Shows lot numbers with estimates and reserve prices</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Vendor details and contact information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Professional PDF format ready for printing</span>
            </li>
          </ul>
        </div>

        {/* Post-Sale Info */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-400">Post-Sale Vendor Advise</h3>
              <p className="text-sm text-orange-700 dark:text-orange-500">After auction ends</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-300">
            <li className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400">✓</span>
              <span>Sold lots with estimated prices and hammer prices</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400">✓</span>
              <span>Total hammer price summary</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400">✓</span>
              <span>Bank details for vendor payment</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VendorAdvise;
