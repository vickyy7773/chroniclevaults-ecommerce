import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Shield, Users, Check, X } from 'lucide-react';
import { roleService, adminService } from '../../services';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      sliders: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      admins: { create: false, edit: false, delete: false },
      dashboard: { access: false }
    }
  });

  // Available permissions structured by category
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
    sliders: {
      title: 'Sliders',
      permissions: [
        { key: 'view', label: 'View Sliders' },
        { key: 'create', label: 'Create Sliders' },
        { key: 'edit', label: 'Edit Sliders' },
        { key: 'delete', label: 'Delete Sliders' }
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
    fetchRoles();
    fetchAdmins();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      console.log('🔐 Fetching roles...');
      const response = await roleService.getAllRoles();
      console.log('🔐 Roles Response:', response);

      // Handle axios response format
      const rolesData = response?.data?.data || response?.data || [];
      const isSuccess = response?.data?.success !== false && response?.status === 200;

      console.log('🔐 Roles Data:', rolesData);
      console.log('✅ Is Success:', isSuccess);

      if (isSuccess && Array.isArray(rolesData)) {
        setRoles(rolesData);
        console.log(`✅ Loaded ${rolesData.length} roles`);
      } else {
        console.warn('⚠️ No roles found or invalid format');
        setRoles([]);
      }
    } catch (error) {
      console.error('❌ Error fetching roles:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to load roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await adminService.getAllAdmins();
      if (response.success) {
        setAllUsers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setRoleFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: {
        users: { view: false, create: false, edit: false, delete: false },
        products: { view: false, create: false, edit: false, delete: false },
        orders: { view: false, edit: false, delete: false },
        categories: { view: false, create: false, edit: false, delete: false },
        blogs: { view: false, create: false, edit: false, delete: false },
        sliders: { view: false, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false },
        admins: { create: false, edit: false, delete: false },
        dashboard: { access: false }
      }
    });
    setShowRoleModal(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions
    });
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (roleId) => {
    const role = roles.find(r => r._id === roleId);
    if (role.isSystemRole) {
      setError('System roles cannot be deleted!');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the role "${role.displayName}"?`)) {
      try {
        const response = await roleService.deleteRole(roleId);
        if (response.success) {
          setSuccess('Role deleted successfully');
          fetchRoles();
        }
      } catch (error) {
        setError(error.message || 'Failed to delete role');
      }
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!roleFormData.name || !roleFormData.displayName) {
      setError('Please fill in role name and display name');
      return;
    }

    console.log('🔐 Submitting role data:', roleFormData);

    try {
      if (editingRole) {
        console.log('📝 Updating role:', editingRole._id);
        const response = await roleService.updateRole(editingRole._id, roleFormData);
        console.log('Update response:', response);

        // Handle axios response
        const isSuccess = (response?.status === 200 || response?.status === 201) && response?.data?.success !== false;

        if (isSuccess) {
          setSuccess('Role updated successfully');
          setShowRoleModal(false);
          fetchRoles();
        } else {
          const errorMsg = response?.data?.message || 'Failed to update role';
          setError(errorMsg);
        }
      } else {
        console.log('✨ Creating new role');
        const response = await roleService.createRole(roleFormData);
        console.log('Create response:', response);

        // Handle axios response
        const isSuccess = (response?.status === 200 || response?.status === 201) && response?.data?.success !== false;

        if (isSuccess) {
          setSuccess('Role created successfully');
          setShowRoleModal(false);
          fetchRoles();
        } else {
          const errorMsg = response?.data?.message || 'Failed to create role';
          setError(errorMsg);
        }
      }
    } catch (error) {
      console.error('❌ Role submit error:', error);
      console.error('Error response:', error.response?.data);

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to save role';

      setError(errorMessage);
    }
  };

  const handleAssignRole = (user) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const roleId = formData.get('roleId');

    try {
      const response = await adminService.assignRoleToUser(selectedUser._id, roleId);
      if (response.success) {
        setSuccess('Role assigned successfully');
        setShowAssignModal(false);
        fetchAdmins();
      }
    } catch (error) {
      setError(error.message || 'Failed to assign role');
    }
  };

  const togglePermission = (category, permission) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions[category],
          [permission]: !prev.permissions[category][permission]
        }
      }
    }));
  };

  const filteredRoles = roles.filter(role =>
    role.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        <button
          onClick={handleAddRole}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
        >
          <Plus size={20} />
          Add Role
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
              <p className="text-sm text-gray-600 font-semibold">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            </div>
            <Shield className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900">{allUsers.length}</p>
            </div>
            <Users className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">System Roles</p>
              <p className="text-2xl font-bold text-gray-900">
                {roles.filter(r => r.isSystemRole).length}
              </p>
            </div>
            <Shield className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoles.map((role) => (
          <div
            key={role._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Shield className="text-amber-600" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{role.displayName}</h3>
                    {role.isSystemRole && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Permissions</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Object.entries(role.permissions || {}).map(([category, perms]) => (
                  <div key={category} className="text-xs">
                    <span className="font-medium text-gray-700 capitalize">{category}:</span>{' '}
                    {Object.entries(perms).filter(([_, enabled]) => enabled).map(([perm]) => perm).join(', ') || 'None'}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleEditRole(role)}
                disabled={role.isSystemRole}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDeleteRole(role._id)}
                disabled={role.isSystemRole}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Role Assignment */}
      {allUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Role Assignment</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Current Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                        {user.role?.displayName || user.legacyRole || 'No Role'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleAssignRole(user)}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRole ? 'Edit Role' : 'Add Role'}
                </h2>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleRoleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role Name (lowercase) *
                    </label>
                    <input
                      type="text"
                      value={roleFormData.name}
                      onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value.toLowerCase() })}
                      required
                      disabled={editingRole}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="content-manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={roleFormData.displayName}
                      onChange={(e) => setRoleFormData({ ...roleFormData, displayName: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Content Manager"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Describe what this role can do..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Permissions
                  </label>
                  <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {Object.entries(permissionCategories).map(([category, { title, permissions }]) => (
                      <div key={category} className="border border-gray-200 rounded-lg p-3">
                        <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {permissions.map((perm) => (
                            <label key={perm.key} className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={roleFormData.permissions[category]?.[perm.key] || false}
                                onChange={() => togglePermission(category, perm.key)}
                                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
                  >
                    {editingRole ? 'Update' : 'Create'} Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Assign Role</h2>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Assign a role to <strong>{selectedUser.name}</strong>
              </p>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Role *
                  </label>
                  <select
                    name="roleId"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Choose a role...</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
                  >
                    Assign Role
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

export default RoleManagement;
