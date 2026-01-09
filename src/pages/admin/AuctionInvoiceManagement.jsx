import React, { useState, useEffect } from 'react';
import { FileText, Edit2, Download, Trash2, Search, Eye, X, Filter, ArrowRightLeft, Send } from 'lucide-react';
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
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedLots, setSelectedLots] = useState([]);

  // Lot Transfer states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSourceInvoice, setTransferSourceInvoice] = useState(null);
  const [selectedLotsForTransfer, setSelectedLotsForTransfer] = useState([]);
  const [targetBuyerSearch, setTargetBuyerSearch] = useState('');
  const [selectedTargetBuyer, setSelectedTargetBuyer] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [auctionBuyers, setAuctionBuyers] = useState([]); // Buyers from same auction
  const [loadingBuyers, setLoadingBuyers] = useState(false);

  // Unsold Lot Assignment states
  const [showUnsoldModal, setShowUnsoldModal] = useState(false);
  const [unsoldLots, setUnsoldLots] = useState([]);
  const [selectedUnsoldLots, setSelectedUnsoldLots] = useState({});
  const [unsoldBuyerSearch, setUnsoldBuyerSearch] = useState('');
  const [selectedUnsoldBuyer, setSelectedUnsoldBuyer] = useState(null);
  const [assigningUnsold, setAssigningUnsold] = useState(false);
  const [loadingUnsoldLots, setLoadingUnsoldLots] = useState(false);
  const [currentAuctionForUnsold, setCurrentAuctionForUnsold] = useState(null);

  // Global Commission state - Load from localStorage or use defaults
  const [globalCommission, setGlobalCommission] = useState(() => {
    const saved = localStorage.getItem('globalCommission');
    return saved ? parseFloat(saved) : 12;
  });
  const [commissionCutoffDate, setCommissionCutoffDate] = useState(() => {
    const saved = localStorage.getItem('commissionCutoffDate');
    return saved || new Date().toISOString().split('T')[0];
  });

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
    if (!window.confirm('Are you sure you want to delete this invoice? All subsequent invoices will be automatically renumbered.')) return;

    try {
      const response = await auctionInvoiceService.deleteInvoice(id);
      toast.success(response.message || 'Invoice deleted successfully.');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
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

  const handleSendToCustomer = async (invoice) => {
    try {
      const response = await api.put(`/auction-invoices/${invoice._id}/send-to-customer`);

      if (response.data.success) {
        toast.success(response.data.message);
        fetchInvoices(); // Refresh the list to show updated status
      }
    } catch (error) {
      console.error('Error sending invoice to customer:', error);
      toast.error('Failed to send invoice to customer');
    }
  };

  const handleSaveCommissionSettings = () => {
    try {
      localStorage.setItem('globalCommission', globalCommission.toString());
      localStorage.setItem('commissionCutoffDate', commissionCutoffDate);
      toast.success('Commission settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save commission settings');
    }
  };

  const generateInvoiceHTML = (invoice) => {
    // Calculate commission
    const invoiceDate = new Date(invoice.invoiceDate);
    const cutoffDate = new Date(commissionCutoffDate);
    const useGlobalCommission = invoiceDate >= cutoffDate;
    const commissionRate = useGlobalCommission ? globalCommission : (invoice.buyerDetails?.commissionPercentage || 12);
    const totalHammerPrice = (invoice.lots || [invoice.lotDetails]).reduce((sum, lot) => sum + (lot.hammerPrice || 0), 0);
    const totalCommission = (totalHammerPrice * commissionRate) / 100;

    // Calculate GST on commission (9% CGST + 9% SGST)
    const cgstOnCommission = (totalCommission * 9) / 100;
    const sgstOnCommission = (totalCommission * 9) / 100;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; line-height: 1.4; }
          .container { max-width: 210mm; margin: 0 auto; }

          /* Header */
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .company-info { flex: 1; }
          .company-name { font-size: 20px; font-weight: bold; color: #d35400; margin-bottom: 2px; }
          .tagline { font-size: 10px; color: #666; margin-bottom: 5px; }
          .contact-info { font-size: 9px; line-height: 1.6; }

          /* Title */
          .invoice-title { text-align: center; font-size: 16px; font-weight: bold; margin: 15px 0; text-decoration: underline; }

          /* Two column layout */
          .two-col { display: flex; gap: 20px; margin-bottom: 15px; }
          .col-left { flex: 1; }
          .col-right { flex: 1; }

          .section-title { font-weight: bold; margin-bottom: 5px; font-size: 10px; }
          .info-row { margin-bottom: 3px; font-size: 10px; }
          .label { display: inline-block; width: 100px; font-weight: bold; }

          /* Table */
          .table-container { margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #000; padding: 5px; text-align: left; }
          th { background-color: #e8e8e8; font-weight: bold; text-align: center; }
          td { text-align: center; }
          td.desc { text-align: left; }

          /* Payment section */
          .payment-section { display: flex; gap: 20px; margin-top: 15px; }
          .payment-detail { flex: 0 0 45%; border: 1px solid #000; padding: 10px; }
          .payment-calc { flex: 1; border: 1px solid #000; padding: 10px; }
          .calc-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px; }
          .calc-row.total { font-weight: bold; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }

          /* Words */
          .amount-words { margin: 15px 0; padding: 8px; border: 1px solid #000; font-size: 10px; }

          /* Remittance */
          .remittance { margin: 10px 0; font-size: 9px; font-style: italic; }

          /* Bank details */
          .bank-section { display: flex; gap: 10px; margin: 15px 0; }
          .bank-box { flex: 1; border: 1px solid #000; padding: 10px; font-size: 9px; }
          .bank-box h4 { font-size: 10px; margin-bottom: 5px; }

          /* Signatures */
          .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
          .sign-box { text-align: center; }
          .sign-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; padding-top: 5px; font-size: 9px; }

          /* Footer */
          .footer { margin-top: 20px; border-top: 2px solid #333; padding-top: 10px; text-align: center; font-size: 9px; }

          @media print {
            body { padding: 0; }
            .container { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <div class="company-name">CHRONICLE VAULTS</div>
              <div class="tagline">Buy, Sell, Auction • Vintage Coins | Stamps | Collectibles</div>
              <div class="contact-info">
                16/189, Netajinagar, Meghaninagar, Ahmedabad-380016, Gujarat, India<br>
                Tel: +91 84608 49878<br>
                Email: chroniclevaults@gmail.com<br>
                Web: chroniclevaults.com
              </div>
            </div>
          </div>

          <!-- Title -->
          <div class="invoice-title">Tax Invoice</div>

          <!-- Consignee and Invoice Details -->
          <div class="two-col">
            <div class="col-left">
              <div class="section-title">Consignee:</div>
              <div class="info-row"><strong>${invoice.buyerDetails.name}</strong></div>
              <div class="info-row">${invoice.shippingAddress?.street || invoice.billingAddress?.street || ''}</div>
              <div class="info-row">${invoice.shippingAddress?.city || invoice.billingAddress?.city || ''}, ${invoice.shippingAddress?.state || invoice.billingAddress?.state || ''} - ${invoice.shippingAddress?.zipCode || invoice.billingAddress?.zipCode || ''}</div>
              <div class="info-row">Email: ${invoice.buyerDetails.email || ''}</div>
              <div class="info-row">Mobile: ${invoice.buyerDetails.phone || ''}</div>
              <div class="info-row">State Code: ${invoice.billingAddress?.stateCode || '24'}</div>
              <div class="info-row">GST NO: ${invoice.buyerDetails.gstin || 'N/A'}</div>
            </div>
            <div class="col-right">
              <div class="info-row"><span class="label">Auction No.:</span> ${invoice.auction?._id ? `AUC-${invoice.auction._id.toString().slice(-6).toUpperCase()}` : 'N/A'}</div>
              <div class="info-row"><span class="label">Auction Date:</span> ${invoice.auction?.startDate ? new Date(invoice.auction.startDate).toLocaleDateString() : 'N/A'}</div>
              <div class="info-row"><span class="label">Invoice No.:</span> ${invoice.invoiceNumber}</div>
              <div class="info-row"><span class="label">Invoice Date:</span> ${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
              <div class="info-row"><span class="label">Bidder No.:</span> ${invoice.buyerDetails.buyerNumber || 'N/A'}</div>
              <div class="info-row"><span class="label">GST No:</span> ${invoice.buyerDetails.gstin || 'N/A'}</div>
            </div>
          </div>

          <!-- Lot Table -->
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">Sr.</th>
                  <th style="width: 60px;">Lot#</th>
                  <th>Description</th>
                  <th style="width: 40px;">Qty</th>
                  <th style="width: 80px;">HSN Number</th>
                  <th style="width: 60px;">GST(%)</th>
                  <th style="width: 100px;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.lots || [invoice.lotDetails]).map((lot, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${lot.lotNumber || invoice.lotNumbers?.[idx] || invoice.lotNumber || 'N/A'}</td>
                    <td class="desc">${lot.description || lot.detailedDescription || ''}</td>
                    <td>${lot.quantity || 1}</td>
                    <td>9705</td>
                    <td>5.00</td>
                    <td>₹${(lot.hammerPrice || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Payment Detail and Calculation -->
          <div class="payment-section">
            <div class="payment-detail">
              <div class="section-title">Payment Detail</div>
              <div class="info-row"><span class="label">Payment Mode:</span> Cash / Cheque / Contra</div>
              <div class="info-row"><span class="label">Bank Name:</span> </div>
              <div class="info-row"><span class="label">Cheque No:</span> </div>
              <div class="info-row"><span class="label">Cheque Date:</span> </div>
              <div class="info-row"><span class="label">Amount in Rs:</span> </div>
            </div>
            <div class="payment-calc">
              <div class="calc-row">
                <span>Total Hammer Price:</span>
                <span>₹${totalHammerPrice.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>(+)Commission (${commissionRate}%):</span>
                <span>₹${totalCommission.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>(+)CGST On Hammer (2.5%) on (${totalHammerPrice}):</span>
                <span>₹${(invoice.gst.cgst || 0).toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>(+)SGST On Hammer (2.5%) on (${totalHammerPrice}):</span>
                <span>₹${(invoice.gst.sgst || 0).toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>(+) Shipping:</span>
                <span>₹0</span>
              </div>
              ${(invoice.insuranceCharges?.amount > 0 && !invoice.insuranceCharges?.declined) ? `
              <div class="calc-row">
                <span>(+) Insurance:</span>
                <span>₹${(invoice.insuranceCharges?.amount || 0).toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="calc-row">
                <span>(+)CGST on Service @ 9%:</span>
                <span>₹${cgstOnCommission.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>(+)SGST on Service @ 9%:</span>
                <span>₹${sgstOnCommission.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>Round Off:</span>
                <span>₹${invoice.amounts.roundOff.toFixed(2)}</span>
              </div>
              <div class="calc-row total">
                <span>Total Payable (₹):</span>
                <span>₹${invoice.amounts.totalPayable.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- Amount in Words -->
          <div class="amount-words">
            <strong>Amount in words:</strong> Rs. ${numberToWords(invoice.amounts.totalPayable)} Only
          </div>

          <!-- Remittance Instruction -->
          <div class="remittance">
            <strong>Remittance Instruction:</strong> Payment in full is due within seven(7) days of the date of invoice. *Shipping charge will be added as per the instruction
          </div>

          <!-- Bank Transfer Details -->
          <div class="bank-section">
            <div class="bank-box">
              <h4>Bank Transfer To:</h4>
              <div><strong>A/C Name:</strong> urhistory</div>
              <div><strong>Bank:</strong> Saraswat Bank, cgroad, Ahmedabad</div>
              <div><strong>A/c No:</strong> 610000000016716</div>
              <div><strong>RTGS/NEFT IFSC code:</strong> SRCB000362</div>
            </div>
            <div class="bank-box">
              <div style="text-align: right; margin-top: 20px;">
                <strong>For, Chronicle Vaults</strong>
              </div>
            </div>
          </div>

          <!-- Signatures -->
          <div class="signature-section">
            <div class="sign-box">
              <div class="sign-line">Receiver's Sign</div>
              <div style="margin-top: 10px; font-size: 9px;">Date: _______________</div>
            </div>
            <div class="sign-box">
              <div class="sign-line">Auth. Signatory</div>
              <div style="margin-top: 10px; font-size: 9px;">Subject To Ahmedabad Jurisdiction</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div>GST NO: 24BCZPD7594Q1ZE &nbsp;&nbsp;&nbsp; PAN NO: BCZPD7594Q &nbsp;&nbsp;&nbsp; HSN 9705 – CGST @2.5% + SGST @2.5% (On Goods) | CGST @9% + SGST @9% (On Commission/Service)</div>
          </div>
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

  // Lot Transfer Functions
  const openTransferModal = async (invoice) => {
    setTransferSourceInvoice(invoice);
    setSelectedLotsForTransfer([]);
    setTargetBuyerSearch('');
    setSelectedTargetBuyer(null);
    setShowTransferModal(true);

    // Fetch ALL registered buyers from all auctions
    try {
      setLoadingBuyers(true);
      const response = await api.get('/lot-transfer/all-buyers');

      if (response.success) {
        // Each buyer has: buyer (user object), auctionReg (registration), lots (array of lots)
        setAuctionBuyers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
      toast.error('Failed to load registered buyers');
      setAuctionBuyers([]);
    } finally {
      setLoadingBuyers(false);
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
    if (!transferSourceInvoice || !selectedTargetBuyer) {
      toast.error('Please select target buyer');
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

      // Safely extract buyer IDs
      const fromBuyerId = transferSourceInvoice.buyer?._id || transferSourceInvoice.buyer;

      // Fix: Properly handle null buyer object
      let toBuyerId;
      if (selectedTargetBuyer.buyer && typeof selectedTargetBuyer.buyer === 'object') {
        toBuyerId = selectedTargetBuyer.buyer._id;
      } else {
        toBuyerId = selectedTargetBuyer.buyer;
      }

      if (!fromBuyerId || !toBuyerId) {
        toast.error('Invalid buyer information. Please try again.');
        return;
      }

      const response = await api.post('/lot-transfer/transfer', {
        auctionId: auctionId,
        fromBuyerId: fromBuyerId,
        toBuyerId: toBuyerId,
        lotNumbers: selectedLotsForTransfer
      });

      if (response.success) {
        toast.success(`Successfully transferred ${selectedLotsForTransfer.length} lots`);
        setShowTransferModal(false);
        setTransferSourceInvoice(null);
        setSelectedLotsForTransfer([]);
        setSelectedTargetBuyer(null);
        setTargetBuyerSearch('');
        setAuctionBuyers([]);
        fetchInvoices(); // Refresh invoices
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error(error.response?.data?.message || 'Failed to transfer lots');
    } finally {
      setTransferring(false);
    }
  };

  const filteredTargetBuyers = auctionBuyers.filter(buyerData => {
    // Skip if buyer data is invalid
    if (!buyerData || !buyerData.buyer) return false;

    // Exclude current invoice buyer
    const currentBuyerId = transferSourceInvoice?.buyer?._id || transferSourceInvoice?.buyer;
    if (buyerData.buyer._id === currentBuyerId) return false;

    // Filter by search - search in name, email, phone, and auction registration ID
    if (!targetBuyerSearch) return true;
    const searchLower = targetBuyerSearch.toLowerCase();
    const buyer = buyerData.buyer;
    const auctionReg = buyerData.auctionReg;

    return buyer.name?.toLowerCase().includes(searchLower) ||
           buyer.email?.toLowerCase().includes(searchLower) ||
           buyer.phone?.toLowerCase().includes(searchLower) ||
           auctionReg?.registrationId?.toLowerCase().includes(searchLower) ||
           auctionReg?.auctionId?.toLowerCase().includes(searchLower);
  });

  // Unsold Lot Assignment Functions
  const openUnsoldLotsModal = async (auctionId) => {
    setCurrentAuctionForUnsold(auctionId);
    setShowUnsoldModal(true);
    setSelectedUnsoldLots({});
    setUnsoldBuyerSearch('');
    setSelectedUnsoldBuyer(null);

    // Fetch unsold lots for this auction
    try {
      setLoadingUnsoldLots(true);
      const response = await api.get(`/lot-transfer/unsold/${auctionId}`);

      if (response.success) {
        setUnsoldLots(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching unsold lots:', error);
      toast.error('Failed to load unsold lots');
      setUnsoldLots([]);
    } finally {
      setLoadingUnsoldLots(false);
    }

    // Also fetch buyers for assignment
    try {
      const response = await api.get('/lot-transfer/all-buyers');
      if (response.success) {
        setAuctionBuyers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
    }
  };

  const toggleUnsoldLotSelection = (lotNumber, currentPrice = 0) => {
    setSelectedUnsoldLots(prev => {
      const newSelection = { ...prev };
      if (newSelection[lotNumber]) {
        delete newSelection[lotNumber];
      } else {
        newSelection[lotNumber] = currentPrice;
      }
      return newSelection;
    });
  };

  const updateUnsoldLotPrice = (lotNumber, price) => {
    setSelectedUnsoldLots(prev => ({
      ...prev,
      [lotNumber]: parseFloat(price) || 0
    }));
  };

  const handleAssignUnsoldLots = async () => {
    if (!selectedUnsoldBuyer) {
      toast.error('Please select a buyer');
      return;
    }

    const lotNumbers = Object.keys(selectedUnsoldLots).map(Number);

    if (lotNumbers.length === 0) {
      toast.error('Please select at least one unsold lot');
      return;
    }

    // Validate all prices are set
    const allPricesValid = lotNumbers.every(lotNum => {
      const price = selectedUnsoldLots[lotNum];
      return price && price > 0;
    });

    if (!allPricesValid) {
      toast.error('Please set valid hammer prices for all selected lots');
      return;
    }

    try {
      setAssigningUnsold(true);

      // Safely extract buyer ID
      const buyerId = selectedUnsoldBuyer.buyer?._id || selectedUnsoldBuyer.buyer;

      if (!buyerId) {
        toast.error('Invalid buyer information. Please try again.');
        return;
      }

      const response = await api.post('/lot-transfer/assign-unsold', {
        auctionId: currentAuctionForUnsold,
        buyerId: buyerId,
        lotNumbers,
        hammerPrices: selectedUnsoldLots  // Send as object {lotNumber: price}
      });

      if (response.success) {
        toast.success(`Successfully assigned ${lotNumbers.length} unsold lots`);
        setShowUnsoldModal(false);
        setSelectedUnsoldLots({});
        setSelectedUnsoldBuyer(null);
        setUnsoldLots([]);
        setCurrentAuctionForUnsold(null);
        fetchInvoices(); // Refresh invoices
      }
    } catch (error) {
      console.error('Assign unsold lots error:', error);
      toast.error(error.response?.data?.message || 'Failed to assign unsold lots');
    } finally {
      setAssigningUnsold(false);
    }
  };


  const filteredUnsoldBuyers = auctionBuyers.filter(buyerData => {
    // Skip if buyer data is invalid
    if (!buyerData || !buyerData.buyer) return false;

    if (!unsoldBuyerSearch) return true;
    const searchLower = unsoldBuyerSearch.toLowerCase();
    const buyer = buyerData.buyer;
    const auctionReg = buyerData.auctionReg;

    return buyer.name?.toLowerCase().includes(searchLower) ||
           buyer.email?.toLowerCase().includes(searchLower) ||
           buyer.phone?.toLowerCase().includes(searchLower) ||
           auctionReg?.registrationId?.toLowerCase().includes(searchLower);
  });

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
        {selectedAuctionFilter && (
          <button
            onClick={() => openUnsoldLotsModal(selectedAuctionFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Assign Unsold Lots
          </button>
        )}
      </div>

      {/* Global Commission Setting */}
      <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-semibold text-purple-900 whitespace-nowrap">
            Commission (%):
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={globalCommission}
            onChange={(e) => setGlobalCommission(parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-1 text-sm border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-600">|</span>
          <label className="text-sm font-semibold text-purple-900 whitespace-nowrap">
            Apply from date:
          </label>
          <input
            type="date"
            value={commissionCutoffDate}
            onChange={(e) => setCommissionCutoffDate(e.target.value)}
            className="px-2 py-1 text-sm border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleSaveCommissionSettings}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors font-medium"
          >
            Save
          </button>
          <p className="text-xs text-gray-600 italic">
            Invoices before this date keep their original commission • Display only, not added to total
          </p>
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
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 italic">
                    ₹{(() => {
                      const totalHammerPrice = invoice.lots?.reduce((sum, lot) => sum + (lot.hammerPrice || 0), 0) || 0;
                      // Check if invoice date is after cutoff date
                      const invoiceDate = new Date(invoice.invoiceDate);
                      const cutoffDate = new Date(commissionCutoffDate);
                      const useGlobalCommission = invoiceDate >= cutoffDate;

                      const commissionRate = useGlobalCommission ? globalCommission : (invoice.buyerDetails?.commissionPercentage || 12);
                      const commission = (totalHammerPrice * commissionRate) / 100;
                      return commission.toLocaleString();
                    })()}
                    <span className="text-xs text-gray-500 ml-1">
                      ({(() => {
                        const invoiceDate = new Date(invoice.invoiceDate);
                        const cutoffDate = new Date(commissionCutoffDate);
                        const useGlobalCommission = invoiceDate >= cutoffDate;
                        return useGlobalCommission ? globalCommission : (invoice.buyerDetails?.commissionPercentage || 12);
                      })()}%)
                    </span>
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
                      {invoice.invoiceType === 'Customer' && (
                        <button
                          onClick={() => handleSendToCustomer(invoice)}
                          className={`${invoice.sentToCustomer ? 'text-purple-600 hover:text-purple-900' : 'text-orange-600 hover:text-orange-900'}`}
                          title={invoice.sentToCustomer ? 'Remove from customer' : 'Send to customer'}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Charges (₹) - Optional</label>
                    <input
                      type="number"
                      value={formData.insuranceCharges?.amount || selectedInvoice.insuranceCharges?.amount || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        insuranceCharges: {
                          amount: parseFloat(e.target.value) || 0,
                          declined: parseFloat(e.target.value) === 0
                        }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter insurance amount (optional)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave as 0 if insurance is not required</p>
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
                  setTargetBuyerSearch('');
                  setSelectedTargetBuyer(null);
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
                  <span className="text-gray-600">Buyer:</span>{' '}
                  <span className="font-semibold">{transferSourceInvoice.buyerDetails?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Lots:</span>{' '}
                  <span className="font-semibold">{transferSourceInvoice.lots?.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>{' '}
                  <span className="font-semibold">₹{transferSourceInvoice.amounts?.totalPayable?.toLocaleString()}</span>
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

            {/* Select Target Buyer */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Select Target Buyer</h3>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or auction ID..."
                  value={targetBuyerSearch}
                  onChange={(e) => setTargetBuyerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {selectedTargetBuyer && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-green-900">{selectedTargetBuyer.buyer.name}</div>
                      <div className="text-sm text-green-700">{selectedTargetBuyer.buyer.email}</div>
                      {selectedTargetBuyer.auctionReg?.registrationId && (
                        <div className="text-xs text-green-600 font-mono mt-1">
                          Auction ID: {selectedTargetBuyer.auctionReg.registrationId}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedTargetBuyer(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {!selectedTargetBuyer && (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {loadingBuyers ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading registered buyers...
                    </div>
                  ) : filteredTargetBuyers.length > 0 ? (
                    filteredTargetBuyers.map((buyerData) => (
                      <div
                        key={buyerData.buyer._id}
                        onClick={() => setSelectedTargetBuyer(buyerData)}
                        className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{buyerData.buyer.name}</div>
                        <div className="text-sm text-gray-600">{buyerData.buyer.email}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                          {buyerData.auctionReg?.registrationId && (
                            <span className="font-mono bg-purple-100 px-2 py-0.5 rounded">
                              ID: {buyerData.auctionReg.registrationId}
                            </span>
                          )}
                          {buyerData.buyer.phone && (
                            <span>📱 {buyerData.buyer.phone}</span>
                          )}
                          {buyerData.lots && buyerData.lots.length > 0 && (
                            <span className="text-green-600">
                              {buyerData.lots.length} lot(s)
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {targetBuyerSearch
                        ? 'No buyers found matching your search'
                        : 'No registered buyers available'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transfer Summary */}
            {selectedLotsForTransfer.length > 0 && selectedTargetBuyer && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-purple-900 mb-2">Transfer Summary</h3>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-600">Transferring:</span>{' '}
                    <span className="font-semibold">{selectedLotsForTransfer.length} lots</span>
                  </div>
                  <div>
                    <span className="text-gray-600">From:</span>{' '}
                    <span className="font-semibold">{transferSourceInvoice.buyerDetails?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">To:</span>{' '}
                    <span className="font-semibold">{selectedTargetBuyer.buyer.name}</span>
                    {selectedTargetBuyer.auctionReg?.registrationId && (
                      <span className="text-xs text-purple-600 ml-2">
                        (ID: {selectedTargetBuyer.auctionReg.registrationId})
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
                  setTargetBuyerSearch('');
                  setSelectedTargetBuyer(null);
                  setAuctionBuyers([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferLots}
                disabled={transferring || selectedLotsForTransfer.length === 0 || !selectedTargetBuyer}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {transferring ? 'Transferring...' : `Transfer ${selectedLotsForTransfer.length} Lots`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsold Lots Assignment Modal */}
      {showUnsoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Assign Unsold Lots</h2>
                <button
                  onClick={() => {
                    setShowUnsoldModal(false);
                    setUnsoldLots([]);
                    setSelectedUnsoldLots({});
                    setSelectedUnsoldBuyer(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Unsold Lots Selection */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Select Unsold Lots & Set Hammer Price</h3>
                {loadingUnsoldLots ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading unsold lots...
                  </div>
                ) : unsoldLots.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {unsoldLots.map((lot) => {
                      const isSelected = selectedUnsoldLots[lot.lotNumber] !== undefined;
                      return (
                        <div
                          key={lot.lotNumber}
                          className={`p-4 border rounded-lg ${
                            isSelected ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleUnsoldLotSelection(lot.lotNumber, lot.startingPrice || lot.reservePrice || 0)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-lg">Lot #{lot.lotNumber}</div>
                                <div className="text-sm text-gray-600 mb-1">{lot.description}</div>

                                {/* ALWAYS show pricing information */}
                                <div className="flex gap-2 text-xs mt-2 flex-wrap bg-gradient-to-r from-blue-50 to-orange-50 p-2.5 rounded-lg border-2 border-blue-200">
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Starting:</span>
                                    <span className="font-bold text-blue-700">₹{(lot.startingPrice || 0).toLocaleString()}</span>
                                  </div>
                                  <span className="text-gray-400">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Reserve:</span>
                                    <span className="font-bold text-orange-700">₹{(lot.reservePrice || 0).toLocaleString()}</span>
                                  </div>
                                  <span className="text-gray-400">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Last Bid:</span>
                                    <span className="font-bold text-green-700">₹{(lot.currentBid || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Hammer Price:</label>
                                <input
                                  type="number"
                                  value={selectedUnsoldLots[lot.lotNumber] || ''}
                                  onChange={(e) => updateUnsoldLotPrice(lot.lotNumber, e.target.value)}
                                  placeholder="0"
                                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No unsold lots found for this auction
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {Object.keys(selectedUnsoldLots).length} lot(s)
                </p>
              </div>

              {/* Select Buyer */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Select Buyer</h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or auction ID..."
                    value={unsoldBuyerSearch}
                    onChange={(e) => setUnsoldBuyerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {selectedUnsoldBuyer && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-green-900">{selectedUnsoldBuyer.buyer.name}</div>
                        <div className="text-sm text-green-700">{selectedUnsoldBuyer.buyer.email}</div>
                        {selectedUnsoldBuyer.auctionReg?.registrationId && (
                          <div className="text-xs text-green-600 font-mono mt-1">
                            Auction ID: {selectedUnsoldBuyer.auctionReg.registrationId}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedUnsoldBuyer(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {!selectedUnsoldBuyer && (
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredUnsoldBuyers.length > 0 ? (
                      filteredUnsoldBuyers.map((buyerData) => (
                        <div
                          key={buyerData.buyer._id}
                          onClick={() => setSelectedUnsoldBuyer(buyerData)}
                          className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{buyerData.buyer.name}</div>
                          <div className="text-sm text-gray-600">{buyerData.buyer.email}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                            {buyerData.auctionReg?.registrationId && (
                              <span className="font-mono bg-green-100 px-2 py-0.5 rounded">
                                ID: {buyerData.auctionReg.registrationId}
                              </span>
                            )}
                            {buyerData.buyer.phone && (
                              <span>📱 {buyerData.buyer.phone}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        {unsoldBuyerSearch
                          ? 'No buyers found matching your search'
                          : 'No registered buyers available'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnsoldModal(false);
                    setUnsoldLots([]);
                    setSelectedUnsoldLots({});
                    setSelectedUnsoldBuyer(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignUnsoldLots}
                  disabled={assigningUnsold || Object.keys(selectedUnsoldLots).length === 0 || !selectedUnsoldBuyer}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {assigningUnsold ? 'Assigning...' : `Assign ${Object.keys(selectedUnsoldLots).length} Lot(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionInvoiceManagement;
