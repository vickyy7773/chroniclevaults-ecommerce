import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Search, Eye, X, Filter, RefreshCw, CheckCircle, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const VendorInvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [selectedAuctionFilter, setSelectedAuctionFilter] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMode: '',
    paymentReference: ''
  });

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editCommission, setEditCommission] = useState(0);
  const [updating, setUpdating] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedAuctionFilter) params.auction = selectedAuctionFilter;
      if (selectedVendorFilter) params.vendor = selectedVendorFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/vendor-invoices', { params });
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching vendor invoices:', error);
      toast.error('Failed to fetch vendor invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await api.get('/auctions');
      setAuctions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await api.get('/vendors');
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchAuctions();
    fetchVendors();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [selectedAuctionFilter, selectedVendorFilter, statusFilter]);

  const handleGenerateInvoices = async () => {
    if (!selectedAuctionFilter) {
      toast.error('Please select an auction first');
      return;
    }

    try {
      setGenerating(true);
      const response = await api.post('/vendor-invoices/generate', {
        auctionId: selectedAuctionFilter
      });

      toast.success(response.message || `Generated ${response.count} vendor invoice(s)`);
      fetchInvoices();
    } catch (error) {
      console.error('Error generating vendor invoices:', error);
      toast.error(error.response?.data?.message || 'Failed to generate vendor invoices');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      const response = await api.get(`/vendor-invoices/${invoice._id}`);
      setSelectedInvoice(response.data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!paymentData.paymentMode) {
      toast.error('Please select payment mode');
      return;
    }

    try {
      await api.put(`/vendor-invoices/${selectedInvoice._id}/payment`, paymentData);
      toast.success('Invoice marked as paid');
      setShowPaymentModal(false);
      setShowViewModal(false);
      setPaymentData({ paymentMode: '', paymentReference: '' });
      fetchInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to mark invoice as paid');
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setEditCommission(invoice.vendorDetails?.commissionPercentage || 0);
    setShowEditModal(true);
  };

  const handleUpdateCommission = async () => {
    if (editCommission < 0 || editCommission > 100) {
      toast.error('Commission must be between 0 and 100');
      return;
    }

    try {
      setUpdating(true);

      // Update commission for all lots
      const updatedLots = editingInvoice.lots.map(lot => ({
        ...lot,
        commissionRate: editCommission
      }));

      await api.put(`/vendor-invoices/${editingInvoice._id}`, {
        vendorDetails: {
          ...editingInvoice.vendorDetails,
          commissionPercentage: editCommission
        },
        lots: updatedLots
      });

      toast.success('Commission updated successfully');
      setShowEditModal(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('Failed to update commission');
    } finally {
      setUpdating(false);
    }
  };

  const calculateUpdatedAmounts = () => {
    if (!editingInvoice) return null;

    const totalHammerPrice = editingInvoice.lots.reduce((sum, lot) => sum + (lot.hammerPrice || 0), 0);
    const totalCommission = (totalHammerPrice * editCommission) / 100;
    const totalNetPayable = totalHammerPrice - totalCommission;
    const finalPayable = Math.round(totalNetPayable);

    return {
      totalHammerPrice,
      totalCommission,
      totalNetPayable,
      finalPayable
    };
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.vendorDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendorDetails?.vendorCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Generated':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Sent':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Invoice Management</h1>
          <p className="text-gray-600 mt-1">Manage vendor payments for sold lots</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Auction</label>
              <select
                value={selectedAuctionFilter}
                onChange={(e) => setSelectedAuctionFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Auctions</option>
                {auctions.map((auction) => (
                  <option key={auction._id} value={auction._id}>
                    {auction.auctionCode} - {auction.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
              <select
                value={selectedVendorFilter}
                onChange={(e) => setSelectedVendorFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.vendorCode} - {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Generated">Generated</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {selectedAuctionFilter && (
              <div className="flex-shrink-0 self-end">
                <button
                  onClick={handleGenerateInvoices}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Generate Invoices
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by vendor name, code, or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No vendor invoices found</p>
          {selectedAuctionFilter && (
            <button
              onClick={handleGenerateInvoices}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Generate Invoices for Selected Auction
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lots
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hammer Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Payable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                      <div className="text-xs text-gray-500">{formatDate(invoice.invoiceDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.vendorDetails?.name}</div>
                      <div className="text-xs text-gray-500">{invoice.vendorDetails?.vendorCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.auction?.auctionCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.lots?.length || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.amounts?.totalHammerPrice)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600 font-semibold">
                        -{formatCurrency(invoice.amounts?.totalCommission)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({invoice.vendorDetails?.commissionPercentage}%)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {formatCurrency(invoice.amounts?.finalPayable)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {invoice.status !== 'Paid' && (
                          <>
                            <button
                              onClick={() => handleEditInvoice(invoice)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Commission"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowPaymentModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Vendor Invoice Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Number</h3>
                  <p className="text-lg font-bold text-gray-900">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Date</h3>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(selectedInvoice.invoiceDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Vendor</h3>
                  <p className="text-lg font-semibold text-gray-900">{selectedInvoice.vendorDetails?.name}</p>
                  <p className="text-sm text-gray-600">{selectedInvoice.vendorDetails?.vendorCode}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              {/* Lots Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Lots Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hammer Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Net Payable</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Sold</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedInvoice.lots?.map((lot, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{lot.lotNumber}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{lot.description}</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold">{formatCurrency(lot.hammerPrice)}</td>
                          <td className="px-4 py-2 text-sm text-right text-red-600">-{formatCurrency(lot.commissionAmount)}</td>
                          <td className="px-4 py-2 text-sm text-right font-bold text-green-600">{formatCurrency(lot.netPayable)}</td>
                          <td className="px-4 py-2 text-xs text-center">
                            {lot.soldDuringAuction ? (
                              <span className="text-blue-600">Live Auction</span>
                            ) : (
                              <span className="text-purple-600">Sold Later</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Hammer Price:</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoice.amounts?.totalHammerPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Commission ({selectedInvoice.vendorDetails?.commissionPercentage}%):</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(selectedInvoice.amounts?.totalCommission)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">Net Payable:</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoice.amounts?.totalNetPayable)}</span>
                </div>
                {selectedInvoice.amounts?.roundOff !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Round Off:</span>
                    <span className="font-semibold">{formatCurrency(selectedInvoice.amounts?.roundOff)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t-2 pt-2">
                  <span className="text-gray-900">Final Payable:</span>
                  <span className="text-green-600">{formatCurrency(selectedInvoice.amounts?.finalPayable)}</span>
                </div>
              </div>

              {/* Bank Details */}
              {selectedInvoice.bankDetails && (
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Bank Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Account Holder:</span>
                      <p className="font-semibold">{selectedInvoice.bankDetails.accountHolderName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Account Number:</span>
                      <p className="font-semibold">{selectedInvoice.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">IFSC Code:</span>
                      <p className="font-semibold">{selectedInvoice.bankDetails.ifscCode}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Bank Name:</span>
                      <p className="font-semibold">{selectedInvoice.bankDetails.bankName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Close
                </button>
                {selectedInvoice.status !== 'Paid' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShowPaymentModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Mark Invoice as Paid</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Invoice: <span className="font-semibold">{selectedInvoice.invoiceNumber}</span></p>
              <p className="text-sm text-gray-600">Vendor: <span className="font-semibold">{selectedInvoice.vendorDetails?.name}</span></p>
              <p className="text-lg font-bold text-green-600 mt-2">
                Amount: {formatCurrency(selectedInvoice.amounts?.finalPayable)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode *</label>
                <select
                  value={paymentData.paymentMode}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Reference</label>
                <input
                  type="text"
                  value={paymentData.paymentReference}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                  placeholder="Transaction ID / Cheque Number / Reference"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={!paymentData.paymentMode}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-400"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Commission Modal */}
      {showEditModal && editingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Vendor Commission</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Invoice Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Invoice Number:</span>
                    <p className="font-semibold">{editingInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Vendor:</span>
                    <p className="font-semibold">{editingInvoice.vendorDetails?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Auction:</span>
                    <p className="font-semibold">{editingInvoice.auction?.auctionCode}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Lots:</span>
                    <p className="font-semibold">{editingInvoice.lots?.length}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Percentage (%) *
                </label>
                <input
                  type="number"
                  value={editCommission}
                  onChange={(e) => setEditCommission(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">Enter commission percentage (0-100)</p>
              </div>

              {calculateUpdatedAmounts() && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Updated Calculation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Hammer Price:</span>
                      <span className="font-semibold">{formatCurrency(calculateUpdatedAmounts().totalHammerPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission ({editCommission}%):</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(calculateUpdatedAmounts().totalCommission)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Net Payable:</span>
                      <span className="font-semibold">{formatCurrency(calculateUpdatedAmounts().totalNetPayable)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t-2 pt-2">
                      <span className="text-gray-900">Final Payable:</span>
                      <span className="text-green-600">{formatCurrency(calculateUpdatedAmounts().finalPayable)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCommission}
                disabled={updating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Commission'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInvoiceManagement;
