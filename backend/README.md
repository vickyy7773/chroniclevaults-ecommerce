# Vintage Coin Store - Backend API

E-commerce backend API built with Node.js, Express, and MongoDB.

## Features

- ✅ User Authentication (JWT)
- ✅ Product Management (CRUD)
- ✅ Shopping Cart
- ✅ Order Management
- ✅ Admin Panel
- ✅ Password Hashing (bcrypt)
- ✅ Error Handling
- ✅ Input Validation

## Tech Stack

- **Node.js** - Runtime
- **Express** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password Hashing

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Create `.env` file in backend folder:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://your-vps-ip:27017/vintage-coin-store
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### 3. Run Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/updateprofile` - Update profile (Protected)
- `PUT /api/auth/updatepassword` - Update password (Protected)

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Cart
- `GET /api/cart` - Get user cart (Protected)
- `POST /api/cart` - Add item to cart (Protected)
- `PUT /api/cart/:itemId` - Update cart item (Protected)
- `DELETE /api/cart/:itemId` - Remove from cart (Protected)
- `DELETE /api/cart` - Clear cart (Protected)

### Orders
- `POST /api/orders` - Create order (Protected)
- `GET /api/orders/myorders` - Get user orders (Protected)
- `GET /api/orders/:id` - Get order by ID (Protected)
- `GET /api/orders` - Get all orders (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)
- `PUT /api/orders/:id/pay` - Mark order as paid (Protected)

## Folder Structure

```
backend/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── productController.js  # Product logic
│   ├── cartController.js     # Cart logic
│   └── orderController.js    # Order logic
├── middleware/
│   ├── auth.js              # Auth middleware
│   └── errorHandler.js      # Error handling
├── models/
│   ├── User.js              # User schema
│   ├── Product.js           # Product schema
│   ├── Cart.js              # Cart schema
│   └── Order.js             # Order schema
├── routes/
│   ├── auth.js              # Auth routes
│   ├── products.js          # Product routes
│   ├── cart.js              # Cart routes
│   └── orders.js            # Order routes
├── utils/
│   └── generateToken.js     # JWT token generator
├── .env.example             # Environment template
├── .gitignore
├── package.json
└── server.js                # Entry point
```

## VPS MongoDB Connection

### Option 1: Local MongoDB
```env
MONGODB_URI=mongodb://localhost:27017/vintage-coin-store
```

### Option 2: VPS MongoDB
```env
MONGODB_URI=mongodb://your-vps-ip:27017/vintage-coin-store
```

### Option 3: MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vintage-coin-store
```

## Deployment Steps

### 1. Upload to VPS

```bash
# Using SCP
scp -r backend/ user@your-vps-ip:/path/to/project/

# Or using Git
git init
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. On VPS

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your VPS MongoDB connection
nano .env

# Start server
npm start

# Or use PM2 for production
npm install -g pm2
pm2 start server.js --name "vintage-coin-api"
pm2 save
pm2 startup
```

## Testing API

Health check:
```bash
curl http://localhost:5000/api/health
```

Register user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"123456"}'
```

## Notes

- Default port: 5000
- JWT token expires in 7 days (configurable)
- Admin users can manage products and orders
- All protected routes require JWT token in Authorization header
- CORS enabled for frontend communication
