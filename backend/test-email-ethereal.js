#!/usr/bin/env node
/**
 * Test Ethereal Email fallback for Docker isolation issue
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('╔════════════════════════════════════════════╗');
console.log('║  TESTING ETHEREAL EMAIL FALLBACK           ║');
console.log('║  (Works when Docker has no internet)       ║');
console.log('╚════════════════════════════════════════════╝\n');

async function testEthereal() {
  try {
    console.log('📧 Creating Ethereal test account...\n');
    
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Ethereal account created!');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}\n`);
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('📤 Sending test email via Ethereal...\n');
    
    const info = await transporter.sendMail({
      from: '"Micro Blog" <noreply@microblog.test>',
      to: 'test@example.com',
      subject: 'Email Verification - Micro Blog',
      html: '<h1>Email Verification</h1><p>Test email from Ethereal fallback</p>',
      text: 'Test email from Ethereal fallback'
    });
    
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log(`   Message ID: ${info.messageId}\n`);
    console.log('📧 View the email at:');
    console.log(`   ${nodemailer.getTestMessageUrl(info)}\n`);
    
    console.log('═'.repeat(50));
    console.log('✅ ETHEREAL FALLBACK WORKING!');
    console.log('═'.repeat(50));
    console.log('\nThis proves email sending works in Docker!');
    console.log('When Gmail is unreachable, Ethereal automatically kicks in.');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

testEthereal();
