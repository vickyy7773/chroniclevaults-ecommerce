import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { blogService } from '../services';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  useEffect(() => {
    fetchBlogDetail();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchBlogDetail = async () => {
    setLoading(true);
    try {
      console.log('📝 Fetching blog details for ID:', id);
      const response = await blogService.getBlogById(id);

      console.log('📝 Blog Detail Response:', response);

      const blogData = response?.data?.data || response?.data;

      if (blogData) {
        setBlog({
          id: blogData._id,
          title: blogData.title,
          excerpt: blogData.excerpt,
          fullContent: blogData.fullContent,
          author: blogData.author,
          date: blogData.createdAt || blogData.date,
          readTime: blogData.readTime,
          image: blogData.image,
          views: blogData.views || 0
        });
        console.log('✅ Blog loaded successfully');

        // Fetch related blogs
        fetchRelatedBlogs();
      } else {
        console.error('❌ Blog not found');
        navigate('/blog');
      }
    } catch (error) {
      console.error('❌ Error fetching blog:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async () => {
    try {
      const response = await blogService.getPublishedBlogs();
      const blogsData = response?.data?.data || response?.data || [];

      // Get 3 random blogs excluding current one
      const otherBlogs = blogsData
        .filter(b => b._id !== id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      setRelatedBlogs(otherBlogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        excerpt: blog.excerpt,
        image: blog.image,
        date: blog.createdAt || blog.date,
        readTime: blog.readTime
      })));
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: blog.excerpt,
        url: url
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Blog not found</h2>
          <Link to="/blog" className="text-amber-600 hover:underline">
            Back to all blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to all blogs
        </button>

        {/* Main Content */}
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200">
          {/* Hero Image */}
          <div className="relative h-96 overflow-hidden">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span>{new Date(blog.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <span>{blog.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>{blog.readTime} min read</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Excerpt */}
            <div className="text-xl text-gray-700 font-semibold mb-8 pb-8 border-b-2 border-gray-200 leading-relaxed">
              {blog.excerpt}
            </div>

            {/* Full Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                {blog.fullContent}
              </div>
            </div>

            {/* Share Button */}
            <div className="mt-12 pt-8 border-t-2 border-gray-200">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-all shadow-md hover:scale-105"
              >
                <Share2 size={20} />
                Share this article
              </button>
            </div>
          </div>
        </article>

        {/* Related Blogs */}
        {relatedBlogs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog.id}
                  to={`/blog/${relatedBlog.id}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 hover:border-amber-400 hover:shadow-xl transition-all group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={relatedBlog.image}
                      alt={relatedBlog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                      {relatedBlog.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {relatedBlog.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={14} />
                      <span>{relatedBlog.readTime} min read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDetail;
