import api from '../utils/api';

const BID_TRACKING_ENDPOINTS = {
  GET_ALL_BIDS: '/auctions/admin/bid-tracking',
  GET_AUCTIONS_LIST: '/auctions'
};

export const bidTrackingService = {
  // Get all bids with filters
  getAllBids: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.auctionId) params.append('auctionId', filters.auctionId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`${BID_TRACKING_ENDPOINTS.GET_ALL_BIDS}?${params.toString()}`);
    return response;
  },

  // Get auctions list for filter dropdown
  getAuctionsList: async () => {
    const response = await api.get(BID_TRACKING_ENDPOINTS.GET_AUCTIONS_LIST);
    return response;
  }
};

export default bidTrackingService;
