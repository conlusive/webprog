import express from 'express';
import db from './db.js';
import { errorHandler } from './errors.js';

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

app.use(errorHandler); // завжди останнім

export default app;
