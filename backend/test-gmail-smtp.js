// Тестирование Gmail SMTP подключения из Docker
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('=== Тестирование Gmail SMTP ===\n');
console.log('Gmail User:', process.env.GMAIL_USER);
console.log('Gmail Password:', process.env.GMAIL_PASSWORD ? 'Установлен' : 'НЕ УСТАНОВЛЕН');
console.log('');

if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
  console.error('❌ Ошибка: Gmail credentials не найдены в .env файле');
  process.exit(1);
}

// Создаем транспортер с максимальной диагностикой
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  connectionTimeout: 30000,
  socketTimeout: 30000,
  debug: true,
  logger: true
});

console.log('Попытка подключения к smtp.gmail.com:587...\n');

// Проверяем подключение
transporter.verify((error, success) => {
  if (error) {
    console.error('\n❌ Ошибка подключения к SMTP серверу:');
    console.error('Error:', error);
    console.error('\nВозможные причины:');
    console.error('1. Неправильный email или пароль приложения');
    console.error('2. Двухфакторная аутентификация не включена');
    console.error('3. Пароль приложения не создан или устарел');
    console.error('4. Сетевые проблемы или блокировка провайдером');
    console.error('5. Gmail заблокировал доступ из этой сети');
    process.exit(1);
  }
  
  console.log('\n✅ SMTP сервер доступен!');
  console.log('Готов к отправке email.\n');
  
  // Пробуем отправить тестовый email
  const testEmail = process.env.GMAIL_USER;
  
  console.log(`Отправка тестового email на ${testEmail}...\n`);
  
  transporter.sendMail({
    from: `"Test" <${process.env.GMAIL_USER}>`,
    to: testEmail,
    subject: 'Test Email from Micro Blog',
    text: 'This is a test email to verify Gmail SMTP configuration.',
    html: '<h1>Test Email</h1><p>This is a test email to verify Gmail SMTP configuration.</p>'
  }, (err, info) => {
    if (err) {
      console.error('\n❌ Ошибка отправки email:');
      console.error(err);
      process.exit(1);
    }
    
    console.log('\n✅ Email успешно отправлен!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\nПроверьте ваш почтовый ящик:', testEmail);
    process.exit(0);
  });
});
