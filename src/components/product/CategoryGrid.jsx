import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';

const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('🔍 CategoryGrid - API_BASE_URL:', API_BASE_URL);
      console.log('🔍 CategoryGrid - Full URL:', `${API_BASE_URL}/categories`);
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success && data.data) {
        // Filter only main, active categories that should show on home page
        const mainCategories = data.data
          .filter(cat => cat.type === 'main' && cat.isActive && cat.showOnHome)
          .map(cat => ({
            id: cat._id,
            title: cat.name.toUpperCase(),
            subtitle: cat.description || '',
            image: cat.cardImage || 'https://images.unsplash.com/photo-1644409367085-e485e6f4cdc1?w=800',
            link: `/category/${cat.name}`
          }));
        setCategories(mainCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-white">
      {/* Container with proper margins */}
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={category.link}
              className="group relative overflow-hidden bg-white transition-all duration-500"
              style={{
                aspectRatio: '5/3'
              }}
            >
              {/* Image Container */}
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
                  style={{
                    filter: 'grayscale(0%) brightness(0.95)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />

                {/* Elegant Overlay - Minimal */}
                <div className="absolute inset-0 bg-black opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              </div>

              {/* Content - Bottom Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                {/* Title */}
                <h3 className="text-3xl md:text-4xl font-light text-white mb-3 tracking-wide"
                    style={{
                      fontFamily: 'Georgia, serif',
                      letterSpacing: '0.05em'
                    }}>
                  {category.title}
                </h3>

                {/* Minimal Underline */}
                <div className="w-12 h-px bg-white/60 mb-4 group-hover:w-20 transition-all duration-500"></div>

                {/* Shop Link - Minimal */}
                <div className="flex items-center text-white text-sm font-light tracking-widest uppercase opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="mr-2">Explore</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>

              {/* Subtle Border */}
              <div className="absolute inset-0 border border-gray-200 group-hover:border-gray-400 transition-colors duration-500"></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;
