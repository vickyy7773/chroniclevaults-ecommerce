import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import { productService } from '../../services';
import { API_BASE_URL } from '../../constants/api';

const AddEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    description: '',
    costPrice: '',
    profitPercentage: '',
    profitAmount: '',
    price: '',
    originalPrice: '',
    discount: 0,
    gst: 0,
    hsnCode: '',
    category: '',
    subCategory: '',
    year: '',
    rarity: '',
    condition: '',
    denomination: '',
    metal: '',
    numistaRarityIndex: '',
    specifications: [{ key: '', value: '' }],
    features: [''],
    images: [''],
    video: '',
    inStock: '',
    featured: false,
    active: true
  });

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const conditions = [
    'Poor',
    'Fair',
    'Good',
    'Very Good',
    'Fine',
    'Very Fine',
    'Extremely Fine',
    'About Uncirculated',
    'Uncirculated',
    'Mint State',
    'Proof'
  ];

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    // Update subcategories when category changes
    if (formData.category) {
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      if (selectedCategory && selectedCategory.subCategories) {
        setSubCategories(selectedCategory.subCategories);
      } else {
        setSubCategories([]);
      }
    }
  }, [formData.category, categories]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success && data.data) {
        // Filter only main categories
        const mainCategories = data.data.filter(cat => cat.type === 'main' && cat.isActive);
        setCategories(mainCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching product:', id);
      const response = await productService.getProductById(id);
      console.log('📦 Product Response:', response);

      // Handle axios response format
      const productData = response?.data?.data || response?.data;
      const isSuccess = response?.data?.success !== false && response?.status === 200;

      console.log('📦 Product Data:', productData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && productData) {
        setFormData({
          productCode: productData.productCode || '',
          name: productData.name,
          description: productData.description,
          costPrice: productData.costPrice || '',
          profitPercentage: productData.profitPercentage || '',
          profitAmount: productData.profitAmount || '',
          price: productData.price,
          originalPrice: productData.originalPrice || '',
          discount: productData.discount || 0,
          gst: productData.gst || 0,
          category: productData.category,
          subCategory: productData.subCategory || '',
          year: productData.year || new Date().getFullYear(),
          rarity: productData.rarity || 'Common',
          condition: productData.condition || '',
          denomination: productData.denomination || '',
          metal: productData.metal || '',
          numistaRarityIndex: productData.numistaRarityIndex || '',
          specifications: productData.specifications || [{ key: '', value: '' }],
          features: productData.features || [''],
          images: productData.images,
          video: productData.video || '',
          inStock: productData.inStock,
          featured: productData.featured || false,
          active: productData.active !== false
        });
        console.log('✅ Product loaded successfully');
      } else {
        console.error('❌ Failed to load product data');
        alert('Failed to load product');
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('❌ Failed to fetch product:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to load product: ' + (error.response?.data?.message || error.message));
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle pricing changes with auto-calculation
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    setFormData(prev => {
      let newData = { ...prev, [name]: value };

      // Profit calculation logic
      // If cost price is changed
      if (name === 'costPrice') {
        if (numValue > 0 && prev.profitPercentage) {
          const profitPercent = parseFloat(prev.profitPercentage) || 0;
          const profitAmt = (numValue * profitPercent) / 100;
          const sellingPrice = numValue + profitAmt;
          newData.profitAmount = profitAmt.toFixed(2);
          newData.price = sellingPrice.toFixed(2);
        }
      }

      // If profit percentage is changed
      if (name === 'profitPercentage') {
        const costPrice = parseFloat(prev.costPrice) || 0;
        if (costPrice > 0 && numValue >= 0) {
          const profitAmt = (costPrice * numValue) / 100;
          const sellingPrice = costPrice + profitAmt;
          newData.profitAmount = profitAmt.toFixed(2);
          newData.price = sellingPrice.toFixed(2);
        }
      }

      // If selling price is changed and we have cost price
      if (name === 'price' && prev.costPrice) {
        const costPrice = parseFloat(prev.costPrice) || 0;
        if (costPrice > 0 && numValue > 0) {
          const profitAmt = numValue - costPrice;
          const profitPercent = (profitAmt / costPrice) * 100;
          newData.profitAmount = profitAmt.toFixed(2);
          newData.profitPercentage = profitPercent.toFixed(2);
        }
      }

      // MRP/Discount calculations (original logic)
      // If MRP changed and we have selling price, calculate discount
      if (name === 'originalPrice' && prev.price) {
        const sellingPrice = parseFloat(prev.price) || 0;
        if (numValue > 0 && sellingPrice > 0 && numValue > sellingPrice) {
          const discountPercent = ((numValue - sellingPrice) / numValue * 100).toFixed(2);
          newData.discount = discountPercent;
        } else {
          newData.discount = 0;
        }
      }

      // If selling price changed and we have MRP, calculate discount
      if (name === 'price' && prev.originalPrice) {
        const mrp = parseFloat(prev.originalPrice) || 0;
        if (mrp > 0 && numValue > 0 && mrp > numValue) {
          const discountPercent = ((mrp - numValue) / mrp * 100).toFixed(2);
          newData.discount = discountPercent;
        } else {
          newData.discount = 0;
        }
      }

      // If discount changed and we have MRP, calculate selling price
      if (name === 'discount' && prev.originalPrice) {
        const mrp = parseFloat(prev.originalPrice) || 0;
        if (mrp > 0 && numValue >= 0 && numValue <= 100) {
          const sellingPrice = (mrp * (1 - numValue / 100)).toFixed(2);
          newData.price = sellingPrice;
        }
      }

      return newData;
    });

    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImageField = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Specification handlers
  const handleSpecificationChange = (index, field, value) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData(prev => ({ ...prev, specifications: newSpecs }));
  };

  const addSpecificationField = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const removeSpecificationField = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  // Feature handlers
  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeatureField = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeatureField = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only image files (JPG, PNG, GIF, WEBP) are allowed');
      return;
    }

    // Check image dimensions
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => {
      img.onload = () => {
        // Recommended: 800x800px (1:1 ratio)
        // Minimum: 400x400px
        // Maximum: 2000x2000px
        if (img.width < 400 || img.height < 400) {
          alert('Image resolution too low!\n\nMinimum: 400x400px\nRecommended: 800x800px (1:1 square ratio)\nYour image: ' + img.width + 'x' + img.height + 'px');
          URL.revokeObjectURL(img.src);
          resolve(false);
          return;
        }
        if (img.width > 2000 || img.height > 2000) {
          alert('Image resolution too high!\n\nMaximum: 2000x2000px\nRecommended: 800x800px\nYour image: ' + img.width + 'x' + img.height + 'px\n\nPlease resize your image before uploading.');
          URL.revokeObjectURL(img.src);
          resolve(false);
          return;
        }
        URL.revokeObjectURL(img.src);
        resolve(true);
      };
    }).then(isValid => {
      if (!isValid) {
        e.target.value = null;
        return;
      }
    });

    try {
      setUploading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('image', file);

      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        // Update image URL in form
        const newImages = [...formData.images];
        newImages[index] = data.imageUrl; // Backend already returns full URL
        setFormData(prev => ({ ...prev, images: newImages }));
        alert('Image uploaded successfully!');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (50MB max for videos)
    if (file.size > 50 * 1024 * 1024) {
      alert('Video file size should be less than 50MB');
      return;
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only video files (MP4, WebM, OGG, MOV) are allowed');
      return;
    }

    try {
      setUploading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('video', file);

      const response = await fetch(`${API_BASE_URL}/upload/video`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        // Update video URL in form
        setFormData(prev => ({ ...prev, video: data.videoUrl }));
        alert('Video uploaded successfully!');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload video: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic Information
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.subCategory.trim()) newErrors.subCategory = 'Sub-category is required';

    // Pricing & Inventory
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.inStock || formData.inStock < 0) newErrors.inStock = 'Valid stock quantity is required';

    // Product Details
    if (!formData.year || formData.year.trim() === '') newErrors.year = 'Year/Era is required';
    if (!formData.rarity) newErrors.rarity = 'Rarity is required';
    if (!formData.condition.trim()) newErrors.condition = 'Condition is required';

    // Images
    if (formData.images.filter(img => img.trim()).length === 0) {
      newErrors.images = 'At least one image is required. Please upload an image or paste an image URL.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Clean up data
      const productData = {
        ...formData,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
        profitPercentage: formData.profitPercentage ? parseFloat(formData.profitPercentage) : 0,
        profitAmount: formData.profitAmount ? parseFloat(formData.profitAmount) : 0,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : parseFloat(formData.price),
        discount: parseFloat(formData.discount) || 0,
        gst: parseFloat(formData.gst) || 0,
        inStock: parseInt(formData.inStock),
        year: formData.year.trim(),
        specifications: formData.specifications.filter(spec => spec.key.trim() && spec.value.trim()),
        features: formData.features.filter(feature => feature.trim()),
        images: formData.images.filter(img => img.trim())
      };

      console.log('📦 Submitting product data:', productData);

      let response;
      if (isEditMode) {
        console.log('📝 Updating product:', id);
        response = await productService.updateProduct(id, productData);
        console.log('📝 Update response:', response);
      } else {
        console.log('✨ Creating new product');
        response = await productService.createProduct(productData);
        console.log('✨ Create response:', response);
      }

      // Check if the operation was successful
      const isSuccess = (response?.status === 200 || response?.status === 201) && response?.data?.success !== false;

      if (isSuccess) {
        alert(isEditMode ? 'Product updated successfully!' : 'Product created successfully!');
        navigate('/admin/products');
      } else {
        const errorMsg = response?.data?.message || 'Failed to save product';
        console.error('❌ Save failed:', errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Failed to save product:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status
      });

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to save product';

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/admin/products')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl mb-6 font-semibold shadow-md hover:shadow-lg transition-all border-2 border-gray-200 dark:border-gray-700"
            >
              <ArrowLeft size={20} />
              Back to Products
            </button>

            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-1 rounded-2xl shadow-2xl">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
                <h1 className="text-5xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
                  {isEditMode ? '✏️ Edit Product' : '➕ Add New Product'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                  {isEditMode ? 'Update product information and settings' : 'Create a new product listing for your store'}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Basic Information</h2>
            </div>

            <div className="space-y-5">
              {/* Product Code */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  🔢 Product Code
                </label>
                <input
                  type="text"
                  name="productCode"
                  value={formData.productCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                  placeholder="e.g., COIN-2024-001 (optional)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Unique product code or SKU for identification</p>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  📦 Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-lg bg-gray-50 dark:bg-gray-900 dark:text-white ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., 1909-S VDB Lincoln Penny"
                />
                {errors.name && <p className="mt-2 text-sm text-red-600 font-semibold">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  📝 Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium bg-gray-50 dark:bg-gray-900 dark:text-white resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Write a detailed description that highlights the product's unique features, condition, and value..."
                />
                {errors.description && <p className="mt-2 text-sm text-red-600 font-semibold">{errors.description}</p>}
              </div>

              {/* Category & Sub-Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    🏷️ Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-lg bg-gray-50 dark:bg-gray-900 dark:text-white ${
                      errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-2 text-sm text-red-600 font-semibold">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    📂 Sub-Category *
                  </label>
                  {subCategories.length > 0 ? (
                    <select
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-lg bg-gray-50 dark:bg-gray-900 dark:text-white ${
                        errors.subCategory ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">Select Sub-Category</option>
                      {subCategories.map((subCat, index) => (
                        <option key={index} value={subCat}>{subCat}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-lg bg-gray-50 dark:bg-gray-900 dark:text-white ${
                        errors.subCategory ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="e.g., Penny, Half Dollar"
                    />
                  )}
                  {errors.subCategory && <p className="mt-2 text-sm text-red-600 font-semibold">{errors.subCategory}</p>}
                  {!formData.category && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Select a category first</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="mb-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Pricing & Inventory</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Cost Price - First */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  🏷️ Cost Price (₹)
                </label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handlePriceChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-cyan-300 dark:border-cyan-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-semibold text-lg bg-cyan-50 dark:bg-gray-800 dark:text-white"
                  placeholder="1000.00"
                />
                <p className="mt-1 text-xs text-cyan-600 dark:text-cyan-400 font-semibold">
                  💡 Your purchase price
                </p>
              </div>

              {/* Profit Percentage - Second */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  📊 Profit (%)
                </label>
                <input
                  type="number"
                  name="profitPercentage"
                  value={formData.profitPercentage}
                  onChange={handlePriceChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-emerald-300 dark:border-emerald-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold text-lg bg-emerald-50 dark:bg-gray-800 dark:text-white"
                  placeholder="25"
                />
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  💰 Profit margin %
                </p>
              </div>

              {/* Profit Amount - Third (Read-only) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  💵 Profit Amount (₹)
                </label>
                <input
                  type="number"
                  name="profitAmount"
                  value={formData.profitAmount}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-green-300 dark:border-green-600 rounded-xl font-semibold text-lg bg-green-50 dark:bg-gray-800 dark:text-white cursor-not-allowed"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                  ✅ Auto-calculated
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* MRP (Original Price) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  💰 MRP / Original Price (₹)
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handlePriceChange}
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-lg bg-blue-50 dark:bg-gray-800 dark:text-white"
                  placeholder="1500.00"
                />
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  📝 Optional
                </p>
              </div>

              {/* Selling Price - Second */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  🏷️ Selling Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handlePriceChange}
                  step="0.01"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent font-semibold text-lg bg-white dark:bg-gray-800 dark:text-white ${
                    errors.price ? 'border-red-500' : 'border-green-300 dark:border-green-600'
                  }`}
                  placeholder="1250.00"
                />
                {errors.price && <p className="mt-1 text-sm text-red-600 font-semibold">{errors.price}</p>}
                {!errors.price && <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                  💡 Auto-calculates discount
                </p>}
              </div>

              {/* Discount - Third */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  🎯 Discount (%)
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handlePriceChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border-2 border-purple-300 dark:border-purple-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-lg bg-purple-50 dark:bg-gray-800 dark:text-white"
                  placeholder="0"
                  readOnly={!formData.originalPrice}
                />
                <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  {formData.originalPrice ? '🔄 Auto-calculated' : '⚠️ Enter MRP first'}
                </p>
              </div>

              {/* GST - Fourth */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  📋 GST (%)
                </label>
                <input
                  type="number"
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border-2 border-indigo-300 dark:border-indigo-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-semibold text-lg bg-indigo-50 dark:bg-gray-800 dark:text-white"
                  placeholder="18"
                />
                <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  💼 GST Rate
                </p>
              </div>

              {/* HSN Code - Fifth */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  🏷️ HSN Code
                </label>
                <input
                  type="text"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  maxLength="20"
                  className="w-full px-4 py-3 border-2 border-teal-300 dark:border-teal-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent font-semibold text-lg bg-teal-50 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., 9705 00 00"
                />
                <p className="mt-1 text-xs text-teal-600 dark:text-teal-400 font-semibold">
                  📊 Harmonized System of Nomenclature Code
                </p>
              </div>

              {/* Stock - Sixth */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  📦 Stock Quantity *
                </label>
                <input
                  type="number"
                  name="inStock"
                  value={formData.inStock}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent font-semibold text-lg bg-white dark:bg-gray-800 dark:text-white ${
                    errors.inStock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="10"
                />
                {errors.inStock && <p className="mt-1 text-sm text-red-600 font-semibold">{errors.inStock}</p>}
              </div>
            </div>

            {/* Profit & Price Summary Card */}
            {(formData.price || formData.costPrice) && (
              <div className="mt-6 space-y-4">
                {/* Profit Summary */}
                {formData.costPrice && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-300 dark:border-green-700">
                    <h3 className="text-sm font-bold text-green-800 dark:text-green-300 mb-3">📊 Profit Analysis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cost Price</p>
                        <p className="text-lg font-black text-gray-900 dark:text-white">
                          ₹{formData.costPrice || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Profit %</p>
                        <p className="text-lg font-black text-emerald-600">{formData.profitPercentage || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Profit Amount</p>
                        <p className="text-lg font-black text-green-600">
                          ₹{formData.profitAmount || 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-lg p-2">
                        <p className="text-xs text-green-700 dark:text-green-300 mb-1 font-semibold">Selling Price</p>
                        <p className="text-xl font-black text-green-700 dark:text-green-400">
                          ₹{formData.price || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Discount Summary */}
                {formData.discount > 0 && (
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-amber-300 dark:border-amber-700">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">💰 Customer Price Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">MRP</p>
                        <p className="text-lg font-black text-gray-900 dark:text-white">
                          ₹{formData.originalPrice || formData.price || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Discount</p>
                        <p className="text-lg font-black text-red-600">{formData.discount || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Customer Saves</p>
                        <p className="text-lg font-black text-green-600">
                          ₹{((formData.originalPrice || formData.price || 0) * (formData.discount || 0) / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-lg p-2">
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-1 font-semibold">Final Price</p>
                        <p className="text-xl font-black text-amber-700 dark:text-amber-400">
                          ₹{formData.price || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Product Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  📅 Year/Era * <span className="text-xs text-gray-500">(Max 10 chars)</span>
                </label>
                <input
                  type="text"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  maxLength={10}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-lg bg-gray-50 dark:bg-gray-900 dark:text-white ${
                    errors.year ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., 2024, BC, VS"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Examples: 2024, 500 BC, VS 2080, Samvat
                </p>
                {errors.year && <p className="mt-2 text-sm text-red-600 font-semibold">{errors.year}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  💎 Rarity *
                </label>
                <select
                  name="rarity"
                  value={formData.rarity}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-lg bg-gray-50 dark:bg-gray-900 dark:text-white ${
                    errors.rarity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select Rarity</option>
                  {rarities.map(rarity => (
                    <option key={rarity} value={rarity}>{rarity}</option>
                  ))}
                </select>
                {errors.rarity && <p className="mt-2 text-sm text-red-600 font-semibold">{errors.rarity}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  ✨ Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-lg bg-gray-50 dark:bg-gray-900 dark:text-white ${
                    errors.condition ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select Condition</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
                {errors.condition && <p className="mt-2 text-sm text-red-600 font-semibold">{errors.condition}</p>}
              </div>
            </div>

            {/* Additional Details - Denomination, Metal, Numista Index */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  🪙 Denomination
                </label>
                <select
                  name="denomination"
                  value={formData.denomination}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select Denomination</option>
                  {denominations.map(denom => (
                    <option key={denom} value={denom}>{denom}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Coin/Note value</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  ⚡ Metal Composition
                </label>
                <select
                  name="metal"
                  value={formData.metal}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select Metal</option>
                  {metals.map(metal => (
                    <option key={metal} value={metal}>{metal}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Material type</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  📊 Numista Rarity Index
                </label>
                <input
                  type="number"
                  name="numistaRarityIndex"
                  value={formData.numistaRarityIndex}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                  placeholder="0-100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Rarity score (0-100)</p>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Specifications</h2>
            </div>

            <div className="space-y-4">
              {formData.specifications.map((spec, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-semibold bg-gray-50 dark:bg-gray-900 dark:text-white"
                    placeholder="e.g., Weight, Diameter, Metal"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-semibold bg-gray-50 dark:bg-gray-900 dark:text-white"
                    placeholder="e.g., 2.5g, 19mm, Copper"
                  />
                  {formData.specifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecificationField(index)}
                      className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSpecificationField}
                className="w-full py-3 border-2 border-dashed border-cyan-300 dark:border-cyan-700 rounded-xl text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors font-bold"
              >
                + Add Specification
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Key Features</h2>
            </div>

            <div className="space-y-4">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent font-semibold bg-gray-50 dark:bg-gray-900 dark:text-white"
                    placeholder="e.g., Rare mint mark, Historical significance, Perfect condition"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeatureField(index)}
                      className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeatureField}
                className="w-full py-3 border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors font-bold"
              >
                + Add Feature
              </button>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg">
                <ImageIcon size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Product Images</h2>
            </div>

            {/* Image Guidelines */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 rounded-lg">
              <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                <ImageIcon size={18} />
                Image Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">📐 Resolution</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-green-600 dark:text-green-400">Recommended:</span> 800×800px
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-amber-600 dark:text-amber-400">Min:</span> 400×400px | <span className="font-medium text-red-600 dark:text-red-400">Max:</span> 2000×2000px
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">📦 File Size</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-red-600 dark:text-red-400">Maximum:</span> 5MB per image
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">🖼️ Format</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    JPG, PNG, WEBP, GIF
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Square ratio (1:1) works best
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {formData.images.map((image, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={image}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-medium bg-gray-50 dark:bg-gray-900 dark:text-white"
                        placeholder="Image URL (auto-filled after upload or paste manually)"
                      />
                    </div>
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="px-4 py-3 text-white bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>

                  {/* Image Upload Button */}
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, index)}
                        className="hidden"
                        disabled={uploading}
                      />
                      <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 text-sm font-semibold">
                        <ImageIcon size={16} className="mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </span>
                    </label>
                    {image && (
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="h-16 w-16 object-cover rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
              {errors.images && <p className="text-sm text-red-600">{errors.images}</p>}

              <button
                type="button"
                onClick={addImageField}
                className="flex items-center text-amber-600 hover:text-amber-700"
              >
                <ImageIcon size={20} className="mr-2" />
                Add Another Image
              </button>
            </div>
          </div>

          {/* Product Video */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Product Video</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  🎥 Video URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.video}
                  onChange={(e) => setFormData(prev => ({ ...prev, video: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium bg-gray-50 dark:bg-gray-900 dark:text-white"
                  placeholder="Video URL (auto-filled after upload or paste manually)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Upload a short video showcasing the product</p>
              </div>

              {/* Video Upload Button */}
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 text-sm font-semibold">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {uploading ? 'Uploading...' : 'Upload Video'}
                  </span>
                </label>
                {formData.video && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, video: '' }))}
                    className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    🗑️ Remove Video
                  </button>
                )}
              </div>

              {/* Video Preview */}
              {formData.video && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Video Preview:</p>
                  <video
                    src={formData.video}
                    controls
                    className="w-full max-w-md rounded-lg border-2 border-gray-300 dark:border-gray-600"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Product Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-lg transition-all">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-6 h-6 text-amber-600 border-gray-300 rounded-lg focus:ring-amber-500"
                />
                <div>
                  <span className="block text-lg font-black text-gray-900 dark:text-white">Recently Added Items</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Display on homepage featured section</span>
                </div>
              </label>

              <label className="flex items-center gap-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-all">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="w-6 h-6 text-green-600 border-gray-300 rounded-lg focus:ring-green-500"
                />
                <div>
                  <span className="block text-lg font-black text-gray-900 dark:text-white">✅ Active Status</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Visible on website</span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 sticky bottom-8 z-10">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-bold text-lg transition-all bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              ❌ Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed font-black text-xl transition-all transform hover:-translate-y-1 shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={24} />
                  {isEditMode ? '💾 Update Product' : '✨ Create Product'}
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
  );
};

export default AddEditProduct;
