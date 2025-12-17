import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowRightLeft,
  Users,
  Package,
  Search,
  CheckSquare,
  Square,
  DollarSign,
  AlertCircle,
  X
} from 'lucide-react';
import api from '../../utils/api';

const LotTransferManagement = () => {
  const [searchParams] = useSearchParams();
  const auctionIdFromUrl = searchParams.get('auction');

  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(auctionIdFromUrl || '');
  const [buyers, setBuyers] = useState([]);
  const [unsoldLots, setUnsoldLots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Transfer Lots State
  const [transferMode, setTransferMode] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [targetBuyer, setTargetBuyer] = useState('');
  const [targetBuyerSearch, setTargetBuyerSearch] = useState('');
  const [selectedLotsForTransfer, setSelectedLotsForTransfer] = useState([]);

  // Assign Unsold Lots State
  const [assignMode, setAssignMode] = useState(false);
  const [selectedUnsoldLots, setSelectedUnsoldLots] = useState([]);
  const [unsoldLotPrices, setUnsoldLotPrices] = useState({});
  const [assignToBuyer, setAssignToBuyer] = useState('');
  const [assignBuyerSearch, setAssignBuyerSearch] = useState('');

  // Fetch ended lot bidding auctions
  useEffect(() => {
    fetchAuctions();
  }, []);

  // Fetch buyers and unsold lots when auction is selected
  useEffect(() => {
    if (selectedAuction) {
      fetchBuyersWithLots();
      fetchUnsoldLots();
    }
  }, [selectedAuction]);

  const fetchAuctions = async () => {
    try {
      const response = await api.get('/auctions');
      const endedLotAuctions = response.data.filter(
        a => a.isLotBidding && a.status === 'Ended'
      );
      setAuctions(endedLotAuctions);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast.error('Failed to fetch auctions');
    }
  };

  const fetchBuyersWithLots = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/lot-transfer/buyers/${selectedAuction}`);
      setBuyers(response.data || []);
    } catch (error) {
      console.error('Error fetching buyers:', error);
      toast.error('Failed to fetch buyers');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnsoldLots = async () => {
    try {
      const response = await api.get(`/lot-transfer/unsold/${selectedAuction}`);
      setUnsoldLots(response.data || []);
    } catch (error) {
      console.error('Error fetching unsold lots:', error);
      toast.error('Failed to fetch unsold lots');
    }
  };

  const handleStartTransfer = (buyer) => {
    setSelectedBuyer(buyer);
    setTransferMode(true);
    setSelectedLotsForTransfer([]);
    setTargetBuyer('');
    setTargetBuyerSearch('');
  };

  const toggleLotSelection = (lotNumber) => {
    if (selectedLotsForTransfer.includes(lotNumber)) {
      setSelectedLotsForTransfer(selectedLotsForTransfer.filter(l => l !== lotNumber));
    } else {
      setSelectedLotsForTransfer([...selectedLotsForTransfer, lotNumber]);
    }
  };

  const handleTransferLots = async () => {
    if (!targetBuyer) {
      toast.error('Please select a target buyer');
      return;
    }

    if (selectedLotsForTransfer.length === 0) {
      toast.error('Please select at least one lot to transfer');
      return;
    }

    if (selectedLotsForTransfer.length === selectedBuyer.lots.length) {
      toast.error('Cannot transfer all lots. At least one lot must remain with the original buyer.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/lot-transfer/transfer', {
        auctionId: selectedAuction,
        fromBuyerId: selectedBuyer.buyer._id,
        toBuyerId: targetBuyer,
        lotNumbers: selectedLotsForTransfer
      });

      toast.success(`Successfully transferred ${selectedLotsForTransfer.length} lots`);

      // Refresh data
      await fetchBuyersWithLots();
      await fetchUnsoldLots();

      // Reset state
      setTransferMode(false);
      setSelectedBuyer(null);
      setSelectedLotsForTransfer([]);
      setTargetBuyer('');
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error(error.response?.data?.message || 'Failed to transfer lots');
    } finally {
      setLoading(false);
    }
  };

  const toggleUnsoldLotSelection = (lotNumber) => {
    if (selectedUnsoldLots.includes(lotNumber)) {
      setSelectedUnsoldLots(selectedUnsoldLots.filter(l => l !== lotNumber));
      const newPrices = { ...unsoldLotPrices };
      delete newPrices[lotNumber];
      setUnsoldLotPrices(newPrices);
    } else {
      setSelectedUnsoldLots([...selectedUnsoldLots, lotNumber]);
    }
  };

  const handlePriceChange = (lotNumber, price) => {
    setUnsoldLotPrices({
      ...unsoldLotPrices,
      [lotNumber]: parseFloat(price) || 0
    });
  };

  const handleAssignUnsoldLots = async () => {
    if (!assignToBuyer) {
      toast.error('Please select a buyer to assign lots to');
      return;
    }

    if (selectedUnsoldLots.length === 0) {
      toast.error('Please select at least one unsold lot');
      return;
    }

    // Validate all lots have prices
    for (const lotNum of selectedUnsoldLots) {
      if (!unsoldLotPrices[lotNum] || unsoldLotPrices[lotNum] <= 0) {
        toast.error(`Please enter a valid price for Lot ${lotNum}`);
        return;
      }
    }

    try {
      setLoading(true);
      await api.post('/lot-transfer/assign-unsold', {
        auctionId: selectedAuction,
        buyerId: assignToBuyer,
        lotNumbers: selectedUnsoldLots,
        hammerPrices: unsoldLotPrices
      });

      toast.success(`Successfully assigned ${selectedUnsoldLots.length} unsold lots`);

      // Refresh data
      await fetchBuyersWithLots();
      await fetchUnsoldLots();

      // Reset state
      setAssignMode(false);
      setSelectedUnsoldLots([]);
      setUnsoldLotPrices({});
      setAssignToBuyer('');
    } catch (error) {
      console.error('Assign error:', error);
      toast.error(error.response?.data?.message || 'Failed to assign unsold lots');
    } finally {
      setLoading(false);
    }
  };

  const filteredBuyersForTarget = buyers.filter(b =>
    b.buyer._id !== selectedBuyer?.buyer._id &&
    (b.buyer.name?.toLowerCase().includes(targetBuyerSearch.toLowerCase()) ||
     b.buyer.email?.toLowerCase().includes(targetBuyerSearch.toLowerCase()) ||
     b.buyer._id.includes(targetBuyerSearch))
  );

  const filteredBuyersForAssign = buyers.filter(b =>
    b.buyer.name?.toLowerCase().includes(assignBuyerSearch.toLowerCase()) ||
    b.buyer.email?.toLowerCase().includes(assignBuyerSearch.toLowerCase()) ||
    b.buyer._id.includes(assignBuyerSearch)
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ArrowRightLeft className="w-8 h-8 text-blue-600" />
          Lot Transfer & Assignment Management
        </h1>
        <p className="text-gray-600 mt-2">Transfer lots between buyers or manually assign unsold lots</p>
      </div>

      {/* Auction Selection */}
      <div className="mb-6 bg-white p-4 rounded-lg border">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Auction</label>
        <select
          value={selectedAuction}
          onChange={(e) => setSelectedAuction(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select Ended Auction --</option>
          {auctions.map(auction => (
            <option key={auction._id} value={auction._id}>
              {auction.title} ({new Date(auction.endTime).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {selectedAuction && (
        <>
          {/* Action Buttons */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => {
                setTransferMode(false);
                setAssignMode(!assignMode);
                setSelectedUnsoldLots([]);
                setUnsoldLotPrices({});
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                assignMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Package className="w-5 h-5" />
              {assignMode ? 'Cancel Assignment' : 'Assign Unsold Lots'}
            </button>
          </div>

          {/* Unsold Lots Section */}
          {assignMode && unsoldLots.length > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-yellow-600" />
                Unsold Lots ({unsoldLots.length})
              </h2>

              {/* Buyer Search for Assignment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search and Select Buyer to Assign Lots
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by buyer name, email, or ID..."
                    value={assignBuyerSearch}
                    onChange={(e) => setAssignBuyerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {assignBuyerSearch && (
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                    {filteredBuyersForAssign.length > 0 ? (
                      filteredBuyersForAssign.map(b => (
                        <div
                          key={b.buyer._id}
                          onClick={() => {
                            setAssignToBuyer(b.buyer._id);
                            setAssignBuyerSearch(b.buyer.name);
                          }}
                          className={`px-4 py-2 cursor-pointer border-b last:border-b-0 ${
                            assignToBuyer === b.buyer._id
                              ? 'bg-blue-100 border-l-4 border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium">{b.buyer.name}</div>
                          <div className="text-sm text-gray-600">{b.buyer.email}</div>
                          <div className="text-xs text-gray-500">Current Lots: {b.lots.length}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-center">No buyers found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Unsold Lots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {unsoldLots.map(lot => (
                  <div
                    key={lot.lotNumber}
                    onClick={() => toggleUnsoldLotSelection(lot.lotNumber)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedUnsoldLots.includes(lot.lotNumber)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-white hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">Lot #{lot.lotNumber}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{lot.title}</p>
                      </div>
                      {selectedUnsoldLots.includes(lot.lotNumber) ? (
                        <CheckSquare className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-400 flex-shrink-0" />
                      )}
                    </div>

                    {selectedUnsoldLots.includes(lot.lotNumber) && (
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Hammer Price (₹)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={unsoldLotPrices[lot.lotNumber] || ''}
                          onChange={(e) => handlePriceChange(lot.lotNumber, e.target.value)}
                          placeholder="Enter price"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Assign Button */}
              {selectedUnsoldLots.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleAssignUnsoldLots}
                    disabled={loading || !assignToBuyer}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <DollarSign className="w-5 h-5" />
                    Assign {selectedUnsoldLots.length} Lot(s) to Buyer
                  </button>
                </div>
              )}
            </div>
          )}

          {unsoldLots.length === 0 && !assignMode && (
            <div className="mb-6 bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No unsold lots in this auction</p>
            </div>
          )}

          {/* Buyers List - Transfer Lots Section */}
          {!assignMode && (
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Buyers with Lots ({buyers.length})
                </h2>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading buyers...</p>
                </div>
              ) : buyers.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  No buyers found for this auction
                </div>
              ) : (
                <div className="divide-y">
                  {buyers.map(buyer => (
                    <div key={buyer.buyer._id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{buyer.buyer.name}</h3>
                          <p className="text-sm text-gray-600">{buyer.buyer.email}</p>
                          <p className="text-sm text-gray-500">Invoice: {buyer.invoiceNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Lots: {buyer.lots.length}</p>
                          <p className="text-lg font-bold text-green-600">
                            ₹{buyer.totalAmount?.toLocaleString()}
                          </p>
                          <button
                            onClick={() => handleStartTransfer(buyer)}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                            Transfer Lots
                          </button>
                        </div>
                      </div>

                      {/* Lots Preview */}
                      <div className="flex flex-wrap gap-2">
                        {buyer.lots.map(lot => (
                          <span
                            key={lot.lotNumber}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                          >
                            Lot #{lot.lotNumber}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transfer Modal */}
          {transferMode && selectedBuyer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                    Transfer Lots from {selectedBuyer.buyer.name}
                  </h2>
                  <button
                    onClick={() => {
                      setTransferMode(false);
                      setSelectedBuyer(null);
                      setSelectedLotsForTransfer([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Target Buyer Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search and Select Target Buyer
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by buyer name, email, or ID..."
                      value={targetBuyerSearch}
                      onChange={(e) => setTargetBuyerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {targetBuyerSearch && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                      {filteredBuyersForTarget.length > 0 ? (
                        filteredBuyersForTarget.map(b => (
                          <div
                            key={b.buyer._id}
                            onClick={() => {
                              setTargetBuyer(b.buyer._id);
                              setTargetBuyerSearch(b.buyer.name);
                            }}
                            className={`px-4 py-2 cursor-pointer border-b last:border-b-0 ${
                              targetBuyer === b.buyer._id
                                ? 'bg-blue-100 border-l-4 border-blue-600'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium">{b.buyer.name}</div>
                            <div className="text-sm text-gray-600">{b.buyer.email}</div>
                            <div className="text-xs text-gray-500">Current Lots: {b.lots.length}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-center">No other buyers found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Lot Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Lots to Transfer ({selectedLotsForTransfer.length}/{selectedBuyer.lots.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedBuyer.lots.map(lot => (
                      <div
                        key={lot.lotNumber}
                        onClick={() => toggleLotSelection(lot.lotNumber)}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          selectedLotsForTransfer.includes(lot.lotNumber)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold">Lot #{lot.lotNumber}</h4>
                            <p className="text-sm text-gray-600 line-clamp-1">{lot.description}</p>
                            <p className="text-sm font-semibold text-green-600">
                              ₹{lot.hammerPrice?.toLocaleString()}
                            </p>
                          </div>
                          {selectedLotsForTransfer.includes(lot.lotNumber) ? (
                            <CheckSquare className="w-6 h-6 text-blue-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-6 h-6 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                {selectedLotsForTransfer.length === selectedBuyer.lots.length && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      Cannot transfer all lots. At least one lot must remain with the original buyer.
                    </p>
                  </div>
                )}

                {/* Transfer Button */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setTransferMode(false);
                      setSelectedBuyer(null);
                      setSelectedLotsForTransfer([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransferLots}
                    disabled={
                      loading ||
                      !targetBuyer ||
                      selectedLotsForTransfer.length === 0 ||
                      selectedLotsForTransfer.length === selectedBuyer.lots.length
                    }
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ArrowRightLeft className="w-5 h-5" />
                    Transfer {selectedLotsForTransfer.length} Lot(s)
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedAuction && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please select an auction to manage lot transfers</p>
        </div>
      )}
    </div>
  );
};

export default LotTransferManagement;
