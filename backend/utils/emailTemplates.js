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
