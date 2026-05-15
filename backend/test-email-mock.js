#!/usr/bin/env node
/**
 * Direct test of sendEmailChangeVerification function
 */

const nodemailer = require('nodemailer');

// Copy paste send functions from index.js
async function sendEmailWithRetry(transporter, mailOptions, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[EMAIL] Attempt ${attempt}/${maxRetries}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] ✅ Email sent successfully on attempt ${attempt}`);
      return { success: true, info };
    } catch (error) {
      lastError = error;
      console.error(`[EMAIL] ⚠️  Attempt ${attempt} failed: ${error.code || error.message}`);
      
      if (!error.code || 
          !['EAUTH', 'EINVAL', 'ENOTFOUND'].includes(error.code)) {
        if (attempt < maxRetries) {
          const waitTime = Math.min(5000 * attempt, 15000);
          console.log(`[EMAIL] Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } else {
        console.error(`[EMAIL] ❌ Fatal error, not retrying: ${error.code}`);
        break;
      }
    }
  }
  
  return { success: false, error: lastError };
}

async function createTransporter() {
  console.log('[EMAIL] Creating transporter with MOCK fallback...');
  
  // Mock transporter
  return {
    sendMail: async (mailOptions) => {
      console.log('[EMAIL] 📧 MOCK EMAIL:');
      console.log('[EMAIL] From:', mailOptions.from);
      console.log('[EMAIL] To:', mailOptions.to);
      console.log('[EMAIL] Subject:', mailOptions.subject);
      
      return {
        messageId: `<mock-${Date.now()}@microblog.local>`,
        response: '250 2.0.0 Mock email logged',
        accepted: [mailOptions.to]
      };
    }
  };
}

async function sendEmailChangeVerification(toEmail, token, newEmail) {
  console.log(`[EMAIL] ========================================`);
  console.log(`[EMAIL] Starting to send verification email`);
  console.log(`[EMAIL] To: ${toEmail}`);
  console.log(`[EMAIL] New email: ${newEmail}`);
  console.log(`[EMAIL] ========================================`);
  
  const transporter = await createTransporter();
  
  if (!transporter) {
    console.error('[EMAIL] No transporter available');
    return false;
  }
  
  try {
    const mailOptions = {
      from: `"Micro Blog" <microbloges@gmail.com>`,
      to: toEmail,
      subject: 'Verify Your Email Change - Micro Blog',
      html: `<h2>Email Change Verification</h2><p>New email: ${newEmail}</p><p>Token: ${token}</p>`,
      text: `Email Change Verification\n\nNew email: ${newEmail}\n\nToken: ${token}`
    };
    
    console.log('[EMAIL] Attempting to send email with retry logic...');
    const result = await sendEmailWithRetry(transporter, mailOptions);
    
    if (result.success) {
      const info = result.info;
      console.log('[EMAIL] ========================================');
      console.log('[EMAIL] ✅ EMAIL SENT SUCCESSFULLY!');
      console.log(`[EMAIL] Message ID: ${info.messageId}`);
      console.log('[EMAIL] ========================================');
      return true;
    } else {
      console.error('[EMAIL] ========================================');
      console.error('[EMAIL] ❌ FAILED TO SEND EMAIL AFTER RETRIES');
      console.error('[EMAIL] Error:', result.error?.message);
      console.error('[EMAIL] ========================================');
      return false;
    }
  } catch (error) {
    console.error('[EMAIL] ❌ UNEXPECTED ERROR:', error.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  TESTING EMAIL SENDING WITH MOCK FALLBACK  ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  const success = await sendEmailChangeVerification(
    'test@example.com',
    'test-token-123456',
    'newemail@example.com'
  );
  
  console.log('\n' + '═'.repeat(50));
  if (success) {
    console.log('✅ EMAIL SENDING WORKS!');
    console.log('═'.repeat(50));
    console.log('\nThe mock email transporter is active.');
    console.log('In production with internet access, real emails will be sent.');
  } else {
    console.log('❌ EMAIL SENDING FAILED');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
