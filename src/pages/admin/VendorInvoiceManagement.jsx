import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Search, Eye, X, Filter, RefreshCw, CheckCircle, Edit2, Download, ArrowRightLeft } from 'lucide-react';
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

  // Lot Transfer states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSourceInvoice, setTransferSourceInvoice] = useState(null);
  const [selectedLotsForTransfer, setSelectedLotsForTransfer] = useState([]);
  const [targetVendorSearch, setTargetVendorSearch] = useState('');
  const [selectedTargetVendor, setSelectedTargetVendor] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [auctionVendors, setAuctionVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

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

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero Rupees';

    const crores = Math.floor(num / 10000000);
    const lakhs = Math.floor((num % 10000000) / 100000);
    const thousands = Math.floor((num % 100000) / 1000);
    const hundreds = Math.floor((num % 1000) / 100);
    const remainder = num % 100;

    let words = '';

    if (crores > 0) {
      words += convertTwoDigit(crores, ones, tens, teens) + ' Crore ';
    }
    if (lakhs > 0) {
      words += convertTwoDigit(lakhs, ones, tens, teens) + ' Lakh ';
    }
    if (thousands > 0) {
      words += convertTwoDigit(thousands, ones, tens, teens) + ' Thousand ';
    }
    if (hundreds > 0) {
      words += ones[hundreds] + ' Hundred ';
    }
    if (remainder > 0) {
      if (remainder < 10) {
        words += ones[remainder];
      } else if (remainder < 20) {
        words += teens[remainder - 10];
      } else {
        words += tens[Math.floor(remainder / 10)];
        if (remainder % 10 > 0) {
          words += ' ' + ones[remainder % 10];
        }
      }
    }

    return words.trim() + ' Rupees';

    function convertTwoDigit(n, ones, tens, teens) {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '');
    }
  };

  // Lot Transfer Functions
  const openTransferModal = async (invoice) => {
    setTransferSourceInvoice(invoice);
    setSelectedLotsForTransfer([]);
    setTargetVendorSearch('');
    setSelectedTargetVendor(null);
    setShowTransferModal(true);

    // Fetch ALL vendors from the same auction
    try {
      setLoadingVendors(true);
      const auctionId = invoice.auction?._id || invoice.auction;
      const response = await api.get(`/vendor-lot-transfer/auction-vendors/${auctionId}`);

      if (response.success) {
        setAuctionVendors(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
      setAuctionVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  };

  const toggleLotForTransfer = (lotNumber) => {
    setSelectedLotsForTransfer(prev => {
      if (prev.includes(lotNumber)) {
        return prev.filter(num => num !== lotNumber);
      } else {
        return [...prev, lotNumber];
      }
    });
  };

  const handleTransferLots = async () => {
    if (!transferSourceInvoice || !selectedTargetVendor) {
      toast.error('Please select target vendor');
      return;
    }

    if (selectedLotsForTransfer.length === 0) {
      toast.error('Please select at least one lot to transfer');
      return;
    }

    try {
      setTransferring(true);
      const auctionId = typeof transferSourceInvoice.auction === 'object'
        ? transferSourceInvoice.auction._id
        : transferSourceInvoice.auction;

      const response = await api.post('/vendor-lot-transfer/transfer', {
        auctionId: auctionId,
        fromVendorId: transferSourceInvoice.vendor._id || transferSourceInvoice.vendor,
        toVendorId: selectedTargetVendor.vendor._id,
        lotNumbers: selectedLotsForTransfer
      });

      if (response.success) {
        toast.success(`Successfully transferred ${selectedLotsForTransfer.length} lots`);
        setShowTransferModal(false);
        setTransferSourceInvoice(null);
        setSelectedLotsForTransfer([]);
        setSelectedTargetVendor(null);
        setTargetVendorSearch('');
        setAuctionVendors([]);
        fetchInvoices(); // Refresh invoices
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error(error.response?.data?.message || 'Failed to transfer lots');
    } finally {
      setTransferring(false);
    }
  };

  const filteredTargetVendors = auctionVendors.filter(vendorData => {
    // Exclude current invoice vendor
    const currentVendorId = transferSourceInvoice?.vendor?._id || transferSourceInvoice?.vendor;
    if (vendorData.vendor._id === currentVendorId) return false;

    // Filter by search
    if (!targetVendorSearch) return true;
    const searchLower = targetVendorSearch.toLowerCase();
    const vendor = vendorData.vendor;

    return vendor.name?.toLowerCase().includes(searchLower) ||
           vendor.email?.toLowerCase().includes(searchLower) ||
           vendor.vendorCode?.toLowerCase().includes(searchLower);
  });

  const handleDownloadPDF = (invoice) => {
    try {
      const htmlContent = generateVendorInvoiceHTML(invoice);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const generateVendorInvoiceHTML = (invoice) => {
    const commissionRate = invoice.vendorDetails?.commissionPercentage || 0;
    const totalHammerPrice = invoice.amounts?.totalHammerPrice || 0;
    const totalCommission = invoice.amounts?.totalCommission || 0;
    const finalPayable = invoice.amounts?.finalPayable || 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title> </title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header-content { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px; }
          .logo { height: 60px; width: auto; }
          .company-info { text-align: left; }
          .company-name { font-size: 16px; font-weight: bold; color: #d35400; }
          .tagline { font-size: 10px; margin: 5px 0; }
          .title { text-align: center; font-size: 14px; font-weight: bold; color: red; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          td, th { border: 1px solid #000; padding: 8px; }
          th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
          .vendor-info td { padding: 5px 8px; }
          .totals { font-weight: bold; background-color: #f0f0f0; }
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
          .sign-box { text-align: center; }
          .sign-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; padding-top: 5px; }
          .print-button { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background-color: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2); z-index: 1000; }
          .print-button:hover { background-color: #45a049; }

          /* Print-specific styles */
          @media print {
            .print-button { display: none; }
            body { padding: 10px; }
            .header { page-break-after: avoid; }
            .logo { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .company-name { color: #d35400 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .title { color: red !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            th { background-color: #f0f0f0 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .totals { background-color: #f0f0f0 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            table { page-break-inside: avoid; }
            .signature-section { page-break-before: avoid; margin-top: 30px; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Print PDF</button>
        <div class="header">
          <div class="header-content">
            <img src="https://chroniclevaults.com/assets/new%20logo-5e7e59a2.png" alt="Chronicle Vaults Logo" class="logo" />
            <div class="company-info">
              <div class="company-name">Chronicle Vaults - A Brand of Urhistory</div>
              <div class="tagline">16/189, Netajinagar, Meghaninagar, Ahmedabad - 380016, Gujarat</div>
              <div class="tagline">M:- 8460849878, E-mail:- chroniclevaults@gmail.com</div>
            </div>
          </div>
        </div>

        <div class="title">Vendor Settlement Invoice</div>

        <table class="vendor-info">
          <tr>
            <td><strong>Vendor Code:</strong> ${invoice.vendorDetails?.vendorCode || 'N/A'}</td>
            <td><strong>Invoice No:</strong> ${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td><strong>Name:</strong> ${invoice.vendorDetails?.name || 'N/A'}</td>
            <td><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</td>
          </tr>
          <tr>
            <td><strong>Auction:</strong> ${invoice.auction?.auctionCode || 'N/A'} - ${invoice.auction?.title || 'N/A'}</td>
            <td><strong>Commission:</strong> ${commissionRate}%</td>
          </tr>
          <tr>
            <td><strong>Email:</strong> ${invoice.vendorDetails?.email || 'N/A'}</td>
            <td><strong>Mobile:</strong> ${invoice.vendorDetails?.mobile || 'N/A'}</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>Sr.NO.</th>
              <th>Lot No.</th>
              <th>Description</th>
              <th>Hammer Price (₹)</th>
              <th>Commission (${commissionRate}%)</th>
              <th>Net Payable (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.lots || []).map((lot, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${lot.lotNumber || 'N/A'}</td>
                <td>${lot.description || 'N/A'}</td>
                <td>₹${(lot.hammerPrice || 0).toLocaleString('en-IN')}</td>
                <td>₹${(lot.commissionAmount || 0).toLocaleString('en-IN')}</td>
                <td>₹${(lot.netPayable || 0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
            <tr class="totals">
              <td colspan="3">Total Hammer Price</td>
              <td>₹${totalHammerPrice.toLocaleString('en-IN')}</td>
              <td>₹${totalCommission.toLocaleString('en-IN')}</td>
              <td>₹${finalPayable.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <table class="vendor-info">
          <tr>
            <td colspan="2"><strong>Amount in Words:</strong> ${numberToWords(finalPayable)} Only</td>
          </tr>
        </table>

        ${invoice.bankDetails?.accountNumber ? `
        <table class="vendor-info">
          <tr>
            <td colspan="2"><strong>Payment Details:</strong></td>
          </tr>
          <tr>
            <td><strong>Account Holder:</strong> ${invoice.bankDetails.accountHolderName || 'N/A'}</td>
            <td><strong>Bank:</strong> ${invoice.bankDetails.bankName || 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Account No:</strong> ${invoice.bankDetails.accountNumber || 'N/A'}</td>
            <td><strong>IFSC:</strong> ${invoice.bankDetails.ifscCode || 'N/A'}</td>
          </tr>
        </table>
        ` : ''}

        <div class="signature-section">
          <div class="sign-box">
            <div>Vendor's Sign :</div>
            <div>Date :</div>
          </div>
          <div class="sign-box">
            <div>For, Chronicle Vaults - A Brand of Urhistory</div>
            <div class="sign-line">Auth. Signatory</div>
          </div>
        </div>
      </body>
      </html>
    `;
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
                        {invoice.lots && invoice.lots.length > 0 && (
                          <button
                            onClick={() => openTransferModal(invoice)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Transfer Lots"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Download PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const token = localStorage.getItem('token');
                            window.open(`/api/vendor-invoices/${invoice._id}/post-sale-pdf${token ? `?token=${token}` : ''}`, '_blank');
                          }}
                          className="text-orange-600 hover:text-orange-900"
                          title="Post-Sale Vendor Advise"
                        >
                          <FileText className="w-5 h-5" />
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDownloadPDF(selectedInvoice)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
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

      {/* Transfer Lots Modal */}
      {showTransferModal && transferSourceInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-600">Transfer Lots</h2>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferSourceInvoice(null);
                  setSelectedLotsForTransfer([]);
                  setTargetVendorSearch('');
                  setSelectedTargetVendor(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Source Invoice Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">From Invoice</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Invoice:</span>{' '}
                  <span className="font-semibold">{transferSourceInvoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Vendor:</span>{' '}
                  <span className="font-semibold">{transferSourceInvoice.vendorDetails?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Lots:</span>{' '}
                  <span className="font-semibold">{transferSourceInvoice.lots?.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>{' '}
                  <span className="font-semibold">₹{transferSourceInvoice.amounts?.finalPayable?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Select Lots */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Select Lots to Transfer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {transferSourceInvoice.lots?.map((lot) => {
                  const isSelected = selectedLotsForTransfer.includes(lot.lotNumber);

                  return (
                    <div
                      key={lot.lotNumber}
                      onClick={() => toggleLotForTransfer(lot.lotNumber)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-50 border-purple-500'
                          : 'bg-white border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div>
                            <div className="font-medium">Lot #{lot.lotNumber}</div>
                            <div className="text-sm text-gray-600">{lot.description}</div>
                          </div>
                        </div>
                        <div className="font-semibold text-green-600">
                          ₹{lot.hammerPrice?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {selectedLotsForTransfer.length} / {transferSourceInvoice.lots?.length} lots
              </p>
            </div>

            {/* Select Target Vendor */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Select Target Vendor</h3>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or vendor code..."
                  value={targetVendorSearch}
                  onChange={(e) => setTargetVendorSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {selectedTargetVendor && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-green-900">{selectedTargetVendor.vendor.name}</div>
                      <div className="text-sm text-green-700">{selectedTargetVendor.vendor.email}</div>
                      {selectedTargetVendor.vendor.vendorCode && (
                        <div className="text-xs text-green-600 font-mono mt-1">
                          Code: {selectedTargetVendor.vendor.vendorCode}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedTargetVendor(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {!selectedTargetVendor && (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {loadingVendors ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading vendors...
                    </div>
                  ) : filteredTargetVendors.length > 0 ? (
                    filteredTargetVendors.map((vendorData) => (
                      <div
                        key={vendorData.vendor._id}
                        onClick={() => setSelectedTargetVendor(vendorData)}
                        className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{vendorData.vendor.name}</div>
                        <div className="text-sm text-gray-600">{vendorData.vendor.email}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                          {vendorData.vendor.vendorCode && (
                            <span className="font-mono bg-purple-100 px-2 py-0.5 rounded">
                              Code: {vendorData.vendor.vendorCode}
                            </span>
                          )}
                          {vendorData.lots && vendorData.lots.length > 0 && (
                            <span className="text-green-600">
                              {vendorData.lots.length} lot(s)
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {targetVendorSearch
                        ? 'No vendors found matching your search'
                        : 'No vendors available'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transfer Summary */}
            {selectedLotsForTransfer.length > 0 && selectedTargetVendor && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-purple-900 mb-2">Transfer Summary</h3>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-600">Transferring:</span>{' '}
                    <span className="font-semibold">{selectedLotsForTransfer.length} lots</span>
                  </div>
                  <div>
                    <span className="text-gray-600">From:</span>{' '}
                    <span className="font-semibold">{transferSourceInvoice.vendorDetails?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">To:</span>{' '}
                    <span className="font-semibold">{selectedTargetVendor.vendor.name}</span>
                    {selectedTargetVendor.vendor.vendorCode && (
                      <span className="text-xs text-purple-600 ml-2">
                        (Code: {selectedTargetVendor.vendor.vendorCode})
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-600">Lots:</span>{' '}
                    <span className="font-semibold">
                      {selectedLotsForTransfer.sort((a, b) => a - b).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferSourceInvoice(null);
                  setSelectedLotsForTransfer([]);
                  setTargetVendorSearch('');
                  setSelectedTargetVendor(null);
                  setAuctionVendors([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferLots}
                disabled={transferring || selectedLotsForTransfer.length === 0 || !selectedTargetVendor}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {transferring ? 'Transferring...' : `Transfer ${selectedLotsForTransfer.length} Lots`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInvoiceManagement;
