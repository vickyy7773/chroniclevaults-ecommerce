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

  // Filter states
  const [selectedAuctionFilter, setSelectedAuctionFilter] = useState(auctionFilter || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // New states for enhanced features
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedLots, setSelectedLots] = useState([]);

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

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/users/customers');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  useEffect(() => {
    console.log('🚀 Component mounted - calling fetchInvoices...');
    fetchInvoices();
    fetchAuctions();
    fetchCustomers();
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

  const handleCustomerSelect = (customer) => {
    setFormData({
      ...formData,
      buyerId: customer._id,
      buyerDetails: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        gstin: customer.gstin || '',
        pan: customer.pan || ''
      },
      billingAddress: {
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || 'Maharashtra',
        stateCode: customer.address?.stateCode || '27',
        zipCode: customer.address?.zipCode || ''
      },
      shippingAddress: {
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || 'Maharashtra',
        stateCode: customer.address?.stateCode || '27',
        zipCode: customer.address?.zipCode || ''
      }
    });
    setCustomerSearch(customer.name);
  };

  const handleSplitInvoice = async () => {
    if (selectedLots.length === 0) {
      toast.error('Please select at least one lot to split');
      return;
    }

    if (selectedLots.length === selectedInvoice.lots.length) {
      toast.error('Cannot split all lots - at least one lot must remain in original invoice');
      return;
    }

    try {
      // Create new invoice with selected lots
      const newInvoiceLots = selectedInvoice.lots.filter(lot =>
        selectedLots.includes(lot.lotNumber)
      );

      const newInvoiceData = {
        ...selectedInvoice,
        lots: newInvoiceLots,
        lotNumbers: selectedLots
      };

      // Remove _id and invoiceNumber to create new invoice
      delete newInvoiceData._id;
      delete newInvoiceData.invoiceNumber;
      delete newInvoiceData.saleNumber;

      await auctionInvoiceService.createInvoice(newInvoiceData);

      // Update original invoice to remove split lots
      const remainingLots = selectedInvoice.lots.filter(lot =>
        !selectedLots.includes(lot.lotNumber)
      );
      const remainingLotNumbers = remainingLots.map(l => l.lotNumber);

      await auctionInvoiceService.updateInvoice(selectedInvoice._id, {
        lots: remainingLots,
        lotNumbers: remainingLotNumbers
      });

      toast.success('Invoice split successfully!');
      setShowSplitModal(false);
      setSelectedLots([]);
      fetchInvoices();
    } catch (error) {
      console.error('Split invoice error:', error);
      toast.error('Failed to split invoice');
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      let htmlContent;

      // Select the appropriate template based on invoice type
      switch (invoice.invoiceType) {
        case 'Vendor':
          htmlContent = generateVendorInvoiceHTML(invoice);
          break;
        case 'ASI':
          htmlContent = generateASIReportHTML(invoice);
          break;
        case 'Customer':
        default:
          htmlContent = generateInvoiceHTML(invoice);
          break;
      }

      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
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

  const generateASIReportHTML = (invoice) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ASI Report ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border: 3px double #333; padding: 20px; }
          .emblem { font-size: 24px; font-weight: bold; color: #8B4513; }
          .report-type { background-color: #FF8C00; color: white; padding: 8px 20px; display: inline-block; margin-top: 10px; font-weight: bold; }
          .section { margin: 25px 0; padding: 15px; border: 1px solid #ddd; }
          .section-title { font-weight: bold; font-size: 18px; margin-bottom: 15px; color: #8B4513; border-bottom: 2px solid #8B4513; padding-bottom: 5px; }
          .field-row { display: flex; margin: 10px 0; }
          .field-label { font-weight: bold; width: 200px; color: #555; }
          .field-value { flex: 1; }
          .certification-box { background-color: #FFF8DC; border: 2px solid #DAA520; padding: 20px; margin: 20px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table th, .table td { border: 1px solid #8B4513; padding: 10px; text-align: left; }
          .table th { background-color: #D2691E; color: white; font-weight: bold; }
          .stamps { margin-top: 50px; display: flex; justify-content: space-between; }
          .stamp-box { width: 200px; text-align: center; }
          .stamp-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(139, 69, 19, 0.1); z-index: -1; pointer-events: none; }
        </style>
      </head>
      <body>
        <div class="watermark">CERTIFIED</div>

        <div class="header">
          <div class="emblem">🏛️ भारतीय पुरातत्व सर्वेक्षण</div>
          <h1 style="margin: 10px 0;">ARCHAEOLOGICAL SURVEY OF INDIA</h1>
          <p style="margin: 5px 0;">Ministry of Culture, Government of India</p>
          <div class="report-type">CERTIFICATION REPORT</div>
        </div>

        <div class="section">
          <div class="section-title">Report Details</div>
          <div class="field-row">
            <span class="field-label">Report Number:</span>
            <span class="field-value">${invoice.invoiceNumber || 'N/A'}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Issue Date:</span>
            <span class="field-value">${new Date(invoice.invoiceDate).toLocaleDateString()}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Auction Reference:</span>
            <span class="field-value">${typeof invoice.auction === 'object' ? invoice.auction?.title : 'N/A'}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Auction House:</span>
            <span class="field-value">Chronicle Vaults</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Item(s) Certified</div>
          <table class="table">
            <thead>
              <tr>
                <th>Lot #</th>
                <th>Description</th>
                <th>Period/Dating</th>
                <th>Category</th>
                <th>Provenance</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.lots || []).map(lot => `
                <tr>
                  <td>${lot.lotNumber || 'N/A'}</td>
                  <td>${lot.description || 'N/A'}</td>
                  <td>${lot.period || 'To be determined'}</td>
                  <td>${lot.category || 'Antiquity'}</td>
                  <td>${lot.provenance || 'Private Collection'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Archaeological Assessment</div>
          <div class="field-row">
            <span class="field-label">Authentication Status:</span>
            <span class="field-value" style="color: green; font-weight: bold;">${invoice.asiDetails?.authenticationStatus || 'CERTIFIED AUTHENTIC'}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Heritage Classification:</span>
            <span class="field-value">${invoice.asiDetails?.heritageClass || 'Non-Protected Antiquity'}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Export Eligibility:</span>
            <span class="field-value">${invoice.asiDetails?.exportEligible || 'Subject to Approval'}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Examined By:</span>
            <span class="field-value">${invoice.asiDetails?.examiner || 'Dr. Archaeological Expert'}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Examination Date:</span>
            <span class="field-value">${invoice.asiDetails?.examinationDate ? new Date(invoice.asiDetails.examinationDate).toLocaleDateString() : new Date(invoice.invoiceDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div class="certification-box">
          <h3 style="text-align: center; margin-top: 0;">OFFICIAL CERTIFICATION</h3>
          <p style="text-align: justify;">
            This is to certify that the item(s) listed in this report have been examined by the Archaeological Survey of India
            and found to be ${invoice.asiDetails?.authenticationStatus || 'authentic antiquities'}. The examination was conducted
            in accordance with the Antiquities and Art Treasures Act, 1972, and relevant ASI protocols.
          </p>
          <p style="text-align: justify;">
            <strong>Note:</strong> ${invoice.asiDetails?.notes || 'This certification does not constitute permission for export. Separate export permission must be obtained from the competent authority as per the Antiquities and Art Treasures Act, 1972.'}
          </p>
        </div>

        <div class="section">
          <div class="section-title">Legal Compliance</div>
          <div class="field-row">
            <span class="field-label">Antiquities Act Compliance:</span>
            <span class="field-value">✓ Compliant</span>
          </div>
          <div class="field-row">
            <span class="field-label">Registration Status:</span>
            <span class="field-value">${invoice.asiDetails?.registrationStatus || 'Registered with ASI'}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Reference No:</span>
            <span class="field-value">${invoice.asiDetails?.referenceNumber || invoice.invoiceNumber}</span>
          </div>
        </div>

        <div class="stamps">
          <div class="stamp-box">
            <div class="stamp-line">
              <p style="margin: 5px 0; font-weight: bold;">Archaeological Expert</p>
              <p style="margin: 5px 0; font-size: 12px;">${invoice.asiDetails?.examiner || 'Dr. Expert Name'}</p>
            </div>
          </div>
          <div class="stamp-box">
            <div class="stamp-line">
              <p style="margin: 5px 0; font-weight: bold;">Director</p>
              <p style="margin: 5px 0; font-size: 12px;">Archaeological Survey of India</p>
            </div>
          </div>
        </div>

        <div style="margin-top: 40px; padding: 15px; background-color: #FFF8DC; border-left: 4px solid #DAA520; font-size: 11px;">
          <p style="margin: 5px 0;"><strong>Disclaimer:</strong></p>
          <p style="margin: 5px 0;">
            This is a simulated ASI report generated for auction documentation purposes by Chronicle Vaults.
            For actual ASI certification, items must be submitted to the Archaeological Survey of India offices
            for official examination and certification.
          </p>
          <p style="margin: 5px 0;">
            Contact: Archaeological Survey of India, Janpath, New Delhi - 110011 | Website: asi.nic.in
          </p>
        </div>
      </body>
      </html>
    `;
  };

  const generateVendorInvoiceHTML = (invoice) => {
    const commissionRate = invoice.vendorDetails?.commissionRate || 15; // Default 15% commission
    const totalHammerPrice = (invoice.lots || []).reduce((sum, lot) => sum + (lot.hammerPrice || 0), 0);
    const commission = totalHammerPrice * (commissionRate / 100);
    const netPayable = totalHammerPrice - commission;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vendor Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .invoice-type { background-color: #8B5CF6; color: white; padding: 5px 15px; display: inline-block; border-radius: 5px; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
          .detail-item { padding: 5px; }
          .detail-label { font-weight: bold; color: #555; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .table th { background-color: #8B5CF6; color: white; font-weight: bold; }
          .table tr:nth-child(even) { background-color: #f9f9f9; }
          .summary { float: right; width: 400px; margin: 20px 0; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #ddd; }
          .summary-row.total { background-color: #f0f0f0; font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
          .signature { margin-top: 80px; text-align: right; }
          .signature-line { border-top: 1px solid #333; width: 200px; margin-left: auto; margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Chronicle Vaults</h1>
          <p>GSTIN: ${invoice.companyDetails?.gstin || 'N/A'} | PAN: ${invoice.companyDetails?.pan || 'N/A'}</p>
          <p>${invoice.companyDetails?.address || ''}, ${invoice.companyDetails?.city || 'Mumbai'}, ${invoice.companyDetails?.state || 'Maharashtra'}</p>
          <h2><span class="invoice-type">VENDOR INVOICE</span></h2>
        </div>

        <div class="section">
          <div class="details-grid">
            <div>
              <div class="detail-item">
                <span class="detail-label">Invoice No:</span> ${invoice.invoiceNumber}
              </div>
              <div class="detail-item">
                <span class="detail-label">Invoice Date:</span> ${new Date(invoice.invoiceDate).toLocaleDateString()}
              </div>
              <div class="detail-item">
                <span class="detail-label">Auction:</span> ${typeof invoice.auction === 'object' ? invoice.auction?.title : 'N/A'}
              </div>
            </div>
            <div>
              <div class="detail-item">
                <span class="detail-label">Vendor/Consignor:</span> ${invoice.vendorDetails?.name || 'N/A'}
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span> ${invoice.vendorDetails?.email || 'N/A'}
              </div>
              <div class="detail-item">
                <span class="detail-label">Phone:</span> ${invoice.vendorDetails?.phone || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Lots Sold</div>
          <table class="table">
            <thead>
              <tr>
                <th>Lot #</th>
                <th>Description</th>
                <th>Buyer</th>
                <th>Hammer Price (₹)</th>
                <th>Sold Date</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.lots || []).map(lot => `
                <tr>
                  <td>${lot.lotNumber || 'N/A'}</td>
                  <td>${lot.description || 'N/A'}</td>
                  <td>${lot.buyerName || 'N/A'}</td>
                  <td>₹${(lot.hammerPrice || 0).toLocaleString()}</td>
                  <td>${lot.soldDate ? new Date(lot.soldDate).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div class="summary-row">
            <span>Total Hammer Price:</span>
            <span>₹${totalHammerPrice.toLocaleString()}</span>
          </div>
          <div class="summary-row">
            <span>Commission (${commissionRate}%):</span>
            <span>- ₹${commission.toLocaleString()}</span>
          </div>
          <div class="summary-row total">
            <span>Net Payable to Vendor:</span>
            <span>₹${netPayable.toLocaleString()}</span>
          </div>
        </div>

        <div style="clear: both; margin-top: 50px;">
          <p><strong>Amount in Words:</strong></p>
          <p>Rs. ${numberToWords(netPayable)} Only</p>
        </div>

        <div class="signature">
          <p>For Chronicle Vaults</p>
          <div class="signature-line"></div>
          <p>Authorised Signatory</p>
        </div>

        <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #8B5CF6;">
          <p style="margin: 0; font-size: 12px; color: #555;">
            <strong>Note:</strong> This is a vendor settlement invoice. Payment will be processed as per the terms and conditions of the consignment agreement.
          </p>
        </div>
      </body>
      </html>
    `;
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

    // Filter by auction ID (from URL or dropdown)
    const auctionId = typeof invoice.auction === 'object' ? invoice.auction?._id : invoice.auction;
    const activeAuctionFilter = selectedAuctionFilter || auctionFilter;
    const matchesAuction = activeAuctionFilter ? auctionId === activeAuctionFilter : true;

    // Filter by status
    const matchesStatus = statusFilter ? invoice.status === statusFilter : true;

    // Filter by invoice type
    const matchesInvoiceType = invoiceTypeFilter ? invoice.invoiceType === invoiceTypeFilter : true;

    // Filter by date range
    const invoiceDate = new Date(invoice.invoiceDate);
    const matchesDateFrom = dateFrom ? invoiceDate >= new Date(dateFrom) : true;
    const matchesDateTo = dateTo ? invoiceDate <= new Date(dateTo) : true;

    return matchesSearch && matchesAuction && matchesStatus && matchesInvoiceType && matchesDateFrom && matchesDateTo;
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

      {/* Filters Section */}
      <div className="mb-6 bg-white p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Invoice # or Buyer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Invoice Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type</label>
            <select
              value={invoiceTypeFilter}
              onChange={(e) => setInvoiceTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Customer">Customer Invoice</option>
              <option value="Vendor">Vendor Invoice</option>
              <option value="ASI">ASI Report</option>
            </select>
          </div>

          {/* Auction Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auction</label>
            <select
              value={selectedAuctionFilter}
              onChange={(e) => setSelectedAuctionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Auctions</option>
              {auctions.filter(a => a.isLotBidding && a.status === 'Ended').map(auction => (
                <option key={auction._id} value={auction._id}>
                  {auction.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Generated">Generated</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-3">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedAuctionFilter('');
                setStatusFilter('');
                setInvoiceTypeFilter('');
                setDateFrom('');
                setDateTo('');
                searchParams.delete('auction');
                setSearchParams(searchParams);
              }}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 pt-3 border-t">
          <span className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredInvoices.length}</span> of <span className="font-semibold text-gray-900">{invoices.length}</span> invoice{invoices.length !== 1 ? 's' : ''}
          </span>
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      invoice.invoiceType === 'Vendor' ? 'bg-purple-100 text-purple-800' :
                      invoice.invoiceType === 'ASI' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {invoice.invoiceType || 'Customer'}
                    </span>
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Invoice</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setCustomerSearch('');
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
                  {/* Customer Search */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Customer or Auction ID
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by customer name, email, or auction ID..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Customer Dropdown */}
                    {customerSearch && (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                        {customers
                          .filter(c =>
                            c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c._id?.includes(customerSearch)
                          )
                          .slice(0, 10)
                          .map(customer => (
                            <div
                              key={customer._id}
                              onClick={() => handleCustomerSelect(customer)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.email}</div>
                              <div className="text-xs text-gray-500">Phone: {customer.phone || 'N/A'}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                      <input
                        type="text"
                        value={selectedInvoice.invoiceNumber}
                        disabled
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Name</label>
                      <input
                        type="text"
                        value={formData.buyerDetails?.name || selectedInvoice.buyerDetails?.name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          buyerDetails: { ...formData.buyerDetails, name: e.target.value }
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.buyerDetails?.email || selectedInvoice.buyerDetails?.email || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          buyerDetails: { ...formData.buyerDetails, email: e.target.value }
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="text"
                        value={formData.buyerDetails?.phone || selectedInvoice.buyerDetails?.phone || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          buyerDetails: { ...formData.buyerDetails, phone: e.target.value }
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
                      <input
                        type="text"
                        value={formData.buyerDetails?.gstin || selectedInvoice.buyerDetails?.gstin || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          buyerDetails: { ...formData.buyerDetails, gstin: e.target.value }
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter GSTIN"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PAN</label>
                      <input
                        type="text"
                        value={formData.buyerDetails?.pan || selectedInvoice.buyerDetails?.pan || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          buyerDetails: { ...formData.buyerDetails, pan: e.target.value }
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter PAN"
                      />
                    </div>
                  </div>

                  {/* Billing Address Section */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Billing Address</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          value={formData.billingAddress?.street || selectedInvoice.billingAddress?.street || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            billingAddress: { ...formData.billingAddress, street: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter street address"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            value={formData.billingAddress?.city || selectedInvoice.billingAddress?.city || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              billingAddress: { ...formData.billingAddress, city: e.target.value }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                          <input
                            type="text"
                            value={formData.billingAddress?.state || selectedInvoice.billingAddress?.state || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              billingAddress: { ...formData.billingAddress, state: e.target.value }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                          <input
                            type="text"
                            value={formData.billingAddress?.zipCode || selectedInvoice.billingAddress?.zipCode || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              billingAddress: { ...formData.billingAddress, zipCode: e.target.value }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            placeholder="ZIP"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex-1">Shipping Address</h3>
                      <button
                        type="button"
                        onClick={() => {
                          // Copy billing address to shipping address
                          setFormData({
                            ...formData,
                            shippingAddress: { ...(formData.billingAddress || selectedInvoice.billingAddress) }
                          });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Same as Billing
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          value={formData.shippingAddress?.street || selectedInvoice.shippingAddress?.street || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            shippingAddress: { ...formData.shippingAddress, street: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter street address"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            value={formData.shippingAddress?.city || selectedInvoice.shippingAddress?.city || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              shippingAddress: { ...formData.shippingAddress, city: e.target.value }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                          <input
                            type="text"
                            value={formData.shippingAddress?.state || selectedInvoice.shippingAddress?.state || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              shippingAddress: { ...formData.shippingAddress, state: e.target.value }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                          <input
                            type="text"
                            value={formData.shippingAddress?.zipCode || selectedInvoice.shippingAddress?.zipCode || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              shippingAddress: { ...formData.shippingAddress, zipCode: e.target.value }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            placeholder="ZIP"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Packing & Forwarding Charges (₹)</label>
                    <input
                      type="number"
                      value={formData.packingForwardingCharges?.amount || selectedInvoice.packingForwardingCharges?.amount || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        packingForwardingCharges: { ...formData.packingForwardingCharges, amount: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Lots Display */}
                  {selectedInvoice.lots && selectedInvoice.lots.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice Lots ({selectedInvoice.lots.length})
                      </label>
                      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                        {selectedInvoice.lots.map((lot, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <div>
                              <span className="font-medium">Lot #{lot.lotNumber}</span>
                              <span className="text-sm text-gray-600 ml-2">{lot.description}</span>
                            </div>
                            <span className="font-semibold text-green-600">₹{lot.hammerPrice?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between gap-2 mt-6">
                <div>
                  {selectedInvoice && selectedInvoice.lots && selectedInvoice.lots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowSplitModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Split Invoice
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setCustomerSearch('');
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Split Invoice Modal */}
      {showSplitModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Split Invoice</h2>
              <button
                onClick={() => {
                  setShowSplitModal(false);
                  setSelectedLots([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Select lots to move to a new invoice. The selected lots will be removed from this invoice
                and a new invoice will be created for them.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Current Invoice:</strong> {selectedInvoice.invoiceNumber}<br />
                  <strong>Total Lots:</strong> {selectedInvoice.lots?.length || 0}<br />
                  <strong>Selected for Split:</strong> {selectedLots.length}
                </p>
              </div>

              <div className="space-y-2">
                {selectedInvoice.lots?.map((lot) => (
                  <div
                    key={lot.lotNumber}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedLots.includes(lot.lotNumber)
                        ? 'bg-purple-50 border-purple-500'
                        : 'bg-white border-gray-300 hover:border-purple-300'
                    }`}
                    onClick={() => {
                      if (selectedLots.includes(lot.lotNumber)) {
                        setSelectedLots(selectedLots.filter(l => l !== lot.lotNumber));
                      } else {
                        setSelectedLots([...selectedLots, lot.lotNumber]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedLots.includes(lot.lotNumber)}
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
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowSplitModal(false);
                  setSelectedLots([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSplitInvoice}
                disabled={selectedLots.length === 0 || selectedLots.length === selectedInvoice.lots?.length}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Split Invoice ({selectedLots.length} lots)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionInvoiceManagement;
