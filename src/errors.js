// Помилка з відомим кодом стану; errorHandler перетворює її на JSON-відповідь
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Єдиний формат помилки для всіх операцій: { "error": "<КОД>", "message": "<текст>" }
// Express 5 сам передає сюди і помилки async-обробників (rejected promise)
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code, message: err.message });
    return;
  }
  // Помилки express.json(): некоректний JSON, завелике тіло тощо
  if (err.status >= 400 && err.status < 500) {
    res.status(400).json({ error: 'INVALID_BODY', message: 'Тіло запиту має бути коректним JSON (до 10 КБ)' });
    return;
  }
  console.error('Помилка:', err.message);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Внутрішня помилка сервера' });
}
