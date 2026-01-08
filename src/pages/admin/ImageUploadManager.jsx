import { useState, useEffect } from 'react';
import { Upload, Copy, Trash2, Image as ImageIcon, Download, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const ImageUploadManager = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);

  // API URL
  const API_URL = import.meta.env.PROD
    ? 'https://chroniclevaults.com/api'
    : 'http://localhost:5000/api';

  // Fetch all uploaded images from database
  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/upload/list`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();

      if (data.success) {
        setUploadedImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images from database');
    } finally {
      setLoading(false);
    }
  };

  // Load images on component mount
  useEffect(() => {
    fetchImages();
  }, []);

  // Handle multiple file selection
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = files.map((file, index) => uploadSingleImage(file, index, files.length));
      const results = await Promise.all(uploadPromises);

      // Count successful uploads
      const successfulUploads = results.filter(r => r.success);

      toast.success(`${successfulUploads.length} images uploaded and saved to database!`);

      // Refetch all images from database
      await fetchImages();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload some images');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = ''; // Reset file input
    }
  };

  // Upload single image
  const uploadSingleImage = async (file, index, total) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Use environment-aware API URL
      const API_URL = import.meta.env.PROD
        ? 'https://chroniclevaults.com/api'
        : 'http://localhost:5000/api';

      const response = await fetch(`${API_URL}/upload/single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || `Upload failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Update progress
      const progress = Math.round(((index + 1) / total) * 100);
      setUploadProgress(progress);

      return {
        success: true,
        id: Date.now() + index,
        filename: data.filename || file.name,
        url: data.imageUrl,
        size: (file.size / 1024).toFixed(2), // Size in KB
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      return {
        success: false,
        filename: file.name,
        error: error.message
      };
    }
  };

  // Copy URL to clipboard
  const handleCopyURL = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  // Copy all URLs
  const handleCopyAllURLs = () => {
    const urls = uploadedImages.map(img => img.url).join('\n');
    navigator.clipboard.writeText(urls);
    toast.success(`${uploadedImages.length} URLs copied to clipboard!`);
  };

  // Delete image from database and server
  const handleDeleteImage = async (filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"? This will remove it from database and server permanently.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/upload/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Image deleted from database and server');
        // Refetch images to update the list
        await fetchImages();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  // Toggle individual image selection
  const handleToggleImage = (filename) => {
    setSelectedImages(prev =>
      prev.includes(filename)
        ? prev.filter(f => f !== filename)
        : [...prev, filename]
    );
  };

  // Toggle all images selection
  const handleToggleAll = () => {
    if (selectedImages.length === uploadedImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(uploadedImages.map(img => img.filename));
    }
  };

  // Bulk delete selected images
  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) {
      toast.warning('Please select images to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedImages.length} selected images? This action cannot be undone.`)) {
      return;
    }

    try {
      toast.info(`Deleting ${selectedImages.length} images...`);

      const deletePromises = selectedImages.map(filename =>
        fetch(`${API_URL}/upload/${filename}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      );

      await Promise.all(deletePromises);

      toast.success(`${selectedImages.length} images deleted successfully!`);
      setSelectedImages([]);
      await fetchImages();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some images');
    }
  };

  // Refresh images list
  const handleRefresh = async () => {
    toast.info('Refreshing image list...');
    await fetchImages();
    toast.success('Image list refreshed!');
  };

  // Download URLs as CSV
  const handleDownloadCSV = () => {
    const csvContent = 'Original Name,Server Filename,URL,Size (KB),Uploaded At\n' +
      uploadedImages.map(img =>
        `"${img.originalName || img.filename}","${img.filename}","${img.url}","${img.size}","${new Date(img.uploadedAt).toLocaleString()}"`
      ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uploaded-images-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully!');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white">
          Image <span className="text-amber-600">Upload Manager</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">
          Upload multiple images and get their URLs for bulk lot creation
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-600" />
            Upload Images
          </h2>
          <div className="flex gap-2">
            {uploadedImages.length > 0 && (
              <>
                {selectedImages.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedImages.length})
                  </button>
                )}
                <button
                  onClick={handleCopyAllURLs}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy All URLs
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* File Input */}
        <div className="relative">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="image-upload-input"
          />
          <label
            htmlFor="image-upload-input"
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              uploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-amber-300 hover:border-amber-500 hover:bg-amber-50 dark:border-gray-700 dark:hover:border-amber-600 dark:hover:bg-gray-800'
            }`}
          >
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-amber-600" />
            {uploading ? (
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Uploading... {uploadProgress}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-amber-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  PNG, JPG, GIF up to 10MB each (Max 100 images at once)
                </p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Uploaded Images Table */}
      {uploadedImages.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 dark:border-gray-800">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Uploaded Images ({uploadedImages.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedImages.length === uploadedImages.length && uploadedImages.length > 0}
                      onChange={handleToggleAll}
                      className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Image URL
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {uploadedImages.map((image, index) => (
                  <tr key={image.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.filename)}
                        onChange={() => handleToggleImage(image.filename)}
                        className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-semibold">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="truncate text-gray-900 dark:text-white font-medium">
                          {image.originalName || image.filename}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {image.filename}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="max-w-md truncate text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                          {image.url}
                        </code>
                        <button
                          onClick={() => handleCopyURL(image.url)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {image.size} KB
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteImage(image.filename)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                        title="Delete from database and server"
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

      {/* Loading State */}
      {loading && uploadedImages.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800">
          <RefreshCw className="w-16 h-16 mx-auto text-amber-600 mb-4 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Loading images from database...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && uploadedImages.length === 0 && !uploading && (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No auction images in database yet. Upload images above to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploadManager;
