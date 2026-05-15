// Тестирование Gmail SMTP через порт 465 (SSL) из Docker
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('=== Тестирование Gmail SMTP (SSL порт 465) ===\n');
console.log('Gmail User:', process.env.GMAIL_USER);
console.log('Gmail Password:', process.env.GMAIL_PASSWORD ? 'Установлен' : 'НЕ УСТАНОВЛЕН');
console.log('');

if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
  console.error('❌ Ошибка: Gmail credentials не найдены в .env файле');
  process.exit(1);
}

// Создаем транспортер с SSL на порту 465
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  connectionTimeout: 60000, // 60 seconds
  socketTimeout: 60000,
  debug: true,
  logger: true
});

console.log('Попытка подключения к smtp.gmail.com:465 (SSL)...\n');

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
    console.error('5. Docker контейнер не имеет доступа к интернету');
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
    subject: 'Test Email from Micro Blog (SSL)',
    text: 'This is a test email to verify Gmail SMTP configuration via SSL.',
    html: '<h1>Test Email (SSL)</h1><p>This is a test email to verify Gmail SMTP configuration via SSL port 465.</p>'
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
