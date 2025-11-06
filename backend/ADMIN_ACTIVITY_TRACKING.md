# Admin Activity Tracking System

Ye system aapke Super Admin panel ke liye banaya gaya hai jo **Admin activities ko track** karta hai.

## Features

### 1. **Login/Logout Tracking**
- Jab bhi koi admin ya superadmin login karta hai, uski detail log ho jati hai
- Login time, IP address, browser/device info save hoti hai
- Logout karte waqt bhi log hota hai

### 2. **Action Tracking**
- Admin dwara kiye gaye sabhi changes track hote hain:
  - Product create/update/delete
  - Order status updates
  - User management
  - Category changes
  - Aur bhi bahut kuch...

### 3. **Session Management**
- Admin ke login/logout sessions track hote hain
- Session duration calculate hota hai
- Active sessions dikhte hain (jo abhi logged in hain)

## API Endpoints (Super Admin Only)

### 1. Get All Admin Activities
```
GET /api/admin/activities
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `adminId` - Filter by specific admin
- `activityType` - Filter by type: login, logout, create, update, delete, view
- `module` - Filter by module: products, orders, users, categories
- `startDate` - Start date filter
- `endDate` - End date filter
- `search` - Search in admin name, email, action

**Example:**
```javascript
GET /api/admin/activities?page=1&limit=20&activityType=create&module=products
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "_id": "...",
        "admin": { "_id": "...", "name": "Admin Name", "email": "admin@example.com" },
        "adminName": "Admin Name",
        "adminEmail": "admin@example.com",
        "activityType": "create",
        "module": "products",
        "action": "Created product: Product Name",
        "targetId": "product_id",
        "targetName": "Product Name",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
```

### 2. Get Specific Admin Activities
```
GET /api/admin/activities/admin/:adminId
```

**Example:**
```javascript
GET /api/admin/activities/admin/507f1f77bcf86cd799439011
```

### 3. Get Admin Login/Logout Sessions
```
GET /api/admin/activities/sessions/:adminId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "loginTime": "2024-01-15T10:00:00Z",
        "logoutTime": "2024-01-15T15:30:00Z",
        "duration": 330,  // minutes
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "isActive": false
      },
      {
        "loginTime": "2024-01-15T16:00:00Z",
        "logoutTime": null,
        "duration": 45,  // minutes (current session)
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "isActive": true  // Currently logged in
      }
    ]
  }
}
```

### 4. Get Activity Statistics
```
GET /api/admin/activities/stats
```

**Query Parameters:**
- `startDate` - Start date
- `endDate` - End date
- `adminId` - Filter by admin

**Response:**
```json
{
  "success": true,
  "data": {
    "activityByType": [
      { "_id": "login", "count": 45 },
      { "_id": "create", "count": 30 },
      { "_id": "update", "count": 120 }
    ],
    "activityByModule": [
      { "_id": "products", "count": 80 },
      { "_id": "orders", "count": 65 }
    ],
    "mostActiveAdmins": [
      { "_id": "admin_id", "count": 150, "name": "Admin Name" }
    ],
    "activeAdmins": [
      {
        "_id": "admin_id",
        "lastActivity": "login",
        "lastActivityTime": "2024-01-15T16:00:00Z",
        "adminName": "Admin Name",
        "adminEmail": "admin@example.com"
      }
    ],
    "totalActivities": 245
  }
}
```

### 5. Get Activity Timeline
```
GET /api/admin/activities/timeline?days=7
```

**Response:** Recent activities (last 50, max 7 days)

### 6. Logout Endpoint
```
POST /api/auth/logout
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Frontend Implementation Guide

### 1. Admin Dashboard - Activity Overview
```javascript
// Get activity statistics
const getActivityStats = async () => {
  const response = await axios.get('/api/admin/activities/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data.data;
};
```

### 2. Admin List - Show Last Login Time
```javascript
// Get specific admin sessions
const getAdminSessions = async (adminId) => {
  const response = await axios.get(`/api/admin/activities/sessions/${adminId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const sessions = response.data.data.sessions;
  const lastSession = sessions[0]; // Most recent

  return {
    lastLogin: lastSession?.loginTime,
    isCurrentlyActive: lastSession?.isActive
  };
};
```

### 3. Activity Log Page
```javascript
// Get all activities with filters
const getActivities = async (filters) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await axios.get(`/api/admin/activities?${queryParams}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data.data;
};

// Example usage:
const activities = await getActivities({
  page: 1,
  limit: 20,
  activityType: 'update',
  module: 'products',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### 4. Logout with Activity Logging
```javascript
const logout = async () => {
  await axios.post('/api/auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Redirect to login
  window.location.href = '/login';
};
```

## Activity Types

- **login** - Admin logged in
- **logout** - Admin logged out
- **create** - Created new item (product, category, etc.)
- **update** - Updated existing item
- **delete** - Deleted item
- **view** - Viewed item details

## Modules Tracked

- **products** - Product management
- **orders** - Order management
- **users** - User management
- **categories** - Category management
- **blogs** - Blog management
- **sliders** - Slider management
- **banners** - Banner management

## Adding Activity Logging to New Controllers

Agar aap kisi aur controller mein activity logging add karna chahte ho:

```javascript
import { logActivity } from '../middleware/activityLogger.js';

// Example: In your controller function
export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);

    // Log the activity
    await logActivity(
      req,                    // Request object
      'create',               // Activity type
      'categories',           // Module name
      `Created category: ${category.name}`,  // Action description
      category._id,           // Target ID (optional)
      category.name           // Target name (optional)
    );

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

## Security Notes

- Sirf **Super Admin** hi activity logs dekh sakta hai
- All routes `/api/admin/activities/*` are protected with `protect` and `superAdmin` middleware
- IP addresses aur user agents track kiye jaate hain security ke liye
- Activity logging automatically fail hone par main operation break nahi hota

## Database Schema

```javascript
{
  admin: ObjectId,              // Admin ka reference
  adminName: String,            // Admin ka naam
  adminEmail: String,           // Admin ka email
  activityType: String,         // login, logout, create, update, delete, view
  module: String,               // products, orders, users, etc.
  action: String,               // Detailed description
  targetId: String,             // Modified item ka ID
  targetName: String,           // Modified item ka name
  ipAddress: String,            // IP address
  userAgent: String,            // Browser/Device info
  sessionId: String,            // Session identifier
  timestamp: Date,              // Activity ka time
  status: String                // success, failed
}
```

## Example UI Components

### Activity Log Table
```jsx
<table>
  <thead>
    <tr>
      <th>Admin</th>
      <th>Action</th>
      <th>Module</th>
      <th>Time</th>
      <th>IP Address</th>
    </tr>
  </thead>
  <tbody>
    {activities.map(activity => (
      <tr key={activity._id}>
        <td>{activity.adminName}</td>
        <td>{activity.action}</td>
        <td>{activity.module}</td>
        <td>{new Date(activity.timestamp).toLocaleString()}</td>
        <td>{activity.ipAddress}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Active Admins Widget
```jsx
<div className="active-admins">
  <h3>Currently Active Admins</h3>
  {activeAdmins.map(admin => (
    <div key={admin._id} className="admin-card">
      <span className="green-dot">●</span>
      <span>{admin.adminName}</span>
      <span>{admin.adminEmail}</span>
      <span>Last activity: {formatTime(admin.lastActivityTime)}</span>
    </div>
  ))}
</div>
```

## Testing

Server start karne ke baad:

1. Admin account se login karo
2. Kuch products create/update karo
3. Super Admin account se `/api/admin/activities` endpoint hit karo
4. Apni activities dekho!

Happy Tracking! 🎯
