import React from 'react';
import { Search, X } from 'lucide-react';

const MobileMenu = ({
  searchTerm,
  setSearchTerm,
  wishlistCount,
  cartTotal,
  setShowMobileMenu
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
      <div className="bg-white w-80 h-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Menu</h2>
          <button onClick={() => setShowMobileMenu(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search coins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        
        <nav className="space-y-4">
          <a href="#" className="block py-2 text-gray-700 hover:text-amber-600">Featured</a>
          <a href="#" className="block py-2 text-gray-700 hover:text-amber-600">New Arrivals</a>
          <a href="#" className="block py-2 text-gray-700 hover:text-amber-600">Rare Coins</a>
          <a href="#" className="block py-2 text-gray-700 hover:text-amber-600">Investment Grade</a>
          <a href="#" className="block py-2 text-gray-700 hover:text-amber-600">Certified Coins</a>
          <a href="#" className="block py-2 text-gray-700 hover:text-amber-600">Bulk Lots</a>
        </nav>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium mb-4">
            Sign In
          </button>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Wishlist ({wishlistCount})</span>
            <span>Cart (₹{cartTotal.toFixed(2)})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;


