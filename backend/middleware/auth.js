const jwt = require('jsonwebtoken');

// Как работает проверка токена:
// 1. Клиент отправляет заголовок: Authorization: Bearer <token>
// 2. Middleware извлекает токен из заголовка
// 3. jwt.verify() проверяет подпись токена секретом из .env
// 4. Если токен валиден — декодированный payload (user_id, role) кладётся в req.user
// 5. Если токен невалиден или отсутствует — возвращается 401

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  const token = authHeader.slice(7); // убираем "Bearer "

  try {
    // jwt.verify бросает исключение если токен просрочен или подпись неверна
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.user_id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
};
