import { useState } from 'react';
import { Upload, Copy, Trash2, Video, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const VideoUploadManager = () => {
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // API URL
  const API_URL = import.meta.env.PROD
    ? 'https://chroniclevaults.com/api'
    : 'http://localhost:5000/api';

  // Handle video file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file size must be less than 100MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);

      // Show initial progress
      setUploadProgress(10);

      const response = await fetch(`${API_URL}/upload/video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      setUploadProgress(90);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || `Upload failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setUploadProgress(100);

      // Add to uploaded videos list
      const newVideo = {
        id: Date.now(),
        filename: data.filename || file.name,
        url: data.videoUrl,
        size: (file.size / (1024 * 1024)).toFixed(2), // Size in MB
        uploadedAt: new Date().toISOString()
      };

      setUploadedVideos(prev => [newVideo, ...prev]);
      toast.success('Video uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload video: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = ''; // Reset file input
    }
  };

  // Copy URL to clipboard
  const handleCopyURL = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Video URL copied to clipboard!');
  };

  // Copy all URLs
  const handleCopyAllURLs = () => {
    const urls = uploadedVideos.map(video => video.url).join('\n');
    navigator.clipboard.writeText(urls);
    toast.success(`${uploadedVideos.length} video URLs copied to clipboard!`);
  };

  // Delete video from list
  const handleDeleteVideo = (id) => {
    setUploadedVideos(prev => prev.filter(video => video.id !== id));
    toast.success('Video removed from list');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white">
          Video <span className="text-purple-600">Upload Manager</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">
          Upload videos and get their URLs for auction lots
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            Upload Video
          </h2>
          {uploadedVideos.length > 0 && (
            <button
              onClick={handleCopyAllURLs}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy All URLs
            </button>
          )}
        </div>

        {/* File Input */}
        <div className="relative">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="video-upload-input"
          />
          <label
            htmlFor="video-upload-input"
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              uploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-purple-300 hover:border-purple-500 hover:bg-purple-50 dark:border-gray-700 dark:hover:border-purple-600 dark:hover:bg-gray-800'
            }`}
          >
            <Video className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            {uploading ? (
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Uploading... {uploadProgress}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Click to upload video
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  MP4, MOV, AVI up to 100MB (One video at a time)
                </p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Uploaded Videos Table */}
      {uploadedVideos.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 dark:border-gray-800">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Uploaded Videos ({uploadedVideos.length})
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
                    Video URL
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
                {uploadedVideos.map((video, index) => (
                  <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-semibold">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <video
                        src={video.url}
                        className="w-32 h-20 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                        controls
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-gray-900 dark:text-white font-medium">
                        {video.filename}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="max-w-md truncate block text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-gray-900 dark:text-white font-mono">
                          {video.url}
                        </code>
                        <button
                          onClick={() => handleCopyURL(video.url)}
                          className="flex-shrink-0 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {video.size} MB
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Remove from list"
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
      <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-3">
          📝 How to use:
        </h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">1.</span>
            <span>Click the upload area and select a video file (MP4, MOV, AVI, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">2.</span>
            <span>Wait for the video to upload to the server</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">3.</span>
            <span>Copy the video URL using the copy button</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">4.</span>
            <span>Paste the URL in the auction lot video field</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">5.</span>
            <span>You can upload multiple videos and copy all URLs at once</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VideoUploadManager;
