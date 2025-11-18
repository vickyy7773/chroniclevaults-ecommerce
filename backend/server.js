import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import passport from "./config/passport.js";

// Import routes
import productRoutes from "./routes/products.js";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import uploadRoutes from "./routes/upload.js";
import categoryRoutes from "./routes/categories.js";
import userRoutes from "./routes/users.js";
import blogRoutes from "./routes/blogs.js";
import roleRoutes from "./routes/roles.js";
import adminRoutes from "./routes/admin.js";
import sliderRoutes from "./routes/sliders.js";
import pagePostersRoutes from "./routes/pagePosters.js";
import bannerRoutes from "./routes/banners.js";
import filterOptionRoutes from "./routes/filterOptionRoutes.js";
import paymentRoutes from "./routes/payments.js";
import userCartRoutes from "./routes/userCart.js";
import auctionRoutes from "./routes/auctions.js";
import visitorRoutes from "./routes/visitors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// CORS Configuration - Allow your frontend domain
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://chroniclevaults.com',
  'https://chroniclevaults.com',
  'http://www.chroniclevaults.com',
  'https://www.chroniclevaults.com',
  'http://72.60.202.163',
  'https://72.60.202.163'
];

// Add your production domain when deploying
if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected: localhost"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Test route
app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend is working!" });
});

// API Health Check
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API is running!",
    version: "1.0.0",
    endpoints: [
      "/api/products",
      "/api/auth",
      "/api/cart",
      "/api/orders",
      "/api/categories",
      "/api/users",
      "/api/blogs",
      "/api/admin",
      "/api/auctions"
    ]
  });
});

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sliders", sliderRoutes);
app.use("/api/page-posters", pagePostersRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/filter-options", filterOptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/user", userCartRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/visitors", visitorRoutes);

// Import email transporter close function
import { closeTransporter } from './config/email.js';

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Close server
  server.close(async () => {
    console.log('🔌 HTTP server closed');

    try {
      // Close email transporter
      await closeTransporter();

      // Close database connection
      await mongoose.connection.close();
      console.log('💾 MongoDB connection closed');

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});
