import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, Eye, Heart, ShoppingCart } from 'lucide-react';
import { getProductUrl } from '../../utils/productUrl';

const FeaturedCarousel = ({ featuredCoins, addToCart, openQuickView, addToWishlist, isInWishlist }) => {
  const scrollContainerRef = useRef(null);
  const [hoveredCoin, setHoveredCoin] = React.useState(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e, coin, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check card position in carousel
    const screenWidth = window.innerWidth;
    const cardLeft = rect.left;
    const cardRight = rect.right;

    // Determine if card is at edge
    const isFirstCard = cardLeft < 100;
    const isLastCard = cardRight > screenWidth - 100;

    setMousePos({
      x: x,
      y: y,
      isFirstCard: isFirstCard,
      isLastCard: isLastCard,
      index: index
    });
    setHoveredCoin(coin);
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350; // Card width (345px) + gap (20px = 5 in gap-5)
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-8 md:py-12 lg:py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="w-full mx-auto px-4 lg:px-6 xl:px-8">
        {/* Section Header */}
        <div className="flex items-center mb-6 md:mb-8 lg:mb-10 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 md:gap-3">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 text-amber-600" />
            <h3 className="text-lg md:text-2xl lg:text-3xl xl:text-4xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              Recently Added Items
            </h3>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative max-w-[1600px] mx-auto">
          {/* Navigation Arrows - Visible on all screens */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 md:left-2 lg:-left-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 lg:p-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all duration-300 group shadow-2xl hover:shadow-amber-500/50 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 md:right-2 lg:-right-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 lg:p-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all duration-300 group shadow-2xl hover:shadow-amber-500/50 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
          </button>

          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scroll-smooth scrollbar-hide pb-4"
          >
            <div className="flex gap-4 px-2" style={{ width: 'max-content' }}>
              {featuredCoins.map((coin, index) => (
                <Link
                  key={coin._id}
                  to={getProductUrl(coin)}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group block"
                  style={{
                    width: '280px',
                    minWidth: '280px',
                    maxWidth: '320px',
                    flexShrink: 0
                  }}
                >
                  {/* Image Section */}
                  <div
                    className="relative overflow-hidden cursor-pointer h-44 sm:h-52 md:h-56 lg:h-64"
                    onMouseMove={(e) => {
                      e.preventDefault();
                      handleMouseMove(e, coin, index);
                    }}
                    onMouseEnter={() => setHoveredCoin(coin)}
                    onMouseLeave={() => setHoveredCoin(null)}
                  >
                    <img
                      src={coin.images[0]}
                      alt={coin.name}
                      className="w-full h-full object-contain transition-all duration-100 ease-out"
                      style={hoveredCoin?._id === coin._id ? {
                        transform: `scale(2.5) translate(${(0.5 - (mousePos.x / 345)) * 100}%, ${(0.5 - (mousePos.y / 256)) * 100}%)`,
                      } : {}}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                    {/* Sale Badge */}
                    {coin.onSale && (
                      <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[10px] md:text-xs font-medium shadow-lg">
                        SALE
                      </div>
                    )}

                    {/* Rarity Badge */}
                    <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-slate-900/90 backdrop-blur-sm text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[10px] md:text-xs font-normal">
                      {coin.rarity}
                    </div>

                    {/* Quick View Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openQuickView(coin);
                      }}
                      className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm text-slate-900 p-2 rounded-full shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110"
                      aria-label="Quick view"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-2.5 md:p-3 lg:p-4">
                    {/* Product Code */}
                    {coin.productCode && (
                      <p className="text-[9px] md:text-[10px] lg:text-xs text-slate-500 mb-0.5 md:mb-1 font-medium">Code: {coin.productCode}</p>
                    )}

                    <h3 className="font-medium text-xs md:text-sm lg:text-base mb-1.5 md:mb-2 text-slate-900 line-clamp-2 min-h-[1.5rem] md:min-h-[2rem] lg:min-h-[2.5rem] group-hover:text-amber-600 transition-colors">
                      {coin.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-1.5 md:mb-2">
                      <span className="text-base md:text-lg lg:text-xl font-semibold text-amber-600">₹{coin.price.toFixed(2)}</span>
                      {coin.originalPrice > coin.price && (
                        <span className="text-[9px] md:text-[10px] lg:text-xs text-slate-500 line-through">₹{coin.originalPrice.toFixed(2)}</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="border-t border-slate-100 pt-1 md:pt-1.5 lg:pt-2 mb-1.5 md:mb-2 lg:mb-3">
                      <p className="text-[9px] md:text-[10px] lg:text-xs text-slate-600 mb-0.5 md:mb-1">
                        Year: <span className="font-medium text-slate-900">{coin.year}</span> • <span className="font-medium text-slate-900">{coin.condition}</span>
                      </p>
                      <p className="text-[9px] md:text-[10px] lg:text-xs text-slate-600">
                        <span className="font-medium text-green-600">In Stock</span>
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-1.5 md:gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(coin);
                        }}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-1.5 md:py-2 px-2 md:px-3 rounded-lg font-normal text-[10px] md:text-xs lg:text-sm transition-all flex items-center justify-center gap-1 md:gap-1.5 shadow-sm hover:shadow-md"
                      >
                        <ShoppingCart className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5" />
                        <span className="hidden sm:inline">Add to Cart</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToWishlist(coin);
                        }}
                        className={`p-1.5 md:p-2 rounded-lg transition-all shadow-sm hover:shadow-md ${
                          isInWishlist(coin._id)
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        aria-label="Add to wishlist"
                      >
                        <Heart className={`w-3 h-3 md:w-4 md:h-4 ${isInWishlist(coin._id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default FeaturedCarousel;


