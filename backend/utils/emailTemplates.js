// OTP Email Template
export const otpEmailTemplate = (otp, purpose) => {
  const purposeText = {
    'signup': 'Email Verification',
    'password-reset': 'Password Reset',
    'email-verification': 'Email Verification'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Verification Code</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Your OTP for ${purposeText[purpose] || 'Verification'}</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                    Please use the following One-Time Password (OTP) to complete your verification:
                  </p>

                  <!-- OTP Box -->
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                    <div style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${otp}
                    </div>
                  </div>

                  <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0;">
                    ⏰ This OTP will expire in <strong>10 minutes</strong>.
                  </p>
                  <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">
                    🔒 For security reasons, please do not share this OTP with anyone.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                    If you didn't request this OTP, please ignore this email or contact our support team.
                  </p>
                  <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 10px 0 0 0; text-align: center;">
                    © ${new Date().getFullYear()} E-Commerce Store. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Welcome Email Template
export const welcomeEmailTemplate = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉 Welcome!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hello ${name}!</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Welcome to our E-Commerce Store! We're excited to have you as part of our community.
                  </p>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Your account has been successfully created and verified. You can now:
                  </p>

                  <ul style="color: #666666; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                    <li>Browse our exclusive collection</li>
                    <li>Add items to your wishlist</li>
                    <li>Enjoy secure checkout</li>
                    <li>Track your orders in real-time</li>
                  </ul>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">
                      Start Shopping
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                    Need help? Contact our support team anytime.
                  </p>
                  <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 10px 0 0 0; text-align: center;">
                    © ${new Date().getFullYear()} E-Commerce Store. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Order Confirmation Email Template
export const orderConfirmationTemplate = (order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e0e0e0;">
        <strong>${item.name}</strong><br>
        <span style="color: #666; font-size: 14px;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #e0e0e0; text-align: right;">
        ₹${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Order Confirmed!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 24px;">Thank you for your order!</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                    Order #<strong>${order.orderId}</strong>
                  </p>

                  <!-- Order Items -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0; border: 1px solid #e0e0e0; border-radius: 5px; overflow: hidden;">
                    ${itemsHtml}
                    <tr style="background-color: #f8f8f8;">
                      <td style="padding: 15px; font-weight: bold;">Total</td>
                      <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px;">
                        ₹${order.total.toFixed(2)}
                      </td>
                    </tr>
                  </table>

                  <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">
                    📦 We'll send you a shipping confirmation email when your order ships.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                    © ${new Date().getFullYear()} E-Commerce Store. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Order Status Update Email Template
export const orderStatusUpdateTemplate = (order, status) => {
  const statusEmoji = {
    'Processing': '⏳',
    'Shipped': '🚚',
    'Delivered': '✅',
    'Cancelled': '❌'
  };

  const statusColor = {
    'Processing': '#4facfe',
    'Shipped': '#f093fb',
    'Delivered': '#4ade80',
    'Cancelled': '#ef4444'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: ${statusColor[status] || '#4facfe'}; padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${statusEmoji[status] || '📦'} Order ${status}</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 24px;">Order Status Update</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                    Order #<strong>${order.orderId}</strong>
                  </p>

                  <div style="background-color: #f8f8f8; border-left: 4px solid ${statusColor[status] || '#4facfe'}; padding: 20px; margin: 0 0 20px 0; border-radius: 4px;">
                    <p style="color: #333333; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                      Status: ${status}
                    </p>
                    <p style="color: #666666; font-size: 14px; margin: 0;">
                      ${status === 'Shipped' ? 'Your order is on its way!' : status === 'Delivered' ? 'Your order has been delivered!' : status === 'Cancelled' ? 'Your order has been cancelled.' : 'Your order is being processed.'}
                    </p>
                  </div>

                  ${order.trackingNumber ? `
                    <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">
                      📍 Tracking Number: <strong>${order.trackingNumber}</strong>
                    </p>
                  ` : ''}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                    © ${new Date().getFullYear()} E-Commerce Store. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Password Reset Email Template
export const passwordResetTemplate = (resetUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔑 Password Reset</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                    You requested to reset your password. Click the button below to create a new password:
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">
                      Reset Password
                    </a>
                  </div>

                  <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
                    ⏰ This link will expire in <strong>1 hour</strong>.
                  </p>
                  <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 10px 0 0 0;">
                    If you didn't request this, please ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                    © ${new Date().getFullYear()} E-Commerce Store. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Contact Form Email Template
export const contactFormTemplate = (formData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #667eea; padding: 30px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📧 New Contact Form Submission</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <table width="100%" cellpadding="10" cellspacing="0">
                    <tr>
                      <td style="color: #666666; font-weight: bold; width: 120px;">Name:</td>
                      <td style="color: #333333;">${formData.name}</td>
                    </tr>
                    <tr>
                      <td style="color: #666666; font-weight: bold;">Email:</td>
                      <td style="color: #333333;">${formData.email}</td>
                    </tr>
                    ${formData.phone ? `
                    <tr>
                      <td style="color: #666666; font-weight: bold;">Phone:</td>
                      <td style="color: #333333;">${formData.phone}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="color: #666666; font-weight: bold; vertical-align: top;">Message:</td>
                      <td style="color: #333333; line-height: 1.6;">${formData.message}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                    Received at ${new Date().toLocaleString()}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Auction Registration Approval Email Template
export const auctionApprovalEmailTemplate = (name, auctionLimit) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Auction Registration Approved</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Georgia', serif; background-color: #f5f1ed; line-height: 1.6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f1ed; padding: 30px 20px;">
        <tr>
          <td align="center">
            <table width="650" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 3px solid #8B6F47;">
              <!-- Header with elegant design -->
              <tr>
                <td style="background: linear-gradient(135deg, #2c1810 0%, #5a3d2b 100%); padding: 50px 40px; text-align: center; border-bottom: 4px solid #d4af37;">
                  <h1 style="color: #d4af37; margin: 0 0 10px 0; font-size: 32px; font-family: 'Georgia', serif; letter-spacing: 2px; text-transform: uppercase;">
                    Chronicle Vaults
                  </h1>
                  <p style="color: #f5f1ed; margin: 0; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; font-weight: 300;">
                    Auction Access Approved
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 50px 40px; background-color: #fefdfb;">
                  <p style="color: #2c1810; font-size: 18px; margin: 0 0 25px 0; font-weight: 300;">
                    Dear ${name},
                  </p>

                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.8; margin: 0 0 25px 0;">
                    Welcome to <strong>Chronicle Vaults</strong>, where heritage, craftsmanship and rare collectibles come together.
                  </p>

                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                    Your registration and document verification have been successfully completed, and your auction account is now fully active. You are now eligible to bid on exclusive numismatic pieces curated from across India and beyond.
                  </p>

                  <!-- Auction Access Box -->
                  <div style="background: linear-gradient(135deg, #fef8e7 0%, #f9f3e3 100%); border-left: 5px solid #d4af37; padding: 30px; margin: 0 0 30px 0; border-radius: 0;">
                    <h3 style="color: #2c1810; margin: 0 0 20px 0; font-size: 22px; font-family: 'Georgia', serif;">
                      🔶 Your Auction Access
                    </h3>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #5a5a5a; font-size: 15px; padding: 8px 0;"><strong>Bidding Limit:</strong></td>
                        <td style="color: #2c1810; font-size: 18px; font-weight: bold; text-align: right; padding: 8px 0;">₹${Number(auctionLimit).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="color: #5a5a5a; font-size: 15px; padding: 8px 0;"><strong>Account Status:</strong></td>
                        <td style="color: #16a34a; font-size: 15px; font-weight: bold; text-align: right; padding: 8px 0;">Verified & Active</td>
                      </tr>
                    </table>
                    <p style="color: #5a5a5a; font-size: 14px; margin: 20px 0 0 0; font-style: italic;">
                      Every bid you place now brings you one step closer to owning a rare piece of history.
                    </p>
                  </div>

                  <!-- Journey Section -->
                  <div style="margin: 0 0 30px 0;">
                    <h3 style="color: #2c1810; margin: 0 0 20px 0; font-size: 20px; font-family: 'Georgia', serif;">
                      🔶 Begin Your Auction Journey
                    </h3>
                    <p style="color: #4a4a4a; font-size: 15px; margin: 0 0 15px 0;">
                      👉 <a href="${process.env.FRONTEND_URL || 'https://chroniclevaults.com'}/authentication" style="color: #d4af37; text-decoration: none; font-weight: bold;">Login to your account</a><br>
                      <span style="color: #999; font-size: 13px; margin-left: 20px;">${process.env.FRONTEND_URL || 'https://chroniclevaults.com'}/authentication</span>
                    </p>
                    <p style="color: #4a4a4a; font-size: 15px; margin: 0;">
                      👉 <a href="${process.env.FRONTEND_URL || 'https://chroniclevaults.com'}/auctions?type=upcoming" style="color: #d4af37; text-decoration: none; font-weight: bold;">Explore upcoming auctions</a><br>
                      <span style="color: #999; font-size: 13px; margin-left: 20px;">${process.env.FRONTEND_URL || 'https://chroniclevaults.com'}/auctions?type=upcoming</span>
                    </p>
                  </div>

                  <p style="color: #4a4a4a; font-size: 15px; line-height: 1.8; margin: 0 0 25px 0;">
                    At Chronicle Vaults, we strive to offer a transparent, secure, and world-class auction experience. We are excited to have you as a part of our collector community and look forward to your active participation in our upcoming auctions.
                  </p>

                  <p style="color: #4a4a4a; font-size: 15px; line-height: 1.8; margin: 0 0 10px 0;">
                    If you have any questions or need assistance at any stage, our team is here to help:<br>
                    📩 <a href="mailto:info@chroniclevaults.com" style="color: #d4af37; text-decoration: none;">info@chroniclevaults.com</a>
                  </p>

                  <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e5e5;">
                    <p style="color: #2c1810; font-size: 16px; margin: 0 0 10px 0;">
                      Warm regards,<br>
                      <strong>Chronicle Vaults Auction Team</strong>
                    </p>
                    <p style="color: #8B6F47; font-size: 14px; margin: 0;">
                      <a href="https://www.chroniclevaults.com" style="color: #8B6F47; text-decoration: none;">www.chroniclevaults.com</a>
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #2c1810; padding: 25px 40px; border-top: 4px solid #d4af37;">
                  <p style="color: #d4af37; font-size: 12px; line-height: 1.5; margin: 0; text-align: center; letter-spacing: 1px;">
                    CHRONICLE VAULTS - WHERE HISTORY MEETS HERITAGE
                  </p>
                  <p style="color: #8B6F47; font-size: 11px; line-height: 1.5; margin: 10px 0 0 0; text-align: center;">
                    © ${new Date().getFullYear()} Chronicle Vaults. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Auction Limit Upgrade Email Template
export const auctionLimitUpgradeEmailTemplate = (name, oldLimit, newLimit) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Auction Limit Upgraded</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Georgia', serif; background-color: #f5f1ed; line-height: 1.6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f1ed; padding: 30px 20px;">
        <tr>
          <td align="center">
            <table width="650" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 3px solid #8B6F47;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2c1810 0%, #5a3d2b 100%); padding: 50px 40px; text-align: center; border-bottom: 4px solid #d4af37;">
                  <h1 style="color: #d4af37; margin: 0 0 10px 0; font-size: 32px; font-family: 'Georgia', serif; letter-spacing: 2px; text-transform: uppercase;">
                    Chronicle Vaults
                  </h1>
                  <p style="color: #f5f1ed; margin: 0; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; font-weight: 300;">
                    Bidding Limit Upgraded
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 50px 40px; background-color: #fefdfb;">
                  <p style="color: #2c1810; font-size: 18px; margin: 0 0 25px 0; font-weight: 300;">
                    Dear ${name},
                  </p>

                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                    We are pleased to inform you that your auction bidding limit has been successfully upgraded!
                  </p>

                  <!-- Upgrade Details Box -->
                  <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%); border-left: 5px solid #16a34a; padding: 30px; margin: 0 0 30px 0; border-radius: 0;">
                    <h3 style="color: #2c1810; margin: 0 0 20px 0; font-size: 22px; font-family: 'Georgia', serif;">
                      🔶 Your Updated Auction Limit
                    </h3>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #5a5a5a; font-size: 15px; padding: 8px 0;"><strong>Previous Limit:</strong></td>
                        <td style="color: #666; font-size: 16px; text-decoration: line-through; text-align: right; padding: 8px 0;">₹${Number(oldLimit).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="color: #5a5a5a; font-size: 15px; padding: 8px 0;"><strong>New Limit:</strong></td>
                        <td style="color: #16a34a; font-size: 22px; font-weight: bold; text-align: right; padding: 8px 0;">₹${Number(newLimit).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="color: #5a5a5a; font-size: 15px; padding: 8px 0;"><strong>Increase:</strong></td>
                        <td style="color: #2c1810; font-size: 18px; font-weight: bold; text-align: right; padding: 8px 0;">+₹${Number(newLimit - oldLimit).toLocaleString()}</td>
                      </tr>
                    </table>
                    <p style="color: #5a5a5a; font-size: 14px; margin: 20px 0 0 0; font-style: italic;">
                      Your increased limit opens doors to a broader collection of premium numismatic pieces.
                    </p>
                  </div>

                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.8; margin: 0 0 25px 0;">
                    This upgrade reflects your growing trust and engagement with Chronicle Vaults. You can now participate in higher-value auctions and expand your collection with even more prestigious items.
                  </p>

                  <!-- Call to Action -->
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="${process.env.FRONTEND_URL || 'https://chroniclevaults.com'}/auctions"
                       style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%); color: #2c1810; text-decoration: none; padding: 16px 40px; border-radius: 0; font-size: 16px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                      Explore Auctions
                    </a>
                  </div>

                  <p style="color: #4a4a4a; font-size: 15px; line-height: 1.8; margin: 0 0 10px 0;">
                    If you have any questions regarding your upgraded limit, please feel free to contact us:<br>
                    📩 <a href="mailto:info@chroniclevaults.com" style="color: #d4af37; text-decoration: none;">info@chroniclevaults.com</a>
                  </p>

                  <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e5e5;">
                    <p style="color: #2c1810; font-size: 16px; margin: 0 0 10px 0;">
                      Thank you for being a valued member of our community.<br>
                      <strong>Chronicle Vaults Auction Team</strong>
                    </p>
                    <p style="color: #8B6F47; font-size: 14px; margin: 0;">
                      <a href="https://www.chroniclevaults.com" style="color: #8B6F47; text-decoration: none;">www.chroniclevaults.com</a>
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #2c1810; padding: 25px 40px; border-top: 4px solid #d4af37;">
                  <p style="color: #d4af37; font-size: 12px; line-height: 1.5; margin: 0; text-align: center; letter-spacing: 1px;">
                    CHRONICLE VAULTS - WHERE HISTORY MEETS HERITAGE
                  </p>
                  <p style="color: #8B6F47; font-size: 11px; line-height: 1.5; margin: 10px 0 0 0; text-align: center;">
                    © ${new Date().getFullYear()} Chronicle Vaults. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
