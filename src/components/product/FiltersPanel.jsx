import React, { useState } from 'react';
import { Search, TrendingUp, ChevronDown, Check } from 'lucide-react';

const FiltersPanel = ({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  filterRarity,
  setFilterRarity,
  filterCondition,
  setFilterCondition,
  sortBy,
  setSortBy,
  currentCount,
  totalCount
}) => {
  const categories = ['All', 'Penny', 'Nickel', 'Dime', 'Quarter', 'Half Dollar', 'Dollar'];
  const conditions = ['All', 'Good', 'Very Good', 'Fine', 'Very Fine', 'About Uncirculated', 'Uncirculated'];
  const sortOptions = ['Name', 'Price: Low to High', 'Price: High to Low', 'Year (Newest First)', 'Rating', 'Featured First'];
  const rarityOptions = ['All', 'Common', 'Uncommon', 'Rare', 'Very Rare'];

  const CustomSelect = ({ label, value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (option) => {
      onChange({ target: { value: option } });
      setIsOpen(false);
    };

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 cursor-pointer hover:border-gray-400 pr-10 shadow-sm flex items-center justify-between"
          >
            <span>{value}</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ₹{isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {options.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`w-full px-4 py-3 text-sm text-left transition-all duration-150 flex items-center justify-between ₹{
                        value === option
                          ? 'bg-amber-50 text-amber-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{option}</span>
                      {value === option && (
                        <Check className="w-4 h-4 text-amber-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-8 border-2 border-amber-200/50 backdrop-blur-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        {/* Search Field */}
        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <div className="relative group">
            <Search className="absolute left-3 sm:left-4 top-2.5 sm:top-3 w-4 h-4 sm:w-5 sm:h-5 text-amber-500 group-hover:text-amber-600 transition-colors" />
            <input
              type="text"
              placeholder="Search rare coins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 placeholder:text-gray-400 shadow-sm outline-none hover:border-gray-400 text-gray-900"
            />
          </div>
        </div>
        
        {/* Category */}
        <CustomSelect
          label="Category"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          options={categories}
        />

        {/* Rarity */}
        <CustomSelect
          label="Rarity"
          value={filterRarity}
          onChange={(e) => setFilterRarity(e.target.value)}
          options={rarityOptions}
        />

        {/* Condition */}
        <CustomSelect
          label="Condition"
          value={filterCondition}
          onChange={(e) => setFilterCondition(e.target.value)}
          options={conditions}
        />
        
        {/* Sort By */}
        <CustomSelect
          label="Sort By"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          options={sortOptions}
        />
      </div>
      
      {/* Stats Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-amber-200/50">
        <div className="flex items-center space-x-2 sm:space-x-3 bg-white/60 backdrop-blur-sm px-4 sm:px-5 py-2 sm:py-3 rounded-full border border-amber-200 shadow-md">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm font-semibold text-amber-900 whitespace-nowrap">
            Showing {currentCount} of {totalCount} coins
          </span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-5 py-2 sm:py-3 rounded-full border border-green-200 shadow-md">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 animate-bounce flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-green-800">Market trending up 12%</span>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;