import React from 'react';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Wishlist = ({ wishlist, addToCart, addToWishlist, isInWishlist }) => {
  const navigate = useNavigate();

  const removeFromWishlist = (coinId) => {
    addToWishlist({ id: coinId }); // Toggle will remove it
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-full p-6">
                <Heart className="w-16 h-16 text-gray-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Wishlist is Empty</h2>
            <p className="text-gray-600 mb-8">
              Start adding items to your wishlist by clicking the heart icon on products you love!
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-yellow-700 transition-all transform hover:scale-105"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600 mt-1">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id || item._id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
            >
              {/* Product Image */}
              <div className="relative h-64 bg-gray-100">
                <img
                  src={item.images?.[0] || 'https://via.placeholder.com/400'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFromWishlist(item.id || item._id)}
                  className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-red-50 transition-colors group"
                >
                  <Heart className="w-5 h-5 fill-red-500 text-red-500 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {item.name}
                </h3>

                {item.year && (
                  <p className="text-sm text-gray-500 mb-2">Year: {item.year}</p>
                )}

                {item.condition && (
                  <p className="text-sm text-gray-500 mb-4">Condition: {item.condition}</p>
                )}

                <div className="flex items-baseline space-x-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    ¹{item.price?.toFixed(2)}
                  </span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-sm text-gray-500 line-through">
                      ¹{item.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      addToCart(item);
                    }}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-yellow-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.id || item._id)}
                    className="bg-red-50 text-red-600 px-4 py-3 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
