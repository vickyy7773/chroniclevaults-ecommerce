import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sliderService } from '../../services';
import banner1 from '../../assets/images/banner/banner-ics.jpg';
import banner2 from '../../assets/images/banner/Categroy-banner image.webp';
import banner3 from '../../assets/images/banner/slider-image-2.jpg';

// Default slides (fallback)
const defaultSlides = [
  {
    id: 1,
    title: "Rare Gold Coins",
    subtitle: "Premium Collection Available",
    buttonText: "Shop Now",
    image: banner1,
    action: () => window.open('/shop', '_blank')
  },
  {
    id: 2,
    title: "Live Auction",
    subtitle: "Bid on Exclusive Coins",
    buttonText: "Bid Now",
    image: banner2,
    action: () => window.open('/auction', '_blank')
  },
  {
    id: 3,
    title: "New Arrivals",
    subtitle: "Fresh Inventory This Week",
    buttonText: "View Collection",
    image: banner3,
    action: () => window.open('/collection', '_blank')
  }
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [slides, setSlides] = useState(defaultSlides);
  const [loading, setLoading] = useState(true);

  // Minimum swipe distance for triggering slide change (in pixels)
  const minSwipeDistance = 50;

  // Fetch slides from database
  const fetchSlides = async () => {
    try {
      setLoading(true);
      console.log('🖼️ Fetching sliders for frontend...');
      const response = await sliderService.getAllSliders();
      console.log('🖼️ Frontend Sliders Response:', response);

      // Handle axios response format
      const slidersData = response?.data?.data || response?.data || [];
      const isSuccess = response?.data?.success !== false && response?.status === 200;

      console.log('🖼️ Sliders Data:', slidersData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(slidersData) && slidersData.length > 0) {
        // Filter only active sliders and sort by order
        const activeSliders = slidersData.filter(slide => slide.isActive);
        console.log(`✅ Found ${activeSliders.length} active sliders`);

        if (activeSliders.length > 0) {
          // Transform API data to component format
          const transformedSlides = activeSliders.map(slide => ({
            id: slide._id,
            title: slide.title,
            subtitle: slide.subtitle || '',
            buttonText: slide.buttonText || 'Shop Now',
            image: slide.image,
            action: () => window.location.href = slide.buttonLink || '/products'
          }));

          // Sort by order field
          transformedSlides.sort((a, b) => {
            const slideA = slidersData.find(s => s._id === a.id);
            const slideB = slidersData.find(s => s._id === b.id);
            return (slideA?.order || 0) - (slideB?.order || 0);
          });

          setSlides(transformedSlides);
          console.log(`✅ Loaded ${transformedSlides.length} slides for display`);
        } else {
          console.warn('⚠️ No active sliders found, using defaults');
          setSlides(defaultSlides);
        }
      } else {
        console.warn('⚠️ No slider data found, using defaults');
        setSlides(defaultSlides);
      }
    } catch (error) {
      console.error('❌ Error fetching sliders:', error);
      console.error('Error details:', error.response?.data);
      // Use default slides on error
      setSlides(defaultSlides);
    } finally {
      setLoading(false);
    }
  };

  // Fetch slides on component mount
  useEffect(() => {
    fetchSlides();
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Touch handlers for mobile swipe
  const onTouchStart = (e) => {
    setTouchEnd(0); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="relative w-full bg-gray-100 flex items-center justify-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading slides...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slider Container - Fade/Blink Effect */}
      <div className="relative w-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${index === currentSlide ? 'block' : 'hidden'} w-full`}
          >
            {/* Background Image */}
            <div className="relative w-full overflow-hidden" style={{ maxHeight: 'none' }}>
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-auto block lg:max-h-[450px] lg:w-full lg:object-cover"
              />
            </div>

          </div>
        ))}
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-2.5 md:space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white w-8 sm:w-10 md:w-12'
                : 'bg-white/50 hover:bg-white/75 w-1.5 sm:w-2'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;