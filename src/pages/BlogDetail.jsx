import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react';
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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = blog ? encodeURIComponent(blog.title) : '';
  const shareText = blog ? encodeURIComponent(blog.excerpt) : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    whatsapp: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`
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
          {/* Title and Meta Info */}
          <div className="p-8 md:p-12 pb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
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

            {/* Excerpt */}
            <div className="text-xl text-gray-700 font-semibold mb-8 leading-relaxed">
              {blog.excerpt}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative w-full bg-gray-900 mx-8 md:mx-12 rounded-xl overflow-hidden mb-8">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-auto max-h-[500px] object-contain"
            />
          </div>

          {/* Content */}
          <div className="px-8 md:px-12 pb-8 md:pb-12">
            {/* Share Button */}
            <div className="mb-8 pb-8 border-b-2 border-gray-200">

              {/* Share on Social Media */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Facebook */}
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-[#1877F2] text-white hover:scale-110 transition-transform shadow-md"
                  title="Share on Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* Twitter/X */}
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-black text-white hover:scale-110 transition-transform shadow-md"
                  title="Share on X (Twitter)"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-[#25D366] text-white hover:scale-110 transition-transform shadow-md"
                  title="Share on WhatsApp"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-[#0A66C2] text-white hover:scale-110 transition-transform shadow-md"
                  title="Share on LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>

                {/* Telegram */}
                <a
                  href={socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-[#0088cc] text-white hover:scale-110 transition-transform shadow-md"
                  title="Share on Telegram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-700 text-white hover:scale-110 transition-transform shadow-md"
                  title="Copy link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Full Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                {blog.fullContent}
              </div>
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
