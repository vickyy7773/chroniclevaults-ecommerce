import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, Eye, Heart, ShoppingCart } from 'lucide-react';
import { getProductUrl } from '../../utils/productUrl';

const FeaturedCarousel = ({ featuredCoins, addToCart, openQuickView }) => {
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
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-amber-600" />
            <h3 className="text-4xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              Recently Added Items
            </h3>
          </div>

          {/* Navigation Arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-3 rounded-full border border-gray-300 hover:border-amber-600 hover:bg-amber-50 transition-all duration-300 group"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-3 rounded-full border border-gray-300 hover:border-amber-600 hover:bg-amber-50 transition-all duration-300 group"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scroll-smooth scrollbar-hide pb-2"
          >
            <div className="flex gap-5" style={{ width: 'max-content' }}>
              {featuredCoins.map((coin, index) => (
                <Link
                  key={coin._id}
                  to={getProductUrl(coin)}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group block"
                  style={{ width: '280px', flexShrink: 0 }}
                >
                  {/* Image Section */}
                  <div
                    className="relative overflow-hidden cursor-pointer h-48"
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
                      className="w-full h-full object-cover transition-all duration-100 ease-out"
                      style={hoveredCoin?._id === coin._id ? {
                        transform: `scale(2.5) translate(${(0.5 - (mousePos.x / 280)) * 100}%, ${(0.5 - (mousePos.y / 192)) * 100}%)`,
                      } : {}}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                    {/* Sale Badge */}
                    {coin.onSale && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                        SALE
                      </div>
                    )}

                    {/* Rarity Badge */}
                    <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-normal">
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
                  <div className="p-4">
                    {/* Product Code */}
                    {coin.productCode && (
                      <p className="text-xs text-slate-500 mb-1 font-medium">Code: {coin.productCode}</p>
                    )}

                    <h3 className="font-medium text-base mb-2.5 text-slate-900 line-clamp-2 min-h-[2.5rem] group-hover:text-amber-600 transition-colors">
                      {coin.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-2.5">
                      <span className="text-xl font-semibold text-amber-600">₹{coin.price.toFixed(2)}</span>
                      {coin.originalPrice > coin.price && (
                        <span className="text-xs text-slate-500 line-through">₹{coin.originalPrice.toFixed(2)}</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="border-t border-slate-100 pt-2 mb-3">
                      <p className="text-xs text-slate-600 mb-1">
                        Year: <span className="font-medium text-slate-900">{coin.year}</span> • <span className="font-medium text-slate-900">{coin.condition}</span>
                      </p>
                      <p className="text-xs text-slate-600">
                        Stock: <span className={`font-medium ${coin.inStock <= 5 ? 'text-red-600' : 'text-green-600'}`}>{coin.inStock} available</span>
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(coin);
                        }}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg font-normal text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add to Cart
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


