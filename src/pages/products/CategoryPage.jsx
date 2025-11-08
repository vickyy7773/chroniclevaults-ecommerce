import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Eye, Filter } from 'lucide-react';
import QuickViewModal from '../../components/modals/QuickViewModal';
import FilterSidebar from '../../components/filters/FilterSidebar';
import FeaturesBar from '../../components/common/FeaturesBar';
import { productService } from '../../services';
import { API_BASE_URL } from '../../constants/api';
import { getProductUrl } from '../../utils/productUrl';

const CategoryPage = ({ addToCart = () => {}, addToWishlist = () => {}, isInWishlist = () => false, searchTerm = '', setSearchTerm = () => {} }) => {
  const { categoryName } = useParams(); // Get category name from URL
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // Default to newest first
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [category, setCategory] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: [0, 1000000], // Changed to 10 lakh to match filter sidebar
    categories: [],
    rarity: [],
    conditions: [],
    denominations: [],
    metals: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e, product, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    setHoveredProduct(product);
  };

  useEffect(() => {
    fetchCategory();
    fetchProducts();
  }, [categoryName]); // Re-fetch when category changes

  // Handle subcategory from URL params
  useEffect(() => {
    const subCategory = searchParams.get('sub');
    if (subCategory) {
      // Auto-apply subcategory filter from URL
      setFilters(prev => ({
        ...prev,
        categories: [subCategory]
      }));
    } else {
      // Clear category filter if no subcategory in URL
      setFilters(prev => ({
        ...prev,
        categories: []
      }));
    }
  }, [searchParams]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success && data.data) {
        // Find category by name (case-insensitive)
        const currentCategory = data.data.find(
          cat => cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (currentCategory) {
          setCategory(currentCategory);
        }
      }
    } catch (error) {
      console.error('Failed to fetch category:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching products for category:', categoryName);

      // If category is "all" or empty, fetch all products without filter
      const queryParams = {};
      if (categoryName && categoryName.toLowerCase() !== 'all') {
        queryParams.category = categoryName;
        console.log('📦 Category filter:', queryParams);
      } else {
        console.log('📦 Fetching all products (no category filter)');
      }

      // Try to fetch products from API
      const response = await productService.getAllProducts(queryParams);
      console.log('📦 Products Response:', response);

      // Handle different API response formats
      const productsData = response?.data?.data || response?.data || [];
      const isSuccess = response?.data?.success !== false && response?.status === 200;

      console.log('📦 Products Data:', productsData);
      console.log('📦 Total products fetched:', productsData.length);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(productsData)) {
        setProducts(productsData);
        console.log(`✅ Set ${productsData.length} products in state`);
      } else {
        console.warn('⚠️ Invalid products data format');
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
      console.error('Error details:', error.response?.data);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filteredProducts = (() => {
    const productList = Array.isArray(products) ? products : [];
    console.log('🔍 Starting filter with', productList.length, 'products');

    const filtered = productList.filter(product => {
      if (!product) return false;

      // Exclude sold items (inStock === 0)
      const isInStock = (product.inStock || 0) > 0;

      // Search filter
      const matchesSearch = searchTerm === '' || (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter (subcategory)
      const matchesCategory = selectedCategory === 'All' || product.subCategory === selectedCategory;

      // Price range filter
      const matchesPrice = (product.price || 0) >= filters.priceRange[0] && (product.price || 0) <= filters.priceRange[1];

      // Categories filter (from sidebar)
      const matchesCategories = filters.categories.length === 0 || filters.categories.includes(product.subCategory);

      // Rarity filter
      const matchesRarity = filters.rarity.length === 0 || filters.rarity.includes(product.rarity);

      // Condition filter
      const matchesCondition = filters.conditions.length === 0 || filters.conditions.includes(product.condition);

      // Denomination filter
      const matchesDenomination = filters.denominations.length === 0 || filters.denominations.includes(product.denomination);

      // Metal filter
      const matchesMetal = filters.metals.length === 0 || filters.metals.includes(product.metal);

      const passes = isInStock && matchesSearch && matchesCategory && matchesPrice && matchesCategories && matchesRarity && matchesCondition && matchesDenomination && matchesMetal;

      return passes;
    });

    console.log('🔍 After filtering:', filtered.length, 'products remain');
    return filtered;
  })()
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // Sort by creation date (newest first)
          return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'year': return (b.year || 0) - (a.year || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'name': return a.name.localeCompare(b.name);
        default:
          // Default also newest first
          return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
      }
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading {categoryName}...</p>
        </div>
      </div>
    );
  }

  const openQuickView = (product) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    setShowQuickView(true);
  };

  const closeQuickView = () => {
    setShowQuickView(false);
    setSelectedProduct(null);
    setSelectedImageIndex(0);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Category Banner */}
      {category && category.bannerImage && category.isActive ? (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={category.bannerImage}
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-xl md:text-2xl">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-b border-slate-200 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-slate-900">
              {category?.name || categoryName} Collection
            </h1>
            <p className="text-xl text-slate-600">
              {category?.description || `Explore our ${categoryName} collection`}
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <FilterSidebar
            onFilterChange={handleFilterChange}
            filters={filters}
            showMobileFilter={showMobileFilter}
            setShowMobileFilter={setShowMobileFilter}
            currentCategory={categoryName}
          />

          {/* Main Content */}
          <div className="flex-1">
            {/* Subcategory Breadcrumb */}
            {searchParams.get('sub') && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">Showing:</span>
                  <span className="font-semibold text-amber-900">{categoryName}</span>
                  <span className="text-slate-400">›</span>
                  <span className="font-semibold text-amber-900">{searchParams.get('sub')}</span>
                  <button
                    onClick={() => navigate(`/category/${categoryName}`)}
                    className="ml-auto text-amber-600 hover:text-amber-700 underline"
                  >
                    Clear filter
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowMobileFilter(true)}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <Filter size={20} />
                Show Filters
              </button>
            </div>

            {/* Products Count and Sort */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 font-medium">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
              >
                <option value="newest">⭐ Newest First</option>
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="year">Year</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters or check back later for new items.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedProducts.map((product, index) => (
                  <div
                    key={product._id || product.id}
                    onClick={() => navigate(getProductUrl(product))}
                    className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  >
                    <div
                      className="relative overflow-hidden h-64"
                      onMouseMove={(e) => handleMouseMove(e, product, index)}
                      onMouseEnter={() => setHoveredProduct(product)}
                      onMouseLeave={() => setHoveredProduct(null)}
                    >
                      <img
                        src={product.images?.[0] || product.image}
                        alt={product.name}
                        className="w-full h-full object-contain transition-all duration-100 ease-out"
                        style={hoveredProduct?._id === product._id ? {
                          transform: `scale(2.5) translate(${(0.5 - (mousePos.x / 300)) * 100}%, ${(0.5 - (mousePos.y / 192)) * 100}%)`,
                        } : {}}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {product.originalPrice > product.price && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                          SALE
                        </div>
                      )}
                      {product.rarity && (
                        <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-normal">
                          {product.rarity}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickView(product);
                        }}
                        className="absolute bottom-2 right-2 bg-white hover:bg-slate-900 text-slate-900 hover:text-white p-2 rounded-full shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                        aria-label="Quick View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      {/* Product Code */}
                      {product.productCode && (
                        <p className="text-xs text-slate-500 mb-1 font-medium">Code: {product.productCode}</p>
                      )}

                      <h3 className="font-medium text-base mb-1.5 text-slate-900 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                      {product.rating && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-slate-600 font-normal">({product.rating})</span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1.5 mb-2.5">
                        <span className="text-xl font-semibold text-amber-600">₹{product.price.toFixed(2)}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-slate-500 line-through">₹{product.originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                      {(product.year || product.condition) && (
                        <div className="border-t border-slate-100 pt-2 mb-3">
                          <p className="text-xs text-slate-600">
                            {product.year && <span>Year: <span className="font-medium text-slate-900">{product.year}</span></span>}
                            {product.year && product.condition && <span> • </span>}
                            {product.condition && <span className="font-medium text-slate-900">{product.condition}</span>}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg font-normal text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Add to Cart
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToWishlist(product);
                          }}
                          className={`${isInWishlist(product._id || product.id) ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} py-2 px-3 rounded-lg transition-all shadow-sm hover:shadow-md`}
                        >
                          <Heart className={`w-4 h-4 ${isInWishlist(product._id || product.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredProducts.length > itemsPerPage && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg transition-all ${
                            currentPage === pageNum
                              ? 'bg-slate-900 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return <span key={pageNum} className="px-2 py-2">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <FeaturesBar />

      {/* QuickView Modal */}
      {showQuickView && selectedProduct && (
        <QuickViewModal
          coin={selectedProduct}
          onClose={closeQuickView}
          addToCart={addToCart}
          addToWishlist={addToWishlist}
          isInWishlist={isInWishlist}
          selectedImageIndex={selectedImageIndex}
          setSelectedImageIndex={setSelectedImageIndex}
        />
      )}
    </div>
  );
};

export default CategoryPage;
