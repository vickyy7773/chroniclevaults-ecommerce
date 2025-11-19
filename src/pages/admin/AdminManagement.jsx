import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Shield, UserPlus, Mail, Key, X, Users, Check, ChevronRight } from 'lucide-react';
import { adminService, roleService } from '../../services';

const AdminManagement = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'roles'

  // Users state
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Roles state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: ''
  });

  const [roleFormData, setRoleFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: {
      users: { view: false, create: false, edit: false, delete: false },
      products: { view: false, create: false, edit: false, delete: false },
      orders: { view: false, edit: false, delete: false },
      categories: { view: false, create: false, edit: false, delete: false },
      blogs: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      admins: { create: false, edit: false, delete: false },
      dashboard: { access: false }
    }
  });

  // Permission categories for role creation
  const permissionCategories = {
    dashboard: {
      title: 'Dashboard',
      permissions: [
        { key: 'access', label: 'Access Dashboard' }
      ]
    },
    users: {
      title: 'Users',
      permissions: [
        { key: 'view', label: 'View Users' },
        { key: 'create', label: 'Create Users' },
        { key: 'edit', label: 'Edit Users' },
        { key: 'delete', label: 'Delete Users' }
      ]
    },
    products: {
      title: 'Products',
      permissions: [
        { key: 'view', label: 'View Products' },
        { key: 'create', label: 'Create Products' },
        { key: 'edit', label: 'Edit Products' },
        { key: 'delete', label: 'Delete Products' }
      ]
    },
    orders: {
      title: 'Orders',
      permissions: [
        { key: 'view', label: 'View Orders' },
        { key: 'edit', label: 'Edit Orders' },
        { key: 'delete', label: 'Delete Orders' }
      ]
    },
    categories: {
      title: 'Categories',
      permissions: [
        { key: 'view', label: 'View Categories' },
        { key: 'create', label: 'Create Categories' },
        { key: 'edit', label: 'Edit Categories' },
        { key: 'delete', label: 'Delete Categories' }
      ]
    },
    blogs: {
      title: 'Blogs',
      permissions: [
        { key: 'view', label: 'View Blogs' },
        { key: 'create', label: 'Create Blogs' },
        { key: 'edit', label: 'Edit Blogs' },
        { key: 'delete', label: 'Delete Blogs' }
      ]
    },
    roles: {
      title: 'Roles',
      permissions: [
        { key: 'view', label: 'View Roles' },
        { key: 'create', label: 'Create Roles' },
        { key: 'edit', label: 'Edit Roles' },
        { key: 'delete', label: 'Delete Roles' }
      ]
    },
    admins: {
      title: 'Admins',
      permissions: [
        { key: 'create', label: 'Create Admins' },
        { key: 'edit', label: 'Edit Admins' },
        { key: 'delete', label: 'Delete Admins' }
      ]
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchRoles();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      console.log('👥 Fetching admins list...');
      const response = await adminService.getAllAdmins();
      console.log('👥 Admins Response:', response);

      // Response interceptor already returns response.data
      const adminsData = response?.data || [];
      const isSuccess = response?.success !== false;

      console.log('👥 Admins Data:', adminsData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(adminsData)) {
        setAdmins(adminsData);
        console.log(`✅ Loaded ${adminsData.length} admins`);
      } else {
        console.warn('⚠️ No admins found or invalid format');
        setAdmins([]);
      }
    } catch (error) {
      console.error('❌ Error fetching admins:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to load admins');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      console.log('🔐 Fetching roles for admin creation...');
      const response = await roleService.getAllRoles();
      console.log('🔐 Roles Response:', response);

      // Response interceptor already returns response.data
      const rolesData = response?.data || [];
      const isSuccess = response?.success !== false;

      console.log('🔐 Roles Data:', rolesData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(rolesData)) {
        setRoles(rolesData);
        console.log(`✅ Loaded ${rolesData.length} roles for selection`);
      } else {
        console.warn('⚠️ No roles found or invalid format');
        setRoles([]);
      }
    } catch (error) {
      console.error('❌ Error fetching roles:', error);
      console.error('Error details:', error.response?.data);
      setRoles([]);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!adminFormData.name || !adminFormData.email || !adminFormData.password) {
      setError('All fields are required');
      return;
    }

    if (!adminFormData.roleId) {
      setError('Please select a role for the user');
      return;
    }

    if (adminFormData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    console.log('👤 Submitting admin data:', adminFormData);

    try {
      const response = await adminService.createAdmin(adminFormData);
      console.log('Admin creation response:', response);

      // Response interceptor already returns response.data
      const isSuccess = response?.success !== false;

      if (isSuccess) {
        setSuccess('Admin created successfully');
        setShowCreateModal(false);
        setAdminFormData({ name: '', email: '', password: '', roleId: '' });
        fetchAdmins();
      } else {
        const errorMsg = response?.data?.message || 'Failed to create admin';
        setError(errorMsg);
      }
    } catch (error) {
      console.error('❌ Admin creation error:', error);
      console.error('Error response:', error.response?.data);

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to create admin';

      setError(errorMessage);
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (window.confirm(`Are you sure you want to delete admin "${adminName}"?`)) {
      try {
        const response = await adminService.deleteAdmin(adminId);
        if (response.success) {
          setSuccess('Admin deleted successfully');
          fetchAdmins();
        }
      } catch (error) {
        setError(error.message || 'Failed to delete admin');
      }
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-1">Create and manage admin users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
        >
          <UserPlus size={20} />
          Create Admin
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={20} /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><X size={20} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
            </div>
            <Shield className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {admins.filter(a => a.legacyRole === 'superadmin').length}
              </p>
            </div>
            <Shield className="text-purple-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {admins.filter(a => a.legacyRole === 'admin').length}
              </p>
            </div>
            <Shield className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search admins by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Email (User ID)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Assigned Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Shield className="text-amber-600" size={16} />
                        </div>
                        <span className="font-semibold text-gray-900">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-amber-500" />
                        <span className="font-mono text-sm text-gray-800 font-semibold">{admin.email}</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-5">Login ID</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        admin.legacyRole === 'superadmin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {admin.role?.displayName || admin.legacyRole || 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                        disabled={admin.legacyRole === 'superadmin'}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No admins found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <UserPlus className="text-amber-600" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Admin</h2>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setAdminFormData({ name: '', email: '', password: '', roleId: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-5">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-sm text-blue-800 font-semibold">
                    📧 User ID = Email Address
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    The email you enter below will be used as the User ID for login
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={adminFormData.name}
                    onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    placeholder="e.g., Rajesh Kumar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📧 Email Address (User ID) *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                    <input
                      type="email"
                      value={adminFormData.email}
                      onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                      required
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      placeholder="user@vintagecoin.com"
                    />
                  </div>
                  <p className="text-xs text-amber-600 mt-1 font-semibold">
                    ⚠️ This email will be the User ID for login
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔑 Password * (min 6 characters)
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                    <input
                      type="password"
                      value={adminFormData.password}
                      onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                      required
                      minLength={6}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👤 Assign Role *
                  </label>
                  <select
                    value={adminFormData.roleId}
                    onChange={(e) => setAdminFormData({ ...adminFormData, roleId: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-semibold"
                  >
                    <option value="">-- Select a Role --</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.displayName} {role.description ? `- ${role.description}` : ''}
                      </option>
                    ))}
                  </select>
                  {adminFormData.roleId && (
                    <p className="text-xs text-green-600 mt-2 font-semibold flex items-center gap-1">
                      <Check size={14} /> Role selected: {roles.find(r => r._id === adminFormData.roleId)?.displayName}
                    </p>
                  )}
                  {!adminFormData.roleId && (
                    <p className="text-xs text-red-600 mt-2 font-semibold">
                      Please select a role to assign to this user
                    </p>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> The new admin will be able to login immediately with the email and password provided.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setAdminFormData({ name: '', email: '', password: '', roleId: '' });
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
                  >
                    Create Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
