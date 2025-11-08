import React from 'react';
import { Award, Eye, Heart, Plus, ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';

const ProductGrid = ({
  coins,
  rarityColors,
  addToWishlist,
  isInWishlist,
  openQuickView,
  addToComparison,
  comparisonCoins,
  addToCart,
  setCurrentPage,
  currentPage,
  totalPages
}) => {
  const [hoveredCoin, setHoveredCoin] = React.useState(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  console.log('🎨 ProductGrid rendered with', coins.length, 'coins');
  console.log('🔧 isInWishlist function:', typeof isInWishlist);

  const handleMouseMove = (e, coin, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check card position in grid
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {coins.map((coin, index) => (
          <div key={coin._id || coin.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div
              className="relative overflow-hidden cursor-pointer h-48"
              onMouseMove={(e) => handleMouseMove(e, coin, index)}
              onMouseEnter={() => setHoveredCoin(coin)}
              onMouseLeave={() => setHoveredCoin(null)}
            >
              <img
                src={coin.images[0]}
                alt={coin.name}
                className="w-full h-full object-cover transition-all duration-100 ease-out"
                style={hoveredCoin?._id === coin._id ? {
                  transform: `scale(2.5) translate(${(0.5 - (mousePos.x / 300)) * 100}%, ${(0.5 - (mousePos.y / 192)) * 100}%)`,
                } : {}}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              {coin.onSale && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                  SALE
                </div>
              )}
              <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-normal">
                {coin.rarity}
              </div>
              <button
                onClick={() => openQuickView(coin)}
                className="absolute bottom-2 right-2 bg-white hover:bg-slate-900 text-slate-900 hover:text-white p-2 rounded-full shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                aria-label="Quick View"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-medium text-base mb-2 text-slate-900 line-clamp-2 min-h-[2.5rem]">{coin.name}</h3>
              <div className="flex items-baseline gap-1.5 mb-2.5">
                <span className="text-xl font-semibold text-amber-600">₹{coin.price.toFixed(2)}</span>
                {coin.originalPrice > coin.price && (
                  <span className="text-xs text-slate-500 line-through">₹{coin.originalPrice.toFixed(2)}</span>
                )}
              </div>
              <div className="border-t border-slate-100 pt-2 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-600">
                    Year: <span className="font-medium text-slate-900">{coin.year}</span>
                  </p>
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {coin.condition}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-1">Stock: <span className={`font-medium ${coin.inStock <= 5 ? 'text-red-600' : 'text-green-600'}`}>{coin.inStock} available</span></p>
                {(() => {
                  console.log('🔍 Checking Numista for:', coin.name, 'Value:', coin.numistaRarityIndex, 'Type:', typeof coin.numistaRarityIndex);
                  return null;
                })()}
                {(coin.numistaRarityIndex !== undefined && coin.numistaRarityIndex !== null) && (
                  <div className="mt-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-md p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-800">Rarity Index</span>
                      <span className="text-xs font-black text-amber-900">{coin.numistaRarityIndex}/100</span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-700 rounded-full transition-all"
                        style={{ width: `${coin.numistaRarityIndex}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addToCart(coin)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg font-normal text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Add to Cart
                </button>
                <button
                  onClick={() => {
                    console.log('❤️ Heart clicked for:', coin.name, 'ID:', coin._id || coin.id);
                    console.log('Before click - isInWishlist:', isInWishlist(coin._id || coin.id));
                    addToWishlist(coin);
                  }}
                  className={`${isInWishlist(coin._id || coin.id) ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} py-2 px-3 rounded-lg transition-all shadow-sm hover:shadow-md`}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(coin._id || coin.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-3 mb-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn-secondary flex items-center space-x-2 px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === i + 1
                  ? 'btn-primary'
                  : 'btn-secondary hover:scale-105'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn-secondary flex items-center space-x-2 px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

export default ProductGrid;


