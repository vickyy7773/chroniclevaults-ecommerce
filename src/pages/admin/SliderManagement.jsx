import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Save, Upload, X, Eye, EyeOff, Check } from 'lucide-react';
import { sliderService } from '../../services';
import { API_BASE_URL } from '../../constants/api';

const SliderManagement = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    image: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      console.log('🖼️ Fetching sliders...');
      const response = await sliderService.getAllSlidersAdmin();
      console.log('🖼️ Sliders Response:', response);

      // Response interceptor already returns response.data
      const slidersData = response?.data || [];
      const isSuccess = response?.success !== false;

      console.log('🖼️ Sliders Data:', slidersData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(slidersData)) {
        setSliders(slidersData);
        console.log(`✅ Loaded ${slidersData.length} sliders`);
      } else {
        console.warn('⚠️ No sliders found or invalid format');
        setSliders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching sliders:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to load sliders');
      setSliders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlider = () => {
    setEditingSlider(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({
      title: '',
      subtitle: '',
      buttonText: 'Shop Now',
      buttonLink: '/products',
      image: '',
      order: sliders.length,
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleEditSlider = (slider) => {
    setEditingSlider(slider);
    setImageFile(null);
    setImagePreview(slider.image);
    setFormData({
      title: slider.title,
      subtitle: slider.subtitle || '',
      buttonText: slider.buttonText || 'Shop Now',
      buttonLink: slider.buttonLink || '/products',
      image: slider.image,
      order: slider.order,
      isActive: slider.isActive
    });
    setShowAddModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', imageFile);

      console.log('Uploading image:', imageFile.name);

      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        body: uploadFormData
        // Don't set Content-Type header - browser will set it automatically with boundary
      });

      console.log('Upload response status:', response.status);

      const data = await response.json();
      console.log('Upload response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      // Return imageUrl from response
      return data.imageUrl || data.url || data.path;
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Failed to upload image: ${error.message}`);
      throw new Error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title) {
      setError('Please provide title');
      return;
    }

    if (!imageFile && !formData.image) {
      setError('Please select or provide an image');
      return;
    }

    try {
      setSaving(true);

      // Upload image if new file selected
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const dataToSave = {
        ...formData,
        image: imageUrl
      };

      if (editingSlider) {
        console.log('🖼️ Updating slider:', editingSlider._id, dataToSave);
        const response = await sliderService.updateSlider(editingSlider._id, dataToSave);
        console.log('🖼️ Update response:', response);

        const isSuccess = response?.success !== false;

        if (isSuccess) {
          setSuccess('✓ Slider updated successfully!');
          setShowAddModal(false);
          setImageFile(null);
          setImagePreview('');
          fetchSliders();

          // Auto-hide after 5 seconds
          setTimeout(() => setSuccess(''), 5000);
        } else {
          setError(response?.data?.message || 'Failed to update slider');
        }
      } else {
        console.log('🖼️ Creating slider with data:', dataToSave);
        const response = await sliderService.createSlider(dataToSave);
        console.log('🖼️ Create slider response:', response);

        const isSuccess = response?.success !== false;

        if (isSuccess) {
          setSuccess('✓ Slider created successfully!');
          setShowAddModal(false);
          setImageFile(null);
          setImagePreview('');
          await fetchSliders(); // Wait for fetch to complete

          // Auto-hide after 5 seconds
          setTimeout(() => setSuccess(''), 5000);
        } else {
          setError(response?.data?.message || 'Failed to create slider');
        }
      }
    } catch (error) {
      setError(error.message || 'Failed to save slider');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlider = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slider?')) {
      return;
    }

    try {
      console.log('🖼️ Deleting slider:', id);
      const response = await sliderService.deleteSlider(id);
      console.log('🖼️ Delete response:', response);

      const isSuccess = response?.success !== false;

      if (isSuccess) {
        setSuccess('✓ Slider deleted successfully!');
        fetchSliders();

        // Auto-hide after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response?.data?.message || 'Failed to delete slider');
      }
    } catch (error) {
      console.error('❌ Delete slider error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to delete slider');
    }
  };

  const handleToggleActive = async (slider) => {
    try {
      console.log('🖼️ Toggling slider active status:', slider._id);
      const response = await sliderService.updateSlider(slider._id, {
        ...slider,
        isActive: !slider.isActive
      });
      console.log('🖼️ Toggle response:', response);

      const isSuccess = (response?.status === 200 || response?.status === 201) && response?.data?.success !== false;

      if (isSuccess) {
        setSuccess(`✓ Slider ${slider.isActive ? 'deactivated' : 'activated'} successfully!`);
        fetchSliders();

        // Auto-hide after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response?.data?.message || 'Failed to update slider');
      }
    } catch (error) {
      console.error('❌ Toggle slider error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update slider');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sliders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hero Slider Management</h1>
          <p className="text-gray-600 mt-1">Manage homepage hero section slides</p>
        </div>
        <button
          onClick={handleAddSlider}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
        >
          <Plus size={20} />
          Add Slider
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={20} /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-2 border-green-500 text-green-800 px-6 py-4 rounded-lg flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 text-white rounded-full p-1">
              <Check size={20} />
            </div>
            <span className="font-semibold">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="hover:bg-green-100 p-1 rounded">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Total Sliders</p>
              <p className="text-2xl font-bold text-gray-900">{sliders.length}</p>
            </div>
            <ImageIcon className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Active Sliders</p>
              <p className="text-2xl font-bold text-gray-900">
                {sliders.filter(s => s.isActive).length}
              </p>
            </div>
            <Eye className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Inactive Sliders</p>
              <p className="text-2xl font-bold text-gray-900">
                {sliders.filter(s => !s.isActive).length}
              </p>
            </div>
            <EyeOff className="text-gray-600" size={32} />
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sliders.map((slider, index) => (
          <div
            key={slider._id}
            className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all ${
              slider.isActive ? 'border-green-200' : 'border-gray-200 opacity-60'
            }`}
          >
            {/* Image */}
            <div className="relative h-48 bg-gray-100">
              <img
                src={slider.image}
                alt={slider.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x400?text=Slider+Image';
                }}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  slider.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {slider.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  Order: {slider.order}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{slider.title}</h3>
              {slider.subtitle && (
                <p className="text-gray-600 mb-3">{slider.subtitle}</p>
              )}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold">
                  {slider.buttonText}
                </span>
                <span className="text-xs text-gray-500">→ {slider.buttonLink}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditSlider(slider)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(slider)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
                    slider.isActive
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {slider.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteSlider(slider._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sliders.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <ImageIcon className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Sliders Yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first hero slider</p>
          <button
            onClick={handleAddSlider}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
          >
            <Plus size={20} />
            Add First Slider
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingSlider ? 'Edit Slider' : 'Add New Slider'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., Rare Gold Coins"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., Premium Collection Available"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., Shop Now"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., /products"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Image * (Recommended: 1920x800px)
                    </label>

                    {/* File Upload */}
                    <div className="mb-3">
                      <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 cursor-pointer transition-colors bg-gray-50 hover:bg-amber-50">
                        <div className="text-center">
                          <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                          <p className="text-sm text-gray-600 font-semibold">
                            Click to upload image
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, WEBP (Max 5MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {imageFile && (
                        <p className="text-sm text-green-600 mt-2 font-semibold">
                          ✓ Selected: {imageFile.name}
                        </p>
                      )}
                    </div>

                    {/* OR divider */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">OR enter URL</span>
                      </div>
                    </div>

                    {/* URL Input */}
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                      disabled={!!imageFile}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste image URL (if not uploading file)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Order
                    </label>
                    <input
                      type="number"
                      value={formData.order || 0}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower numbers appear first
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active (visible on homepage)</span>
                    </label>
                  </div>
                </div>

                {/* Image Preview */}
                {(imagePreview || formData.image) && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                    <div className="relative">
                      <img
                        src={imagePreview || formData.image}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/1920x800?text=Slider+Preview';
                        }}
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="font-semibold">Uploading...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading Image...' : (saving ? 'Saving...' : (editingSlider ? 'Update Slider' : 'Create Slider'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SliderManagement;
