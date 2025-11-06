import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Upload, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';

const AddEditCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    type: 'main', // Always main category
    parentCategory: null, // No parent for main categories
    description: '',
    bannerImage: null,
    cardImage: null,
    showOnHome: false,
    isActive: true
  });

  const [subcategories, setSubcategories] = useState([]);
  const [newSubcategory, setNewSubcategory] = useState('');

  const [bannerPreview, setBannerPreview] = useState('');
  const [cardPreview, setCardPreview] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Otherwise, prepend the API URL
    return `${API_BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    if (isEdit) {
      fetchCategoryData();
      fetchSubcategories();
    }
  }, [id]);

  const fetchSubcategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        // Filter subcategories for this category
        const subs = data.data.filter(cat =>
          cat.type === 'sub' && cat.parentCategory &&
          (typeof cat.parentCategory === 'object' ? cat.parentCategory._id === id : cat.parentCategory === id)
        );
        setSubcategories(subs);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const category = data.data;
        setFormData({
          name: category.name,
          type: category.type,
          parentCategory: category.parentCategory?._id || '',
          description: category.description || '',
          bannerImage: null,
          cardImage: null,
          showOnHome: category.showOnHome || false,
          isActive: category.isActive
        });
        if (category.bannerImage) setBannerPreview(getImageUrl(category.bannerImage));
        if (category.cardImage) setCardPreview(getImageUrl(category.cardImage));
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        bannerImage: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCardImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        cardImage: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategory.trim()) {
      alert('Please enter subcategory name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newSubcategory,
          type: 'sub',
          parentCategory: id,
          isActive: true
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewSubcategory('');
        fetchSubcategories();
        alert('✅ Subcategory added successfully!');
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Error adding subcategory:', error);
      alert('❌ Failed to add subcategory');
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/categories/${subcategoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchSubcategories();
        alert('✅ Subcategory deleted successfully!');
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      alert('❌ Failed to delete subcategory');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    alert('Form submitted! Processing...');
    console.log('=== FORM SUBMISSION STARTED ===');

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      console.log('Token:', token);

      if (!token) {
        alert('❌ Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('✓ Token found');
      console.log('Form data:', formData);

      // Upload banner image if provided
      let bannerImageUrl = bannerPreview;

      console.log('Checking banner image...');

      if (formData.bannerImage instanceof File) {
        console.log('Uploading banner image...');
        const imageFormData = new FormData();
        imageFormData.append('image', formData.bannerImage);
        const uploadResponse = await fetch(`${API_BASE_URL}/upload/single`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: imageFormData
        });
        const uploadData = await uploadResponse.json();
        console.log('Banner upload response:', uploadData);
        if (uploadData.imageUrl) {
          bannerImageUrl = uploadData.imageUrl;
        }
      }

      // Upload card image if provided
      let cardImageUrl = cardPreview;

      console.log('Checking card image...');

      if (formData.cardImage instanceof File) {
        console.log('Uploading card image...');
        const imageFormData = new FormData();
        imageFormData.append('image', formData.cardImage);
        const uploadResponse = await fetch(`${API_BASE_URL}/upload/single`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: imageFormData
        });
        const uploadData = await uploadResponse.json();
        console.log('Card upload response:', uploadData);
        if (uploadData.imageUrl) {
          cardImageUrl = uploadData.imageUrl;
        }
      }

      console.log('✓ Images processed');

      // Prepare category data
      const categoryData = {
        name: formData.name,
        type: formData.type,
        parentCategory: formData.type === 'sub' ? formData.parentCategory : null,
        description: formData.description,
        bannerImage: bannerImageUrl || null,
        cardImage: cardImageUrl || null,
        showOnHome: formData.showOnHome,
        isActive: formData.isActive
      };

      console.log('Category data prepared:', categoryData);

      // Create or update category
      const url = isEdit
        ? `${API_BASE_URL}/categories/${id}`
        : `${API_BASE_URL}/categories`;

      const method = isEdit ? 'PUT' : 'POST';

      console.log(`Sending ${method} request to:`, url);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      });

      console.log('API Response received');

      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (data.success) {
        console.log('✅ SUCCESS!');
        alert(`✅ ${data.message || `Category ${isEdit ? 'updated' : 'created'} successfully!`}`);
        console.log('Navigating to /admin/categories');
        navigate('/admin/categories');
      } else {
        console.error('❌ API Error:', data);
        alert(`❌ ${data.message || 'Failed to save category'}`);
      }
    } catch (error) {
      console.error('💥 EXCEPTION:', error);
      alert(`❌ Failed to save category: ${error.message}`);
    } finally {
      console.log('=== FORM SUBMISSION ENDED ===');
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update category information' : 'Create a new product category'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter category name"
                />
              </div>

              {/* Category Type - Hidden, always main */}
              <input type="hidden" name="type" value="main" />

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter category description"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label className="ml-2 text-sm font-semibold text-gray-700">
                  Active Category
                </label>
              </div>

              {/* Show on Home Page */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="showOnHome"
                  checked={formData.showOnHome}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-semibold text-gray-700">
                  Show on Home Page
                  <span className="text-gray-500 font-normal text-xs ml-2">(Display this category on home page cards)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Banner Image */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Banner Image (Category Page)</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Banner Image
                <span className="text-gray-500 font-normal text-xs ml-2">(Displayed on category page header)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-amber-500 transition-colors">
                {bannerPreview ? (
                  <div className="relative">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerPreview('');
                        setFormData(prev => ({ ...prev, bannerImage: null }));
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="py-8">
                    <ImageIcon className="mx-auto text-gray-400 mb-2" size={48} />
                    <p className="text-sm text-gray-600 mb-2">Click to upload banner image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageChange}
                      className="hidden"
                      id="bannerImage"
                    />
                    <label
                      htmlFor="bannerImage"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
                    >
                      <Upload size={16} />
                      Choose Banner Image
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Image - Only show if showOnHome is true */}
          {formData.showOnHome && (
            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Card Image (Home Page)</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Card Image
                  <span className="text-gray-500 font-normal text-xs ml-2">(Displayed on home page category cards)</span>
                </label>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                  {cardPreview ? (
                    <div className="relative">
                      <img
                        src={cardPreview}
                        alt="Card preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCardPreview('');
                          setFormData(prev => ({ ...prev, cardImage: null }));
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-8">
                      <ImageIcon className="mx-auto text-blue-400 mb-2" size={48} />
                      <p className="text-sm text-gray-600 mb-2">Click to upload card image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCardImageChange}
                        className="hidden"
                        id="cardImage"
                      />
                      <label
                        htmlFor="cardImage"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        <Upload size={16} />
                        Choose Card Image
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subcategory Management - Only for Edit Mode */}
          {isEdit && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Manage Subcategories</h2>

              {/* Add Subcategory */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add New Subcategory
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    placeholder="Enter subcategory name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Subcategories List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Current Subcategories ({subcategories.length})
                </h3>
                {subcategories.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg">
                    No subcategories yet. Add your first subcategory above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subcategories.map((sub) => (
                      <div
                        key={sub._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{sub.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubcategory(sub._id)}
                          className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/categories')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  {isEdit ? 'Update Category' : 'Create Category'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
  );
};

export default AddEditCategory;
