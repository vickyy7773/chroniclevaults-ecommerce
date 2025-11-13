# OAuth Login Setup Guide

This guide will help you set up Google and Facebook OAuth login for chroniclevaults.com

## Prerequisites
- Access to server .env file at: `/home/chroniclevaults.com/app/backend/.env`
- PM2 restart access

---

## Google OAuth Setup

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing project "chroniclevaults"
3. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
4. Application type: **Web application**
5. Name: **Chronicle Vaults Production**
6. Add Authorized redirect URIs:
   ```
   https://chroniclevaults.com/api/auth/google/callback
   http://chroniclevaults.com/api/auth/google/callback
   ```
7. Click **"Create"**
8. Copy the **Client ID** and **Client Secret**

### Step 2: Add to Server .env File

SSH to server and edit `.env`:
```bash
ssh root@72.60.202.163
nano /home/chroniclevaults.com/app/backend/.env
```

Add these lines:
```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_CALLBACK_URL=https://chroniclevaults.com/api/auth/google/callback
```

### Step 3: Restart Server
```bash
pm2 restart chroniclevaults-api
pm2 logs chroniclevaults-api --lines 20
```

Look for: `✅ Google OAuth enabled`

---

## Facebook OAuth Setup

### Step 1: Get Facebook OAuth Credentials

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Click **"Create App"**
3. Use case: **Consumer** or **Business**
4. App name: **Chronicle Vaults**
5. Contact email: Your email
6. Click **"Create App"**

### Step 2: Add Facebook Login Product

1. In app dashboard, click **"Add Product"**
2. Find **"Facebook Login"** → Click **"Set Up"**
3. Platform: **Web**
4. Site URL: `https://chroniclevaults.com`
5. Go to **Facebook Login** → **Settings** (left sidebar)
6. Add Valid OAuth Redirect URIs:
   ```
   https://chroniclevaults.com/api/auth/facebook/callback
   http://chroniclevaults.com/api/auth/facebook/callback
   ```
7. Save changes

### Step 3: Get App Credentials

1. Go to **Settings** → **Basic** (left sidebar)
2. Copy **App ID**
3. Click **Show** next to **App Secret** and copy it

### Step 4: Make App Live

1. App Mode is in **Development** by default
2. To make it public:
   - Complete all required fields in **Settings** → **Basic**
   - Add Privacy Policy URL
   - Add Terms of Service URL
   - Choose category
   - Click toggle to switch to **Live** mode

### Step 5: Add to Server .env File

SSH to server and edit `.env`:
```bash
ssh root@72.60.202.163
nano /home/chroniclevaults.com/app/backend/.env
```

Add these lines:
```env
FACEBOOK_APP_ID=your_actual_app_id_here
FACEBOOK_APP_SECRET=your_actual_app_secret_here
FACEBOOK_CALLBACK_URL=https://chroniclevaults.com/api/auth/facebook/callback
```

### Step 6: Restart Server
```bash
pm2 restart chroniclevaults-api
pm2 logs chroniclevaults-api --lines 20
```

Look for: `✅ Facebook OAuth enabled`

---

## Testing

### Test Google Login
1. Go to https://chroniclevaults.com/authentication
2. Click **"Continue with Google"** button
3. Select your Google account
4. Should redirect back to home page, logged in

### Test Facebook Login
1. Go to https://chroniclevaults.com/authentication
2. Click **"Continue with Facebook"** button
3. Select your Facebook account or login
4. Should redirect back to home page, logged in

---

## Troubleshooting

### OAuth Not Working?

1. Check server logs:
   ```bash
   pm2 logs chroniclevaults-api --lines 50
   ```

2. Verify credentials in .env:
   ```bash
   cat /home/chroniclevaults.com/app/backend/.env | grep -E "GOOGLE|FACEBOOK"
   ```

3. Make sure callback URLs match EXACTLY (https vs http)

4. For Facebook, ensure app is in **Live** mode (not Development)

5. Check if user sees error page - look at URL for error message

### Common Issues

**"Redirect URI mismatch"**
- Callback URL in .env doesn't match OAuth app settings
- Check https vs http

**"App not approved" (Facebook)**
- App is still in Development mode
- Switch to Live mode in Facebook App settings

**"OAuth disabled" in logs**
- Credentials not added to .env
- .env has placeholder values like "your_google_client_id_here"
- Server not restarted after adding credentials

---

## Current Status

As of deployment, OAuth login is:
- ✅ **Fully implemented** (frontend + backend)
- ⚠️  **Credentials not configured** (need to add to .env)
- 🔴 **Currently disabled** (waiting for credentials)

Once credentials are added and server restarted, OAuth login will work immediately!

---

## Security Notes

- Never commit actual credentials to git
- Keep .env file secure (chmod 600)
- Use different credentials for development and production
- Regularly rotate OAuth secrets
- Monitor OAuth usage in provider dashboards
