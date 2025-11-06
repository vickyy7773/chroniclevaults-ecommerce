# 🛠️ Admin Panel Guide - Vintage Coin Store

## Admin Panel Access

### Admin Login Credentials
After running `node seedData.js`, use these credentials:

- **Email:** `admin@vintagecoin.com`
- **Password:** `admin123`

---

## 📍 Admin Panel URLs

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/admin` or `/admin/dashboard` | Overview & stats |
| Products | `/admin/products` | View all products |
| Add Product | `/admin/products/add` | Create new product |
| Edit Product | `/admin/products/edit/:id` | Update existing product |

---

## 🎯 Quick Start Guide

### Step 1: Login as Admin
1. Go to: `http://localhost:5173/authentication`
2. Click "Sign In" tab
3. Enter:
   - Email: `admin@vintagecoin.com`
   - Password: `admin123`
4. Click "Sign In"

### Step 2: Access Admin Panel
1. After login, go to: `http://localhost:5173/admin`
2. You'll see the **Dashboard** with:
   - Total Products
   - Total Orders
   - Revenue Stats
   - Quick Action Cards

### Step 3: Add New Product
1. Click **"Add New Product"** button on dashboard
   - OR go to: `http://localhost:5173/admin/products/add`

2. Fill in the form:
   - **Product Name:** e.g., "2024 Gold Coin Special Edition"
   - **Description:** Detailed description
   - **Price:** e.g., 5000
   - **Original Price:** e.g., 6000 (optional)
   - **Category:** Select from dropdown
   - **Sub-Category:** e.g., "Gold Coins"
   - **Stock Quantity:** e.g., 10
   - **Year:** e.g., 2024
   - **Rarity:** Select from dropdown
   - **Condition:** e.g., "Uncirculated"
   - **Image URLs:** Add one or more image URLs
   - **Featured:** Check if you want to feature
   - **Active:** Check to make visible

3. Click **"Create Product"**
4. Product will be immediately visible on website!

---

## 📦 Product Management Features

### View All Products
- Go to: `/admin/products`
- Features:
  - ✅ Search products by name
  - ✅ Filter by category
  - ✅ View product details
  - ✅ See stock levels
  - ✅ Check active/inactive status

### Edit Existing Product
1. Go to `/admin/products`
2. Click **Edit** icon (pencil) on any product
3. Update any field
4. Click **"Update Product"**

### Delete Product
1. Go to `/admin/products`
2. Click **Delete** icon (trash) on any product
3. Confirm deletion
4. Product removed from database

---

## 🎨 Admin Dashboard Features

### Statistics Cards
- **Total Products:** Count of all products
- **Total Orders:** Number of orders placed
- **Total Revenue:** Sum of all order values
- **Pending Orders:** Orders waiting to be processed

### Quick Actions
- **Add New Product:** Create product instantly
- **Manage Products:** View/Edit all products
- **Manage Orders:** View/Process orders

### Recent Lists
- **Recent Products:** Last 5 products added
- **Recent Orders:** Last 5 orders placed

---

## 📝 Product Form Fields Explained

### Required Fields (*)
- **Product Name:** Display name
- **Description:** Full details about product
- **Price:** Selling price in ₹
- **Stock Quantity:** Available units
- **Category:** Product category
- **Images:** At least one image URL

### Optional Fields
- **Original Price:** For showing discount
- **Sub-Category:** More specific categorization
- **Year:** Year of production/minting
- **Rarity:** How rare the item is
- **Condition:** Physical condition
- **Featured:** Show on homepage carousel
- **Active:** Make visible to customers

---

## 🖼️ Adding Product Images

### Method 1: Direct URL
```
https://images.unsplash.com/photo-1234567890?w=400&h=400&fit=crop
```

### Method 2: Upload to Image Host
1. Upload image to:
   - ImgBB (imgbb.com)
   - Imgur (imgur.com)
   - Cloudinary
2. Copy public URL
3. Paste in image field

### Tips:
- Use high-quality images (minimum 400x400px)
- Multiple images help customers see details
- Click "Add Another Image" for more images
- Remove unwanted images with "Remove" button

---

## 🔐 Admin Features

### Only Admins Can:
- ✅ Access `/admin/*` routes
- ✅ Create new products
- ✅ Edit existing products
- ✅ Delete products
- ✅ View all orders
- ✅ Update order status
- ✅ See revenue statistics

### Regular Users Cannot:
- ❌ Access admin panel
- ❌ Modify products
- ❌ See other users' orders
- ❌ Delete products

---

## 🎯 Common Admin Tasks

### Task 1: Add Product with Discount
```
Price: 1250
Original Price: 1500
Result: Shows "17% OFF" badge on product
```

### Task 2: Feature Product on Homepage
```
1. Edit product
2. Check "Featured Product" checkbox
3. Save
4. Product appears in homepage carousel
```

### Task 3: Mark Product Out of Stock
```
Option A: Set Stock Quantity to 0
Option B: Uncheck "Active" to hide completely
```

### Task 4: Bulk Category Management
```
1. Go to /admin/products
2. Filter by category
3. Edit products in that category
```

---

## 📊 Product Categories

Available categories:
1. **Coins** - Vintage and modern coins
2. **BankNotes** - Currency notes
3. **Stamps** - Postage stamps
4. **Medals** - Commemorative medals
5. **Books** - Reference books, catalogs
6. **Accessories** - Storage, tools, supplies

---

## 🚀 Testing Your Products

### After Adding Product:
1. Go to homepage: `http://localhost:5173`
2. Check if product appears in:
   - Featured carousel (if marked featured)
   - Category grids
   - Product pages

3. Test filtering by:
   - Category
   - Search
   - Price range

4. Test product details:
   - Click on product
   - View images
   - Check price display
   - Add to cart

---

## 💡 Best Practices

### Product Names
- ✅ Clear and descriptive
- ✅ Include year if relevant
- ❌ Avoid ALL CAPS
- ❌ Don't use special characters

### Descriptions
- ✅ Detailed and informative
- ✅ Mention condition, rarity
- ✅ Include historical context
- ❌ Don't copy-paste same description

### Pricing
- ✅ Competitive pricing
- ✅ Use original price for discounts
- ✅ Consider rarity in pricing
- ❌ Don't leave blank

### Stock Management
- ✅ Update stock regularly
- ✅ Set realistic quantities
- ✅ Mark out of stock items
- ❌ Don't oversell

---

## 🐛 Troubleshooting

### Can't Access Admin Panel?
1. Check you're logged in as admin
2. Verify email is `admin@vintagecoin.com`
3. Check user role in database

### Product Not Saving?
1. Fill all required fields (marked with *)
2. Check image URLs are valid
3. Ensure price > 0
4. Check backend is running

### Product Not Showing on Website?
1. Check "Active" checkbox is enabled
2. Verify stock quantity > 0
3. Refresh the page
4. Clear browser cache

### Images Not Loading?
1. Verify image URLs are public
2. Check URL format (must start with http/https)
3. Use direct image links (not webpage links)
4. Test URL in new browser tab

---

## 📞 Quick Reference

### Essential URLs
```
Homepage:        http://localhost:5173
Admin Login:     http://localhost:5173/authentication
Admin Dashboard: http://localhost:5173/admin
Add Product:     http://localhost:5173/admin/products/add
View Products:   http://localhost:5173/admin/products
```

### Essential Credentials
```
Admin Email:    admin@vintagecoin.com
Admin Password: admin123
```

### Backend API
```
Backend URL:  http://localhost:5000
API Base:     http://localhost:5000/api
Health Check: http://localhost:5000/api/health
```

---

## 🎉 You're Ready!

Now you can:
- ✅ Login as admin
- ✅ Access admin dashboard
- ✅ Add new products directly
- ✅ Edit existing products
- ✅ Delete products
- ✅ Manage inventory
- ✅ See products live on website

**Happy Managing! 🚀**
