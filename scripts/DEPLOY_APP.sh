#!/bin/bash
# Chronicle Vaults - Application Deployment Script
# Run this AFTER uploading files

set -e

APP_DIR="/var/www/chroniclevaults"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "========================================="
echo "🚀 Deploying Chronicle Vaults"
echo "========================================="

# Navigate to backend
cd $BACKEND_DIR

# Create .env file
echo "📝 Creating backend .env file..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chroniclevaults
JWT_SECRET=chroniclevaults-super-secret-key-2025-change-this
FRONTEND_URL=https://chroniclevaults.com
CORS_ORIGIN=https://chroniclevaults.com
EOF

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install --production

# Start backend with PM2
echo "🚀 Starting backend server..."
pm2 delete chroniclevaults-backend 2>/dev/null || true
pm2 start server.js --name "chroniclevaults-backend" --env production
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

# Configure Nginx
echo "⚙️ Configuring Nginx..."
cat > /etc/nginx/sites-available/chroniclevaults << 'EOF'
# Backend API Server
server {
    listen 80;
    server_name api.chroniclevaults.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for long requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# Frontend Server
server {
    listen 80;
    server_name chroniclevaults.com www.chroniclevaults.com;

    root /var/www/chroniclevaults/frontend/dist;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/chroniclevaults /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

echo ""
echo "========================================="
echo "✅ Application Deployed Successfully!"
echo "========================================="
echo ""
echo "📊 Status Check:"
echo "----------------"
pm2 status
echo ""
systemctl status nginx --no-pager | head -5
echo ""
systemctl status mongod --no-pager | head -5
echo ""
echo "🌐 Your site is running at:"
echo "   Frontend: http://chroniclevaults.com"
echo "   API: http://api.chroniclevaults.com"
echo ""
echo "⚠️ IMPORTANT: Setup SSL with this command:"
echo "   certbot --nginx -d chroniclevaults.com -d www.chroniclevaults.com -d api.chroniclevaults.com"
echo ""
echo "📝 Useful commands:"
echo "   pm2 logs chroniclevaults-backend    - View backend logs"
echo "   pm2 restart chroniclevaults-backend - Restart backend"
echo "   systemctl restart nginx             - Restart nginx"
echo ""
