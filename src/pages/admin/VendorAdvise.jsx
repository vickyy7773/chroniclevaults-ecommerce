import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import * as XLSX from 'xlsx';

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

  const handlePreSaleExcel = async () => {
    if (!selectedVendor || !selectedAuction) {
      toast.error('Please select both vendor and auction');
      return;
    }

    try {
      setLoading(true);

      // Fetch vendor and auction data
      const vendor = vendors.find(v => v._id === selectedVendor);
      const auction = auctions.find(a => a._id === selectedAuction);

      if (!vendor || !auction) {
        toast.error('Vendor or auction not found');
        return;
      }

      // Get vendor's lots from auction
      const vendorLots = auction.lots.filter(lot =>
        lot.vendor && lot.vendor.toString() === selectedVendor
      );

      if (vendorLots.length === 0) {
        toast.error('No lots found for this vendor in selected auction');
        return;
      }

      // Create data array for Excel
      const data = [];

      // Header Section
      data.push(['Chronicle Vaults - A Brand Of Urhistory', '', '', '', '']);
      data.push(['16/189, Netajinagar, Meghaninagar,', '', '', '', '']);
      data.push(['Ahmedabad - 380016,', '', '', '', '']);
      data.push(['Gujarat.', '', '', '', '']);
      data.push(['M:- 8460849878, E-mail:- chroniclevaults@gmail.com', '', '', '', '']);
      data.push(['', '', '', '', '']);

      // Title
      data.push(['Pre-Sale Vendor Advise', '', '', '', '']);
      data.push(['', '', '', '', '']);

      // Vendor Details - Left side and Right side
      data.push([`Vendor Code: ${vendor.vendorCode}`, '', '', `Auction No: ${auction.auctionNumber || auction.auctionCode || 'N/A'}`, '']);
      data.push([`Name: ${vendor.name}`, '', '', `Date: ${new Date().toLocaleDateString('en-IN')}`, '']);
      data.push([`Address: ${vendor.address || 'N/A'}`, '', '', `Vendor: ${auction.title}`, '']);
      data.push([`${vendor.city || ''}, ${vendor.state || 'Gujarat'}`, '', '', '', '']);
      data.push([`State: ${vendor.state || 'Gujarat'} pincode: ${vendor.pincode || ''}`, '', '', '', '']);
      data.push([`Email: ${vendor.email || 'N/A'} M:- ${vendor.mobile || 'N/A'}`, '', '', '', '']);
      data.push(['', '', '', '', '']);

      // Table Header
      data.push(['Sr.NO.', 'Lot No.', 'Description', 'Estimate', 'Reserve Price']);

      // Lot Data
      vendorLots.forEach((lot, index) => {
        data.push([
          index + 1,
          lot.lotNumber,
          lot.title,
          `${lot.estimateLow || 0}-${lot.estimateHigh || 0}`,
          lot.reservePrice || ''
        ]);
      });

      // Add empty rows for spacing (at least 10 more rows for printing)
      for (let i = 0; i < (15 - vendorLots.length); i++) {
        data.push(['', '', '', '', '']);
      }

      // Total row
      data.push(['Total', '', '', '', '']);
      data.push(['', '', '', '', '']);

      // Signature Section
      data.push(["Receiver's Sign :", '', '', 'For,Chornicle Vaults', '']);
      data.push(['Date :', '', '', '', '']);
      data.push(['', '', '', 'Auth. Signatory', '']);
      data.push(['', '', '', '', '']);

      // Footer
      data.push(['Thank You for your Participation in our Auction Subject To Ahmedabad Jurisdiction', '', '', '', '']);
      data.push(['', '', '', '', '']);
      data.push(['GST No: Chornicle Vaults', '', '', 'Antiqes Trading Licence No', '']);
      data.push(['Statutory Warning:', '', '', '', '']);
      data.push(['Antiques over 100 years old cannot be taken out of India without the permission of the', '', '', '', '']);
      data.push(['Director General, Archaeological Survey of India, Janpath, New Delhi 110011.', '', '', '', '']);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Set column widths
      ws['!cols'] = [
        { wch: 12 },  // Sr.NO.
        { wch: 12 },  // Lot No.
        { wch: 45 },  // Description
        { wch: 18 },  // Estimate
        { wch: 15 }   // Reserve Price
      ];

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pre-Sale Vendor Advise');

      // Download file
      const fileName = `PreSale_Vendor_Advise_${vendor.vendorCode}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Pre-Sale Vendor Advise downloaded successfully!');
    } catch (error) {
      console.error('Error generating pre-sale Excel:', error);
      toast.error('Failed to generate Excel file');
    } finally {
      setLoading(false);
    }
  };

  const handlePostSaleExcel = async () => {
    if (!selectedVendor || !selectedAuction) {
      toast.error('Please select both vendor and auction');
      return;
    }

    try {
      setLoading(true);

      // Fetch vendor invoice
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

      // Create data array for Excel
      const data = [];

      // Header Section
      data.push(['Chronicle Vaults - A Brand Of Urhistory', '', '', '', '', '', '']);
      data.push(['16/189, Netajinagar, Meghaninagar, Ahmedabad - 380016, Gujarat', '', '', '', '', '', '']);
      data.push(['M:- 8460849878, E-mail:- chroniclevaults@gmail.com', '', '', '', '', '', '']);
      data.push(['', '', '', '', '', '', '']);

      // Title
      data.push(['Post-Sale Vendor Advise', '', '', '', '', '', '']);
      data.push(['', '', '', '', '', '', '']);

      // Invoice Details
      data.push([`Invoice No: ${invoice.invoiceNumber || 'N/A'}`, '', '', `Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, '', '', '']);
      data.push([`Vendor Code: ${invoice.vendorDetails?.vendorCode || 'N/A'}`, '', '', `Commission: ${invoice.vendorDetails?.commissionPercentage || 0}%`, '', '', '']);
      data.push([`Vendor Name: ${invoice.vendorDetails?.name || 'N/A'}`, '', '', `Payment Status: ${invoice.isPaid ? 'PAID' : 'PENDING'}`, '', '', '']);
      data.push([`Email: ${invoice.vendorDetails?.email || 'N/A'}`, '', '', `Mobile: ${invoice.vendorDetails?.mobile || 'N/A'}`, '', '', '']);
      data.push(['', '', '', '', '', '', '']);

      // Table Header
      data.push(['Sr.No.', 'Lot No.', 'Description', 'Hammer Price', 'Commission %', 'Commission Amt', 'Net Payable']);

      // Lot Data
      invoice.lots.forEach((lot, index) => {
        data.push([
          index + 1,
          lot.lotNumber,
          lot.description,
          lot.hammerPrice,
          lot.commissionRate,
          lot.commissionAmount,
          lot.netPayable
        ]);
      });

      // Add empty rows for spacing
      for (let i = 0; i < (10 - invoice.lots.length); i++) {
        data.push(['', '', '', '', '', '', '']);
      }

      // Totals
      data.push(['', '', 'TOTAL', invoice.amounts.totalHammerPrice, '', invoice.amounts.totalCommission, invoice.amounts.totalNetPayable]);
      data.push(['', '', '', '', '', '', '']);
      data.push(['', '', 'FINAL PAYABLE', '', '', '', invoice.amounts.finalPayable]);
      data.push(['', '', '', '', '', '', '']);

      // Bank Details (if available)
      if (invoice.bankDetails?.accountNumber) {
        data.push(['BANK PAYMENT DETAILS:', '', '', '', '', '', '']);
        data.push([`Account Holder: ${invoice.bankDetails.accountHolderName || 'N/A'}`, '', '', '', '', '', '']);
        data.push([`Account Number: ${invoice.bankDetails.accountNumber}`, '', '', '', '', '', '']);
        data.push([`IFSC Code: ${invoice.bankDetails.ifscCode || 'N/A'}`, '', '', `Bank: ${invoice.bankDetails.bankName || 'N/A'}`, '', '', '']);
        data.push([`Branch: ${invoice.bankDetails.branchName || 'N/A'}`, '', '', '', '', '', '']);
        data.push(['', '', '', '', '', '', '']);
      }

      // Signature Section
      data.push(["Receiver's Sign :", '', '', 'For, Chronicle Vaults - A Brand of Urhistory', '', '', '']);
      data.push(['Date :', '', '', '', '', '', '']);
      data.push(['', '', '', 'Auth. Signatory', '', '', '']);
      data.push(['', '', '', '', '', '', '']);

      // Footer
      data.push(['Thank You for your Participation in our Auction Subject To Ahmedabad Jurisdiction', '', '', '', '', '', '']);
      data.push(['GST No: Chronicle Vaults', '', '', 'Antiques Trading Licence No:', '', '', '']);
      data.push(['Statutory Warning:', '', '', '', '', '', '']);
      data.push(['Antiques over 100 years old cannot be taken out of India without the permission of the', '', '', '', '', '', '']);
      data.push(['Director General, Archaeological Survey of India, Janpath, New Delhi 110011.', '', '', '', '', '', '']);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Set column widths
      ws['!cols'] = [
        { wch: 10 },  // Sr.No.
        { wch: 12 },  // Lot No.
        { wch: 40 },  // Description
        { wch: 15 },  // Hammer Price
        { wch: 12 },  // Commission %
        { wch: 15 },  // Commission Amount
        { wch: 15 }   // Net Payable
      ];

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Post-Sale Vendor Advise');

      // Download file
      const fileName = `PostSale_Vendor_Advise_${invoice.vendorDetails.vendorCode}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Post-Sale Vendor Advise downloaded successfully!');
    } catch (error) {
      console.error('Error generating post-sale Excel:', error);
      toast.error(error.response?.data?.message || 'Failed to generate Excel file');
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
        <p className="text-gray-600 dark:text-gray-400 mt-1">Download Pre-Sale and Post-Sale vendor advise in Excel format</p>
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
            onClick={handlePreSaleExcel}
            disabled={!selectedVendor || !selectedAuction || loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {loading ? 'Generating...' : 'Download Pre-Sale Advise (Excel)'}
          </button>

          <button
            onClick={handlePostSaleExcel}
            disabled={!selectedVendor || !selectedAuction || loading}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {loading ? 'Generating...' : 'Download Post-Sale Advise (Excel)'}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pre-Sale Info */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
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
              <span>Excel format with multiple sheets</span>
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
              <span>Sold lots with hammer prices and commission</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400">✓</span>
              <span>Net payable amount after commission deduction</span>
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
