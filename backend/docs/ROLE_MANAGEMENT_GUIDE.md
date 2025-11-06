# Role Management System - Complete Guide

## Overview

Ye complete Role-Based Access Control (RBAC) system hai jo aapke e-commerce platform ke liye implement kiya gaya hai. Isme Super Admin roles create kar sakta hai, admins manage kar sakta hai, aur granular permissions set kar sakta hai.

## Features

### 1. **Role Management**
- Create custom roles with specific permissions
- Edit role permissions
- Delete custom roles (system roles protected hai)
- View all roles and their permissions

### 2. **Admin Management**
- Super Admin can create new admin users
- Assign roles to admins
- Update admin details
- Delete admin accounts (with protection for super admin)

### 3. **Permission System**
Har role ke liye different permissions:

- **Users**: view, create, edit, delete
- **Products**: view, create, edit, delete
- **Orders**: view, edit, delete
- **Categories**: view, create, edit, delete
- **Blogs**: view, create, edit, delete
- **Roles**: view, create, edit, delete (Super Admin only)
- **Admins**: create, edit, delete (Super Admin only)
- **Dashboard**: access

### 4. **Default Roles**

#### Super Admin
- Full system access
- Can create/edit/delete all resources
- Can manage roles and admins
- Cannot be deleted

#### Admin
- Most administrative permissions
- Can manage products, orders, categories, blogs
- Cannot manage roles or create admins
- Cannot delete users

#### Manager
- Limited administrative access
- Can view and edit products, orders
- Cannot delete major resources
- Cannot manage users or roles

#### User
- Basic customer permissions
- Can view products, own orders
- No administrative access

## Setup Instructions

### Step 1: Seed Default Roles

```bash
cd backend
node seedRoles.js
```

Ye command 4 default roles create karega:
- superadmin
- admin
- manager
- user

### Step 2: Create Super Admin Account

```bash
node createSuperAdmin.js
```

Aapko prompt milega:
- Enter name
- Enter email
- Enter password

Ye super admin account create karega with full permissions.

### Step 3: Start Backend Server

```bash
npm start
```

## API Endpoints

### Role Management APIs

#### Get All Roles
```
GET /api/roles
Authorization: Bearer {super_admin_token}
```

#### Get Role by ID
```
GET /api/roles/:id
Authorization: Bearer {super_admin_token}
```

#### Create New Role
```
POST /api/roles
Authorization: Bearer {super_admin_token}

Body:
{
  "name": "content-manager",
  "displayName": "Content Manager",
  "description": "Manages blogs and content",
  "permissions": {
    "users": { "view": false, "create": false, "edit": false, "delete": false },
    "products": { "view": true, "create": false, "edit": false, "delete": false },
    "orders": { "view": false, "edit": false, "delete": false },
    "categories": { "view": true, "create": false, "edit": false, "delete": false },
    "blogs": { "view": true, "create": true, "edit": true, "delete": true },
    "roles": { "view": false, "create": false, "edit": false, "delete": false },
    "admins": { "create": false, "edit": false, "delete": false },
    "dashboard": { "access": true }
  }
}
```

#### Update Role
```
PUT /api/roles/:id
Authorization: Bearer {super_admin_token}

Body:
{
  "displayName": "Updated Name",
  "description": "Updated description",
  "permissions": { ... }
}
```

#### Delete Role
```
DELETE /api/roles/:id
Authorization: Bearer {super_admin_token}
```

### Admin Management APIs

#### Create Admin User
```
POST /api/admin/create-admin
Authorization: Bearer {super_admin_token}

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "roleId": "role_id_here" // optional
}
```

#### Get All Admins
```
GET /api/admin/admins
Authorization: Bearer {super_admin_token}
```

#### Update Admin
```
PUT /api/admin/admins/:id
Authorization: Bearer {super_admin_token}

Body:
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "roleId": "new_role_id",
  "legacyRole": "admin"
}
```

#### Delete Admin
```
DELETE /api/admin/admins/:id
Authorization: Bearer {super_admin_token}
```

#### Assign Role to User
```
PUT /api/admin/users/:id/assign-role
Authorization: Bearer {super_admin_token}

Body:
{
  "roleId": "role_id_here"
}
```

#### Get User Permissions
```
GET /api/admin/users/:id/permissions
Authorization: Bearer {super_admin_token}
```

## Usage Examples

### Example 1: Create a Custom Role for Blog Manager

```javascript
// POST /api/roles
{
  "name": "blog-manager",
  "displayName": "Blog Manager",
  "description": "Manages blog content only",
  "permissions": {
    "users": { "view": false, "create": false, "edit": false, "delete": false },
    "products": { "view": true, "create": false, "edit": false, "delete": false },
    "orders": { "view": false, "edit": false, "delete": false },
    "categories": { "view": true, "create": false, "edit": false, "delete": false },
    "blogs": { "view": true, "create": true, "edit": true, "delete": true },
    "roles": { "view": false, "create": false, "edit": false, "delete": false },
    "admins": { "create": false, "edit": false, "delete": false },
    "dashboard": { "access": true }
  }
}
```

### Example 2: Create Admin with Blog Manager Role

```javascript
// Step 1: Create the role and get roleId
// POST /api/roles (as shown above)

// Step 2: Create admin with that role
// POST /api/admin/create-admin
{
  "name": "Jane Blog Manager",
  "email": "jane@example.com",
  "password": "password123",
  "roleId": "the_role_id_from_step_1"
}
```

### Example 3: Update User's Role

```javascript
// PUT /api/admin/users/:userId/assign-role
{
  "roleId": "new_role_id"
}
```

## Middleware Usage

### In Your Routes

```javascript
import { protect, superAdmin, admin, checkPermission } from '../middleware/auth.js';

// Super Admin only
router.post('/roles', protect, superAdmin, createRole);

// Any admin
router.get('/products', protect, admin, getProducts);

// Permission-based
router.post('/products', protect, checkPermission('products', 'create'), createProduct);
router.delete('/products/:id', protect, checkPermission('products', 'delete'), deleteProduct);
```

## Security Features

1. **Super Admin Protection**: Super admin accounts cannot be deleted
2. **Self-Protection**: Users cannot delete their own accounts
3. **System Role Protection**: Default system roles cannot be modified or deleted
4. **Role Dependency Check**: Roles with assigned users cannot be deleted
5. **Token-based Authentication**: All routes require valid JWT tokens

## Database Schema

### User Model (Updated)
```javascript
{
  name: String,
  email: String,
  password: String,
  role: ObjectId (ref: 'Role'),
  legacyRole: String (enum: ['user', 'admin', 'superadmin']),
  // ... other fields
}
```

### Role Model
```javascript
{
  name: String (unique),
  displayName: String,
  description: String,
  permissions: {
    users: { view, create, edit, delete },
    products: { view, create, edit, delete },
    orders: { view, edit, delete },
    categories: { view, create, edit, delete },
    blogs: { view, create, edit, delete },
    roles: { view, create, edit, delete },
    admins: { create, edit, delete },
    dashboard: { access }
  },
  isSystemRole: Boolean,
  createdBy: ObjectId
}
```

## Frontend Integration

Frontend me aap ye endpoints use kar sakte ho:

1. **Dashboard me Role Management Page**:
   - List all roles
   - Create new role with permission checkboxes
   - Edit role permissions
   - Delete custom roles

2. **Admin Management Page**:
   - List all admins
   - Create new admin
   - Assign/change roles
   - Delete admins

3. **Permission Checks**:
```javascript
// Check if user has permission
const canCreateProduct = user.role?.permissions?.products?.create;

if (canCreateProduct) {
  // Show create product button
}
```

## Testing

### Test Super Admin Creation
```bash
node createSuperAdmin.js
# Follow prompts
```

### Test Role Creation
```bash
# Use Postman or any API client
POST http://localhost:5000/api/roles
Headers: Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN
Body: { role data }
```

### Test Admin Creation
```bash
POST http://localhost:5000/api/admin/create-admin
Headers: Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN
Body: { name, email, password, roleId }
```

## Troubleshooting

### Issue: "Not authorized. Super Admin access required"
**Solution**: Make sure you're using a super admin token. Check user's legacyRole is 'superadmin'.

### Issue: "Cannot delete system roles"
**Solution**: System roles (superadmin, admin, manager, user) are protected and cannot be deleted.

### Issue: "Cannot delete role. X user(s) are assigned this role"
**Solution**: First reassign users to different roles, then delete the role.

### Issue: "Role with this name already exists"
**Solution**: Use a unique role name or update the existing role.

## Next Steps

1. ✅ Backend setup complete
2. 🔄 Create frontend Dashboard pages for:
   - Role Management
   - Admin Management
   - Permission assignment UI
3. 🔄 Add audit logging for role/permission changes
4. 🔄 Add email notifications when admins are created

## Support

Agar koi issue ho ya questions ho, toh:
1. Check logs in console
2. Verify database connection
3. Check JWT token validity
4. Ensure user has required permissions

---

**Made with ❤️ for E-Commerce Platform**
