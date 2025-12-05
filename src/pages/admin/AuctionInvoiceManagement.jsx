import React, { useState, useEffect } from 'react';
import { FileText, Edit2, Download, Trash2, DollarSign, Search, Eye, X, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import auctionInvoiceService from '../../services/auctionInvoiceService';
import api from '../../utils/api';

const AuctionInvoiceManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const auctionFilter = searchParams.get('auction');
  const [invoices, setInvoices] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    auctionId: '',
    lotNumber: '',
    buyerId: '',
    packingForwardingCharges: { amount: 80 },
    insuranceCharges: { amount: 0, declined: true },
    companyDetails: {
      name: 'Chronicle Vaults',
      gstin: '',
      pan: '',
      msme: '',
      address: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      phone: '',
      email: 'info@chroniclevaults.com'
    }
  });

  const fetchInvoices = async () => {
    try {
      console.log('📡 Fetching invoices from API...');
      setLoading(true);
      const response = await auctionInvoiceService.getAllInvoices();
      console.log('📦 API Response:', response);
      console.log('📊 Response data:', response.data);
      setInvoices(response.data || []);
      console.log('✅ Invoices set in state:', response.data?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      console.error('❌ Error details:', error.response?.data);
      toast.error('Failed to fetch invoices');
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

  useEffect(() => {
    console.log('🚀 Component mounted - calling fetchInvoices...');
    fetchInvoices();
    fetchAuctions();
  }, []);

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    try {
      await auctionInvoiceService.updateInvoice(selectedInvoice._id, formData);
      toast.success('Invoice updated successfully!');
      setShowEditModal(false);
      fetchInvoices();
      setSelectedInvoice(null);
      resetForm();
    } catch (error) {
      toast.error('Failed to update invoice');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await auctionInvoiceService.deleteInvoice(id);
      toast.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      // Basic PDF generation - will enhance later
      const printWindow = window.open('', '_blank');
      printWindow.document.write(generateInvoiceHTML(invoice));
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const generateInvoiceHTML = (invoice) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin: 20px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${invoice.companyDetails.name}</h1>
          <p>GSTIN: ${invoice.companyDetails.gstin}</p>
          <h2>Tax Invoice</h2>
        </div>

        <div class="invoice-details">
          <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          <p><strong>Buyer:</strong> ${invoice.buyerDetails.name}</p>
          <p><strong>Email:</strong> ${invoice.buyerDetails.email}</p>
          <p><strong>Phone:</strong> ${invoice.buyerDetails.phone}</p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Lot#</th>
              <th>Description</th>
              <th>HSN Code</th>
              <th>Qty</th>
              <th>GST %</th>
              <th>Hammer Price (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.lots || [invoice.lotDetails]).map((lot, idx) => `
              <tr>
                <td>${lot.lotNumber || invoice.lotNumbers?.[idx] || invoice.lotNumber || 'N/A'}</td>
                <td>${lot.description}</td>
                <td>${lot.hsnCode || '97050090'}</td>
                <td>${lot.quantity || 1}</td>
                <td>${invoice.gst.itemGSTRate}%</td>
                <td>₹${(lot.hammerPrice || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="5"><strong>Packing & Forwarding Charges</strong></td>
              <td><strong>₹${invoice.packingForwardingCharges.amount.toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <p>Gross Amount: ₹${invoice.amounts.grossAmount.toLocaleString()}</p>
          <p>${invoice.gst.type}: ₹${invoice.amounts.totalGST.toLocaleString()}</p>
          <p>Round Off: ₹${invoice.amounts.roundOff.toFixed(2)}</p>
          <p class="total">Total Payable: ₹${invoice.amounts.totalPayable.toLocaleString()}</p>
        </div>

        <div style="margin-top: 50px;">
          <p><strong>Amount in Words:</strong></p>
          <p>Rs. ${numberToWords(invoice.amounts.totalPayable)} Only</p>
        </div>

        <div style="margin-top: 50px; text-align: right;">
          <p>For ${invoice.companyDetails.name}</p>
          <br><br>
          <p>Authorised Signatory</p>
        </div>
      </body>
      </html>
    `;
  };

  const numberToWords = (num) => {
    // Simple number to words conversion - basic version
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
  };

  const resetForm = () => {
    setFormData({
      auctionId: '',
      lotNumber: '',
      buyerId: '',
      packingForwardingCharges: { amount: 80 },
      insuranceCharges: { amount: 0, declined: true },
      companyDetails: {
        name: 'Chronicle Vaults',
        gstin: '',
        pan: '',
        msme: '',
        address: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        phone: '',
        email: 'info@chroniclevaults.com'
      }
    });
  };

  const openEditModal = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      buyerDetails: invoice.buyerDetails,
      billingAddress: invoice.billingAddress,
      shippingAddress: invoice.shippingAddress,
      lotDetails: invoice.lotDetails,
      packingForwardingCharges: invoice.packingForwardingCharges,
      insuranceCharges: invoice.insuranceCharges,
      gst: invoice.gst,
      companyDetails: invoice.companyDetails
    });
    setShowEditModal(true);
  };

  // Debug logging
  console.log('🔍 Invoice filtering:', {
    totalInvoices: invoices.length,
    auctionFilter,
    searchTerm,
    sampleInvoice: invoices[0]
  });

  const filteredInvoices = invoices.filter(invoice => {
    // Filter by search term
    const matchesSearch = invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.buyerDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by auction ID if present in URL
    // Handle both populated (object) and non-populated (string) auction field
    const auctionId = typeof invoice.auction === 'object' ? invoice.auction?._id : invoice.auction;
    const matchesAuction = auctionFilter ? auctionId === auctionFilter : true;

    console.log('📋 Invoice filter check:', {
      invoiceNumber: invoice.invoiceNumber,
      auctionId,
      auctionFilter,
      matchesSearch,
      matchesAuction,
      passes: matchesSearch && matchesAuction
    });

    return matchesSearch && matchesAuction;
  });

  console.log('✅ Filtered result:', filteredInvoices.length, 'invoices');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auction Invoice Management</h1>
          <p className="text-gray-600 mt-1">View and edit automatically generated auction invoices</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by invoice number or buyer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Active Filter Badge */}
        {auctionFilter && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                Filtered by Auction: {auctions.find(a => a._id === auctionFilter)?.title || auctionFilter.slice(-6)}
              </span>
              <button
                onClick={() => {
                  searchParams.delete('auction');
                  setSearchParams(searchParams);
                }}
                className="ml-2 hover:bg-blue-200 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm text-gray-600">
              Showing {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No invoices found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.buyerDetails?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {invoice.lotNumbers && invoice.lotNumbers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {invoice.lotNumbers.map((num, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            #{num}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        #{invoice.lotNumber || 'N/A'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ₹{invoice.amounts?.totalPayable?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {invoice.gst?.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'Generated' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        className="text-green-600 hover:text-green-900"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Invoice</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice}>
              {selectedInvoice && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                    <input
                      type="text"
                      value={selectedInvoice.invoiceNumber}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lot Description</label>
                    <input
                      type="text"
                      value={formData.lotDetails?.description || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        lotDetails: { ...formData.lotDetails, description: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hammer Price (₹)</label>
                    <input
                      type="number"
                      value={formData.lotDetails?.hammerPrice || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        lotDetails: { ...formData.lotDetails, hammerPrice: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Packing & Forwarding Charges (₹)</label>
                    <input
                      type="number"
                      value={formData.packingForwardingCharges?.amount || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        packingForwardingCharges: { ...formData.packingForwardingCharges, amount: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionInvoiceManagement;
