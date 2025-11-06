import React from 'react';
import { X, Star, ShoppingCart } from 'lucide-react';

const ComparisonModal = ({
  comparisonCoins,
  setShowComparison,
  rarityColors,
  addToCart,
  removeFromComparison
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Compare Coins</h2>
            <button 
              onClick={() => setShowComparison(false)}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisonCoins.map(coin => (
              <div key={coin.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="relative">
                  <img 
                    src={coin.images[0]} 
                    alt={coin.name}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => removeFromComparison(coin.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{coin.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold text-amber-600">₹{coin.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span>{coin.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mint:</span>
                      <span>{coin.mint}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Condition:</span>
                      <span>{coin.condition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rarity:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ₹{rarityColors[coin.rarity]}`}>
                        {coin.rarity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metal:</span>
                      <span>{coin.metal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stock:</span>
                      <span className={coin.inStock <= 3 ? 'text-orange-600' : 'text-green-600'}>
                        {coin.inStock}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => addToCart(coin)}
                    disabled={coin.inStock === 0}
                    className="w-full mt-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    {coin.inStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;


