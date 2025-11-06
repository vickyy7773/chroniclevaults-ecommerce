import React from 'react';
import { X, Award, Star, ShoppingCart, Heart } from 'lucide-react';

const QuickViewModal = ({
  selectedCoin,
  setShowQuickView,
  rarityColors,
  addToCart,
  addToWishlist,
  isInWishlist,
  selectedImageIndex,
  setSelectedImageIndex,
  coin,
  onClose
}) => {
  // Use coin prop if available, otherwise use selectedCoin
  const product = coin || selectedCoin;
  const handleClose = onClose || (() => setShowQuickView(false));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-screen overflow-y-auto animate-slideUp">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={product.images?.[selectedImageIndex] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        index === selectedImageIndex ? 'border-amber-600' : 'border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  {product.rarity && (
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${rarityColors?.[product.rarity] || 'bg-gray-100 text-gray-800'}`}>
                      {product.rarity}
                    </span>
                  )}
                  {product.category && !product.rarity && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                      {product.category}
                    </span>
                  )}
                  {product.featured && (
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>Featured</span>
                    </span>
                  )}
                  {(product.onSale || (product.originalPrice && product.originalPrice > product.price)) && (
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                      On Sale
                    </span>
                  )}
                </div>


                <div className="flex items-center space-x-4 mb-6">
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-2xl text-gray-500 line-through">₹{product.originalPrice.toFixed(2)}</span>
                  )}
                  <span className="text-4xl font-bold text-amber-700">₹{product.price.toFixed(2)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                      Save ₹{(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {(product.year || product.condition || product.mint || product.metal || product.weight || product.diameter || product.certification) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {product.year && (
                      <div>
                        <span className="text-gray-600">Year:</span>
                        <span className="font-medium ml-2">{product.year}</span>
                      </div>
                    )}
                    {product.mint && (
                      <div>
                        <span className="text-gray-600">Mint:</span>
                        <span className="font-medium ml-2">{product.mint}</span>
                      </div>
                    )}
                    {product.condition && (
                      <div>
                        <span className="text-gray-600">Condition:</span>
                        <span className="font-medium ml-2">{product.condition}</span>
                      </div>
                    )}
                    {product.metal && (
                      <div>
                        <span className="text-gray-600">Metal:</span>
                        <span className="font-medium ml-2">{product.metal}</span>
                      </div>
                    )}
                    {product.weight && (
                      <div>
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-medium ml-2">{product.weight}</span>
                      </div>
                    )}
                    {product.diameter && (
                      <div>
                        <span className="text-gray-600">Diameter:</span>
                        <span className="font-medium ml-2">{product.diameter}</span>
                      </div>
                    )}
                    {product.certification && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Certification:</span>
                        <span className="font-medium ml-2">{product.certification}</span>
                      </div>
                    )}
                    {product.author && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Author:</span>
                        <span className="font-medium ml-2">{product.author}</span>
                      </div>
                    )}
                    {product.brand && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Brand:</span>
                        <span className="font-medium ml-2">{product.brand}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {product.description && (
                <div>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Stock: </span>
                  <span className={`font-medium ${product.inStock <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                    {product.inStock} available
                  </span>
                </div>
                {product.inStock <= 3 && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold">
                    Low Stock!
                  </span>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.inStock === 0}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{product.inStock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={() => addToWishlist(product)}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    isInWishlist(product._id || product.id)
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist(product._id || product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;


