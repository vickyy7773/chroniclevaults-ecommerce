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
    <div className="bg-white py-8">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Calendar className="w-7 h-7 text-amber-600" />
          <h2 className="text-3xl md:text-4xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            Today in History
          </h2>
        </div>

        {/* Blog Card - Image Left (1/3), Content Right (2/3) */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="grid md:grid-cols-3 gap-0">

            {/* Left: Image (1/3 width) */}
            <div className="relative h-48 md:h-72 overflow-hidden group">
              <img
                src={latestBlog.image}
                alt={latestBlog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Right: Text Content (2/3 width) */}
            <div className="md:col-span-2 p-8 flex flex-col justify-between bg-cream-50">

              {/* Title and Description (Center) */}
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                  {latestBlog.title}
                </h3>

                <p className="text-gray-600 leading-relaxed">
                  {latestBlog.excerpt}
                </p>
              </div>

              {/* Read More Button (Bottom Right Corner) */}
              <div className="flex justify-end mt-6">
                <Link
                  to="/blog"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Explore Full Story
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
