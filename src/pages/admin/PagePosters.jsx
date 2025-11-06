import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, ChevronDown, ChevronUp, FolderPlus, Layers, ChevronRight } from 'lucide-react';

const PagePosters = () => {
  const [categories, setCategories] = useState([]);
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'edit', 'add-slider', 'add-subcategory'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    isActive: true
  });

  const [sliderForm, setSliderForm] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    order: 1
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
    description: '',
    isActive: true
  });

  // Sample data (replace with API calls later)
  useEffect(() => {
    // Load sample categories
    setCategories([
      {
        id: 1,
        name: 'Coins',
        description: 'Rare and vintage coins collection',
        icon: '🪙',
        isActive: true,
        sliders: [
          { id: 1, title: 'Rare Coins', subtitle: 'Discover vintage treasures', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800', link: '/coins', order: 1 },
          { id: 2, title: 'Gold Coins', subtitle: 'Premium collection', image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800', link: '/coins/gold', order: 2 }
        ],
        subcategories: [
          { id: 1, name: 'Ancient Coins', description: 'Historical coins', isActive: true },
          { id: 2, name: 'Modern Coins', description: 'Contemporary collection', isActive: true }
        ]
      },
      {
        id: 2,
        name: 'Bank Notes',
        description: 'Collectible currency notes',
        icon: '💵',
        isActive: true,
        sliders: [],
        subcategories: []
      }
    ]);
  }, []);

  // Category Management
  const handleCreateCategory = (e) => {
    e.preventDefault();
    const newCategory = {
      id: Date.now(),
      ...categoryForm,
      sliders: [],
      subcategories: []
    };
    setCategories([...categories, newCategory]);
    resetCategoryForm();
    setActiveView('list');
  };

  const handleUpdateCategory = (e) => {
    e.preventDefault();
    setCategories(categories.map(cat =>
      cat.id === selectedCategory.id ? { ...cat, ...categoryForm } : cat
    ));
    resetCategoryForm();
    setActiveView('list');
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      icon: '',
      isActive: true
    });
    setSelectedCategory(null);
  };

  // Slider Management
  const handleAddSlider = (e) => {
    e.preventDefault();
    const newSlider = {
      id: Date.now(),
      ...sliderForm
    };
    setCategories(categories.map(cat =>
      cat.id === selectedCategory.id
        ? { ...cat, sliders: [...cat.sliders, newSlider] }
        : cat
    ));
    resetSliderForm();
    setActiveView('list');
  };

  const handleDeleteSlider = (categoryId, sliderId) => {
    if (window.confirm('Delete this slider?')) {
      setCategories(categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, sliders: cat.sliders.filter(s => s.id !== sliderId) }
          : cat
      ));
    }
  };

  const resetSliderForm = () => {
    setSliderForm({
      title: '',
      subtitle: '',
      image: '',
      link: '',
      order: 1
    });
    setSelectedCategory(null);
  };

  // Subcategory Management
  const handleAddSubcategory = (e) => {
    e.preventDefault();
    const newSubcategory = {
      id: Date.now(),
      ...subcategoryForm
    };
    setCategories(categories.map(cat =>
      cat.id === selectedCategory.id
        ? { ...cat, subcategories: [...cat.subcategories, newSubcategory] }
        : cat
    ));
    resetSubcategoryForm();
    setActiveView('list');
  };

  const handleDeleteSubcategory = (categoryId, subcategoryId) => {
    if (window.confirm('Delete this subcategory?')) {
      setCategories(categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, subcategories: cat.subcategories.filter(s => s.id !== subcategoryId) }
          : cat
      ));
    }
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({
      name: '',
      description: '',
      isActive: true
    });
    setSelectedCategory(null);
  };

  // Image upload handler
  const handleImageUpload = (e, formType) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (formType === 'slider') {
          setSliderForm(prev => ({ ...prev, image: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Move category up/down
  const moveCategoryUp = (index) => {
    if (index === 0) return;
    const newCategories = [...categories];
    [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    setCategories(newCategories);
  };

  const moveCategoryDown = (index) => {
    if (index === categories.length - 1) return;
    const newCategories = [...categories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    setCategories(newCategories);
  };

  // Render different views
  const renderListView = () => (
    <div className="p-8">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            <span className="text-5xl mr-2">📁</span>
            Category <span className="text-accent-600">Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Create and manage categories, sliders, and subcategories</p>
        </div>
        <button
          onClick={() => setActiveView('create')}
          className="group bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-2xl px-8 py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex items-center gap-3 font-bold"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <Plus size={24} className="relative z-10" />
          <span className="relative z-10">Create Category</span>
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-8">
        {categories.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-16 text-center border-2 border-gray-100 dark:border-gray-800">
            <div className="inline-block p-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl mb-6">
              <div className="text-8xl">📂</div>
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">No Categories Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Create your first category to get started</p>
            <button
              onClick={() => setActiveView('create')}
              className="group bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl px-8 py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden inline-flex items-center gap-3 font-bold"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <Plus size={24} className="relative z-10" />
              <span className="relative z-10">Create First Category</span>
            </button>
          </div>
        ) : (
          categories.map((category, index) => (
            <div key={category.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border-2 border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300">
              {/* Category Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-2xl">
                    <span className="text-5xl">{category.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{category.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{category.description}</p>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-bold ${category.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {category.isActive ? '✓ Active' : '○ Inactive'}
                      </span>
                      <span className="px-4 py-1.5 rounded-xl text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        {category.sliders.length} Sliders
                      </span>
                      <span className="px-4 py-1.5 rounded-xl text-xs font-bold bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
                        {category.subcategories.length} Subcategories
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <button
                      onClick={() => moveCategoryUp(index)}
                      disabled={index === 0}
                      className={`p-2 rounded-lg transition-all ${index === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'}`}
                      title="Move up"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      onClick={() => moveCategoryDown(index)}
                      disabled={index === categories.length - 1}
                      className={`p-2 rounded-lg transition-all ${index === categories.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'}`}
                      title="Move down"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setCategoryForm({
                        name: category.name,
                        description: category.description,
                        icon: category.icon,
                        isActive: category.isActive
                      });
                      setActiveView('edit');
                    }}
                    className="px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl font-bold hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <Edit2 size={18} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="px-6 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl font-bold hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => {
                    setSelectedCategory(category);
                    setActiveView('add-slider');
                  }}
                  className="group px-6 py-4 bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-xl font-bold hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <ImageIcon size={20} className="relative z-10" />
                  <span className="relative z-10">Add Slider/Poster</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory(category);
                    setActiveView('add-subcategory');
                  }}
                  className="group px-6 py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FolderPlus size={20} className="relative z-10" />
                  <span className="relative z-10">Add Subcategory</span>
                </button>
                <button
                  onClick={() => alert('View details coming soon')}
                  className="group px-6 py-4 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-xl font-bold hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Layers size={20} className="relative z-10" />
                  <span className="relative z-10">Manage Items</span>
                </button>
              </div>

              {/* Sliders List */}
              {category.sliders.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-black text-gray-900 dark:text-white mb-4 flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl">
                      <ImageIcon size={20} className="text-white" />
                    </div>
                    Sliders/Posters ({category.sliders.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.sliders.map(slider => (
                      <div key={slider.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:border-yellow-400 dark:hover:border-yellow-500 hover:shadow-lg transition-all">
                        <img src={slider.image} alt={slider.title} className="w-full h-40 object-cover" />
                        <div className="p-4">
                          <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{slider.title}</h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{slider.subtitle}</p>
                          <button
                            onClick={() => handleDeleteSlider(category.id, slider.id)}
                            className="w-full px-4 py-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-xl hover:shadow-lg transition-all font-bold transform hover:-translate-y-0.5"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subcategories List */}
              {category.subcategories.length > 0 && (
                <div>
                  <h4 className="font-black text-gray-900 dark:text-white mb-4 flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                      <FolderPlus size={20} className="text-white" />
                    </div>
                    Subcategories ({category.subcategories.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.subcategories.map(subcategory => (
                      <div key={subcategory.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-5 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                              <ChevronRight size={16} className="text-purple-500" />
                              {subcategory.name}
                            </h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{subcategory.description}</p>
                            <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${subcategory.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}`}>
                              {subcategory.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                            className="p-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderCreateCategoryForm = () => (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            <span className="text-5xl mr-2">➕</span>
            Create New <span className="text-accent-600">Category</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Add a new category to organize your products</p>
        </div>
        <button
          onClick={() => {
            resetCategoryForm();
            setActiveView('list');
          }}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
        >
          <X size={20} />
          Cancel
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleCreateCategory} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border-2 border-gray-100 dark:border-gray-800 space-y-6">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-black text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Category Name *
            </label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold text-lg"
              placeholder="e.g., Coins, Bank Notes, Stamps"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-black text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Description *
            </label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold"
              placeholder="Brief description of this category"
              rows="4"
              required
            />
          </div>

          {/* Icon/Emoji */}
          <div>
            <label className="block text-sm font-black text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Icon/Emoji
            </label>
            <input
              type="text"
              value={categoryForm.icon}
              onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
              className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold text-5xl text-center"
              placeholder="🪙 💵 📚 ✉️"
              maxLength="2"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Add an emoji to represent this category</p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl">
            <input
              type="checkbox"
              id="isActive"
              checked={categoryForm.isActive}
              onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
              className="w-6 h-6 rounded-lg accent-accent-500"
            />
            <label htmlFor="isActive" className="text-sm font-bold text-gray-900 dark:text-white">
              Active (visible to customers)
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-xl font-bold hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 text-lg"
          >
            <Save size={24} />
            Create Category
          </button>
        </form>
      </div>
    </div>
  );

  const renderEditCategoryForm = () => (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-gradient mb-2">✏️ Edit Category</h1>
          <p className="text-gray-600">Update category information</p>
        </div>
        <button
          onClick={() => {
            resetCategoryForm();
            setActiveView('list');
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center gap-2"
        >
          <X size={18} />
          Cancel
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleUpdateCategory} className="card-modern p-8 space-y-6">
          {/* Same form fields as create */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Description *
            </label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Icon/Emoji
            </label>
            <input
              type="text"
              value={categoryForm.icon}
              onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-2xl"
              maxLength="2"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={categoryForm.isActive}
              onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
              className="w-5 h-5 rounded border-2 text-amber-600 focus:ring-2 focus:ring-amber-400"
            />
            <label htmlFor="isActiveEdit" className="text-sm font-semibold text-gray-900">
              Active (visible to customers)
            </label>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Update Category
          </button>
        </form>
      </div>
    </div>
  );

  const renderAddSliderForm = () => (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-gradient mb-2">🖼️ Add Slider/Poster</h1>
          <p className="text-gray-600">Add a promotional slider for {selectedCategory?.name}</p>
        </div>
        <button
          onClick={() => {
            resetSliderForm();
            setActiveView('list');
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center gap-2"
        >
          <X size={18} />
          Cancel
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleAddSlider} className="card-modern p-8 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Slider Image *
            </label>
            {sliderForm.image ? (
              <div className="relative rounded-lg overflow-hidden border-2 border-amber-300 mb-3">
                <img src={sliderForm.image} alt="Preview" className="w-full h-64 object-cover" />
                <button
                  type="button"
                  onClick={() => setSliderForm({ ...sliderForm, image: '' })}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center mb-3 border-2 border-dashed border-gray-300">
                <ImageIcon size={48} className="text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">Upload slider image</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'slider')}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={sliderForm.title}
              onChange={(e) => setSliderForm({ ...sliderForm, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-lg"
              placeholder="e.g., Premium Collection"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={sliderForm.subtitle}
              onChange={(e) => setSliderForm({ ...sliderForm, subtitle: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none"
              placeholder="e.g., Discover rare treasures"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Link URL
            </label>
            <input
              type="text"
              value={sliderForm.link}
              onChange={(e) => setSliderForm({ ...sliderForm, link: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none"
              placeholder="/products/category"
            />
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={sliderForm.order}
              onChange={(e) => setSliderForm({ ...sliderForm, order: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Add Slider
          </button>
        </form>
      </div>
    </div>
  );

  const renderAddSubcategoryForm = () => (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-gradient mb-2">📁 Add Subcategory</h1>
          <p className="text-gray-600">Add a subcategory under {selectedCategory?.name}</p>
        </div>
        <button
          onClick={() => {
            resetSubcategoryForm();
            setActiveView('list');
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center gap-2"
        >
          <X size={18} />
          Cancel
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleAddSubcategory} className="card-modern p-8 space-y-6">
          {/* Subcategory Name */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Subcategory Name *
            </label>
            <input
              type="text"
              value={subcategoryForm.name}
              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none text-lg"
              placeholder="e.g., Ancient Coins, Modern Coins"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={subcategoryForm.description}
              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-amber-500 focus:outline-none"
              placeholder="Brief description"
              rows="3"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="subcatActive"
              checked={subcategoryForm.isActive}
              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, isActive: e.target.checked })}
              className="w-5 h-5 rounded border-2 text-amber-600 focus:ring-2 focus:ring-amber-400"
            />
            <label htmlFor="subcatActive" className="text-sm font-semibold text-gray-900">
              Active (visible to customers)
            </label>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Add Subcategory
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="max-w-full">
        {activeView === 'list' && renderListView()}
        {activeView === 'create' && renderCreateCategoryForm()}
        {activeView === 'edit' && renderEditCategoryForm()}
        {activeView === 'add-slider' && renderAddSliderForm()}
        {activeView === 'add-subcategory' && renderAddSubcategoryForm()}
      </div>
    </div>
  );
};

export default PagePosters;
