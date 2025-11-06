import React from 'react';
import { Heart, X, ShoppingCart, Trash2 } from 'lucide-react';

const WishlistSidebar = ({
  wishlist,
  setShowWishlist,
  addToCart,
  addToWishlist
}) => {
  const removeFromWishlist = (coinId) => {
    addToWishlist({ id: coinId }); // Toggle will remove it
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setShowWishlist(false)}
      />

      {/* Wishlist Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-gradient-to-b from-primary-50 to-white shadow-strong z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b-2 border-accent-400 bg-gradient-accent text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black flex items-center space-x-2">
              <Heart className="w-6 h-6" />
              <span>My Wishlist</span>
            </h3>
            <button
              onClick={() => setShowWishlist(false)}
              className="text-white/90 hover:text-white hover:scale-110 transition-all p-2 hover:bg-white/20 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {wishlist.length > 0 && (
            <div className="mt-2 text-white/95 text-sm font-semibold">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>

        {/* Wishlist Items - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {wishlist.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-bounce-soft">=�</div>
              <p className="text-neutral-600 mb-4 font-semibold text-lg">Your wishlist is empty</p>
              <p className="text-sm text-neutral-500">Add items you love to your wishlist!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlist.map(item => (
                <div key={item.id || item._id} className="card-modern p-3 animate-fade-in hover-lift">
                  <div className="flex items-start space-x-3">
                    <img
                      src={item.images ? item.images[0] : item.image}
                      alt={item.name}
                      className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-xl shadow-soft flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm mb-1 line-clamp-2 text-neutral-900">{item.name}</h4>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-gradient font-black text-base sm:text-lg">�{item.price?.toFixed(2)}</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-xs text-neutral-500 line-through">�{item.originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                      {item.condition && (
                        <div className="text-xs text-neutral-600 mb-2 font-medium">
                          {item.condition} {item.year && `" ${item.year}`}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            addToCart(item);
                          }}
                          className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:from-amber-700 hover:to-yellow-700 transition-all flex items-center justify-center space-x-1"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={() => removeFromWishlist(item.id || item._id)}
                          className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-xl transition-all hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Continue Shopping Button */}
        {wishlist.length > 0 && (
          <div className="p-4 border-t-2 border-primary-200 bg-white flex-shrink-0">
            <button
              onClick={() => setShowWishlist(false)}
              className="btn-secondary w-full py-3 rounded-xl font-bold hover:scale-105 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        @keyframes bounce-soft {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-soft {
          animation: bounce-soft 2s infinite;
        }

        .hover-lift {
          transition: transform 0.2s;
        }

        .hover-lift:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </>
  );
};

export default WishlistSidebar;
