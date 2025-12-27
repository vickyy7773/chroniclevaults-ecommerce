import React, { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const MyInvoice = () => {
  const [selectedAuction, setSelectedAuction] = useState('');
  const [auctions, setAuctions] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchAuctions();
    fetchInvoiceData();
  }, []);

  useEffect(() => {
    filterData();
  }, [selectedAuction, invoiceData]);

  const fetchAuctions = async () => {
    try {
      const response = await api.get('/auctions');
      setAuctions(response.data || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      // Mock data
      setAuctions([
        { _id: '1', title: 'AUC47', auctionNumber: 'AUC47' },
        { _id: '2', title: 'AUC46', auctionNumber: 'AUC46' }
      ]);
    }
  };

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/my-invoices');
      setInvoiceData(response.data || []);
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      // Mock data
      setInvoiceData([
        {
          srNo: 1,
          auctionNo: 'AUC47-111',
          invoiceNo: 'B/AUC47/132',
          amount: 31135,
          invoiceDate: '2024-11-08',
          pdfUrl: '/invoices/sample.pdf',
          auctionId: '1'
        },
        {
          srNo: 2,
          auctionNo: 'AUC46-78',
          invoiceNo: 'B/AUC46/141',
          amount: 34967,
          invoiceDate: '2023-12-23',
          pdfUrl: '/invoices/sample2.pdf',
          auctionId: '2'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...invoiceData];

    // Filter by auction
    if (selectedAuction) {
      filtered = filtered.filter(invoice => invoice.auctionId === selectedAuction);
    }

    setFilteredData(filtered);
  };

  const handleSearch = () => {
    filterData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      // TODO: Implement actual PDF download
      toast.info('PDF download will be implemented soon');
      console.log('Downloading PDF for invoice:', invoice.invoiceNo);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Invoice</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                <option value="">--Select Auction--</option>
                {auctions.map((auction) => (
                  <option key={auction._id} value={auction._id}>
                    {auction.auctionNumber || auction.title}
                  </option>
                ))}
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
            <div className="md:col-start-3">
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

        {/* Invoice Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-accent-100 py-3 px-6">
            <h2 className="text-lg font-semibold text-gray-800 text-center">My Invoice</h2>
          </div>

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
                      Sr No.
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Auction No
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Invoice No
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      Invoice Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      PDF
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No invoice data available
                      </td>
                    </tr>
                  ) : (
                    filteredData.slice(0, pageSize).map((invoice, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {invoice.srNo}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {invoice.auctionNo}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {invoice.invoiceNo}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="px-6 py-3 text-sm border-b border-gray-200">
                          <button
                            onClick={() => handleDownloadPDF(invoice)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-5 h-5" />
                          </button>
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

export default MyInvoice;
