import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, User, ArrowRight, Clock, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { blogService } from '../services';

const Blog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const postsPerPage = 5;
  const blogRefs = useRef({});

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      console.log('📝 Fetching published blogs...');
      const response = await blogService.getPublishedBlogs();

      console.log('📝 Published Blogs Response:', response);

      // Handle axios response format
      const blogsData = response?.data?.data || response?.data || [];
      const isSuccess = response?.data?.success !== false && response?.status === 200;

      console.log('📝 Blogs Data:', blogsData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(blogsData)) {
        // Map backend data to frontend format
        const mappedBlogs = blogsData.map(blog => ({
          id: blog._id,
          title: blog.title,
          excerpt: blog.excerpt,
          fullContent: blog.fullContent,
          author: blog.author,
          date: blog.createdAt || blog.date,
          readTime: blog.readTime,
          image: blog.image
        }));
        setBlogPosts(mappedBlogs);
        console.log(`✅ Loaded ${mappedBlogs.length} published blogs`);
      } else {
        console.warn('⚠️ No published blogs found');
        setBlogPosts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching blogs:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });
      // Set empty array on error
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-expand blog post if coming from "Today in History" banner
  useEffect(() => {
    if (location.state?.expandBlogId && blogPosts.length > 0) {
      const blogId = location.state.expandBlogId;

      // Find the blog in the list
      const blogIndex = blogPosts.findIndex(blog => blog.id === blogId);

      if (blogIndex !== -1) {
        // Calculate which page the blog is on
        const pageNumber = Math.floor(blogIndex / postsPerPage) + 1;

        // Set the current page
        if (pageNumber !== currentPage) {
          setCurrentPage(pageNumber);
        }

        // Expand the blog post
        setExpandedPosts([blogId]);

        // Increment view count
        blogService.getBlogById(blogId).catch(err => console.error('Error incrementing view:', err));

        // Scroll to the blog post after a short delay
        setTimeout(() => {
          if (blogRefs.current[blogId]) {
            blogRefs.current[blogId].scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 300);
      }

      // Clear the state to prevent auto-expansion on subsequent visits
      window.history.replaceState({}, document.title);
    }
  }, [blogPosts, location.state]);

  const toggleExpand = async (postId) => {
    // If expanding (not collapsing), increment views
    if (!expandedPosts.includes(postId)) {
      try {
        // Fetch blog by ID to increment views
        await blogService.getBlogById(postId);
        console.log('View counted for blog:', postId);
      } catch (error) {
        console.error('Error incrementing view:', error);
      }
    }

    setExpandedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  // Sample/Fallback blog posts
  const sampleBlogPosts = [
    {
      id: 1,
      title: "The Ultimate Guide to Collecting Indian Vintage Coins",
      excerpt: "Discover the rich history and value of Indian vintage coins. Learn about the rarest pieces, their historical significance, and how to start your collection journey.",
      fullContent: "Discover the rich history and value of Indian vintage coins. Learn about the rarest pieces, their historical significance, and how to start your collection journey. From identifying authentic pieces to understanding market values, this comprehensive guide covers everything a beginner collector needs to know.\n\nIndia has a fascinating numismatic history spanning thousands of years. Ancient punch-marked coins, Mughal-era gold mohurs, and British India coins all tell unique stories of our nation's economic and cultural evolution. Understanding this history is crucial for any serious collector.\n\nWhen starting your collection, focus on a specific theme - whether it's a particular era, ruler, or denomination. This focused approach makes your collection more meaningful and potentially more valuable. Research extensively before making purchases, and always buy from reputable dealers who can provide authenticity certificates.\n\nStorage and preservation are critical. Use proper coin holders, maintain consistent humidity levels, and handle coins carefully. Never clean vintage coins as this can significantly reduce their value. Professional grading services can authenticate and assess your coins' condition, which is essential for insurance and resale purposes.",
      author: "Chronicle Vaults",
      date: "2025-01-15",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&h=500&fit=crop"
    },
    {
      id: 2,
      title: "How to Authenticate Vintage Coins: Expert Tips",
      excerpt: "Learn the essential techniques to verify the authenticity of vintage coins and avoid common pitfalls in coin collecting.",
      fullContent: "Learn the essential techniques to verify the authenticity of vintage coins and avoid common pitfalls in coin collecting. This expert guide walks you through weight verification, edge examination, and advanced authentication methods used by professional numismatists.\n\nAuthentication is perhaps the most critical skill for any coin collector. Counterfeit coins are unfortunately common in the market, and knowing how to spot them can save you from costly mistakes. Start with basic checks: examine the weight, dimensions, and edge details. Authentic vintage coins have specific weights and sizes that counterfeiters often struggle to replicate exactly.\n\nUse a magnifying glass to inspect fine details. Look for signs of casting, unusual wear patterns, or inconsistencies in the design. Genuine coins show natural wear consistent with their age and circulation. Pay special attention to the lettering and numerical details - these are often poorly reproduced in fakes.\n\nFor valuable pieces, consider professional authentication services. Organizations like NGC and PCGS provide expert evaluation and certification, giving you peace of mind and better resale value. Building relationships with reputable dealers is also invaluable - they can guide you and often guarantee authenticity.",
      author: "Expert Team",
      date: "2025-01-10",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=500&fit=crop"
    },
    {
      id: 3,
      title: "Investment Potential of Rare Indian Coins in 2025",
      excerpt: "Explore the investment opportunities in rare Indian coins and understand market trends that could impact your portfolio.",
      fullContent: "Explore the investment opportunities in rare Indian coins and understand market trends that could impact your portfolio. With detailed analysis of historical price movements and expert predictions, learn which coins offer the best investment potential in the current market.\n\nThe rare coin market has shown remarkable resilience and growth potential, especially for Indian numismatics. Coins from the Mughal era, particularly gold mohurs, have appreciated significantly over the past decade. British India commemorative coins and error varieties are also gaining traction among investors.\n\nWhen investing in coins, consider factors like rarity, condition, historical significance, and market demand. Coins in mint condition (MS65 and above) typically offer better investment returns. However, don't overlook well-preserved circulated coins of rare varieties - these can also appreciate substantially.\n\nDiversification is key. Don't put all your resources into one type or era. Build a balanced portfolio across different periods and denominations. Stay informed about market trends through auction results and price guides. Remember, coin investment is typically a long-term strategy - patience and knowledge are your best assets.",
      author: "Market Analyst",
      date: "2025-01-08",
      readTime: "10 min read",
      image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&h=500&fit=crop"
    },
    {
      id: 4,
      title: "Preserving Your Coin Collection: Best Practices",
      excerpt: "Essential tips for storing and maintaining your vintage coin collection to preserve its value and beauty for generations.",
      fullContent: "Essential tips for storing and maintaining your vintage coin collection to preserve its value and beauty for generations. Learn about proper storage materials, environmental controls, and handling techniques that professional collectors use to protect their investments.\n\nProper preservation is crucial for maintaining your coins' value and appearance. Store coins in a cool, dry environment with stable temperature and humidity. Avoid basements, attics, or areas with significant temperature fluctuations. Ideal conditions are around 65-70°F with 40-50% humidity.\n\nUse archival-quality storage materials. Acid-free coin holders, albums, and boxes are essential. Never use PVC-based products as they can damage coins over time. For valuable pieces, consider individual coin slabs or certified holders.\n\nHandle coins minimally and always by the edges. Wear cotton gloves for especially valuable pieces. Never clean coins - even gentle cleaning can reduce value significantly. If a coin needs conservation, consult professional services. Document your collection with photographs and maintain detailed records including purchase information, grading details, and any provenance.",
      author: "Conservation Expert",
      date: "2025-01-05",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&h=500&fit=crop"
    },
    {
      id: 5,
      title: "Top 10 Most Valuable Indian Coins of All Time",
      excerpt: "A comprehensive look at the most sought-after and valuable Indian coins that every serious collector should know about.",
      fullContent: "A comprehensive look at the most sought-after and valuable Indian coins that every serious collector should know about. From rare Mughal-era gold mohurs to British India's legendary errors, discover the coins that command premium prices at auctions worldwide.\n\nAt the top of the list are Mughal gold mohurs from Jahangir and Shah Jahan's reigns. These beautifully crafted coins, especially zodiac series mohurs, can fetch millions at international auctions. The artistic detail and historical significance make them incredibly desirable.\n\nBritish India error coins are another category of high-value collectibles. The 1835 William IV coin, the 1862 one-quarter anna proof, and various double-struck or off-center errors are extremely rare. Even a well-preserved 1940 Bombay mint quarter rupee can be worth significant amounts.\n\nAncient Indian coins, particularly those from the Gupta period, are highly prized for their historical value. Punch-marked silver karshapanas and early Indo-Greek coins combine numismatic and archaeological significance. Republic India proof sets and limited mintage commemoratives are also appreciating steadily, making them good modern investment options.",
      author: "Chronicle Vaults",
      date: "2025-01-03",
      readTime: "12 min read",
      image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=500&fit=crop"
    },
    {
      id: 6,
      title: "Understanding Coin Grading: A Beginner's Guide",
      excerpt: "Learn about the coin grading system and how to assess the condition and quality of vintage coins accurately.",
      fullContent: "Learn about the coin grading system and how to assess the condition and quality of vintage coins accurately. This beginner-friendly guide explains the Sheldon Scale, common grading terms, and how professional grading services can authenticate and value your collection.\n\nCoin grading uses the Sheldon Scale, ranging from 1 (Poor) to 70 (Perfect Mint State). Understanding this system is essential for buying, selling, and insuring coins. Circulated coins are graded from About Good (AG-3) to About Uncirculated (AU-58). Uncirculated coins range from MS-60 to MS-70.\n\nKey grading factors include strike quality, preservation of details, presence of contact marks, and luster. Even small differences in grade can significantly impact value. For example, an MS-65 coin might be worth twice as much as the same coin in MS-63 condition.\n\nProfessional grading services like PCGS, NGC, and ANACS provide impartial assessments and encapsulate coins in protective holders. This 'slabbing' process authenticates the coin, assigns a numerical grade, and protects it from damage. While professional grading costs money, it's worthwhile for valuable coins as it increases buyer confidence and typically commands premium prices.",
      author: "Expert Team",
      date: "2024-12-28",
      readTime: "9 min read",
      image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&h=500&fit=crop"
    },
    {
      id: 7,
      title: "The History of Indian Currency: From Ancient to Modern",
      excerpt: "Journey through centuries of Indian monetary history, from punch-marked coins of ancient kingdoms to the modern Republic.",
      fullContent: "Journey through centuries of Indian monetary history, from punch-marked coins of ancient kingdoms to the modern Republic. Discover how India's diverse rulers created unique coinage that reflects the subcontinent's rich cultural heritage and artistic traditions.\n\nIndia's numismatic journey began around 600 BCE with punch-marked coins - irregularly shaped silver pieces marked with various symbols. These evolved into more standardized forms under different dynasties. The Indo-Greek kingdoms introduced portrait coins, blending Indian and Hellenistic styles.\n\nThe Gupta period (320-550 CE) is considered the golden age of Indian coinage. Gold dinars featured elegant portraits and Sanskrit legends, showcasing advanced metallurgy and artistry. Medieval India saw the introduction of Islamic coinage styles, with the Delhi Sultanate and later the Mughals creating magnificent gold mohurs and silver rupees.\n\nBritish colonial rule brought standardized modern coinage, though it retained Indian motifs. Post-independence, Republic India has produced diverse commemorative and circulation coins. Today's coins balance modern security features with designs celebrating India's cultural heritage, continuing a numismatic tradition spanning over 2,500 years.",
      author: "Chronicle Vaults",
      date: "2024-12-20",
      readTime: "15 min read",
      image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=500&fit=crop"
    },
    {
      id: 8,
      title: "Building a Themed Coin Collection: Expert Strategies",
      excerpt: "Develop a focused and valuable coin collection by choosing a specific theme.",
      fullContent: "Develop a focused and valuable coin collection by choosing a specific theme. Whether you're interested in a particular era, ruler, or design motif, learn how to curate a meaningful collection that tells a story and appreciates in value over time.\n\nThemed collecting gives your collection coherence and purpose. Popular themes include collecting coins from a specific ruler (like Akbar or Queen Victoria), a particular era (Mughal, British India), or by denomination (all one rupee variations). Some collectors focus on specific metals (gold or silver only) or special categories like error coins.\n\nYour theme should reflect your interests and budget. Start with research - understand what coins exist within your theme, their relative rarity, and typical prices. Set realistic goals, knowing you may not find every piece immediately. The search itself becomes part of the enjoyment.\n\nDocument your collection thoroughly. Create a catalog with photographs, acquisition details, and historical context. Join collector communities and forums to share knowledge and discover trading opportunities. A well-documented themed collection often appreciates better than random accumulations, and it provides greater satisfaction as you see the historical narrative unfold through your curated pieces.",
      author: "Collection Curator",
      date: "2024-12-15",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&h=500&fit=crop"
    }
  ];

  // Calculate pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = blogPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(blogPosts.length / postsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setExpandedPosts([]); // Collapse all posts when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-cream-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-semibold">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-cream-50 to-orange-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-600 text-white px-5 py-2 rounded-full mb-4 shadow-lg">
            <BookOpen size={20} />
            <span className="font-semibold">Our Blog</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Chronicle Vaults Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover stories, insights, and expert tips about vintage coin collecting
          </p>
        </div>

        {/* Blog Posts List */}
        <div className="space-y-8 mb-12">
          {currentPosts.map((post, index) => (
            <div
              key={post.id}
              ref={(el) => (blogRefs.current[post.id] = el)}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200 hover:border-amber-400 hover:shadow-2xl transition-all group"
            >
              <div className={`grid ${expandedPosts.includes(post.id) ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-0 transition-all duration-500`}>
                {/* Image Side */}
                <div className={`relative overflow-hidden ${expandedPosts.includes(post.id) ? 'h-80' : 'h-64 md:h-auto'}`}>
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Content Side */}
                <div className={`p-8 flex flex-col ${expandedPosts.includes(post.id) ? '' : 'justify-center'}`}>
                  <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} className="text-amber-600" />
                      <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <Clock size={16} className="text-amber-600" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-amber-600 transition-colors">
                    {post.title}
                  </h2>

                  <div className="text-gray-600 mb-6 leading-relaxed">
                    {expandedPosts.includes(post.id) ? (
                      <div className="whitespace-pre-line">
                        {post.fullContent}
                      </div>
                    ) : (
                      <p className="line-clamp-3">{post.excerpt}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                        <User className="text-white" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{post.author}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(post.id)}
                      className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-all shadow-md hover:scale-105"
                    >
                      {expandedPosts.includes(post.id) ? 'Read Less' : 'Read More'}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-amber-600 border-2 border-amber-600 hover:bg-amber-600 hover:text-white shadow-md'
            }`}
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                  currentPage === index + 1
                    ? 'bg-amber-600 text-white shadow-lg scale-110'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
              currentPage === totalPages
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-amber-600 border-2 border-amber-600 hover:bg-amber-600 hover:text-white shadow-md'
            }`}
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Blog;
