import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testSMTP = async () => {
  console.log('\n=== SMTP Configuration Test ===\n');

  const configs = [
    {
      name: 'Port 587 (STARTTLS)',
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    },
    {
      name: 'Port 465 (SSL)',
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    },
    {
      name: 'Port 25 (Plain)',
      host: process.env.EMAIL_HOST,
      port: 25,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  ];

  console.log('Testing with credentials:');
  console.log('Host:', process.env.EMAIL_HOST);
  console.log('User:', process.env.EMAIL_USER);
  console.log('Password:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
  console.log('\n');

  for (const config of configs) {
    console.log(`\n--- Testing ${config.name} ---`);
    console.log(`Host: ${config.host}:${config.port}`);
    console.log(`Secure: ${config.secure}`);

    try {
      const transporter = nodemailer.createTransport(config);

      // Verify connection
      console.log('Attempting connection...');
      await transporter.verify();

      console.log('✅ SUCCESS - Connection verified!');
      console.log('This configuration works. Trying to send test email...\n');

      // Try sending test email
      const info = await transporter.sendMail({
        from: `"Test" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: 'SMTP Test Email',
        text: 'This is a test email from your Node.js application.',
        html: '<p>This is a <b>test email</b> from your Node.js application.</p>'
      });

      console.log('✅✅ EMAIL SENT SUCCESSFULLY!');
      console.log('Message ID:', info.messageId);
      console.log('\nUse this configuration in your .env file:');
      console.log(`EMAIL_PORT=${config.port}`);
      console.log(`EMAIL_SECURE=${config.secure}`);

      break; // Stop if successful

    } catch (error) {
      console.log('❌ FAILED');
      console.log('Error Code:', error.code);
      console.log('Error Message:', error.message);

      if (error.response) {
        console.log('Server Response:', error.response);
      }

      if (error.code === 'EAUTH') {
        console.log('\n⚠️  Authentication failed - Check your username and password');
      } else if (error.code === 'ESOCKET') {
        console.log('\n⚠️  Connection failed - Check host and port');
      } else if (error.code === 'ECONNECTION') {
        console.log('\n⚠️  Cannot connect to server - Check if SMTP is running');
      }
    }
  }

  console.log('\n\n=== Test Complete ===\n');
  process.exit(0);
};

testSMTP();
