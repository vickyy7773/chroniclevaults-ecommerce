# 🚀 Complete Setup Instructions

## ✅ Kya Kya Complete Hai

### 1. User Registration & Login System
- ✅ User signup kar sakta hai (POST /api/auth/register)
- ✅ User login kar sakta hai (POST /api/auth/login)
- ✅ Password automatic hash hota hai (bcrypt)
- ✅ JWT token generate hota hai
- ✅ Default 'user' role automatically assign hota hai

### 2. Role Management System
- ✅ 4 default roles: superadmin, admin, manager, user
- ✅ Blog permissions included
- ✅ Super admin can create/edit/delete roles
- ✅ Custom roles create kar sakte ho

### 3. Admin Management
- ✅ Super admin can create admin users
- ✅ Roles assign kar sakte ho
- ✅ Permissions manage kar sakte ho

## 🔧 Setup Steps

### Step 1: Database Connection Check

Aapka MongoDB already connected hai ya nahi check karo:

```javascript
// backend/server.js me ye line dekho (line 65-68)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected: localhost"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));
```

### Step 2: Environment Variables

`.env` file me ye variables hone chahiye:

```env
MONGODB_URI=mongodb://localhost:27017/your_database_name
JWT_SECRET=your_secret_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Step 3: Install Dependencies (if not done)

```bash
cd backend
npm install
```

### Step 4: Seed Default Roles

```bash
node seedRoles.js
```

**Output dekho:**
```
✅ MongoDB Connected
✅ Created role: Super Admin
✅ Created role: Admin
✅ Created role: Manager
✅ Created role: User
🎉 Roles seeded successfully!
```

### Step 5: Create Super Admin

```bash
node createSuperAdmin.js
```

**Prompts:**
```
Enter name: Admin User
Enter email: admin@example.com
Enter password: admin123
```

**Output:**
```
✅ Super Admin created successfully!
Super Admin Details:
  Name: Admin User
  Email: admin@example.com
  Role: superadmin
```

### Step 6: Start Server

```bash
npm start
```

**Ya development mode me:**
```bash
npm run dev
```

**Output dekho:**
```
🚀 Server is running on http://0.0.0.0:5000
📊 Environment: development
✅ MongoDB Connected: localhost
```

## 🧪 Testing

### Test 1: User Registration

**Request:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "user_id_here",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "role": {
      "_id": "role_id",
      "name": "user",
      "displayName": "User",
      "permissions": { ... }
    },
    "legacyRole": "user",
    "token": "jwt_token_here"
  }
}
```

### Test 2: User Login

**Request:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "user_id",
    "name": "Test User",
    "email": "test@example.com",
    "role": { ... },
    "legacyRole": "user",
    "isAdmin": false,
    "isSuperAdmin": false,
    "token": "jwt_token_here"
  }
}
```

### Test 3: Super Admin Login

**Request:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "admin_id",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": { ... },
    "legacyRole": "superadmin",
    "isAdmin": true,
    "isSuperAdmin": true,
    "token": "super_admin_token"
  }
}
```

### Test 4: Create Role (Super Admin Only)

**Request:**
```bash
POST http://localhost:5000/api/roles
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "content-editor",
  "displayName": "Content Editor",
  "description": "Can manage blogs and products",
  "permissions": {
    "users": { "view": false, "create": false, "edit": false, "delete": false },
    "products": { "view": true, "create": true, "edit": true, "delete": false },
    "orders": { "view": false, "edit": false, "delete": false },
    "categories": { "view": true, "create": false, "edit": false, "delete": false },
    "blogs": { "view": true, "create": true, "edit": true, "delete": true },
    "roles": { "view": false, "create": false, "edit": false, "delete": false },
    "admins": { "create": false, "edit": false, "delete": false },
    "dashboard": { "access": true }
  }
}
```

### Test 5: Create Admin User

**Request:**
```bash
POST http://localhost:5000/api/admin/create-admin
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Blog Manager",
  "email": "blog@example.com",
  "password": "password123",
  "roleId": "content_editor_role_id"
}
```

## 📊 API Endpoints Summary

### Public Routes (No Auth Required)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### User Routes (Auth Required)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updateprofile` - Update profile
- `PUT /api/auth/updatepassword` - Update password

### Super Admin Routes (Super Admin Only)
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `GET /api/roles/:id/permissions` - Get role permissions
- `POST /api/admin/create-admin` - Create admin
- `GET /api/admin/admins` - Get all admins
- `PUT /api/admin/admins/:id` - Update admin
- `DELETE /api/admin/admins/:id` - Delete admin
- `PUT /api/admin/users/:id/assign-role` - Assign role to user

## 🎯 User Flow

### Normal User Flow
1. User website par jata hai
2. Signup button click karta hai
3. Name, email, password enter karta hai
4. Register button click karta hai
5. **Backend automatically:**
   - Password hash kar deta hai
   - User ko 'user' role assign kar deta hai
   - JWT token generate kar deta hai
6. User token use karke login rehta hai
7. User products dekh sakta hai, orders place kar sakta hai

### Admin Flow
1. Super Admin login karta hai
2. Dashboard me jata hai
3. "Create Admin" button click karta hai
4. Admin details aur role select karta hai
5. Admin create hota hai
6. New admin login kar sakta hai aur apne permissions ke according kaam kar sakta hai

## 🔐 Security Features

1. **Password Hashing**: Passwords bcrypt se hash hote hain (10 salt rounds)
2. **JWT Tokens**: Secure authentication ke liye
3. **Role-Based Access**: Har user ko uski role ke hisaab se access milta hai
4. **Email Lowercase**: Emails lowercase me store hote hain (consistency ke liye)
5. **Super Admin Protection**: Super admin ko delete nahi kar sakte
6. **System Role Protection**: Default roles ko modify/delete nahi kar sakte

## ❓ Common Issues & Solutions

### Issue 1: MongoDB Connection Error
**Solution:**
```bash
# Check if MongoDB is running
# Windows:
net start MongoDB

# Mac/Linux:
sudo systemctl start mongod
```

### Issue 2: Port Already in Use
**Solution:**
```bash
# Change PORT in .env file
PORT=5001
```

### Issue 3: "Role not found" during registration
**Solution:**
```bash
# Run seedRoles.js first
node seedRoles.js
```

### Issue 4: "Not authorized" error
**Solution:**
- Check if token is valid
- Check if token is being sent in Authorization header
- Format: `Authorization: Bearer {token}`

## 📝 Database Collections

After setup, aapke MongoDB me ye collections honge:

1. **users** - All users (regular users + admins)
2. **roles** - All roles with permissions
3. **products** - Product catalog
4. **orders** - User orders
5. **categories** - Product categories
6. **blogs** - Blog posts
7. **carts** - Shopping carts

## ✅ Checklist

Setup complete hai ya nahi check karo:

- [ ] MongoDB running hai
- [ ] .env file configured hai
- [ ] Dependencies installed hain (`npm install`)
- [ ] Default roles seeded hain (`node seedRoles.js`)
- [ ] Super admin created hai (`node createSuperAdmin.js`)
- [ ] Server start ho rahi hai (`npm start`)
- [ ] User registration test kiya
- [ ] User login test kiya
- [ ] Super admin login test kiya

## 🎉 Congratulations!

Agar sab kuch ✅ hai, toh aapka complete authentication & role management system ready hai!

Ab aap:
- Normal users create kar sakte ho
- Admins create kar sakte ho
- Custom roles bana sakte ho
- Permissions manage kar sakte ho
