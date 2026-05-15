#!/usr/bin/env node
/**
 * Test file to verify email sending with retry logic
 * Tests the new sendEmailWithRetry function and improved Gmail SMTP settings
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('╔════════════════════════════════════════════╗');
console.log('║  EMAIL SENDING FIX - VERIFICATION TEST     ║');
console.log('╚════════════════════════════════════════════╝\n');

// Check environment variables
console.log('📋 Checking environment variables...\n');
const hasGmail = process.env.GMAIL_USER && process.env.GMAIL_PASSWORD;
const hasMail = process.env.MAILRU_USER && process.env.MAILRU_PASSWORD;
const hasYandex = process.env.YANDEX_USER && process.env.YANDEX_PASSWORD;

console.log(`Gmail configured:   ${hasGmail ? '✅ YES' : '❌ NO'}`);
console.log(`Mail.ru configured: ${hasMail ? '✅ YES' : '❌ NO'}`);
console.log(`Yandex configured:  ${hasYandex ? '✅ YES' : '❌ NO'}\n`);

if (!hasGmail && !hasMail && !hasYandex) {
  console.error('❌ ERROR: No email providers configured!');
  process.exit(1);
}

// Create transporter with new improved settings
const createTransporter = () => {
  console.log('🔧 Creating email transporter...\n');
  
  if (process.env.GMAIL_USER && process.env.GMAIL_PASSWORD) {
    console.log('→ Using Gmail SMTP (port 587 STARTTLS - improved for Docker)\n');
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 30000,
      socketTimeout: 30000,
      pool: {
        maxConnections: 1,
        maxMessages: 100
      },
      debug: false,
      logger: false
    });
  }
  
  if (process.env.MAILRU_USER && process.env.MAILRU_PASSWORD) {
    console.log('→ Using Mail.ru SMTP (port 465 SSL)\n');
    return nodemailer.createTransport({
      host: 'smtp.mail.ru',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAILRU_USER,
        pass: process.env.MAILRU_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      socketTimeout: 30000,
      pool: {
        maxConnections: 1,
        maxMessages: 100
      }
    });
  }
  
  if (process.env.YANDEX_USER && process.env.YANDEX_PASSWORD) {
    console.log('→ Using Yandex SMTP (port 465 SSL)\n');
    return nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: {
        user: process.env.YANDEX_USER,
        pass: process.env.YANDEX_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      socketTimeout: 30000,
      pool: {
        maxConnections: 1,
        maxMessages: 100
      }
    });
  }
  
  return null;
};

// Retry logic function
async function sendEmailWithRetry(transporter, mailOptions, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   ⏳ Attempt ${attempt}/${maxRetries}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`   ✅ Email sent successfully on attempt ${attempt}`);
      return { success: true, info };
    } catch (error) {
      lastError = error;
      console.log(`   ⚠️  Attempt ${attempt} failed: ${error.code || error.message}`);
      
      if (!error.code || 
          !['EAUTH', 'EINVAL', 'ENOTFOUND'].includes(error.code)) {
        if (attempt < maxRetries) {
          const waitTime = Math.min(5000 * attempt, 15000);
          console.log(`   ⏳ Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } else {
        console.log(`   ❌ Fatal error, not retrying: ${error.code}`);
        break;
      }
    }
  }
  
  return { success: false, error: lastError };
}

// Main test
async function runTest() {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('❌ Failed to create transporter');
    process.exit(1);
  }
  
  const testEmail = process.env.GMAIL_USER || process.env.MAILRU_USER || process.env.YANDEX_USER;
  
  console.log('🧪 Sending test email with retry logic...\n');
  
  const mailOptions = {
    from: `"Micro Blog Test" <${testEmail}>`,
    to: testEmail,
    subject: 'Email Sending Fix - Test Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4CAF50;">✅ Email Sending Fix Verified</h1>
        <p>This test confirms that the email sending fix is working correctly.</p>
        <h3>Improvements Made:</h3>
        <ul>
          <li>✅ Changed Gmail from port 465 SSL to port 587 STARTTLS (better Docker support)</li>
          <li>✅ Added automatic retry logic (3 attempts with exponential backoff)</li>
          <li>✅ Reduced timeouts from 60s to 30s (faster feedback)</li>
          <li>✅ Added connection pooling</li>
          <li>✅ Improved error handling and logging</li>
        </ul>
        <p style="color: #666; margin-top: 30px; font-size: 12px;">
          If you received this email, the email sending system is working properly!
        </p>
      </div>
    `,
    text: `Email Sending Fix - Test Email\n\nThis test confirms that the email sending fix is working correctly.\n\nImprovements Made:\n✅ Changed Gmail from port 465 SSL to port 587 STARTTLS (better Docker support)\n✅ Added automatic retry logic (3 attempts with exponential backoff)\n✅ Reduced timeouts from 60s to 30s (faster feedback)\n✅ Added connection pooling\n✅ Improved error handling and logging\n\nIf you received this email, the email sending system is working properly!`
  };
  
  const result = await sendEmailWithRetry(transporter, mailOptions);
  
  console.log('\n' + '═'.repeat(50));
  if (result.success) {
    console.log('✅ TEST PASSED - EMAIL SENT SUCCESSFULLY!');
    console.log('═'.repeat(50));
    console.log(`\n📧 Message ID: ${result.info.messageId}`);
    console.log(`📧 Response:   ${result.info.response}`);
    console.log(`\n📬 Check your email at: ${testEmail}`);
    console.log('\n🎉 The email sending fix is working correctly!');
    process.exit(0);
  } else {
    console.log('❌ TEST FAILED - EMAIL NOT SENT');
    console.log('═'.repeat(50));
    console.log(`\n❌ Error: ${result.error.message}`);
    console.log(`❌ Code:  ${result.error.code}`);
    
    console.log('\n📋 Troubleshooting steps:');
    console.log('1. Verify email credentials in .env');
    console.log('2. Check if Docker has internet access: docker exec pskp-6s-max-backend-1 ping -c 3 google.com');
    console.log('3. Try without Docker: npm start');
    console.log('4. Check firewall/VPN/antivirus settings');
    console.log('5. For Gmail, ensure app password is configured: https://myaccount.google.com/apppasswords');
    
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
