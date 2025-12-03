import { useState } from 'react';
import { Upload, Copy, Trash2, Image as ImageIcon, Download, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ImageUploadManager = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle multiple file selection
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = files.map((file, index) => uploadSingleImage(file, index, files.length));
      const results = await Promise.all(uploadPromises);

      // Add successfully uploaded images to state
      const successfulUploads = results.filter(r => r.success);
      setUploadedImages(prev => [...prev, ...successfulUploads]);

      toast.success(`${successfulUploads.length} images uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload some images');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = ''; // Reset file input
    }
  };

  // Upload single image to Cloudinary
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

  // Delete image from list (not from Cloudinary)
  const handleDeleteImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    toast.info('Image removed from list');
  };

  // Clear all images
  const handleClearAll = () => {
    if (confirm(`Are you sure you want to clear all ${uploadedImages.length} images?`)) {
      setUploadedImages([]);
      toast.info('All images cleared');
    }
  };

  // Download URLs as CSV
  const handleDownloadCSV = () => {
    const csvContent = 'Filename,URL,Size (KB),Uploaded At\n' +
      uploadedImages.map(img =>
        `"${img.filename}","${img.url}","${img.size}","${new Date(img.uploadedAt).toLocaleString()}"`
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
          {uploadedImages.length > 0 && (
            <div className="flex gap-2">
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
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          )}
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
                      <div className="max-w-xs truncate text-gray-900 dark:text-white font-medium">
                        {image.filename}
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
                        onClick={() => handleDeleteImage(image.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                        title="Delete"
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

      {/* Empty State */}
      {uploadedImages.length === 0 && !uploading && (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No images uploaded yet. Click the upload button above to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploadManager;
