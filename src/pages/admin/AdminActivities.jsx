import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Activity, Download, Eye } from 'lucide-react';
import { activityService } from '../../services';

const AdminActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    activityType: '',
    module: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  useEffect(() => {
    fetchActivities();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activityService.getAllActivities(filters);
      console.log('Activities Response:', response);

      setActivities(response.data?.activities || []);
      setPagination(response.data?.pagination || {});
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const activityIcons = {
    login: '🔐',
    logout: '👋',
    create: '➕',
    update: '✏️',
    delete: '🗑️',
    view: '👁️'
  };

  const activityColors = {
    login: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
    logout: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400',
    create: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
    update: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
    view: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400'
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          <Activity className="inline-block mr-2" />
          Admin Activity Logs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Track all admin actions and system activities</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Activity Type */}
          <div>
            <select
              value={filters.activityType}
              onChange={(e) => handleFilterChange('activityType', e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
            </select>
          </div>

          {/* Module */}
          <div>
            <select
              value={filters.module}
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Modules</option>
              <option value="products">Products</option>
              <option value="orders">Orders</option>
              <option value="users">Users</option>
              <option value="categories">Categories</option>
              <option value="blogs">Blogs</option>
              <option value="sliders">Sliders</option>
              <option value="banners">Banners</option>
            </select>
          </div>

          {/* Date Range - Full width on mobile, spans correctly on larger screens */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              placeholder="Start Date"
              className="w-full px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              placeholder="End Date"
              className="w-full px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.search || filters.activityType || filters.module || filters.startDate || filters.endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({
                page: 1,
                limit: 20,
                activityType: '',
                module: '',
                search: '',
                startDate: '',
                endDate: ''
              })}
              className="px-4 py-2 text-xs md:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 font-medium transition-colors"
            >
              ✕ Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Activities List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No activities found</p>
          </div>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activities.map((activity) => (
                    <tr key={activity._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-white font-bold mr-3">
                            {activity.adminName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.adminName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{activity.adminEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${activityColors[activity.activityType]}`}>
                          {activityIcons[activity.activityType]} {activity.activityType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.module ? (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                            {activity.module}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">{activity.action}</p>
                        {activity.targetName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Target: {activity.targetName}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-xs text-gray-600 dark:text-gray-400">{activity.ipAddress}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity) => (
                <div key={activity._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {activity.adminName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.adminName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.adminEmail}</p>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${activityColors[activity.activityType]}`}>
                          {activityIcons[activity.activityType]} {activity.activityType}
                        </span>
                        {activity.module && (
                          <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                            {activity.module}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mt-2">{activity.action}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{activity.ipAddress}</span>
                        <span>•</span>
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.totalItems)} of {pagination.totalItems} activities
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminActivities;
