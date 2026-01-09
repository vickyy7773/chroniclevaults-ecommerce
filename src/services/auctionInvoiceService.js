import api from '../utils/api';

const INVOICE_ENDPOINTS = {
  BASE: '/auction-invoices',
  BY_ID: (id) => `/auction-invoices/${id}`,
  BY_AUCTION: (auctionId) => `/auction-invoices/auction/${auctionId}`,
  MARK_PAID: (id) => `/auction-invoices/${id}/pay`,
  AVAILABLE_NUMBERS: '/auction-invoices/available-numbers'
};

export const auctionInvoiceService = {
  // Get all invoices
  getAllInvoices: async () => {
    const response = await api.get(INVOICE_ENDPOINTS.BASE);
    return response;
  },

  // Get invoice by ID
  getInvoiceById: async (id) => {
    const response = await api.get(INVOICE_ENDPOINTS.BY_ID(id));
    return response;
  },

  // Get invoices for specific auction
  getInvoicesByAuction: async (auctionId) => {
    const response = await api.get(INVOICE_ENDPOINTS.BY_AUCTION(auctionId));
    return response;
  },

  // Create new invoice
  createInvoice: async (invoiceData) => {
    const response = await api.post(INVOICE_ENDPOINTS.BASE, invoiceData);
    return response;
  },

  // Update invoice
  updateInvoice: async (id, invoiceData) => {
    const response = await api.put(INVOICE_ENDPOINTS.BY_ID(id), invoiceData);
    return response;
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    const response = await api.delete(INVOICE_ENDPOINTS.BY_ID(id));
    return response;
  },

  // Mark invoice as paid
  markAsPaid: async (id, paymentMode) => {
    const response = await api.put(INVOICE_ENDPOINTS.MARK_PAID(id), { paymentMode });
    return response;
  },

  // Get available invoice numbers for reassignment
  getAvailableNumbers: async () => {
    const response = await api.get(INVOICE_ENDPOINTS.AVAILABLE_NUMBERS);
    return response;
  }
};

export default auctionInvoiceService;
