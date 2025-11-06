# Development Guide - Chronicle Vaults

یہ guide بتاتی ہے کہ **local development** اور **production deployment** کیسے کریں۔

## 📁 Environment Files

### Frontend:
- **`.env.local`** - Local development کے لیے (localhost)
- **`.env.production`** - Production build کے لیے (chroniclevaults.com)
- **`.env`** - Default values

### Backend:
- **`backend/.env`** - Backend configuration

---

## 🖥️ Local Development

### 1. **MongoDB شروع کریں:**
```bash
# MongoDB service چل رہی ہونی چاہیے
# Windows: MongoDB Service running in Services
# Or start manually: mongod --dbpath="C:\data\db"
```

### 2. **Backend شروع کریں:**
```bash
cd backend
npm install
npm run dev
# Server: http://localhost:5000
```

### 3. **Frontend شروع کریں:**
```bash
# Root directory میں
npm install
npm run dev
# Frontend: http://localhost:5173
```

### 4. **Environment Check:**
- ✅ Backend `.env`:
  - `NODE_ENV=development`
  - `MONGODB_URI=mongodb://127.0.0.1:27017/vintage-coin-store`
  - `FRONTEND_URL=http://localhost:5173`
  - `BACKEND_URL=http://localhost:5000`

- ✅ Frontend `.env.local`:
  - `VITE_API_URL=http://localhost:5000/api`

---

## 🚀 Production Deployment

### 1. **Frontend Build:**
```bash
# Root directory میں
npm run build
# یہ automatically .env.production استعمال کرے گا
```

### 2. **VPS پر Deploy:**
```bash
# Frontend deploy
cd dist
scp -r * root@72.60.202.163:/var/www/chroniclevaults.com/

# Backend deploy (if needed)
cd ../backend
scp -r * root@72.60.202.163:/root/backend/

# SSH into VPS
ssh root@72.60.202.163

# VPS پر:
# Backend restart
cd /root/backend
pm2 restart backend

# Nginx reload
systemctl reload nginx
```

### 3. **Production Environment Check:**
- ✅ VPS Backend `.env`:
  - `NODE_ENV=production`
  - `MONGODB_URI=mongodb://127.0.0.1:27017/vintage-coin-store`
  - `FRONTEND_URL=https://chroniclevaults.com`
  - `BACKEND_URL=https://chroniclevaults.com`

- ✅ Frontend `.env.production`:
  - `VITE_API_URL=https://chroniclevaults.com/api`

---

## 🔄 Switching Between Local & Production

### Local سے Production جانے کے لیے:
```bash
# 1. Code commit/push کریں (optional)
git add .
git commit -m "Ready for production"

# 2. Production build
npm run build

# 3. Deploy to VPS (دیکھیں اوپر)
```

### Production سے Local جانے کے لیے:
```bash
# Files already configured ہیں!
# بس local servers شروع کریں:

# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

---

## 📝 Important Notes

### **Database:**
- Local: MongoDB local instance (`127.0.0.1:27017`)
- Production: MongoDB on VPS (`127.0.0.1:27017`)

### **Images/Uploads:**
- Local: `backend/uploads/` folder
- Production: `/var/www/chroniclevaults-uploads/` (VPS)
  - Symlink: `/root/backend/uploads` → `/var/www/chroniclevaults-uploads/`

### **URLs:**
- Local Frontend: `http://localhost:5173`
- Local Backend: `http://localhost:5000`
- Production: `https://chroniclevaults.com`

---

## 🐛 Common Issues

### **Issue 1: Frontend localhost:5000 errors**
**Fix:**
```bash
# Check .env.local
cat .env.local
# Should show: VITE_API_URL=http://localhost:5000/api
```

### **Issue 2: Backend not connecting to MongoDB**
**Fix:**
```bash
# Check MongoDB service
tasklist | findstr mongod

# Start if not running
# Services → MongoDB → Start
```

### **Issue 3: Images not loading locally**
**Fix:**
```bash
# Ensure backend/uploads folder exists
cd backend
mkdir uploads  # if doesn't exist
```

---

## ✅ Quick Start Checklist

### Local Development:
- [ ] MongoDB service چل رہی ہے
- [ ] `.env.local` میں `http://localhost:5000/api`
- [ ] `backend/.env` میں `NODE_ENV=development`
- [ ] Backend: `cd backend && npm run dev`
- [ ] Frontend: `npm run dev`
- [ ] Browser: `http://localhost:5173`

### Production Deployment:
- [ ] Code ready & tested locally
- [ ] `npm run build` (uses `.env.production`)
- [ ] Deploy to VPS
- [ ] Backend restart: `pm2 restart backend`
- [ ] Nginx reload: `systemctl reload nginx`
- [ ] Test: `https://chroniclevaults.com`

---

## 🎯 Pro Tips

1. **Always test locally first** before deploying to production
2. **Never commit `.env` files** to git (they're in `.gitignore`)
3. **Keep production `.env` backup** on VPS
4. **Use `pm2 logs backend`** to debug production issues
5. **Hard refresh browser** after deployment: `Ctrl + Shift + R`

---

**Happy Coding! 🚀**
