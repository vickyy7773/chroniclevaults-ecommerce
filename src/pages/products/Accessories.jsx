import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Search, Eye, Filter } from 'lucide-react';
import QuickViewModal from '../../components/modals/QuickViewModal';
import FilterSidebar from '../../components/filters/FilterSidebar';
import FeaturesBar from '../../components/common/FeaturesBar';
import { API_BASE_URL } from '../../constants/api';
import { getProductUrl } from '../../utils/productUrl';

const Accessories = ({ addToCart = () => {}, addToWishlist = () => {}, isInWishlist = () => false, searchTerm = '', setSearchTerm = () => {} }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [category, setCategory] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    categories: [],
    rarity: [],
    conditions: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchCategory();
  }, []);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success && data.data) {
        const currentCategory = data.data.find(cat => cat.name === 'Accessories');
        if (currentCategory) {
          setCategory(currentCategory);
        }
      }
    } catch (error) {
      console.error('Failed to fetch category:', error);
    }
  };

  const accessories = [
    {
      id: 1,
      name: "Professional Coin Album - 120 Pockets",
      brand: "Lighthouse",
      price: 29.95,
      originalPrice: 34.95,
      category: "Albums",
      rarity: "Common",
      condition: "New",
      image: "https://images.unsplash.com/photo-1553531087-019d1ceea9f8?w=400&h=400&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1553531087-019d1ceea9f8?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&h=400&fit=crop"
      ],
      rating: 4.7,
      inStock: 45,
      description: "Professional-grade coin album with 120 clear pockets. Perfect for organizing and displaying your coin collection safely."
    },
    {
      id: 2,
      name: "LED Magnifying Glass 10X",
      brand: "Carson",
      price: 24.99,
      originalPrice: 29.99,
      category: "Magnifiers",
      rarity: "Common",
      condition: "New",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1553531087-019d1ceea9f8?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&h=400&fit=crop"
      ],
      rating: 4.8,
      inStock: 60,
      description: "High-quality LED magnifying glass with 10X magnification. Ideal for examining coin details and authenticity markers."
    },
    {
      id: 3,
      name: "Coin Holders - 100 Pack (2x2)",
      brand: "BCW",
      price: 8.95,
      originalPrice: 12.95,
      category: "Holders",
      rarity: "Common",
      condition: "New",
      image: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&h=400&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1553531087-019d1ceea9f8?w=400&h=400&fit=crop"
      ],
      rating: 4.5,
      inStock: 150,
      description: "Archival quality 2x2 coin holders. Pack of 100 holders perfect for protecting individual coins from damage and oxidation."
    },
    {
      id: 4,
      name: "Digital Scale - Precision 0.01g",
      brand: "Smart Weigh",
      price: 18.99,
      originalPrice: 24.99,
      category: "Tools",
      rarity: "Common",
      condition: "New",
      image: "https://images.unsplash.com/photo-1506377295352-e3154d43ea9e?w=400&h=400&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1506377295352-e3154d43ea9e?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1553531087-019d1ceea9f8?w=400&h=400&fit=crop"
      ],
      rating: 4.6,
      inStock: 35,
      description: "Professional digital scale with 0.01g precision. Essential for verifying coin weights and authenticity."
    },
    {
      id: 5,
      name: "Coin Display Case - Velvet Interior",
      brand: "Collector's Choice",
      price: 45.0,
      originalPrice: 55.0,
      category: "Display",
      rarity: "Uncommon",
      condition: "New",
      image: "https://images.unsplash.com/photo-1580982172477-9373ff52ae43?w=400&h=400&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1580982172477-9373ff52ae43?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1553531087-019d1ceea9f8?w=400&h=400&fit=crop"
      ],
      rating: 4.9,
      inStock: 20,
      description: "Premium wooden display case with luxurious velvet interior. Perfect for showcasing your most prized coins."
    },
    {
      id: 6,
      name: "White Cotton Gloves - 12 Pairs",
      brand: "Coin Supply",
      price: 6.99,
      originalPrice: 9.99,
      category: "Handling",
      rarity: "Common",
      condition: "New",
      image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1553531087-019d1ceea9f8?w=400&h=400&fit=crop"
      ],
      rating: 4.4,
      inStock: 100,
      description: "Soft white cotton gloves for safe coin handling. Pack of 12 pairs prevents fingerprints and oil transfer."
    }
  ];

  const categories = ['All', 'Albums', 'Holders', 'Magnifiers', 'Display', 'Tools', 'Handling'];

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filteredAccessories = accessories
    .filter(item => {
      // Exclude sold items
      const isInStock = (item.inStock || 0) > 0;

      // Search filter
      const matchesSearch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter (old selector)
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

      // Price range filter
      const matchesPrice = item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1];

      // Categories filter (from sidebar)
      const matchesCategories = filters.categories.length === 0 || filters.categories.includes(item.category);

      // Rarity filter
      const matchesRarity = filters.rarity.length === 0 || filters.rarity.includes(item.rarity);

      // Condition filter
      const matchesCondition = filters.conditions.length === 0 || filters.conditions.includes(item.condition);

      return isInStock && matchesSearch && matchesCategory && matchesPrice && matchesCategories && matchesRarity && matchesCondition;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        default: return a.name.localeCompare(b.name);
      }
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAccessories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAccessories = filteredAccessories.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy, selectedCategory]);

  const openQuickView = (accessory) => {
    setSelectedAccessory(accessory);
    setSelectedImageIndex(0);
    setShowQuickView(true);
  };

  const closeQuickView = () => {
    setShowQuickView(false);
    setSelectedAccessory(null);
    setSelectedImageIndex(0);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Hero Section */}
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
        <div className="bg-gradient-to-br from-cream-200 to-cream-100 border-b border-cream-300 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4 text-charcoal-900">🔧 Accessories & Supplies</h1>
            <p className="text-xl text-charcoal-700">Everything you need for coin collecting and preservation</p>
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
            currentCategory="Accessories"
          />

          {/* Main Content */}
          <div className="flex-1">
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

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedAccessories.map(item => (
            <div key={item.id} onClick={() => navigate(getProductUrl(item))} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
              <div className="relative overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {item.originalPrice > item.price && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                    SALE
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-normal">
                  {item.rarity || item.category}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openQuickView(item);
                  }}
                  className="absolute bottom-2 right-2 bg-white hover:bg-slate-900 text-slate-900 hover:text-white p-2 rounded-full shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Quick View"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                {/* Product Code */}
                {item.productCode && (
                  <p className="text-xs text-slate-500 mb-1 font-medium">Code: {item.productCode}</p>
                )}

                <h3 className="font-medium text-base mb-1.5 text-slate-900 line-clamp-2 min-h-[2.5rem]">{item.name}</h3>
                {item.brand && <p className="text-sm text-slate-600 mb-2">by {item.brand}</p>}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(item.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-600 font-normal">({item.rating})</span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-2.5">
                  <span className="text-xl font-semibold text-slate-900">₹{item.price.toFixed(2)}</span>
                  {item.originalPrice > item.price && (
                    <span className="text-xs text-slate-500 line-through">₹{item.originalPrice.toFixed(2)}</span>
                  )}
                </div>
                <div className="border-t border-slate-100 pt-2 mb-3">
                  <p className="text-xs text-slate-600 mb-1">Condition: <span className="font-medium text-slate-900">{item.condition}</span></p>
                  <p className="text-xs text-slate-600">Stock: <span className={`font-medium ${item.inStock <= 5 ? 'text-red-600' : 'text-green-600'}`}>{item.inStock} available</span></p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg font-normal text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Add to Cart
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToWishlist(item);
                    }}
                    className={`${isInWishlist(item._id || item.id) ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} py-2 px-3 rounded-lg transition-all shadow-sm hover:shadow-md`}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(item._id || item.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
            </div>

            {/* Pagination */}
            {filteredAccessories.length > itemsPerPage && (
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

      {/* QuickView Modal */}
      {showQuickView && selectedAccessory && (
        <QuickViewModal
          coin={selectedAccessory}
          onClose={closeQuickView}
          addToCart={addToCart}
          addToWishlist={addToWishlist}
          isInWishlist={isInWishlist}
          selectedImageIndex={selectedImageIndex}
          setSelectedImageIndex={setSelectedImageIndex}
        />
      )}

      <FeaturesBar />
    </div>
  );
};

export default Accessories;
