#!/bin/bash
# Chronicle Vaults - Complete Server Setup Script
# Copy-paste this entire script on your server

set -e  # Exit on error

echo "========================================="
echo "🚀 Chronicle Vaults Server Setup"
echo "========================================="

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node installation
node --version
npm --version

# Install MongoDB
echo "📦 Installing MongoDB..."
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod
systemctl status mongod

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Setup firewall
echo "🔒 Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# Create app directory
echo "📁 Creating application directories..."
mkdir -p /var/www/chroniclevaults/backend
mkdir -p /var/www/chroniclevaults/frontend

echo ""
echo "========================================="
echo "✅ Server Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Upload your files to /var/www/chroniclevaults/"
echo "2. Run the deployment script"
echo ""
