import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Minus, Plus, Truck, Shield, RefreshCw, ChevronLeft, ChevronRight, Share2, Facebook, Twitter, Linkedin, MessageCircle, Copy, Check, X } from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';
import { getProductUrl } from '../../utils/productUrl';
import stampImage from '../../assets/stamp.png';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      // User not logged in - redirect to authentication page
      console.log('🚫 User not logged in, redirecting to authentication...');
      navigate('/authentication', {
        state: {
          from: window.location.pathname,
          cartItems: [{
            ...product,
            quantity: quantity
          }]
        }
      });
      return;
    }

    // User is logged in - navigate to checkout with product details
    console.log('✅ User logged in, proceeding to checkout');
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

  // Sharing Functions
  const getShareUrl = () => {
    return window.location.href;
  };

  const getShareText = () => {
    return `Check out this amazing ${product?.name || 'product'} at Chronicle Vaults!`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Product',
          text: getShareText(),
          url: getShareUrl(),
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
    }, 2000);
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(getShareText());
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const shareOnPinterest = () => {
    const url = encodeURIComponent(getShareUrl());
    const media = encodeURIComponent(product?.images?.[0] || '');
    const description = encodeURIComponent(product?.name || 'Product');
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`, '_blank', 'width=600,height=400');
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
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 flex-wrap overflow-x-auto">
          <button
            onClick={() => navigate('/')}
            className="hover:text-amber-600 transition-colors font-medium whitespace-nowrap"
          >
            Home
          </button>
          <span className="text-gray-400">/</span>
          <button
            onClick={() => navigate(`/category/${product.category}`)}
            className="hover:text-amber-600 transition-colors capitalize font-medium whitespace-nowrap"
          >
            {product.category}
          </button>
          {product.subCategory && (
            <>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => navigate(`/category/${product.category}?subCategory=${product.subCategory}`)}
                className="hover:text-amber-600 transition-colors capitalize font-medium whitespace-nowrap"
              >
                {product.subCategory}
              </button>
            </>
          )}
          <span className="text-gray-400 hidden sm:inline">/</span>
          <span className="text-gray-900 font-semibold truncate max-w-[150px] sm:max-w-[300px] hidden sm:inline" title={product.name}>
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          {/* Product Media Gallery */}
          <div>
            {/* Main Display Area */}
            <div
              className="relative bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden mb-3 sm:mb-4 group cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => mediaItems[selectedImage]?.type === 'image' && setShowZoom(true)}
              onMouseLeave={() => setShowZoom(false)}
            >
              {mediaItems.length > 0 && mediaItems[selectedImage] && (
                <>
                  {mediaItems[selectedImage].type === 'image' ? (
                    <div className="relative w-full h-[280px] sm:h-[400px] lg:h-[500px] overflow-hidden">
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
                      className="w-full h-[280px] sm:h-[400px] lg:h-[500px] object-contain bg-black"
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
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </>
              )}

              {/* Rarity Badge */}
              {product.rarity && (
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-slate-900/90 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  {product.rarity}
                </div>
              )}

              {/* Share Button */}
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                <button
                  onClick={handleNativeShare}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <Share2 size={20} />
                </button>

                {/* Share Modal */}
                {showShareModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Share Product</h3>
                        <button
                          onClick={() => setShowShareModal(false)}
                          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X size={18} className="sm:w-5 sm:h-5" />
                        </button>
                      </div>

                      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Share this product with your friends</p>

                      {/* Social Media Buttons */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <button
                          onClick={shareOnFacebook}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Facebook size={18} className="sm:w-5 sm:h-5" fill="currentColor" />
                          <span className="text-sm sm:text-base font-semibold">Facebook</span>
                        </button>

                        <button
                          onClick={shareOnTwitter}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-2 border-sky-500 text-sky-500 rounded-lg hover:bg-sky-50 transition-colors"
                        >
                          <Twitter size={18} className="sm:w-5 sm:h-5" fill="currentColor" />
                          <span className="text-sm sm:text-base font-semibold">Twitter</span>
                        </button>

                        <button
                          onClick={shareOnWhatsApp}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <MessageCircle size={18} className="sm:w-5 sm:h-5" />
                          <span className="text-sm sm:text-base font-semibold">WhatsApp</span>
                        </button>

                        <button
                          onClick={shareOnLinkedIn}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-2 border-blue-700 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Linkedin size={18} className="sm:w-5 sm:h-5" fill="currentColor" />
                          <span className="text-sm sm:text-base font-semibold">LinkedIn</span>
                        </button>
                      </div>

                      {/* Pinterest Button - Full Width */}
                      <button
                        onClick={shareOnPinterest}
                        className="w-full flex items-center justify-center gap-2 sm:gap-3 p-2 sm:p-3 mb-3 sm:mb-4 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                        </svg>
                        <span className="text-sm sm:text-base font-semibold">Pinterest</span>
                      </button>

                      {/* Copy Link */}
                      <div className="border-t pt-3 sm:pt-4">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">Or copy link</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={getShareUrl()}
                            readOnly
                            className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs sm:text-sm"
                          />
                          <button
                            onClick={handleCopyLink}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors ${
                              linkCopied
                                ? 'bg-green-600 text-white'
                                : 'bg-amber-600 text-white hover:bg-amber-700'
                            }`}
                          >
                            {linkCopied ? (
                              <Check size={18} className="sm:w-5 sm:h-5" />
                            ) : (
                              <Copy size={18} className="sm:w-5 sm:h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery (Images + Video) */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {mediaItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative bg-white rounded-md sm:rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-amber-600' : 'border-gray-200 hover:border-amber-400'
                  }`}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`View ${index + 1}`}
                      className="w-full h-16 sm:h-20 lg:h-24 object-contain"
                    />
                  ) : (
                    <div className="relative w-full h-16 sm:h-20 lg:h-24 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span className="absolute bottom-0.5 sm:bottom-1 right-0.5 sm:right-1 bg-black/70 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded">
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
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              {/* Category Badge */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-100 text-amber-800 rounded-full text-xs sm:text-sm font-semibold">
                  {product.category}
                </span>
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-semibold">
                  {product.subCategory}
                </span>
              </div>

              {/* Product Code */}
              {product.productCode && (
                <div className="mb-2 sm:mb-3">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                    Code: {product.productCode}
                  </span>
                </div>
              )}

              {/* Product Name */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">{product.name}</h1>

              {/* Price and Stamp */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Price Section */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 sm:gap-4 mb-2 flex-wrap">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-600">
                        ₹{(product.price || 0).toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-lg sm:text-xl lg:text-2xl text-gray-400 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                      (Inclusive of all Taxes and Shipping)
                    </p>
                    {product.originalPrice && product.originalPrice > product.price && product.discount > 0 && (
                      <p className="text-sm sm:text-base text-green-600 font-semibold">
                        You Save: ₹{(product.originalPrice - product.price).toLocaleString()} ({product.discount}%)
                      </p>
                    )}
                  </div>

                  {/* Stamp Image */}
                  <div className="flex-shrink-0 self-start">
                    <img
                      src={stampImage}
                      alt="Authenticity Stamp"
                      className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain opacity-90 hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-4 sm:mb-6">
                {(product.inStock || 0) > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-green-500 rounded-full"></span>
                    <span className="text-sm sm:text-base text-green-600 font-semibold">
                      In Stock
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-red-500 rounded-full"></span>
                    <span className="text-sm sm:text-base text-red-600 font-semibold">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Numista Rarity Index */}
              {product.numistaRarityIndex > 0 && (
                <div className="mb-4 sm:mb-6 bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-amber-300 shadow-sm">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-xs sm:text-sm font-bold text-amber-900">📊 Numista Rarity Index</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-700">{product.numistaRarityIndex}/100</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-full transition-all duration-500 shadow-md"
                      style={{ width: `${product.numistaRarityIndex}%` }}
                    ></div>
                  </div>
                  <div className="mt-1.5 sm:mt-2 flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      {product.numistaRarityIndex >= 80 ? '🔥 Extremely Rare' :
                       product.numistaRarityIndex >= 60 ? '⭐ Very Rare' :
                       product.numistaRarityIndex >= 40 ? '💎 Rare' :
                       product.numistaRarityIndex >= 20 ? '✨ Uncommon' : '📌 Common'}
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <div className="inline-flex items-center border-2 border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 sm:p-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={18} className="sm:w-5 sm:h-5" />
                  </button>
                  <span className="px-4 sm:px-6 py-1.5 sm:py-2 text-base sm:text-lg font-bold border-x-2 border-gray-300 min-w-[50px] sm:min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.inStock || 1)}
                    className="p-2 sm:p-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
                <button
                  onClick={handleBuyNow}
                  disabled={product.inStock === 0}
                  className="flex-1 py-3 sm:py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={product.inStock === 0}
                  className="flex-1 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-base sm:text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
                  <span className="whitespace-nowrap">Add to Cart</span>
                </button>
                <button
                  onClick={() => addToWishlist(product)}
                  className={`p-3 sm:p-4 border-2 rounded-lg transition-colors sm:flex-none ${
                    isInWishlist(product._id)
                      ? 'bg-red-50 border-red-500 text-red-500'
                      : 'border-gray-300 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  <Heart size={20} className={`sm:w-6 sm:h-6 mx-auto ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                    <Truck className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">Free Shipping</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">{product.shippingInfo.estimatedDays}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Shield className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">Authentic</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">{product.warranty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                    <RefreshCw className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">100% Return</p>
                    <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">Guaranteed if Found<br className="hidden sm:inline" /><span className="sm:hidden"> </span>Forgery / Fake</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12">
          {/* Tabs */}
          <div className="flex gap-2 sm:gap-4 border-b-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-semibold transition-colors relative whitespace-nowrap text-sm sm:text-base ${
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
              className={`px-4 sm:px-6 py-2 sm:py-3 font-semibold transition-colors relative whitespace-nowrap text-sm sm:text-base ${
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
              className={`px-4 sm:px-6 py-2 sm:py-3 font-semibold transition-colors relative whitespace-nowrap text-sm sm:text-base ${
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
                <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">{product.description}</p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {product.specifications &&
                 (Array.isArray(product.specifications) ? product.specifications.length > 0 : Object.keys(product.specifications).length > 0) ? (
                  Array.isArray(product.specifications) ? (
                    // Handle array format: [{key: 'Year', value: '1909'}]
                    product.specifications.map((spec, index) => (
                      <div key={index} className="flex gap-2 sm:gap-3 border-b pb-2 sm:pb-3">
                        <span className="font-semibold text-gray-900 min-w-fit text-xs sm:text-sm lg:text-base">{spec.key}:</span>
                        <span className="text-gray-700 flex-1 text-xs sm:text-sm lg:text-base">{spec.value}</span>
                      </div>
                    ))
                  ) : (
                    // Handle object format: {Year: '1909'}
                    Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex gap-2 sm:gap-3 border-b pb-2 sm:pb-3">
                        <span className="font-semibold text-gray-900 min-w-fit text-xs sm:text-sm lg:text-base">{key}:</span>
                        <span className="text-gray-700 flex-1 text-xs sm:text-sm lg:text-base">{value}</span>
                      </div>
                    ))
                  )
                ) : (
                  <p className="text-gray-500 col-span-2 text-sm sm:text-base">No specifications available</p>
                )}
              </div>
            )}

            {activeTab === 'features' && (
              <ul className="space-y-2 sm:space-y-3">
                {product.features && product.features.length > 0 ? (
                  product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 sm:gap-3">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-600 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700 text-sm sm:text-base lg:text-lg">{feature}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm sm:text-base">No features available</p>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct._id}
                  onClick={() => navigate(getProductUrl(relatedProduct))}
                  className="bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden group"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={relatedProduct.images?.[0] || relatedProduct.image || '/api/placeholder/300/300'}
                      alt={relatedProduct.name}
                      className="w-full h-40 sm:h-48 lg:h-64 object-cover group-hover:scale-110 sm:group-hover:scale-125 transition-transform duration-500 ease-out"
                    />
                    {relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price && (
                      <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold">
                        {Math.round(((relatedProduct.originalPrice - relatedProduct.price) / relatedProduct.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 sm:p-3 lg:p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2 text-xs sm:text-sm lg:text-base">{relatedProduct.name}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-base sm:text-lg lg:text-xl font-bold text-amber-600">₹{(relatedProduct.price || 0).toLocaleString()}</span>
                      {relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price && (
                        <span className="text-xs sm:text-sm text-gray-400 line-through">₹{relatedProduct.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                    {relatedProduct.inStock > 0 ? (
                      <p className="text-xs sm:text-sm text-green-600 mt-1.5 sm:mt-2 font-semibold">In Stock</p>
                    ) : (
                      <p className="text-xs sm:text-sm text-red-600 mt-1.5 sm:mt-2 font-semibold">Out of Stock</p>
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
