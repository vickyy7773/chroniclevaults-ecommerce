# Chronicle Vaults - Vintage Coin Store E-Commerce Platform

A full-stack e-commerce platform for selling vintage coins, medals, stamps, banknotes, and collectible accessories.

## 🚀 Tech Stack

**Frontend:**
- React 18
- React Router DOM
- Axios
- Tailwind CSS
- Lucide React Icons
- Vite

**Backend:**
- Node.js & Express
- MongoDB & Mongoose
- JWT Authentication
- Passport.js (Google OAuth)
- Multer (File Uploads)
- Bcrypt (Password Hashing)

## 📁 Project Structure

```
chronicle-vaults/
├── backend/              # Backend API server
│   ├── config/          # Configuration files (passport, etc.)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware (auth, upload, etc.)
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts (setup, seed data)
│   ├── docs/            # Backend documentation
│   ├── uploads/         # Uploaded files storage
│   ├── utils/           # Helper utilities
│   └── server.js        # Entry point
│
├── src/                 # Frontend React app
│   ├── components/      # React components
│   │   ├── common/      # Shared components (Header, Footer, etc.)
│   │   ├── layout/      # Layout components
│   │   ├── product/     # Product-related components
│   │   ├── cart/        # Cart & Wishlist
│   │   ├── modals/      # Modal dialogs
│   │   └── filters/     # Filter components
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin panel pages
│   │   ├── products/    # Product pages
│   │   ├── info/        # About, Contact, FAQ
│   │   └── policies/    # Privacy, Terms, Shipping
│   ├── services/        # API service layer
│   ├── utils/           # Frontend utilities
│   ├── constants/       # Constants & configs
│   ├── hooks/           # Custom React hooks
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
│
├── docs/                # Project documentation
├── scripts/             # Deployment scripts
├── dist/                # Production build output
└── mongodb-backup/      # MongoDB backups

```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd chronicle-vaults
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Configure your .env file with:
# - MongoDB URI
# - JWT Secret
# - Frontend URL
# - Google OAuth credentials (optional)

# Seed initial data (optional)
node scripts/seedRoles.js
node scripts/seedData.js

# Create admin user (optional)
node scripts/setupAdmin.js

# Start backend server
npm run dev
```

Backend will run on `http://host:5000`

### 3. Frontend Setup

```bash
# From project root
npm install

# Create .env file
cp .env.example .env

# Configure VITE_API_URL in .env
# For local: VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📖 Available Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend
```bash
npm run dev          # Start with nodemon (development)
npm start            # Start server (production)
```

## 🔐 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Chronicle Vaults
```

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/vintage-coin-store
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🎯 Features

### Customer Features
- Browse products by category (Coins, Medals, Stamps, Bank Notes, Books, Accessories)
- Product search and filtering
- Product details with image gallery
- Shopping cart management
- Wishlist functionality
- User authentication (Email/Password & Google OAuth)
- Order placement and tracking
- User profile management
- Blog section

### Admin Features
- Dashboard with analytics
- Product management (CRUD)
- Category & subcategory management
- Order management & status updates
- Customer management
- Slider/Banner management
- Blog post management
- Role-based access control

## 📚 Documentation

Detailed documentation available in `/docs`:
- [Quick Start Guide](docs/QUICK_START_GUIDE.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Admin Guide](docs/ADMIN_GUIDE.md)
- [Google OAuth Setup](docs/GOOGLE_OAUTH_SETUP.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)

Backend documentation in `/backend/docs`:
- [Role Management Guide](backend/docs/ROLE_MANAGEMENT_GUIDE.md)
- [Setup Instructions](backend/docs/SETUP_INSTRUCTIONS.md)

## 🚢 Deployment

Deployment scripts available in `/scripts`:
- `deploy.sh` - Main deployment script
- `DEPLOY_APP.sh` - Full application deployment
- `SERVER_SETUP.sh` - Server initial setup

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📝 API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updateprofile` - Update profile
- `PUT /api/auth/updatepassword` - Update password
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/:productId` - Remove from cart
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `GET /api/orders/myorders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status (admin)

### Categories & Sliders
- `GET /api/page-posters` - Get all categories
- `GET /api/sliders` - Get homepage sliders
- `POST /api/page-posters` - Create category (admin)
- `PUT /api/page-posters/:id` - Update category (admin)

### Admin
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `PUT /api/admin/customers/:id/status` - Update customer status

### Blogs
- `GET /api/blogs` - Get all blogs
- `GET /api/blogs/:id` - Get single blog
- `POST /api/blogs` - Create blog (admin)
- `PUT /api/blogs/:id` - Update blog (admin)
- `DELETE /api/blogs/:id` - Delete blog (admin)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For support, email support@chroniclevaults.com or visit our Contact Us page.

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the database
- All open-source contributors

---

**Built with ❤️ by Chronicle Vaults Team**
