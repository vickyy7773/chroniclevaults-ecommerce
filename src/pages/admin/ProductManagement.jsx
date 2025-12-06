import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { productService } from '../../services';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const categories = ['All', 'Coins', 'BankNotes', 'Stamps', 'Medals', 'Books', 'Accessories'];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching products...');
      const filters = selectedCategory !== 'All' ? { category: selectedCategory } : {};
      const response = await productService.getAllProducts(filters);
      console.log('📦 Products Response:', response);

      // Response interceptor already returns response.data
      const productsData = response?.data || [];
      const isSuccess = response?.success !== false;

      console.log('📦 Products Data:', productsData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(productsData)) {
        setProducts(productsData);
        console.log(`✅ Loaded ${productsData.length} products`);
      } else {
        console.warn('⚠️ No products found or invalid format');
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      console.error('Error details:', error.response?.data);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter(p => p._id !== productId));
      setDeleteModal({ show: false, product: null });
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product: ' + error.message);
    }
  };

  const filteredProducts = products.filter(product =>
    product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product?.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Product</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete "{deleteModal.product?.name}"? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteModal({ show: false, product: null })}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDelete(deleteModal.product._id)}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Product Management
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 md:mt-2">Manage your product inventory</p>
          </div>
          <Link
            to="/admin/products/add"
            className="inline-flex items-center justify-center px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg md:rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 shadow-lg font-semibold text-sm md:text-base"
          >
            <Plus size={18} className="mr-2 md:w-5 md:h-5" />
            Add New Product
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b-2 border-indigo-200 dark:border-indigo-700">
                <tr>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-right text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {paginatedProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product?.images?.[0] || 'https://via.placeholder.com/150'}
                          alt={product?.name || 'Product'}
                          className="w-14 h-14 rounded-lg object-cover border-2 border-gray-300 dark:border-gray-600 shadow-md"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                        <div className="ml-4">
                          <div className="font-bold text-gray-950 dark:text-white text-base leading-tight">{product?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-800 dark:text-gray-400 font-semibold mt-1">{product?.year || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product?.productCode ? (
                        <span className="text-sm font-mono font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 px-3 py-1.5 rounded-md border border-indigo-200 dark:border-indigo-700">
                          {product.productCode}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
                        {product?.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 dark:text-gray-300 font-bold text-base">₹{(product?.costPrice || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-950 dark:text-white font-extrabold text-lg">₹{(product?.price || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-green-700 dark:text-green-400 font-bold text-base">₹{(product?.profitAmount || 0).toLocaleString()}</span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/50 px-2 py-0.5 rounded-full inline-block w-fit">
                          {(product?.profitPercentage || 0).toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold text-base ${(product?.inStock || 0) > 10 ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/50 px-3 py-1 rounded-full' : (product?.inStock || 0) > 0 ? 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/50 px-3 py-1 rounded-full' : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/50 px-3 py-1 rounded-full'}`}>
                        {product?.inStock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 ${
                        product?.active ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400 border-green-300 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-400 border-red-300 dark:border-red-700'
                      }`}>
                        {product?.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/edit/${product._id}`}
                          className="p-2.5 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600"
                          title="Edit Product"
                        >
                          <Edit size={20} />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ show: true, product })}
                          className="p-2.5 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors border border-red-200 dark:border-red-700 hover:border-red-300 dark:hover:border-red-600"
                          title="Delete Product"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No products found</p>
            </div>
          )}
        </div>

        {/* Stats and Pagination */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
            {filteredProducts.length !== products.length && ` (filtered from ${products.length} total)`}
          </p>

          {/* Pagination */}
          {filteredProducts.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-all font-medium ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="px-2 py-2 text-gray-500 dark:text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {deleteModal.show && <DeleteModal />}
      </div>
  );
};

export default ProductManagement;
