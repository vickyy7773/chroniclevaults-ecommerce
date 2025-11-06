import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, FolderTree, Image as ImageIcon, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, main, sub
  const [loading, setLoading] = useState(false);
  const [uploadingImageFor, setUploadingImageFor] = useState(null);
  const fileInputRefs = useRef({});

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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    console.log('🔄 Fetching categories from API...');
    console.log('API URL:', API_BASE_URL);

    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Categories received:', data);

      if (data.success) {
        console.log(`✅ ${data.data.length} categories loaded`);
        setCategories(data.data);
      } else {
        console.error('❌ API returned success: false');
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      alert(`Failed to load categories: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      console.log('🗑️ Deleting category:', categoryId);
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          alert('Please login again');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        console.log('Delete response:', data);

        if (data.success) {
          console.log('✅ Category deleted, refreshing list...');
          // Refresh the list from server
          await fetchCategories();
          alert('✅ Category deleted successfully!');
        } else {
          alert(`❌ ${data.message || 'Failed to delete category'}`);
        }
      } catch (error) {
        console.error('❌ Error deleting category:', error);
        alert(`❌ Failed to delete category: ${error.message}`);
      }
    }
  };

  const toggleStatus = async (categoryId) => {
    try {
      const category = categories.find(cat => cat._id === categoryId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...category,
          isActive: !category.isActive
        })
      });
      const data = await response.json();
      if (data.success) {
        setCategories(categories.map(cat =>
          cat._id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
        ));
      }
    } catch (error) {
      console.error('Error updating category status:', error);
    }
  };

  const toggleShowOnHome = async (categoryId, newValue) => {
    try {
      const category = categories.find(cat => cat._id === categoryId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...category,
          showOnHome: newValue
        })
      });
      const data = await response.json();
      if (data.success) {
        setCategories(categories.map(cat =>
          cat._id === categoryId ? { ...cat, showOnHome: newValue } : cat
        ));
        if (newValue) {
          alert('✅ Category will show on home page! Upload a card image for best results.');
        }
      }
    } catch (error) {
      console.error('Error updating showOnHome:', error);
    }
  };

  const moveCategory = async (categoryId, direction) => {
    try {
      setLoading(true); // Show loading state

      const token = localStorage.getItem('token');
      const mainCategories = categories.filter(cat => cat.type === 'main').sort((a, b) => (a.order || 0) - (b.order || 0));
      const currentIndex = mainCategories.findIndex(cat => cat._id === categoryId);

      if (direction === 'up' && currentIndex === 0) {
        setLoading(false);
        return;
      }
      if (direction === 'down' && currentIndex === mainCategories.length - 1) {
        setLoading(false);
        return;
      }

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const currentCategory = mainCategories[currentIndex];
      const swapCategory = mainCategories[newIndex];

      console.log(`🔄 Moving "${currentCategory.name}" ${direction}...`);

      // Update orders
      await fetch(`${API_BASE_URL}/categories/${currentCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...currentCategory,
          order: swapCategory.order || newIndex
        })
      });

      await fetch(`${API_BASE_URL}/categories/${swapCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...swapCategory,
          order: currentCategory.order || currentIndex
        })
      });

      console.log(`✅ "${currentCategory.name}" moved successfully!`);

      // Refresh categories
      await fetchCategories();
    } catch (error) {
      console.error('❌ Error moving category:', error);
      alert('Failed to reorder category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerImageUpload = async (categoryId, file) => {
    if (!file) return;

    try {
      setUploadingImageFor(categoryId + '_banner');
      console.log('🖼️ Uploading banner image for category:', categoryId);

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        return;
      }

      // Create FormData and upload image
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/banner-image`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('Banner image upload response:', data);

      if (data.success) {
        console.log('✅ Banner image updated successfully!');
        alert('✅ Banner image updated successfully!');
        // Refresh categories to show new image
        await fetchCategories();
      } else {
        alert(`❌ ${data.message || 'Failed to update banner image'}`);
      }
    } catch (error) {
      console.error('❌ Error uploading banner image:', error);
      alert(`❌ Failed to update banner image: ${error.message}`);
    } finally {
      setUploadingImageFor(null);
    }
  };

  const handleCardImageUpload = async (categoryId, file) => {
    if (!file) return;

    try {
      setUploadingImageFor(categoryId + '_card');
      console.log('🖼️ Uploading card image for category:', categoryId);

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        return;
      }

      // Create FormData and upload image
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/card-image`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('Card image upload response:', data);

      if (data.success) {
        console.log('✅ Card image updated successfully!');
        alert('✅ Card image updated successfully!');
        // Refresh categories to show new image
        await fetchCategories();
      } else {
        alert(`❌ ${data.message || 'Failed to update card image'}`);
      }
    } catch (error) {
      console.error('❌ Error uploading card image:', error);
      alert(`❌ Failed to update card image: ${error.message}`);
    } finally {
      setUploadingImageFor(null);
    }
  };

  const triggerFileInput = (categoryId) => {
    fileInputRefs.current[categoryId]?.click();
  };

  const filteredCategories = categories
    .filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
      // Only show main categories in the list (subcategories will be shown inside)
      const matchesType = filterType === 'all'
        ? category.type === 'main'  // By default only show main categories
        : category.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              <p className="text-gray-700 font-semibold">Reordering categories...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
            <p className="text-gray-600 mt-1">Manage your product categories and subcategories</p>
          </div>
          <Link
            to="/admin/categories/add"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
          >
            <Plus size={20} />
            Add Category
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent min-w-[200px]"
            >
              <option value="all">📁 Main Categories</option>
              <option value="main">📂 Main Only</option>
              <option value="sub">📄 Sub Categories Only</option>
            </select>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-6">
          {filteredCategories.map((category, index) => {
            // Get subcategories for this main category (only for main categories)
            const categorySubcategories = category.type === 'main'
              ? categories.filter(cat => {
                  if (cat.type !== 'sub') return false;
                  const parentId = typeof cat.parentCategory === 'object'
                    ? cat.parentCategory?._id
                    : cat.parentCategory;
                  return parentId === category._id;
                })
              : [];

            // Get parent category info for subcategories
            const parentCategoryInfo = category.type === 'sub' && category.parentCategory
              ? categories.find(cat =>
                  cat._id === (typeof category.parentCategory === 'object'
                    ? category.parentCategory._id
                    : category.parentCategory)
                )
              : null;

            return (
            <div
              key={category._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-left-4"
            >
              <div className="flex flex-col md:flex-row">
                {/* Banner Image */}
                <div className="md:w-1/4 p-4">
                  <div className="text-xs text-gray-600 mb-1 font-semibold">Banner Image (Category Page)</div>
                  <div className="relative group">
                    {category.bannerImage ? (
                      <img
                        src={getImageUrl(category.bannerImage)}
                        alt={`${category.name} banner`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ImageIcon className="text-gray-400" size={32} />
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={(el) => fileInputRefs.current[category._id + '_banner'] = el}
                      accept="image/*"
                      onChange={(e) => handleBannerImageUpload(category._id, e.target.files[0])}
                      className="hidden"
                    />

                    {/* Change Image Button - Shows on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[category._id + '_banner']?.click()}
                        disabled={uploadingImageFor === category._id + '_banner'}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {uploadingImageFor === category._id + '_banner' ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Upload Banner
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Image (Only if showOnHome) */}
                {category.showOnHome && (
                  <div className="md:w-1/4 p-4">
                    <div className="text-xs text-gray-600 mb-1 font-semibold">Card Image (Home Page)</div>
                    <div className="relative group">
                      {category.cardImage ? (
                        <img
                          src={getImageUrl(category.cardImage)}
                          alt={`${category.name} card`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                          <ImageIcon className="text-gray-400" size={32} />
                        </div>
                      )}

                      {/* Hidden file input */}
                      <input
                        type="file"
                        ref={(el) => fileInputRefs.current[category._id + '_card'] = el}
                        accept="image/*"
                        onChange={(e) => handleCardImageUpload(category._id, e.target.files[0])}
                        className="hidden"
                      />

                      {/* Change Image Button - Shows on hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[category._id + '_card']?.click()}
                          disabled={uploadingImageFor === category._id + '_card'}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                          {uploadingImageFor === category._id + '_card' ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload size={16} />
                              Upload Card
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          category.type === 'main'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {category.type === 'main' ? 'Main Category' : 'Sub Category'}
                        </span>
                        <button
                          onClick={() => toggleStatus(category._id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            category.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </button>
                        {category.type === 'main' && (
                          <button
                            onClick={() => toggleShowOnHome(category._id, !category.showOnHome)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              category.showOnHome
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {category.showOnHome ? '🏠 On Home' : 'Not on Home'}
                          </button>
                        )}
                      </div>
                      {parentCategoryInfo && (
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                            <FolderTree size={14} />
                            Parent: {parentCategoryInfo.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">{category.description}</p>

                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-700">Products:</span>
                      <span className="text-gray-600">{category.productsCount || 0}</span>
                    </div>
                    {categorySubcategories.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-gray-700">Sub Categories:</span>
                        <span className="text-gray-600">{categorySubcategories.length}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-700">Created:</span>
                      <span className="text-gray-600">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {categorySubcategories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Sub Categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {categorySubcategories.map((sub) => (
                          <span
                            key={sub._id}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 items-center">
                    {/* Reorder Buttons - Only for main categories */}
                    {category.type === 'main' && (
                      <div className="flex flex-col gap-1 mr-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <button
                          onClick={() => moveCategory(category._id, 'up')}
                          disabled={index === 0 || loading}
                          className="p-2 bg-white text-gray-700 rounded-md hover:bg-amber-50 hover:text-amber-600 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-sm active:scale-95"
                          title="Move Up"
                        >
                          <ChevronUp size={18} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => moveCategory(category._id, 'down')}
                          disabled={index === filteredCategories.length - 1 || loading}
                          className="p-2 bg-white text-gray-700 rounded-md hover:bg-amber-50 hover:text-amber-600 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-sm active:scale-95"
                          title="Move Down"
                        >
                          <ChevronDown size={18} strokeWidth={2.5} />
                        </button>
                        <div className="text-[10px] text-center text-gray-500 font-semibold mt-0.5">#{index + 1}</div>
                      </div>
                    )}
                    <Link
                      to={`/admin/categories/edit/${category._id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      <Edit size={16} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <FolderTree size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No categories found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or add a new category</p>
            </div>
          )}
        </div>
      </div>
  );
};

export default CategoryManagement;
