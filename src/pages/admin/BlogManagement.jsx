import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, FileText, Eye, X, Save, Upload } from 'lucide-react';
import { blogService } from '../../services';

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    fullContent: '',
    author: '',
    readTime: '',
    image: '',
    status: 'draft',
    showInHistory: false
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      console.log('📝 Fetching blogs...');
      const response = await blogService.getAllBlogs();
      console.log('📝 Blogs Response:', response);

      // Handle axios response format
      const blogsData = response?.data?.data || response?.data || [];
      const isSuccess = response?.data?.success !== false && response?.status === 200;

      console.log('📝 Blogs Data:', blogsData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(blogsData)) {
        setBlogs(blogsData);
        console.log(`✅ Loaded ${blogsData.length} blogs`);
      } else {
        console.warn('⚠️ No blogs found or invalid format');
        setBlogs([]);
      }
    } catch (error) {
      console.error('❌ Error fetching blogs:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to load blogs';

      console.error('Blog fetch error:', errorMessage);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        console.log('🗑️ Deleting blog:', blogId);
        const response = await blogService.deleteBlog(blogId);
        console.log('Delete response:', response);

        // Handle axios response
        const isSuccess = response?.data?.success !== false && response?.status === 200;

        if (isSuccess) {
          alert('✅ Blog deleted successfully!');
          await fetchBlogs();
        } else {
          const errorMsg = response?.data?.message || 'Failed to delete blog';
          alert(errorMsg);
        }
      } catch (error) {
        console.error('❌ Error deleting blog:', error);
        const errorMessage = error.response?.data?.message
          || error.response?.data?.error
          || error.message
          || 'Failed to delete blog';
        alert(errorMessage);
      }
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      fullContent: blog.fullContent || '',
      author: blog.author || '',
      readTime: blog.readTime || '',
      image: blog.image || '',
      status: blog.status || 'draft',
      showInHistory: blog.showInHistory || false
    });
    setImagePreview(blog.image);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      excerpt: '',
      fullContent: '',
      author: '',
      readTime: '',
      image: '',
      status: 'draft',
      showInHistory: false
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.excerpt || !formData.fullContent || !formData.author || !formData.readTime) {
      alert('Please fill all required fields!');
      return;
    }

    if (!formData.image) {
      alert('Please upload an image!');
      return;
    }

    setLoading(true);

    try {
      if (editingBlog) {
        // Update existing blog
        console.log('📝 Updating blog:', editingBlog._id, formData);
        const response = await blogService.updateBlog(editingBlog._id, formData);
        console.log('Update response:', response);

        // Handle axios response - status 200 or 201 is success
        const isSuccess = (response?.status === 200 || response?.status === 201) && response?.data?.success !== false;

        if (isSuccess) {
          alert('✅ Blog updated successfully!');
          await fetchBlogs();
          setShowModal(false);
          setEditingBlog(null);
          setFormData({
            title: '',
            excerpt: '',
            fullContent: '',
            author: '',
            readTime: '',
            image: '',
            status: 'draft',
            showInHistory: false
          });
          setImagePreview(null);
        } else {
          const errorMsg = response?.data?.message || 'Failed to update blog';
          alert('❌ ' + errorMsg);
        }
      } else {
        // Create new blog
        console.log('📝 Creating blog:', formData);
        const response = await blogService.createBlog(formData);
        console.log('Create response:', response);

        // Handle axios response - status 200 or 201 is success
        const isSuccess = (response?.status === 200 || response?.status === 201) && response?.data?.success !== false;

        if (isSuccess) {
          alert('✅ Blog created successfully!');
          await fetchBlogs();
          setShowModal(false);
          setFormData({
            title: '',
            excerpt: '',
            fullContent: '',
            author: '',
            readTime: '',
            image: '',
            status: 'draft',
            showInHistory: false
          });
          setImagePreview(null);
        } else {
          const errorMsg = response?.data?.message || 'Failed to create blog';
          alert('❌ ' + errorMsg);
        }
      }
    } catch (error) {
      console.error('❌ Error saving blog:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to save blog';

      alert('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (blog.status || 'draft') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
              Blog <span className="text-accent-600">Management</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Create and manage blog posts</p>
          </div>
          <button
            onClick={handleAdd}
            className="group bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-2xl px-8 py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex items-center gap-3 font-bold"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <Plus size={24} className="relative z-10" />
            <span className="relative z-10">Add Blog Post</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
                  <FileText size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Total Posts</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{blogs.length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-400 to-accent-500 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 shadow-lg">
                  <FileText size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Published</p>
                <h3 className="text-3xl font-black text-accent-600 dark:text-accent-400">
                  {blogs.filter(b => (b.status || 'draft') === 'published').length}
                </h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-500 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg">
                  <FileText size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Drafts</p>
                <h3 className="text-3xl font-black text-yellow-600 dark:text-yellow-400">
                  {blogs.filter(b => (b.status || 'draft') === 'draft').length}
                </h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-600 to-accent-600 opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-lg">
                  <Eye size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wide">Total Views</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                  {blogs.reduce((sum, b) => sum + (b.views || 0), 0)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-800 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 placeholder-gray-500 font-medium"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white text-gray-900 font-semibold"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Blog Posts */}
        <div className="space-y-6">
          {filteredBlogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-800 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full md:w-64 h-40 object-cover rounded-2xl ring-2 ring-gray-200 dark:ring-gray-700 shadow-lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">{blog.title}</h3>
                        <span className={`px-4 py-1.5 rounded-xl text-xs font-bold ${
                          blog.status === 'published'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {blog.status || 'draft'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{blog.excerpt}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg font-semibold text-gray-700 dark:text-gray-300">
                          By {blog.author}
                        </span>
                        <span className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg font-semibold text-primary-700 dark:text-primary-300">
                          {blog.readTime}
                        </span>
                        <span className="px-3 py-1.5 bg-accent-100 dark:bg-accent-900/30 rounded-lg font-semibold text-accent-700 dark:text-accent-300 flex items-center gap-1">
                          <Eye size={14} />
                          {blog.views || 0} views
                        </span>
                        <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg font-semibold text-gray-700 dark:text-gray-300">
                          {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-xl transition-all text-sm font-bold transform hover:-translate-y-0.5"
                    >
                      <Edit size={18} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:shadow-xl transition-all text-sm font-bold transform hover:-translate-y-0.5"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredBlogs.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800">
              <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl mb-4">
                <FileText size={64} className="text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xl font-bold mb-2">No blog posts found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Blog Modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full my-8 border-2 border-gray-200 dark:border-gray-800">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-accent-600 to-accent-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={28} />
                  <h2 className="text-2xl font-bold">
                    {editingBlog ? 'Edit Blog Post' : 'Add New Blog Post'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/90 hover:text-white hover:scale-110 transition-all p-2 hover:bg-white/20 rounded-xl"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white font-medium"
                      placeholder="Enter blog title"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Featured Image *
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-bold">
                        <Upload size={20} />
                        <span>Choose Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="w-32 h-20 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-700" />
                      )}
                    </div>
                  </div>

                  {/* Author & Read Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Author *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white font-medium"
                        placeholder="Enter author name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Read Time *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.readTime}
                        onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white font-medium"
                        placeholder="e.g., 5 min read"
                      />
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Excerpt (Short Description) *
                    </label>
                    <textarea
                      required
                      rows="3"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white font-medium"
                      placeholder="Short description for blog preview"
                    />
                  </div>

                  {/* Full Content */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Full Content *
                    </label>
                    <textarea
                      required
                      rows="10"
                      value={formData.fullContent}
                      onChange={(e) => setFormData({ ...formData, fullContent: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white font-medium"
                      placeholder="Full article content (use \n\n for paragraphs)"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent-500 dark:text-white font-bold"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {/* Show in Today In History */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showInHistory}
                        onChange={(e) => setFormData({ ...formData, showInHistory: e.target.checked })}
                        className="w-5 h-5 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                      />
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          Show in "Today In History" section
                        </span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          This blog will appear on the homepage in the "Today In History" banner
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {loading ? 'Saving...' : editingBlog ? 'Update Blog' : 'Create Blog'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BlogManagement;
