import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Save, Upload, X, Eye, EyeOff } from 'lucide-react';
import { bannerService } from '../../services';
import { API_BASE_URL } from '../../constants/api';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    heading: '',
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '/products',
    isActive: false
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      console.log('🎯 Fetching banners...');
      const response = await bannerService.getAllBannersAdmin();
      console.log('🎯 Banners Response:', response);

      const bannersData = response?.data?.data || response?.data || [];
      const isSuccess = response?.data?.success !== false && response?.status === 200;

      if (isSuccess && Array.isArray(bannersData)) {
        setBanners(bannersData);
        console.log(`✅ Loaded ${bannersData.length} banners`);
      } else {
        setBanners([]);
      }
    } catch (error) {
      console.error('❌ Error fetching banners:', error);
      alert('Failed to load banners');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBanner = () => {
    setEditingBanner(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({
      heading: '',
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '/products',
      isActive: false
    });
    setShowModal(true);
  };

  const handleEditBanner = (banner) => {
    setEditingBanner(banner);
    setImageFile(null);
    setImagePreview(banner.imageUrl);
    setFormData({
      heading: banner.heading || '',
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '/products',
      isActive: banner.isActive
    });
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.imageUrl;

    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('image', imageFile);

      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        body: uploadFormData
      });

      const data = await response.json();
      if (response.ok && data.imageUrl) {
        return data.imageUrl;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!imageFile && !formData.imageUrl) {
      alert('Please select an image');
      return;
    }

    try {
      setSaving(true);
      const imageUrl = await uploadImage();
      const bannerData = {
        ...formData,
        imageUrl: imageUrl || formData.imageUrl
      };

      if (editingBanner) {
        await bannerService.updateBanner(editingBanner._id, bannerData);
        alert('Banner updated successfully!');
      } else {
        await bannerService.createBanner(bannerData);
        alert('Banner created successfully!');
      }

      await fetchBanners();
      setShowModal(false);
      setEditingBanner(null);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save banner: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      await bannerService.deleteBanner(id);
      alert('Banner deleted successfully!');
      await fetchBanners();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete banner');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await bannerService.toggleBannerStatus(id);
      await fetchBanners();
    } catch (error) {
      console.error('Toggle error:', error);
      alert('Failed to toggle banner status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Today in History Banner</h1>
            <p className="text-gray-600 mt-1">Manage the banner displayed on homepage</p>
          </div>
          <button
            onClick={handleAddBanner}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus size={20} />
            Add New Banner
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading banners...</p>
          </div>
        )}

        {/* Banners List */}
        {!loading && (
          <div className="grid grid-cols-1 gap-6">
            {banners.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No banners yet. Create your first banner!</p>
              </div>
            ) : (
              banners.map((banner) => (
                <div key={banner._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex items-center gap-6 p-6">
                    {/* Banner Image */}
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-64 h-32 object-cover rounded-lg"
                    />

                    {/* Banner Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{banner.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Link: <span className="text-amber-600">{banner.linkUrl}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleToggleActive(banner._id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          banner.isActive
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {banner.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        {banner.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEditBanner(banner)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Section Heading */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Heading (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.heading}
                      onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                      maxLength="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., Chronicle Chronicles, Today in History, etc."
                    />
                    <p className="text-xs text-gray-500 mt-1">This appears as the main heading above the banner (max 50 characters)</p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banner Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., The Legacy of Ancient Indian Coins"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      maxLength="500"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      placeholder="Enter banner description (max 500 characters)"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
                  </div>

                  {/* Link URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link URL
                    </label>
                    <input
                      type="text"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="/products"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banner Image *
                    </label>

                    {/* Banner Size Specifications */}
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-3 rounded-lg">
                      <p className="text-sm font-bold text-amber-900 mb-3">📐 Today In History Banner Size:</p>
                      <div className="bg-white rounded p-3 mb-3">
                        <p className="text-lg font-bold text-amber-800">1200 x 600 px (2:1 ratio)</p>
                        <p className="text-xs text-gray-600 mt-1">Perfect for split layout: Image on left, Text on right</p>
                      </div>
                      <div className="text-xs text-amber-800 space-y-1">
                        <p><span className="font-semibold">✓ Formats:</span> JPG, PNG, WEBP</p>
                        <p><span className="font-semibold">✓ Max Size:</span> 5MB</p>
                        <p><span className="font-semibold">✓ Layout:</span> Image + Text with "Read More" button</p>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview('');
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center cursor-pointer">
                          <Upload size={48} className="text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload image</span>
                          <span className="text-xs text-gray-500 mt-1">(JPG, PNG, WEBP - Max 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Is Active */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Set as active banner (will deactivate all other banners)
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving || uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {uploading ? 'Uploading...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Banner
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerManagement;
