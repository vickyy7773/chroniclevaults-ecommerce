# Google OAuth Setup Guide

Google OAuth login ab aapke application mein successfully implement ho gaya hai! 🎉

## ✅ Kya Complete Hua:

1. **Backend Setup**
   - ✅ Passport.js aur Google OAuth strategy installed
   - ✅ Google OAuth routes configured
   - ✅ User model updated (googleId, avatar, isEmailVerified fields)
   - ✅ OAuth callback handler implemented

2. **Frontend Setup**
   - ✅ Google Sign-In button added in AuthModal
   - ✅ Success/Error pages created
   - ✅ Routes configured

## 🔧 Setup Steps (Google Cloud Console):

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project ya existing project select karein
3. Project name: "Chronicle Vaults" (or apna naam)

### Step 2: Enable Google+ API

1. Left sidebar mein **"APIs & Services"** > **"Library"** par click karein
2. Search for **"Google+ API"**
3. Click karke **"Enable"** karein

### Step 3: Create OAuth Credentials

1. **"APIs & Services"** > **"Credentials"** par jaayein
2. Click on **"Create Credentials"** > **"OAuth client ID"**
3. If asked, configure consent screen first:
   - User Type: **External**
   - App name: **Chronicle Vaults**
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
   - Add scopes: `.../auth/userinfo.email` and `.../auth/userinfo.profile`
   - Test users: Add your email

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Chronicle Vaults OAuth**
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:5000`
     - `https://chroniclevaults.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback`
     - `https://chroniclevaults.com/api/auth/google/callback` (production)

### Step 4: Copy Credentials

After creating, aapko mil jayega:
- **Client ID** (something like: 123456789-abc.apps.googleusercontent.com)
- **Client Secret** (something like: GOCSPX-...)

### Step 5: Update Backend .env File

`backend/.env` file mein ye values add karein:

```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

**IMPORTANT:** Production deployment ke liye GOOGLE_CALLBACK_URL change karein:
```env
GOOGLE_CALLBACK_URL=https://chroniclevaults.com/api/auth/google/callback
```

### Step 6: Restart Backend Server

```bash
cd backend
npm run dev
```

## 🧪 Testing:

1. Frontend open karein: `http://localhost:5173`
2. Login button click karein (AuthModal khulega)
3. **"Sign in with Google"** button click karein
4. Google account select karein
5. Permissions allow karein
6. Automatically home page par redirect ho jayega

## 📝 Important Notes:

- **Local Development**: `localhost:5000` aur `localhost:5173` credentials mein add karna zaroori hai
- **Production**: Production URLs Google Cloud Console mein add karna na bhoolein
- **Security**: `.env` file ko **NEVER** git mein commit na karein
- **Test Users**: Development mode mein sirf test users hi login kar sakte hain

## 🔐 User Data Storage:

Google OAuth se login karne par:
- User ka `googleId` database mein store hota hai
- `avatar` (profile photo) save hoti hai
- `isEmailVerified` automatically `true` set hoti hai
- Password optional hai (Google users ke liye)

## 🚨 Troubleshooting:

### Error: "Redirect URI mismatch"
**Fix:** Google Cloud Console mein redirect URI exactly match honi chahiye:
- Local: `http://localhost:5000/api/auth/google/callback`
- Production: `https://yourdomain.com/api/auth/google/callback`

### Error: "Access blocked: This app's request is invalid"
**Fix:** OAuth consent screen properly configure karein aur test users add karein

### Error: "Invalid client"
**Fix:** `GOOGLE_CLIENT_ID` aur `GOOGLE_CLIENT_SECRET` check karein .env file mein

## 🎨 Customization:

Google button ka color/style change karne ke liye:
`src/components/modals/AuthModal.jsx` mein Google button ko customize kar sakte ho.

## 📱 Mobile Testing:

Mobile par test karne ke liye:
1. Make sure backend accessible hai network par
2. Frontend URL update karein
3. Google Cloud Console mein mobile URLs add karein

---

**Happy Coding! 🚀**

Need help? Contact: support@chroniclevaults.com
