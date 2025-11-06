# Email System Setup Guide

This guide will help you set up the email functionality for your E-Commerce application.

## Features

✅ **OTP-based Email Verification** for new user signups
✅ **Welcome Emails** after successful registration
✅ **Order Confirmation Emails**
✅ **Order Status Update Emails**
✅ **Password Reset Emails**
✅ **Contact Form Emails**

---

## 📧 Email Configuration

### Step 1: Configure Email Provider

We support any SMTP email provider. Below are instructions for Gmail (recommended for testing):

#### Using Gmail:

1. **Create a Gmail Account** (or use existing)

2. **Enable 2-Step Verification**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

3. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or Other)
   - Click "Generate"
   - Copy the 16-character password

4. **Update `.env` file**:
   ```env
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM_NAME=E-Commerce Store
   ADMIN_EMAIL=admin@example.com
   ```

#### Using Other Email Providers:

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Custom SMTP Server:**
```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-password
```

---

## 🔐 OTP-Based Registration Flow

### API Endpoints:

#### 1. Send OTP for Registration
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "expiresAt": "2025-11-04T14:00:00.000Z"
}
```

#### 2. Verify OTP and Register
```http
POST /api/auth/verify-otp-register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securepassword",
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "user@example.com",
    "token": "jwt-token...",
    "isEmailVerified": true
  }
}
```

#### 3. Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "purpose": "signup"
}
```

---

## 📨 Email Templates

All email templates are located in `/backend/utils/emailTemplates.js`:

1. **OTP Email** - Sends 6-digit OTP with 10-minute expiry
2. **Welcome Email** - Sent after successful registration
3. **Order Confirmation** - Sent when order is placed
4. **Order Status Update** - Sent when order status changes
5. **Password Reset** - Sent for password reset requests
6. **Contact Form** - Sent to admin when contact form is submitted

---

## 🧪 Testing

### Test OTP Flow Locally:

1. **Start Backend Server:**
   ```bash
   cd backend
   npm start
   ```

2. **Test with Postman/Thunder Client:**

   **Send OTP:**
   ```
   POST http://localhost:5000/api/auth/send-otp
   Body: { "email": "test@example.com" }
   ```

   **Check Email** - You should receive OTP email

   **Verify OTP:**
   ```
   POST http://localhost:5000/api/auth/verify-otp-register
   Body: {
     "name": "Test User",
     "email": "test@example.com",
     "password": "test123",
     "otp": "123456"
   }
   ```

   **Check Email** - You should receive Welcome email

---

## ⚙️ OTP Configuration

OTP settings in `/backend/models/OTP.js`:

- **OTP Length:** 6 digits
- **Expiry Time:** 10 minutes
- **Max Attempts:** 3 attempts before OTP is invalidated
- **Auto-Delete:** Expired OTPs are automatically removed from database

---

## 📬 Sending Emails in Your Code

### Order Confirmation Example:

```javascript
import { sendOrderConfirmationEmail } from '../services/emailService.js';

// After order is created
await sendOrderConfirmationEmail(userEmail, {
  orderId: order._id,
  items: order.items,
  total: order.totalAmount
});
```

### Order Status Update Example:

```javascript
import { sendOrderStatusEmail } from '../services/emailService.js';

// When order status changes
await sendOrderStatusEmail(userEmail, {
  orderId: order._id,
  trackingNumber: order.trackingNumber
}, 'Shipped');
```

### Contact Form Example:

```javascript
import { sendContactFormEmail } from '../services/emailService.js';

await sendContactFormEmail({
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  message: "I have a question..."
});
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use App Passwords** instead of actual email passwords
3. **Enable 2FA** on your email account
4. **Rate Limit** OTP requests to prevent abuse
5. **Log email errors** but don't expose details to users

---

## 🐛 Troubleshooting

### "Failed to send email" error:

1. **Check EMAIL_USER and EMAIL_PASSWORD** in `.env`
2. **Verify App Password** is correct (for Gmail)
3. **Check firewall** isn't blocking port 587
4. **Enable "Less secure app access"** (for some providers)

### OTP not received:

1. **Check spam folder**
2. **Verify email service is configured**
3. **Check backend logs** for errors
4. **Test with a different email**

### "OTP expired" error:

- OTP expires in 10 minutes
- Request a new OTP using `/resend-otp` endpoint

---

## 📝 Environment Variables Reference

```env
# Required
EMAIL_HOST=smtp.gmail.com          # SMTP server host
EMAIL_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
EMAIL_USER=your-email@gmail.com    # Your email address
EMAIL_PASSWORD=app-password        # App password or email password

# Optional
EMAIL_FROM_NAME=E-Commerce Store   # Name shown in "From" field
ADMIN_EMAIL=admin@example.com      # Admin email for contact forms
```

---

## 🚀 Production Deployment

For production, consider using:

- **SendGrid** - 100 free emails/day
- **AWS SES** - $0.10 per 1,000 emails
- **Mailgun** - 5,000 free emails/month
- **Postmark** - 100 free emails/month

Update EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD accordingly.

---

## 📞 Support

For issues or questions, please open an issue in the repository.
