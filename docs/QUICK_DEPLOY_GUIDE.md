# 🚀 Quick Deployment Guide - Chronicle Vaults

## ✅ Changes Made (Already Done)

1. ✅ Frontend `.env` updated to use `https://chroniclevaults.com/api`
2. ✅ Backend `.env` updated with production URLs
3. ✅ CORS settings updated in backend to allow domain
4. ✅ Production build created (`dist` folder ready)
5. ✅ Deployment script created (`DEPLOY.bat`)

---

## 📦 Option 1: Quick Deploy (Using Script)

### Step 1: Run Deployment Script

Simply double-click on:
```
DEPLOY.bat
```

Enter your VPS password when prompted (3 times - for frontend, backend, and SSH)

### Step 2: SSH into VPS and Restart Services

After upload completes, SSH into VPS:
```bash
ssh root@72.60.202.163
```

Then run these commands:
```bash
cd ~/backend
npm install
pm2 restart all
systemctl reload nginx
```

---

## 📦 Option 2: Manual Deploy (Step by Step)

### Step 1: Upload Frontend

```bash
scp -r "C:\Users\rajpu\OneDrive\Desktop\e commerce\dist\*" root@72.60.202.163:/var/www/html/
```

### Step 2: Upload Backend

```bash
scp -r "C:\Users\rajpu\OneDrive\Desktop\e commerce\backend\." root@72.60.202.163:~/backend/
```

### Step 3: SSH and Restart Services

```bash
ssh root@72.60.202.163
cd ~/backend
npm install
pm2 restart all
systemctl reload nginx
```

---

## 🔧 VPS Setup Commands (If First Time)

If this is your first deployment, you may need to setup the VPS first:

### 1. Install Node.js (if not installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

### 2. Install PM2 (if not installed)
```bash
npm install -g pm2
```

### 3. Install MongoDB (if not installed)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

### 4. Install Nginx (if not installed)
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 5. Configure Nginx

Create nginx config:
```bash
nano /etc/nginx/sites-available/chroniclevaults
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name chroniclevaults.com www.chroniclevaults.com 72.60.202.163;

    client_max_body_size 50M;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /root/backend/uploads;
    }
}
```

Enable site and restart:
```bash
ln -s /etc/nginx/sites-available/chroniclevaults /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 6. Start Backend with PM2

```bash
cd ~/backend
npm install
pm2 start server.js --name chronicle-backend
pm2 save
pm2 startup
```

### 7. Setup Firewall

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
```

---

## 🔒 Optional: Setup SSL Certificate (HTTPS)

After everything is working on HTTP, add SSL:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d chroniclevaults.com -d www.chroniclevaults.com
```

Follow the prompts. It will automatically configure HTTPS.

---

## ✅ Verify Deployment

1. **Check Backend**: `http://72.60.202.163:5000` or `ssh root@72.60.202.163` then `pm2 status`
2. **Check Frontend**: Visit `https://chroniclevaults.com`
3. **Check API**: Visit `https://chroniclevaults.com/api` (should show backend message)

---

## 🐛 Troubleshooting

### Frontend not loading
```bash
ssh root@72.60.202.163
ls -la /var/www/html/
# Should see index.html and assets folder
```

### Backend not working
```bash
ssh root@72.60.202.163
pm2 logs chronicle-backend
# Check for errors
```

### API calls failing
```bash
# Check nginx logs
tail -f /var/log/nginx/error.log

# Check nginx config
nginx -t
```

### MongoDB not connected
```bash
systemctl status mongod
# If stopped:
systemctl start mongod
```

---

## 📝 Login Credentials

**Admin:**
- Email: admin@vintagecoin.com
- Password: Admin@123

**User:**
- Email: user@example.com
- Password: User@123

---

## 🔄 Future Updates

To update the site later:

1. Make changes locally
2. Build: `npm run build`
3. Upload: Run `DEPLOY.bat`
4. Restart: `ssh root@72.60.202.163` then `pm2 restart all && systemctl reload nginx`

---

## 📞 Support

If you face issues:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check MongoDB: `systemctl status mongod`
4. Check all services: `pm2 status && systemctl status nginx && systemctl status mongod`

---

**Domain**: https://chroniclevaults.com
**VPS IP**: 72.60.202.163
**SSH**: root@72.60.202.163
**Backend Path**: ~/backend
**Frontend Path**: /var/www/html
