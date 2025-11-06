#!/bin/bash

# Chronicle Vaults - Quick Deployment Script
# Run this on your server after uploading files

echo "🚀 Starting Chronicle Vaults Deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/chroniclevaults"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo -e "${YELLOW}1. Creating directories...${NC}"
mkdir -p $APP_DIR
mkdir -p $BACKEND_DIR
mkdir -p $FRONTEND_DIR

echo -e "${YELLOW}2. Installing backend dependencies...${NC}"
cd $BACKEND_DIR
npm install --production

echo -e "${YELLOW}3. Setting up PM2...${NC}"
pm2 delete chroniclevaults-backend 2>/dev/null || true
pm2 start server.js --name "chroniclevaults-backend"
pm2 save
pm2 startup | tail -1 | bash

echo -e "${YELLOW}4. Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/chroniclevaults.com << 'EOF'
# Backend API
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
    }
}

# Frontend
server {
    listen 80;
    server_name chroniclevaults.com www.chroniclevaults.com;

    root /var/www/chroniclevaults/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/chroniclevaults.com /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo -e "${YELLOW}5. Setting up SSL...${NC}"
certbot --nginx -d chroniclevaults.com -d www.chroniclevaults.com -d api.chroniclevaults.com --non-interactive --agree-tos -m admin@chroniclevaults.com || echo "SSL setup failed - run manually: certbot --nginx"

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "🌐 Your site is live at:"
echo "   Frontend: https://chroniclevaults.com"
echo "   API: https://api.chroniclevaults.com"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status                    - Check backend status"
echo "   pm2 logs chroniclevaults-backend - View logs"
echo "   systemctl status nginx        - Check nginx"
echo "   systemctl status mongod       - Check MongoDB"
