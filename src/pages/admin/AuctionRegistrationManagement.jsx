import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  User,
  Calendar,
  Hash,
  Globe,
  Clock,
  Coins,
  Edit,
  Search
} from 'lucide-react';
import api from '../../utils/api';

const AuctionRegistrationManagement = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [auctionCoins, setAuctionCoins] = useState(0);
  const [showCoinsEditModal, setShowCoinsEditModal] = useState(false);
  const [editingCoins, setEditingCoins] = useState(0);
  const [updatingCoins, setUpdatingCoins] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    // Reset to page 1 when filter changes
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    fetchRegistrations();
  }, [filter, currentPage]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const statusParam = filter !== 'all' ? `status=${filter}` : '';
      const pageParam = `page=${currentPage}`;
      const limitParam = 'limit=20';
      const queryParams = [statusParam, pageParam, limitParam].filter(Boolean).join('&');
      const url = `/auction-registration/admin/all${queryParams ? `?${queryParams}` : ''}`;

      const response = await api.get(url);
      console.log('📊 Fetched Registrations:', response);

      if (response.registrations) {
        setRegistrations(response.registrations);
        setPagination(response.pagination);
      } else {
        // Fallback for old API response format
        setRegistrations(response || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to fetch registrations');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId) => {
    // Validate coins
    if (auctionCoins < 0 || isNaN(auctionCoins)) {
      toast.error('Please enter a valid number (0 or greater)');
      return;
    }

    if (!window.confirm(`Approve registration and assign ${auctionCoins} auction coins? User must already have an e-commerce account with the same email.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.put(`/auction-registration/admin/approve/${registrationId}`, {
        auctionCoins
      });
      toast.success(response.message || 'Registration approved successfully!');
      fetchRegistrations();
      setShowDetailsModal(false);
      setAuctionCoins(0); // Reset coins
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error(error.response?.message || 'Failed to approve registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (registrationId) => {
    const reason = prompt('Enter reason for rejection:');
    if (!reason) {
      toast.error('Reason is required to reject registration');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/auction-registration/admin/reject/${registrationId}`, { reason });
      toast.success('Registration rejected');
      fetchRegistrations();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Failed to reject registration');
    } finally {
      setActionLoading(false);
    }
  };

  const viewDetails = (registration) => {
    console.log('📋 Selected Registration:', registration);
    console.log('📋 userId:', registration.userId);
    console.log('📋 auctionCoins:', registration.userId?.auctionCoins);
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  };

  const openCoinsEditModal = () => {
    setEditingCoins(selectedRegistration?.userId?.auctionCoins || 0);
    setShowCoinsEditModal(true);
  };

  const handleUpdateCoins = async () => {
    if (editingCoins < 0 || isNaN(editingCoins)) {
      toast.error('Please enter a valid number (0 or greater)');
      return;
    }

    try {
      setUpdatingCoins(true);
      await api.put(`/users/${selectedRegistration.userId._id}/auction-coins`, {
        auctionCoins: editingCoins
      });
      toast.success('Auction coins updated successfully!');
      setShowCoinsEditModal(false);
      fetchRegistrations();
    } catch (error) {
      console.error('Error updating coins:', error);
      toast.error(error.response?.data?.message || 'Failed to update coins');
    } finally {
      setUpdatingCoins(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-accent-600" />
          <h1 className="text-3xl font-bold text-gray-900">Auction Registration Management</h1>
        </div>
        <p className="text-gray-600">Review and manage auction registration applications</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Auction ID, Name, Email, or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 text-gray-900 placeholder-gray-500 font-medium"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-accent-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({registrations.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Registrations List */}
      {(() => {
        const filteredRegistrations = registrations.filter(reg => {
          if (!searchTerm) return true;
          const search = searchTerm.toLowerCase();
          return (
            (reg.auctionId && reg.auctionId.toLowerCase().includes(search)) ||
            (reg.fullName && reg.fullName.toLowerCase().includes(search)) ||
            (reg.email && reg.email.toLowerCase().includes(search)) ||
            (reg.mobile && reg.mobile.includes(search))
          );
        });

        return filteredRegistrations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No registrations found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-accent-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-accent-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {registration.title} {registration.fullName}
                          </div>
                          {registration.auctionId && (
                            <div className="text-xs font-mono text-accent-600 font-bold">
                              {registration.auctionId}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {registration.emailVerified ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="text-red-600">Not Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{registration.email}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {registration.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {registration.companyName || 'N/A'}
                      </div>
                      {registration.gstNumber && (
                        <div className="text-xs text-gray-500">
                          GST: {registration.gstNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(registration.submittedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(registration.status)}`}>
                        {registration.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetails(registration)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {registration.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(registration._id)}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                              title="Approve"
                              disabled={actionLoading}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(registration._id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Reject"
                              disabled={actionLoading}
                            >
                              <XCircle className="w-4 h-4" />
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

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600">
                Showing page <span className="font-bold">{pagination.currentPage}</span> of <span className="font-bold">{pagination.totalPages}</span>
                {' '}({pagination.totalItems} total registrations)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-accent-600 text-white rounded-lg font-semibold hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      );
      })()}

      {/* Details Modal */}
      {showDetailsModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-accent-600 to-accent-700 text-white px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Registration Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`rounded-lg p-4 border-2 ${getStatusBadge(selectedRegistration.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-lg">Status: {selectedRegistration.status.toUpperCase()}</p>
                    <p className="text-sm mt-1">
                      Submitted: {formatDate(selectedRegistration.submittedAt)}
                    </p>
                    {selectedRegistration.auctionId && (
                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-mono font-bold text-accent-600">
                          Auction ID: {selectedRegistration.auctionId}
                        </p>
                        {selectedRegistration.userId && (
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-green-600" />
                            <p className="text-sm font-bold text-green-600">
                              Coins: {selectedRegistration.userId.auctionCoins || 0}
                            </p>
                            <button
                              onClick={openCoinsEditModal}
                              className="p-1 hover:bg-green-100 rounded text-green-600"
                              title="Edit Coins"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedRegistration.emailVerified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Email Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      <span className="font-semibold">Email Not Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-accent-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Full Name</label>
                    <p className="font-semibold">{selectedRegistration.title} {selectedRegistration.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Date of Birth</label>
                    <p className="font-semibold">{new Date(selectedRegistration.dateOfBirth).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-semibold">{selectedRegistration.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Mobile</label>
                    <p className="font-semibold">{selectedRegistration.mobile}</p>
                  </div>
                  {selectedRegistration.phone && (
                    <div>
                      <label className="text-sm text-gray-600">Phone</label>
                      <p className="font-semibold">{selectedRegistration.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent-600" />
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Company Name</label>
                    <p className="font-semibold">{selectedRegistration.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">GST Number</label>
                    <p className="font-semibold">{selectedRegistration.gstNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">PAN Number</label>
                    <p className="font-semibold font-mono tracking-wider text-lg bg-amber-50 px-3 py-1 rounded border border-amber-200">
                      {selectedRegistration.panNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">State Code</label>
                    <p className="font-semibold">{selectedRegistration.stateCode || 'N/A'}</p>
                  </div>
                  {selectedRegistration.website && (
                    <div>
                      <label className="text-sm text-gray-600">Website</label>
                      <p className="font-semibold">{selectedRegistration.website}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Addresses */}
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent-600" />
                  Addresses
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Billing Address</label>
                    <p className="text-gray-900">
                      {selectedRegistration.billingAddress.addressLine1}
                      {selectedRegistration.billingAddress.addressLine2 && `, ${selectedRegistration.billingAddress.addressLine2}`}
                    </p>
                    <p className="text-gray-600">
                      {selectedRegistration.billingAddress.city}, {selectedRegistration.billingAddress.state} - {selectedRegistration.billingAddress.pinCode}
                    </p>
                    <p className="text-gray-600">{selectedRegistration.billingAddress.country}</p>
                  </div>
                  {!selectedRegistration.sameAsBilling && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Shipping Address</label>
                      <p className="text-gray-900">
                        {selectedRegistration.shippingAddress.addressLine1}
                        {selectedRegistration.shippingAddress.addressLine2 && `, ${selectedRegistration.shippingAddress.addressLine2}`}
                      </p>
                      <p className="text-gray-600">
                        {selectedRegistration.shippingAddress.city}, {selectedRegistration.shippingAddress.state} - {selectedRegistration.shippingAddress.pinCode}
                      </p>
                      <p className="text-gray-600">{selectedRegistration.shippingAddress.country}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent-600" />
                  Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">PAN Card</label>
                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={selectedRegistration.panCard}
                        alt="PAN Card"
                        className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selectedRegistration.panCard, '_blank')}
                      />
                    </div>
                    <a
                      href={selectedRegistration.panCard}
                      download="PAN_Card.jpg"
                      className="text-accent-600 hover:underline text-sm mt-2 inline-block"
                    >
                      Download PAN Card
                    </a>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      ID Proof ({selectedRegistration.idProof.proofType})
                    </label>
                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={selectedRegistration.idProof.url}
                        alt="ID Proof"
                        className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selectedRegistration.idProof.url, '_blank')}
                      />
                    </div>
                    <a
                      href={selectedRegistration.idProof.url}
                      download={`ID_Proof_${selectedRegistration.idProof.proofType}.jpg`}
                      className="text-accent-600 hover:underline text-sm mt-2 inline-block"
                    >
                      Download ID Proof
                    </a>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {selectedRegistration.collectingInterests && (
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Collecting Interests</h3>
                  <p className="text-gray-700">{selectedRegistration.collectingInterests}</p>
                </div>
              )}

              {selectedRegistration.references && selectedRegistration.references.length > 0 && (
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">References</h3>
                  <div className="space-y-3">
                    {selectedRegistration.references.map((ref, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-xs text-gray-500">Name:</span>
                            <p className="text-sm font-semibold text-gray-900">{ref.name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">City:</span>
                            <p className="text-sm font-semibold text-gray-900">{ref.city || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Mobile:</span>
                            <p className="text-sm font-semibold text-gray-900">{ref.mobile || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auction Coins Input & Action Buttons */}
              {selectedRegistration.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t-2">
                  {/* Auction Coins Input */}
                  <div className="border-2 border-accent-200 rounded-xl p-4 bg-accent-50">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Auction Coins to Assign
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={auctionCoins}
                      onChange={(e) => setAuctionCoins(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-accent-600 focus:outline-none text-lg font-semibold"
                      placeholder="Enter coins amount (e.g., 1000, 5000)"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Specify how many auction coins this user will receive upon approval
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(selectedRegistration._id)}
                      disabled={actionLoading}
                      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Registration
                    </button>
                    <button
                      onClick={() => handleReject(selectedRegistration._id)}
                      disabled={actionLoading}
                      className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Registration
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Coins Modal */}
      {showCoinsEditModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6" />
                <h2 className="text-xl font-bold">Edit Auction Coins</h2>
              </div>
              <button
                onClick={() => setShowCoinsEditModal(false)}
                className="text-white/80 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  User: {selectedRegistration.fullName}
                </label>
                <p className="text-xs text-gray-600">{selectedRegistration.email}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Auction Coins
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingCoins}
                  onChange={(e) => setEditingCoins(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-lg font-semibold"
                  placeholder="Enter coins amount"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Current: <span className="font-bold text-green-600">{selectedRegistration.userId?.auctionCoins || 0}</span> coins
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCoinsEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                  disabled={updatingCoins}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCoins}
                  disabled={updatingCoins}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  {updatingCoins ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Coins className="w-5 h-5" />
                      Update Coins
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionRegistrationManagement;
