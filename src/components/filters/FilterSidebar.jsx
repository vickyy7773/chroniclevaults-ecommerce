import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';

const FilterSidebar = ({
  onFilterChange,
  filters = {},
  showMobileFilter = false,
  setShowMobileFilter,
  currentCategory = null  // Current page category (e.g., "Coins", "Stamps")
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [priceRange, setPriceRange] = useState(filters.priceRange || [0, 1000000]);
  const [selectedCategories, setSelectedCategories] = useState(filters.categories || []);
  const [selectedRarity, setSelectedRarity] = useState(filters.rarity || []);
  const [selectedConditions, setSelectedConditions] = useState(filters.conditions || []);
  const [selectedDenominations, setSelectedDenominations] = useState(filters.denominations || []);
  const [selectedMetals, setSelectedMetals] = useState(filters.metals || []);
  const [categories, setCategories] = useState([]);
  const [expandedSection, setExpandedSection] = useState('price'); // Only one section can be open at a time
  const [rarities, setRarities] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [denominations, setDenominations] = useState([]);
  const [metals, setMetals] = useState([]);

  // Fetch filter options from API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/filter-options`);
        const data = await response.json();
        if (data.success) {
          setRarities(data.data.rarity || []);
          setConditions(data.data.condition || []);
          setDenominations(data.data.denomination || []);
          setMetals(data.data.metal || []);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
        // Fallback to default values if API fails
        setRarities(['Common', 'Uncommon', 'Rare', 'Very Rare', 'Extremely Rare']);
        setConditions(['Poor', 'Fair', 'Good', 'Very Fine', 'Extremely Fine', 'Uncirculated']);
        setDenominations(['Penny', 'Nickel', 'Dime', 'Quarter', 'Half Dollar', 'Dollar', 'Rupee', 'Paise', 'Anna']);
        setMetals(['Gold', 'Silver', 'Bronze', 'Copper', 'Nickel', 'Brass', 'Platinum', 'Aluminum']);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch subcategories for current main category
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!currentCategory) {
        setCategories([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        if (data.success) {
          // Find the main category
          const mainCat = data.data.find(cat =>
            cat.name === currentCategory && cat.type === 'main'
          );

          if (mainCat) {
            // Get subcategories for this main category
            const subcats = data.data
              .filter(cat => {
                if (cat.type !== 'sub' || !cat.isActive) return false;
                const parentId = typeof cat.parentCategory === 'object'
                  ? cat.parentCategory?._id
                  : cat.parentCategory;
                return parentId === mainCat._id;
              })
              .map(cat => cat.name);

            setCategories(subcats);
          }
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    };
    fetchSubcategories();
  }, [currentCategory]);

  const toggleSection = (section) => {
    // If clicking the same section, close it; otherwise open the new section
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handlePriceChange = (value, index) => {
    const newRange = [...priceRange];
    newRange[index] = parseInt(value);
    setPriceRange(newRange);
    applyFilters({ priceRange: newRange });
  };

  const toggleCategory = (category) => {
    // Navigate to category page with subcategory param
    if (currentCategory) {
      navigate(`/category/${currentCategory}?sub=${encodeURIComponent(category)}`);
    }
  };

  const toggleRarity = (rarity) => {
    const newRarity = selectedRarity.includes(rarity)
      ? selectedRarity.filter(r => r !== rarity)
      : [...selectedRarity, rarity];
    setSelectedRarity(newRarity);
    applyFilters({ rarity: newRarity });
  };

  const toggleCondition = (condition) => {
    const newConditions = selectedConditions.includes(condition)
      ? selectedConditions.filter(c => c !== condition)
      : [...selectedConditions, condition];
    setSelectedConditions(newConditions);
    applyFilters({ conditions: newConditions });
  };

  const toggleDenomination = (denomination) => {
    const newDenominations = selectedDenominations.includes(denomination)
      ? selectedDenominations.filter(d => d !== denomination)
      : [...selectedDenominations, denomination];
    setSelectedDenominations(newDenominations);
    applyFilters({ denominations: newDenominations });
  };

  const toggleMetal = (metal) => {
    const newMetals = selectedMetals.includes(metal)
      ? selectedMetals.filter(m => m !== metal)
      : [...selectedMetals, metal];
    setSelectedMetals(newMetals);
    applyFilters({ metals: newMetals });
  };

  const applyFilters = (updates) => {
    if (onFilterChange) {
      onFilterChange({
        priceRange,
        categories: selectedCategories,
        rarity: selectedRarity,
        conditions: selectedConditions,
        denominations: selectedDenominations,
        metals: selectedMetals,
        ...updates
      });
    }
  };

  const clearAllFilters = () => {
    setPriceRange([0, 1000000]);
    setSelectedCategories([]);
    setSelectedRarity([]);
    setSelectedConditions([]);
    setSelectedDenominations([]);
    setSelectedMetals([]);
    if (onFilterChange) {
      onFilterChange({
        priceRange: [0, 1000000],
        categories: [],
        rarity: [],
        conditions: [],
        denominations: [],
        metals: []
      });
    }
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Filter size={18} />
          Filters
        </h3>
        <button
          onClick={clearAllFilters}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Price Range */}
      <div className="border-b border-slate-200 pb-4">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between mb-3 hover:text-amber-600 transition-colors"
        >
          <span className="font-medium text-slate-900">Price Range</span>
          {expandedSection === 'price' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {expandedSection === 'price' && (
          <div className="space-y-3 mt-3">
            {/* Price Range Display */}
            <div className="flex items-center justify-between text-sm bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              <span className="font-semibold text-amber-900">₹{priceRange[0].toLocaleString()}</span>
              <span className="text-amber-600">—</span>
              <span className="font-semibold text-amber-900">₹{priceRange[1].toLocaleString()}</span>
            </div>

            {/* Min Price Slider */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Min: ₹{priceRange[0].toLocaleString()}</label>
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={priceRange[0]}
                onChange={(e) => handlePriceChange(e.target.value, 0)}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 slider"
              />
            </div>

            {/* Max Price Slider */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Max: ₹{priceRange[1].toLocaleString()}</label>
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={priceRange[1]}
                onChange={(e) => handlePriceChange(e.target.value, 1)}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 slider"
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="border-b border-slate-200 pb-4">
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between mb-3 hover:text-amber-600 transition-colors"
        >
          <span className="font-medium text-slate-900">Category</span>
          {expandedSection === 'category' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {expandedSection === 'category' && (
          <div className="space-y-1.5 mt-3">
            {/* Show "All" option first */}
            <button
              onClick={() => navigate(`/category/${currentCategory}`)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                !searchParams.get('sub')
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="text-sm">All {currentCategory}</span>
            </button>

            {categories.map(category => {
              const isActive = searchParams.get('sub') === category;
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-amber-100 text-amber-900 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-sm">{category}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Rarity Filter */}
      <div className="border-b border-slate-200 pb-4">
        <button
          onClick={() => toggleSection('rarity')}
          className="w-full flex items-center justify-between mb-3 hover:text-amber-600 transition-colors"
        >
          <span className="font-medium text-slate-900">Rarity</span>
          {expandedSection === 'rarity' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {expandedSection === 'rarity' && (
          <div className="space-y-1.5 mt-3">
            {rarities.map(rarity => (
              <label key={rarity} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={selectedRarity.includes(rarity)}
                  onChange={() => toggleRarity(rarity)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700 font-normal">{rarity}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Condition Filter */}
      <div className="border-b border-slate-200 pb-4">
        <button
          onClick={() => toggleSection('condition')}
          className="w-full flex items-center justify-between mb-3 hover:text-amber-600 transition-colors"
        >
          <span className="font-medium text-slate-900">Condition</span>
          {expandedSection === 'condition' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {expandedSection === 'condition' && (
          <div className="space-y-1.5 mt-3">
            {conditions.map(condition => (
              <label key={condition} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(condition)}
                  onChange={() => toggleCondition(condition)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700 font-normal">{condition}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Denomination Filter */}
      <div className="border-b border-slate-200 pb-4">
        <button
          onClick={() => toggleSection('denomination')}
          className="w-full flex items-center justify-between mb-3 hover:text-amber-600 transition-colors"
        >
          <span className="font-medium text-slate-900">Denomination</span>
          {expandedSection === 'denomination' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {expandedSection === 'denomination' && (
          <div className="space-y-1.5 mt-3">
            {denominations.map(denomination => (
              <label key={denomination} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={selectedDenominations.includes(denomination)}
                  onChange={() => toggleDenomination(denomination)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700 font-normal">{denomination}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Metal Filter */}
      <div className="pb-4">
        <button
          onClick={() => toggleSection('metal')}
          className="w-full flex items-center justify-between mb-3 hover:text-amber-600 transition-colors"
        >
          <span className="font-medium text-slate-900">Metal</span>
          {expandedSection === 'metal' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {expandedSection === 'metal' && (
          <div className="space-y-1.5 mt-3">
            {metals.map(metal => (
              <label key={metal} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={selectedMetals.includes(metal)}
                  onChange={() => toggleMetal(metal)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700 font-normal">{metal}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 sticky top-0 max-h-screen overflow-y-auto">
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Sidebar */}
      {showMobileFilter && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowMobileFilter(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 lg:hidden shadow-lg overflow-y-auto animate-slide-in-left">
            <div className="p-5">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Filter size={18} />
                  Filters
                </h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="text-slate-700 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={22} />
                </button>
              </div>

              <FilterContent />

              {/* Apply Button */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }

        /* Custom Range Slider Styling */
        input[type="range"].slider {
          -webkit-appearance: none;
          appearance: none;
        }

        input[type="range"].slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: #f59e0b;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        input[type="range"].slider::-webkit-slider-thumb:hover {
          background: #d97706;
          transform: scale(1.15);
        }

        input[type="range"].slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: #f59e0b;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        input[type="range"].slider::-moz-range-thumb:hover {
          background: #d97706;
          transform: scale(1.15);
        }

        input[type="range"].slider::-webkit-slider-runnable-track {
          background: #e2e8f0;
          height: 4px;
          border-radius: 2px;
        }

        input[type="range"].slider::-moz-range-track {
          background: #e2e8f0;
          height: 4px;
          border-radius: 2px;
        }

        input[type="range"].slider::-moz-range-progress {
          background: #f59e0b;
          height: 4px;
          border-radius: 2px;
        }
      `}</style>
    </>
  );
};

export default FilterSidebar;
