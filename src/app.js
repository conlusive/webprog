import express from 'express';
import db from './db.js';
import { errorHandler, notFound } from './errors.js';
import linksRouter from './links.js';

const app = express();

app.use(express.json({ limit: '10kb' }));

// Перевірка стану сервісу: чи відповідає база даних
app.get('/health', async (req, res) => {
  try {
    await db.one('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

app.use('/api/links', linksRouter);

// Перехід за коротким кодом. Реєструється після всіх інших шляхів, а зарезервовані
// слова (api, docs, health) не можна взяти як alias - тому конфлікту немає
app.get('/:code', async (req, res) => {
  // Один запит і збільшує лічильник, і повертає адресу: лічильник не губиться при одночасних переходах
  const row = await db.oneOrNone(
    'UPDATE links SET clicks = clicks + 1 WHERE code = $1 RETURNING url',
    [req.params.code]
  );
  if (!row) {
    throw notFound();
  }
  res.redirect(302, row.url); // 302, а не 301: браузер не кешує, кожен перехід доходить до сервера
});

app.use(errorHandler); // завжди останнім

export default app;
