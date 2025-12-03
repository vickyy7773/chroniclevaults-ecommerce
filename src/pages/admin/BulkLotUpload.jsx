import { useState, useEffect } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const BulkLotUpload = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [parsedLots, setParsedLots] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState('');
  const [auctions, setAuctions] = useState([]);

  // Fetch auctions on component mount
  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await api.get('/auctions');
      setAuctions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
      toast.error('Failed to load auctions');
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = 'Lot Number,Title,Description,Image URL,Vendor ID,Starting Price,Reserve Price\n' +
      '1,Ancient Roman Coin,Rare silver denarius from 100 AD,https://example.com/image1.jpg,VEN001,5000,7000\n' +
      '2,Gold British Sovereign,1885 Victoria gold sovereign,https://example.com/image2.jpg,VEN002,15000,20000\n' +
      '3,Indian Copper Coin,East India Company 1/4 Anna,https://example.com/image3.jpg,VEN001,2000,3000';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-lot-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV template downloaded!');
  };

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const lots = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values.length !== headers.length) {
        console.warn(`Skipping line ${i + 1}: Column count mismatch`);
        continue;
      }

      const lot = {
        lotNumber: parseInt(values[0]) || i,
        title: values[1]?.trim() || '',
        description: values[2]?.trim() || '',
        image: values[3]?.trim() || '',
        vendorId: values[4]?.trim() || null,
        startingPrice: parseFloat(values[5]) || 0,
        reservePrice: parseFloat(values[6]) || 0,
        currentBid: parseFloat(values[5]) || 0, // Initialize with starting price
        status: 'Upcoming'
      };

      // Validation
      const errors = [];
      if (!lot.title) errors.push('Title is required');
      if (!lot.description) errors.push('Description is required');
      if (!lot.image) errors.push('Image URL is required');
      if (lot.startingPrice <= 0) errors.push('Starting price must be greater than 0');

      lot.errors = errors;
      lot.isValid = errors.length === 0;

      lots.push(lot);
    }

    return lots;
  };

  // Parse CSV line handling quotes
  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current);
    return values.map(v => v.replace(/^"|"$/g, '').trim());
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvFile(file);

    // Read and parse CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lots = parseCSV(text);
        setParsedLots(lots);
        toast.success(`Parsed ${lots.length} lots from CSV`);
      } catch (error) {
        console.error('CSV parsing error:', error);
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  // Remove lot from preview
  const handleRemoveLot = (index) => {
    setParsedLots(prev => prev.filter((_, i) => i !== index));
    toast.info('Lot removed from preview');
  };

  // Upload lots to auction
  const handleUploadLots = async () => {
    if (!selectedAuctionId) {
      toast.error('Please select an auction');
      return;
    }

    const validLots = parsedLots.filter(lot => lot.isValid);
    if (validLots.length === 0) {
      toast.error('No valid lots to upload');
      return;
    }

    if (parsedLots.some(lot => !lot.isValid)) {
      if (!confirm(`${parsedLots.filter(lot => !lot.isValid).length} lots have errors. Upload only valid lots?`)) {
        return;
      }
    }

    setUploading(true);
    try {
      const response = await api.post(`/auctions/${selectedAuctionId}/bulk-lots`, {
        lots: validLots
      });

      toast.success(`Successfully added ${validLots.length} lots to auction!`);

      // Reset form
      setCsvFile(null);
      setParsedLots([]);
      setSelectedAuctionId('');
      document.getElementById('csv-file-input').value = '';
    } catch (error) {
      console.error('Bulk upload error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to upload lots';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const validLotsCount = parsedLots.filter(lot => lot.isValid).length;
  const invalidLotsCount = parsedLots.length - validLotsCount;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white">
          Bulk Lot <span className="text-amber-600">Upload</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">
          Upload multiple lots at once using CSV file
        </p>
      </div>

      {/* Download Template Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-lg p-6 mb-6 border-2 border-amber-200 dark:border-amber-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-amber-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                CSV Template
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Download the template and fill in your lot details
              </p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Template
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-amber-600" />
          Upload CSV File
        </h2>

        {/* Auction Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Auction
          </label>
          <select
            value={selectedAuctionId}
            onChange={(e) => setSelectedAuctionId(e.target.value)}
            className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            disabled={uploading}
          >
            <option value="">Select an auction...</option>
            {auctions.map(auction => (
              <option key={auction._id} value={auction._id}>
                {auction.title} - {auction.status} {auction.isLotBidding ? '(Lot Bidding)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* File Input */}
        <div className="relative">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="csv-file-input"
          />
          <label
            htmlFor="csv-file-input"
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              uploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-amber-300 hover:border-amber-500 hover:bg-amber-50 dark:border-gray-700 dark:hover:border-amber-600 dark:hover:bg-gray-800'
            }`}
          >
            <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-amber-600" />
            {csvFile ? (
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {csvFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {parsedLots.length} lots parsed
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Click to upload CSV file
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  CSV file with lot details (Lot Number, Title, Description, Image URL, Starting Price, Reserve Price)
                </p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Preview Section */}
      {parsedLots.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 dark:border-gray-800 mb-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Lot Preview ({parsedLots.length} total)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="text-green-600 font-semibold">{validLotsCount} valid</span>
                {invalidLotsCount > 0 && (
                  <span className="text-red-600 font-semibold ml-2">{invalidLotsCount} invalid</span>
                )}
              </p>
            </div>
            <button
              onClick={handleUploadLots}
              disabled={uploading || validLotsCount === 0 || !selectedAuctionId}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                uploading || validLotsCount === 0 || !selectedAuctionId
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              {uploading ? 'Uploading...' : `Add ${validLotsCount} Lots`}
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Lot #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Vendor ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Starting Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Reserve Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {parsedLots.map((lot, index) => (
                  <tr
                    key={index}
                    className={`${
                      lot.isValid
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        : 'bg-red-50 dark:bg-red-900/10'
                    } transition-colors`}
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-semibold">
                      {lot.lotNumber}
                    </td>
                    <td className="px-4 py-3">
                      {lot.image ? (
                        <img
                          src={lot.image}
                          alt={lot.title}
                          className="w-12 h-12 object-cover rounded border-2 border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="hidden w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-gray-400" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="text-gray-900 dark:text-white font-medium truncate">
                          {lot.title || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-sm">
                        <p className="text-gray-600 dark:text-gray-400 text-sm truncate">
                          {lot.description || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-md text-xs font-semibold">
                        {lot.vendorId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-semibold">
                      ₹{lot.startingPrice?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-semibold">
                      ₹{lot.reservePrice?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3">
                      {lot.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          Valid
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            Invalid
                          </span>
                          <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {lot.errors?.map((err, i) => (
                              <div key={i}>• {err}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveLot(index)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-3">
          How to use Bulk Lot Upload
        </h3>
        <ol className="space-y-2 text-blue-800 dark:text-blue-400">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>Download the CSV template using the button above</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>Upload images using the Image Upload Manager and copy the URLs</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>Fill in the CSV template with your lot details (paste image URLs from step 2)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>Select the auction you want to add lots to</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">5.</span>
            <span>Upload the CSV file and review the parsed lots</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">6.</span>
            <span>Click "Add Lots" to add all valid lots to the selected auction</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default BulkLotUpload;
