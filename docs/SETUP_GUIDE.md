# 🚀 Complete Setup Guide - Vintage Coin Store

## Prerequisites
- Node.js (v16 or higher)
- MongoDB installed or VPS MongoDB access

---

## 📦 Step 1: Backend Setup

### 1.1 Navigate to Backend
```bash
cd backend
```

### 1.2 Install Dependencies
```bash
npm install
```

### 1.3 Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your settings
```

**.env Configuration:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vintage-coin-store
# For VPS: mongodb://your-vps-ip:27017/vintage-coin-store
JWT_SECRET=your-super-secret-jwt-key-123456
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### 1.4 Import Sample Data
```bash
# This will create admin user and sample products
node seedData.js
```

**Sample Credentials Created:**
- **Admin User:**
  - Email: `admin@vintagecoin.com`
  - Password: `admin123`

- **Test User:**
  - Email: `user@example.com`
  - Password: `123456`

### 1.5 Start Backend Server
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

**Backend will run on:** `http://localhost:5000`

### 1.6 Test Backend
```bash
# Health check
curl http://localhost:5000/api/health

# Get products
curl http://localhost:5000/api/products

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vintagecoin.com","password":"admin123"}'
```

---

## 🎨 Step 2: Frontend Setup

### 2.1 Go Back to Root
```bash
cd ..
```

### 2.2 Install Dependencies (if not already installed)
```bash
npm install
```

### 2.3 Configure Environment
```bash
# Copy example env file
cp .env.example .env
```

**.env Configuration:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 2.4 Start Frontend
```bash
npm run dev
```

**Frontend will run on:** `http://localhost:5173`

---

## ✅ Step 3: Verify Everything Works

### 3.1 Check Backend
- Open: `http://localhost:5000/api/health`
- Should see: `{"success":true,"message":"Server is running"}`

### 3.2 Check Frontend
- Open: `http://localhost:5173`
- Should see the website

### 3.3 Test API Integration
1. Open Frontend: `http://localhost:5173`
2. Click on "Login" or "Sign Up"
3. Try logging in with:
   - Email: `user@example.com`
   - Password: `123456`

---

## 📁 Project Structure

```
e-commerce/
├── backend/              # Backend API
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── .env             # Backend environment
│   ├── server.js
│   └── seedData.js      # Import sample data
├── src/                 # Frontend React app
│   ├── components/
│   ├── pages/
│   ├── services/        # API service layer
│   ├── constants/
│   └── App.jsx
├── .env                 # Frontend environment
└── package.json
```

---

## 🔧 Common Commands

### Backend Commands (from /backend folder)
```bash
npm run dev        # Start with nodemon
npm start          # Start production
node seedData.js   # Import sample data
node seedData.js -d # Delete all data
```

### Frontend Commands (from root folder)
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## 🌐 API Endpoints Available

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/featured` - Get featured
- `GET /api/products/:id` - Get single product

### Cart (Requires Auth)
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:itemId` - Update quantity
- `DELETE /api/cart/:itemId` - Remove item

### Orders (Requires Auth)
- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get my orders
- `GET /api/orders/:id` - Get order details

---

## 🐛 Troubleshooting

### Backend not starting?
1. Check if MongoDB is running
2. Verify .env file exists and has correct MongoDB URI
3. Check port 5000 is not in use

### Frontend not connecting to backend?
1. Verify backend is running on port 5000
2. Check .env file has correct VITE_API_URL
3. Check CORS settings in backend

### Database connection error?
1. Check MongoDB is running: `mongod --version`
2. Verify connection string in backend/.env
3. For VPS: ensure IP is accessible and MongoDB is bound to 0.0.0.0

---

## 🎯 Next Steps After Setup

1. ✅ Backend running on port 5000
2. ✅ Frontend running on port 5173
3. ✅ Sample data imported
4. ✅ Can login with test credentials
5. ✅ Products displaying on homepage

### Now You Can:
- Browse products
- Register/Login users
- Add items to cart
- Create orders
- Admin can manage products

---

## 📝 Notes

- Frontend services are in `/src/services/`
- All API calls use the service layer
- Token stored in localStorage
- Admin panel features require admin role
- Sample data includes 10 products

---

## 🚀 VPS Deployment (Optional)

### Backend Deployment
```bash
# On VPS
cd /path/to/project/backend
npm install
cp .env.example .env
# Edit .env with VPS MongoDB URI
node seedData.js
npm install -g pm2
pm2 start server.js --name "vintage-coin-api"
pm2 save
pm2 startup
```

### Frontend Deployment
```bash
# Build locally
npm run build

# Upload dist folder to VPS
scp -r dist/ user@vps-ip:/var/www/vintage-coin-store/

# Configure Nginx or serve with static server
```

---

## 📞 Need Help?

Check backend logs: `backend/` folder
Check frontend console: Browser DevTools
Check network requests: Browser Network tab
