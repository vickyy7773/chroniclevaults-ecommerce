import { useState, useEffect } from 'react';

export const usePermissions = () => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const loadUserPermissions = () => {
    try {
      // Get user from localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // If super admin, grant all permissions
        if (parsedUser.legacyRole === 'superadmin' || parsedUser.isSuperAdmin) {
          setPermissions({
            dashboard: { access: true },
            users: { view: true, create: true, edit: true, delete: true },
            products: { view: true, create: true, edit: true, delete: true },
            orders: { view: true, edit: true, delete: true },
            categories: { view: true, create: true, edit: true, delete: true },
            blogs: { view: true, create: true, edit: true, delete: true },
            sliders: { view: true, create: true, edit: true, delete: true },
            roles: { view: true, create: true, edit: true, delete: true },
            admins: { create: true, edit: true, delete: true }
          });
        } else if (parsedUser.role && parsedUser.role.permissions) {
          // Use role-based permissions
          setPermissions(parsedUser.role.permissions);
        } else {
          // Default minimal permissions
          setPermissions({
            dashboard: { access: true },
            users: { view: false, create: false, edit: false, delete: false },
            products: { view: false, create: false, edit: false, delete: false },
            orders: { view: false, edit: false, delete: false },
            categories: { view: false, create: false, edit: false, delete: false },
            blogs: { view: false, create: false, edit: false, delete: false },
            sliders: { view: false, create: false, edit: false, delete: false },
            roles: { view: false, create: false, edit: false, delete: false },
            admins: { create: false, edit: false, delete: false }
          });
        }
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if user has permission
  const hasPermission = (resource, action) => {
    if (!permissions) return false;

    // Super admin has all permissions
    if (user?.legacyRole === 'superadmin' || user?.isSuperAdmin) {
      return true;
    }

    return permissions[resource]?.[action] === true;
  };

  // Check if user can access a menu item
  const canAccessMenu = (menuResource) => {
    if (!permissions) return false;

    // Super admin can access everything
    if (user?.legacyRole === 'superadmin' || user?.isSuperAdmin) {
      return true;
    }

    // Check if user has at least view permission for the resource
    return permissions[menuResource]?.view === true ||
           permissions[menuResource]?.access === true;
  };

  return {
    user,
    permissions,
    loading,
    hasPermission,
    canAccessMenu,
    isSuperAdmin: user?.legacyRole === 'superadmin' || user?.isSuperAdmin
  };
};

export default usePermissions;
