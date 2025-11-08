import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Minus, Plus, Truck, Shield, RefreshCw, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';
import { getProductUrl } from '../../utils/productUrl';

const ProductDetail = ({ addToCart, addToWishlist, isInWishlist }) => {
  const { id, category, subcategory, productSlug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [mediaItems, setMediaItems] = useState([]); // Images + Video combined
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchProductDetails();
  }, [id, productSlug]);

  // Fetch related products after main product is loaded
  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
      // Build media items array (images + video)
      const items = [];

      // Add all images
      if (product.images && product.images.length > 0) {
        product.images.forEach(img => {
          items.push({ type: 'image', url: img });
        });
      }

      // Add video if exists
      if (product.video) {
        items.push({ type: 'video', url: product.video });
      }

      setMediaItems(items);
    }
  }, [product]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // Determine if using old format (ID) or new format (slug)
      const identifier = productSlug || id;

      // Fetch from API
      const response = await fetch(`${API_BASE_URL}/products/${identifier}`);
      const data = await response.json();

      if (data.success && data.data) {
        const productData = data.data;

        // Calculate discount
        const originalPrice = productData.originalPrice || productData.price;
        const discount = originalPrice > productData.price
          ? Math.round(((originalPrice - productData.price) / originalPrice) * 100)
          : 0;

        // Set product with default values for missing fields
        setProduct({
          ...productData,
          originalPrice: originalPrice,
          discount: discount,
          rating: productData.rating || 0,
          reviews: productData.reviews || 0,
          views: productData.views || 0,
          sold: productData.sold || 0,
          specifications: productData.specifications || {},
          features: productData.features || [],
          shippingInfo: productData.shippingInfo || {
            freeShipping: true,
            estimatedDays: '3-5 business days',
            courier: 'Secure Shipping'
          },
          returnPolicy: productData.returnPolicy || '100% Return Guaranteed if Found Forgery / Fake',
          warranty: productData.warranty || 'Authenticity Guarantee'
        });
        setLoading(false);
      } else {
        // Product not found
        console.error('Product not found');
        setProduct(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      if (!product || !product.category) return;

      // Fetch products from same category
      const response = await fetch(`${API_BASE_URL}/products?category=${product.category}`);
      const data = await response.json();

      if (data.success && data.data) {
        // Filter out current product and limit to 4 products
        const filtered = data.data
          .filter(p => p._id !== id)
          .slice(0, 4);
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
      setRelatedProducts([]);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    const maxStock = product?.inStock || 1;
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    alert('Product added to cart!');
  };

  const handleBuyNow = () => {
    // Navigate to checkout with product details
    navigate('/checkout', {
      state: {
        cartItems: [{
          ...product,
          quantity: quantity
        }]
      }
    });
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % mediaItems.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <button
            onClick={() => navigate('/coins')}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="hover:text-amber-600 transition-colors font-medium"
          >
            Home
          </button>
          <span className="text-gray-400">/</span>
          <button
            onClick={() => navigate(`/category/${product.category}`)}
            className="hover:text-amber-600 transition-colors capitalize font-medium"
          >
            {product.category}
          </button>
          {product.subCategory && (
            <>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => navigate(`/category/${product.category}?subCategory=${product.subCategory}`)}
                className="hover:text-amber-600 transition-colors capitalize font-medium"
              >
                {product.subCategory}
              </button>
            </>
          )}
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-semibold truncate max-w-[300px]" title={product.name}>
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Media Gallery */}
          <div>
            {/* Main Display Area */}
            <div
              className="relative bg-white rounded-2xl shadow-lg overflow-hidden mb-4 group cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => mediaItems[selectedImage]?.type === 'image' && setShowZoom(true)}
              onMouseLeave={() => setShowZoom(false)}
            >
              {mediaItems.length > 0 && mediaItems[selectedImage] && (
                <>
                  {mediaItems[selectedImage].type === 'image' ? (
                    <div className="relative w-full h-[500px] overflow-hidden">
                      <img
                        src={mediaItems[selectedImage].url}
                        alt={product.name}
                        className="w-full h-full object-contain transition-transform duration-100"
                        style={showZoom ? {
                          transform: 'scale(2)',
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                        } : {}}
                      />
                    </div>
                  ) : (
                    <video
                      src={mediaItems[selectedImage].url}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-[500px] object-contain bg-black"
                      poster={product.images?.[0]}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </>
              )}

              {/* Navigation Buttons */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Rarity Badge */}
              {product.rarity && (
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                  {product.rarity}
                </div>
              )}

              {/* Share Button */}
              <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors">
                <Share2 size={20} />
              </button>
            </div>

            {/* Thumbnail Gallery (Images + Video) */}
            <div className="grid grid-cols-4 gap-2">
              {mediaItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative bg-white rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-amber-600' : 'border-gray-200 hover:border-amber-400'
                  }`}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`View ${index + 1}`}
                      className="w-full h-24 object-contain"
                    />
                  ) : (
                    <div className="relative w-full h-24 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        Video
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Category Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
                  {product.category}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {product.subCategory}
                </span>
              </div>

              {/* Product Code */}
              {product.productCode && (
                <div className="mb-3">
                  <span className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full">
                    Code: {product.productCode}
                  </span>
                </div>
              )}

              {/* Product Name */}
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{product.name}</h1>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-4xl font-bold text-amber-600">
                    ₹{(product.price || 0).toLocaleString()}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-2xl text-gray-400 line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  (Inclusive of all Taxes and Shipping)
                </p>
                {product.originalPrice && product.originalPrice > product.price && product.discount > 0 && (
                  <p className="text-green-600 font-semibold">
                    You Save: ₹{(product.originalPrice - product.price).toLocaleString()} ({product.discount}%)
                  </p>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {(product.inStock || 0) > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-green-600 font-semibold">
                      In Stock
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-red-600 font-semibold">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Numista Rarity Index */}
              {product.numistaRarityIndex > 0 && (
                <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-300 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-amber-900">📊 Numista Rarity Index</span>
                    <span className="text-2xl font-black text-amber-700">{product.numistaRarityIndex}/100</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-full transition-all duration-500 shadow-md"
                      style={{ width: `${product.numistaRarityIndex}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-full">
                      {product.numistaRarityIndex >= 80 ? '🔥 Extremely Rare' :
                       product.numistaRarityIndex >= 60 ? '⭐ Very Rare' :
                       product.numistaRarityIndex >= 40 ? '💎 Rare' :
                       product.numistaRarityIndex >= 20 ? '✨ Uncommon' : '📌 Common'}
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <div className="inline-flex items-center border-2 border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="px-6 py-2 text-lg font-bold border-x-2 border-gray-300 min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.inStock || 1)}
                    className="p-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={handleBuyNow}
                  disabled={product.inStock === 0}
                  className="flex-1 py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={product.inStock === 0}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
                <button
                  onClick={() => addToWishlist(product)}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    isInWishlist(product._id)
                      ? 'bg-red-50 border-red-500 text-red-500'
                      : 'border-gray-300 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  <Heart size={24} className={isInWishlist(product._id) ? 'fill-current' : ''} />
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Truck className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Free Shipping</p>
                    <p className="text-xs text-gray-600">{product.shippingInfo.estimatedDays}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Shield className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Authentic</p>
                    <p className="text-xs text-gray-600">{product.warranty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <RefreshCw className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">100% Return</p>
                    <p className="text-xs text-gray-600 leading-tight">Guaranteed if Found<br />Forgery / Fake</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          {/* Tabs */}
          <div className="flex gap-4 border-b-2 mb-6">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-6 py-3 font-semibold transition-colors relative ${
                activeTab === 'description'
                  ? 'text-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Description
              {activeTab === 'description' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('specifications')}
              className={`px-6 py-3 font-semibold transition-colors relative ${
                activeTab === 'specifications'
                  ? 'text-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Specifications
              {activeTab === 'specifications' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-6 py-3 font-semibold transition-colors relative ${
                activeTab === 'features'
                  ? 'text-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Features
              {activeTab === 'features' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed">{product.description}</p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.specifications &&
                 (Array.isArray(product.specifications) ? product.specifications.length > 0 : Object.keys(product.specifications).length > 0) ? (
                  Array.isArray(product.specifications) ? (
                    // Handle array format: [{key: 'Year', value: '1909'}]
                    product.specifications.map((spec, index) => (
                      <div key={index} className="flex gap-3 border-b pb-3">
                        <span className="font-semibold text-gray-900 min-w-fit">{spec.key}:</span>
                        <span className="text-gray-700 flex-1">{spec.value}</span>
                      </div>
                    ))
                  ) : (
                    // Handle object format: {Year: '1909'}
                    Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex gap-3 border-b pb-3">
                        <span className="font-semibold text-gray-900 min-w-fit">{key}:</span>
                        <span className="text-gray-700 flex-1">{value}</span>
                      </div>
                    ))
                  )
                ) : (
                  <p className="text-gray-500 col-span-2">No specifications available</p>
                )}
              </div>
            )}

            {activeTab === 'features' && (
              <ul className="space-y-3">
                {product.features && product.features.length > 0 ? (
                  product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-amber-600 rounded-full mt-2"></span>
                      <span className="text-gray-700 text-lg">{feature}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No features available</p>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct._id}
                  onClick={() => navigate(getProductUrl(relatedProduct))}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden group"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={relatedProduct.images?.[0] || relatedProduct.image || '/api/placeholder/300/300'}
                      alt={relatedProduct.name}
                      className="w-full h-64 object-cover group-hover:scale-125 transition-transform duration-500 ease-out"
                    />
                    {relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        {Math.round(((relatedProduct.originalPrice - relatedProduct.price) / relatedProduct.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">{relatedProduct.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-amber-600">₹{(relatedProduct.price || 0).toLocaleString()}</span>
                      {relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price && (
                        <span className="text-sm text-gray-400 line-through">₹{relatedProduct.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                    {relatedProduct.inStock > 0 ? (
                      <p className="text-sm text-green-600 mt-2 font-semibold">In Stock</p>
                    ) : (
                      <p className="text-sm text-red-600 mt-2 font-semibold">Out of Stock</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
