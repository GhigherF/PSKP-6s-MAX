// Тестовая отправка email из Docker
const nodemailer = require('nodemailer');

console.log('========================================');
console.log('Тест отправки email из Docker (порт 465)');
console.log('========================================');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER || 'microbloges@gmail.com',
    pass: process.env.GMAIL_PASSWORD || 'wyiwhbevvyabxrxp'
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 60000,
  socketTimeout: 60000
});

const testEmail = process.argv[2] || 'ghighersworld@gmail.com';

console.log(`\nОтправка тестового письма на: ${testEmail}\n`);

transporter.sendMail({
  from: '"Micro Blog Test" <microbloges@gmail.com>',
  to: testEmail,
  subject: 'Тест отправки из Docker',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>✅ Email работает!</h2>
      <p>Это тестовое письмо отправлено из Docker контейнера.</p>
      <p>Время: ${new Date().toLocaleString()}</p>
    </div>
  `
})
.then(info => {
  console.log('\n========================================');
  console.log('✅ УСПЕХ! Письмо отправлено!');
  console.log('Message ID:', info.messageId);
  console.log('Response:', info.response);
  console.log('========================================');
  process.exit(0);
})
.catch(err => {
  console.error('\n========================================');
  console.error('❌ ОШИБКА отправки:');
  console.error('Сообщение:', err.message);
  console.error('Код:', err.code);
  console.error('========================================');
  process.exit(1);
});
