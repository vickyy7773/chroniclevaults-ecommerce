import { useState } from 'react';
import { Shield, UserCog } from 'lucide-react';
import RoleManagement from './RoleManagement';
import AdminManagement from './AdminManagement';

const UserRoleManagement = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-6 p-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <UserCog size={22} />
            <div className="text-left">
              <div className="text-sm">Step 2</div>
              <div className="text-base">Create Users</div>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-bold transition-all ${
              activeTab === 'roles'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Shield size={22} />
            <div className="text-left">
              <div className="text-sm">Step 1</div>
              <div className="text-base">Manage Roles</div>
            </div>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-5 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          How to use this page
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Step 1:</strong> Click "Manage Roles" tab → Create roles with specific permissions (e.g., Content Manager, Sales Manager)</p>
          <p><strong>Step 2:</strong> Click "Create Users" tab → Create admin users and assign them roles</p>
          <p className="mt-3 pt-3 border-t border-blue-200">
            <strong>📧 Note:</strong> Email address will be used as User ID for login
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'users' && <AdminManagement />}
        {activeTab === 'roles' && <RoleManagement />}
      </div>
    </div>
  );
};

export default UserRoleManagement;
