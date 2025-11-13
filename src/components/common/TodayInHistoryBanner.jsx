import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { blogService } from '../../services';

const TodayInHistoryBanner = () => {
  const [latestBlog, setLatestBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestBlog();
  }, []);

  const fetchLatestBlog = async () => {
    try {
      setLoading(true);
      const response = await blogService.getPublishedBlogs();
      const blogsData = response?.data?.data || response?.data || [];

      if (blogsData && blogsData.length > 0) {
        // First, try to get blogs with showInHistory enabled
        const historyBlogs = blogsData.filter(blog => blog.showInHistory === true);

        let selectedBlog;

        if (historyBlogs && historyBlogs.length > 0) {
          // If there are blogs with showInHistory, use the most recent one
          const sortedHistoryBlogs = historyBlogs.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          selectedBlog = sortedHistoryBlogs[0];
        } else {
          // Fallback: If no blog has showInHistory enabled, show the latest published blog
          const sortedBlogs = blogsData.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          selectedBlog = sortedBlogs[0];
        }

        setLatestBlog(selectedBlog);
      }
    } catch (error) {
      console.error('Error fetching latest blog:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no blog or still loading
  if (loading || !latestBlog) {
    return null;
  }

  return (
    <div className="bg-white py-4 md:py-6 lg:py-8">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 mb-3 md:mb-4 lg:mb-5">
          <Calendar className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-amber-600" />
          <h2 className="text-base md:text-xl lg:text-2xl xl:text-3xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            Today in History
          </h2>
        </div>

        {/* Blog Card - Image Top on Mobile, Left on Desktop */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col md:grid md:grid-cols-3 gap-0 items-stretch">

            {/* Image - Full width on mobile, 1/3 on desktop */}
            <div className="relative w-full h-48 md:h-auto overflow-hidden group bg-white flex items-center justify-center">
              <img
                src={latestBlog.image}
                alt={latestBlog.title}
                className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Text Content - Full width on mobile, 2/3 on desktop */}
            <div className="md:col-span-2 p-3 md:p-5 lg:p-6 xl:p-8 flex flex-col justify-between bg-cream-50">

              {/* Title and Description (Center) */}
              <div>
                <h3 className="text-sm md:text-base lg:text-lg xl:text-xl font-bold text-gray-900 mb-1.5 md:mb-2 lg:mb-3">
                  {latestBlog.title}
                </h3>

                <p className="text-xs md:text-sm lg:text-base text-gray-600 leading-relaxed line-clamp-2 md:line-clamp-3">
                  {latestBlog.excerpt}
                </p>
              </div>

              {/* Read More Button (Bottom Right Corner) */}
              <div className="flex justify-end mt-3 md:mt-4 lg:mt-5">
                <Link
                  to="/blog"
                  state={{ expandBlogId: latestBlog._id }}
                  className="inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 lg:px-5 xl:px-6 py-1.5 md:py-2 lg:py-2.5 xl:py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs md:text-sm lg:text-base font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  <span className="hidden sm:inline">Explore Full Story</span>
                  <span className="sm:hidden">Read More</span>
                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayInHistoryBanner;
