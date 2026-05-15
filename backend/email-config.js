// Альтернативная конфигурация для email
// Используйте этот файл, если Gmail не работает

const nodemailer = require('nodemailer');

// Вариант 1: Gmail (если работает)
const createGmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    return null;
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });
};

// Вариант 2: Ethereal Email (бесплатный тестовый email)
// Автоматически создает тестовый аккаунт и показывает URL для просмотра писем
const createEtherealTransporter = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('[EMAIL] Using Ethereal Email for testing');
    console.log(`[EMAIL] Test account: ${testAccount.user}`);
    console.log(`[EMAIL] Test password: ${testAccount.pass}`);
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (error) {
    console.error('[EMAIL] Failed to create Ethereal account:', error);
    return null;
  }
};

// Вариант 3: Обычный SMTP (например, Mail.ru, Yandex, Outlook)
const createSMTPTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

module.exports = {
  createGmailTransporter,
  createEtherealTransporter,
  createSMTPTransporter
};