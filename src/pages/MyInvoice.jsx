import React, { useState, useEffect } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const MyInvoice = () => {
  const [selectedAuction, setSelectedAuction] = useState('');
  const [auctions, setAuctions] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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
      setInvoiceData([]);
      toast.error('Failed to fetch invoices');
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
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearch = () => {
    filterData();
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
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
      // Fetch HTML content from backend
      // Note: api interceptor already returns response.data, so response IS the HTML string
      const htmlContent = await api.get(invoice.pdfUrl);

      // Open in new window and print (same as admin)
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error opening invoice:', error);
      toast.error('Failed to open invoice');
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
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
            <div className="overflow-x-auto scrollbar-visible" style={{ overflowX: 'auto' }}>
              <table className="w-full" style={{ minWidth: '1000px', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '80px' }} />
                  <col style={{ width: '150px' }} />
                  <col style={{ width: '200px' }} />
                  <col style={{ width: '200px' }} />
                  <col style={{ width: '200px' }} />
                  <col style={{ width: '170px' }} />
                </colgroup>
                <thead className="bg-accent-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap">
                      Sr No.
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap">
                      Auction No
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap">
                      Invoice No
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap">
                      Invoice Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap">
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
                    currentData.map((invoice, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
                          {startIndex + index + 1}
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

          {/* Pagination Controls */}
          {!loading && filteredData.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Showing info */}
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(endIndex, filteredData.length)}</span> of{' '}
                  <span className="font-semibold">{filteredData.length}</span> invoices
                </div>

                {/* Pagination buttons */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    {/* Previous button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, idx) => {
                        const pageNum = idx + 1;
                        // Show first page, last page, current page, and pages around current
                        const showPage =
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                        // Show ellipsis
                        const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 3;
                        const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 2;

                        if (showEllipsisBefore || showEllipsisAfter) {
                          return (
                            <span key={pageNum} className="px-2 text-gray-500">
                              ...
                            </span>
                          );
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 border rounded-md transition-colors ${
                              currentPage === pageNum
                                ? 'bg-accent-600 text-white border-accent-600 font-semibold'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Next page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-visible {
          scrollbar-width: thin;
          scrollbar-color: #d97706 #f3f4f6;
        }

        .scrollbar-visible::-webkit-scrollbar {
          height: 12px;
        }

        .scrollbar-visible::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 6px;
        }

        .scrollbar-visible::-webkit-scrollbar-thumb {
          background: #d97706;
          border-radius: 6px;
          border: 2px solid #f3f4f6;
        }

        .scrollbar-visible::-webkit-scrollbar-thumb:hover {
          background: #b45309;
        }
      `}</style>
    </div>
  );
};

export default MyInvoice;
