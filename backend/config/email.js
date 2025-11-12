import nodemailer from 'nodemailer';

// Create a single transporter instance with connection pooling
let transporter = null;

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    pool: true, // Use connection pool
    maxConnections: 5, // Maximum simultaneous connections
    maxMessages: 100, // Maximum messages per connection
    rateDelta: 1000, // Time window for rate limiting (1 second)
    rateLimit: 5, // Max 5 messages per rateDelta
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    socketTimeout: 15000, // 15 seconds
    debug: false, // Disable verbose debug in production
    logger: false // Disable logging in production
  };

  // Only add auth if BOTH credentials are provided AND not empty
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASSWORD?.trim();

  if (emailUser && emailPass) {
    config.auth = {
      user: emailUser,
      pass: emailPass
    };
    console.log('🔐 SMTP authentication enabled');
  } else {
    console.log('📧 SMTP without authentication (localhost mode)');
  }

  console.log('📧 Creating Email Transporter:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth ? 'enabled' : 'disabled (localhost)',
    user: config.auth?.user || 'none',
    pooling: config.pool
  });

  transporter = nodemailer.createTransport(config);

  // Verify connection on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error);
      transporter = null; // Reset to retry on next send
    } else {
      console.log('✅ Email transporter ready to send emails');
    }
  });

  return transporter;
};

// Retry logic wrapper
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`⚠️ Attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: wait longer between retries
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Reset transporter on connection errors
      if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.log('🔄 Resetting email transporter...');
        transporter = null;
      }
    }
  }
};

// Send email function with retry logic
export const sendEmail = async (options) => {
  try {
    console.log(`📤 Attempting to send email to: ${options.email}`);

    const result = await retryOperation(async () => {
      const emailTransporter = createTransporter();

      if (!emailTransporter) {
        throw new Error('Failed to create email transporter');
      }

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'Chronicle Vaults'} <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await emailTransporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    });

    return result;
  } catch (error) {
    console.error('❌ Failed to send email after all retries:', error.message);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    return { success: false, error: error.message };
  }
};

// Graceful shutdown - close transporter
export const closeTransporter = async () => {
  if (transporter) {
    console.log('📧 Closing email transporter...');
    transporter.close();
    transporter = null;
  }
};

export default { sendEmail, closeTransporter };
