import { sendEmail } from '../config/email.js';
import OTP from '../models/OTP.js';
import {
  otpEmailTemplate,
  welcomeEmailTemplate,
  orderConfirmationTemplate,
  orderStatusUpdateTemplate,
  passwordResetTemplate,
  contactFormTemplate
} from '../utils/emailTemplates.js';

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
export const sendOTPEmail = async (email, purpose = 'signup') => {
  try {
    console.log(`📧 Starting OTP email process for: ${email}, purpose: ${purpose}`);

    // Delete any existing OTPs for this email and purpose
    const deleted = await OTP.deleteMany({ email, purpose });
    if (deleted.deletedCount > 0) {
      console.log(`🗑️ Deleted ${deleted.deletedCount} existing OTP(s) for ${email}`);
    }

    // Generate new OTP
    const otp = generateOTP();
    console.log(`🔢 Generated OTP for ${email}`);

    // Save OTP to database
    const otpDoc = await OTP.create({
      email,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    console.log(`💾 OTP saved to database for ${email}, expires at ${otpDoc.expiresAt}`);

    // Send email with retry logic already built into sendEmail function
    console.log(`📤 Sending OTP email to ${email}...`);
    const result = await sendEmail({
      email,
      subject: `Your OTP for ${purpose === 'signup' ? 'Sign Up' : 'Password Reset'} - ${otp}`,
      html: otpEmailTemplate(otp, purpose)
    });

    if (result.success) {
      console.log(`✅ OTP email sent successfully to ${email}`);
      return {
        success: true,
        message: 'OTP sent successfully to your email. Please check your inbox and spam folder.',
        expiresAt: otpDoc.expiresAt
      };
    } else {
      // If email failed, delete the OTP
      console.error(`❌ Email sending failed for ${email}, deleting OTP from database`);
      await OTP.findByIdAndDelete(otpDoc._id);
      throw new Error(`Failed to send OTP email: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Send OTP Error:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

// Verify OTP
export const verifyOTP = async (email, otp, purpose = 'signup') => {
  try {
    const otpDoc = await OTP.findOne({
      email,
      purpose,
      verified: false
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return {
        success: false,
        message: 'OTP not found or already used'
      };
    }

    // Check if OTP is expired
    if (new Date() > otpDoc.expiresAt) {
      await OTP.findByIdAndDelete(otpDoc._id);
      return {
        success: false,
        message: 'OTP has expired'
      };
    }

    // Check attempts (max 3 attempts)
    if (otpDoc.attempts >= 3) {
      await OTP.findByIdAndDelete(otpDoc._id);
      return {
        success: false,
        message: 'Maximum verification attempts exceeded'
      };
    }

    // Verify OTP
    if (otpDoc.otp !== otp) {
      // Increment attempts
      otpDoc.attempts += 1;
      await otpDoc.save();

      return {
        success: false,
        message: 'Invalid OTP',
        attemptsLeft: 3 - otpDoc.attempts
      };
    }

    // Mark as verified
    otpDoc.verified = true;
    await otpDoc.save();

    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    console.error('Verify OTP Error:', error);
    throw error;
  }
};

// Send Welcome Email
export const sendWelcomeEmail = async (email, name) => {
  try {
    const result = await sendEmail({
      email,
      subject: 'Welcome to E-Commerce Store! 🎉',
      html: welcomeEmailTemplate(name)
    });

    return result;
  } catch (error) {
    console.error('Send Welcome Email Error:', error);
    throw error;
  }
};

// Send Order Confirmation Email
export const sendOrderConfirmationEmail = async (email, order) => {
  try {
    const result = await sendEmail({
      email,
      subject: `Order Confirmation - Order #${order.orderId}`,
      html: orderConfirmationTemplate(order)
    });

    return result;
  } catch (error) {
    console.error('Send Order Confirmation Error:', error);
    throw error;
  }
};

// Send Order Status Update Email
export const sendOrderStatusEmail = async (email, order, status) => {
  try {
    const result = await sendEmail({
      email,
      subject: `Order ${status} - Order #${order.orderId}`,
      html: orderStatusUpdateTemplate(order, status)
    });

    return result;
  } catch (error) {
    console.error('Send Order Status Email Error:', error);
    throw error;
  }
};

// Send Password Reset Email
export const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const result = await sendEmail({
      email,
      subject: 'Password Reset Request',
      html: passwordResetTemplate(resetUrl)
    });

    return result;
  } catch (error) {
    console.error('Send Password Reset Email Error:', error);
    throw error;
  }
};

// Send Contact Form Email
export const sendContactFormEmail = async (formData) => {
  try {
    // Send to admin
    const result = await sendEmail({
      email: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `New Contact Form Submission from ${formData.name}`,
      html: contactFormTemplate(formData)
    });

    // Send auto-reply to user
    if (result.success) {
      await sendEmail({
        email: formData.email,
        subject: 'We received your message!',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Thank you for contacting us!</h2>
            <p>Hi ${formData.name},</p>
            <p>We've received your message and will get back to you as soon as possible.</p>
            <p>Best regards,<br>E-Commerce Support Team</p>
          </body>
          </html>
        `
      });
    }

    return result;
  } catch (error) {
    console.error('Send Contact Form Email Error:', error);
    throw error;
  }
};

export default {
  sendOTPEmail,
  verifyOTP,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendPasswordResetEmail,
  sendContactFormEmail
};
