import crypto from 'node:crypto';
import express from 'express';
import db from './db.js';
import { HttpError, notFound } from './errors.js';

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 7;
const MAX_ATTEMPTS = 5; // стільки разів пробуємо інший код, якщо згенерований уже існує
const RESERVED = ['api', 'docs', 'health']; // шляхи самого сервера
const UNIQUE_VIOLATION = '23505'; // код помилки PostgreSQL: порушено унікальність

const router = express.Router();

// ---------- Допоміжні функції ----------

// Рядок з бази -> об'єкт відповіді зі специфікації (Link)
function toLink(row) {
  return {
    code: row.code,
    shortUrl: `${BASE_URL}/${row.code}`,
    url: row.url,
    clicks: row.clicks,
    createdAt: row.created_at,
  };
}

// Без заголовка Content-Type: application/json express.json() залишає req.body порожнім
function getBody(req) {
  const body = req.body;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'INVALID_BODY', 'Тіло запиту має бути JSON-об\'єктом (Content-Type: application/json)');
  }
  return body;
}

// Перевіряє адресу і повертає її без пробілів по краях
function checkUrl(value) {
  const invalid = (message) => new HttpError(400, 'INVALID_URL', message);

  if (typeof value !== 'string') {
    throw invalid('url обов\'язковий і має бути рядком');
  }
  const text = value.trim();
  if (text.length > 2048) {
    throw invalid('url не може бути довшим за 2048 символів');
  }
  // Лише http і https: так відсікаємо javascript:, data:, file: тощо
  if (!/^https?:\/\//i.test(text)) {
    throw invalid('url має бути коректною адресою http або https');
  }
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw invalid('url має бути коректною адресою http або https');
  }
  // Адреса самого сервісу створила б нескінченне перенаправлення
  if (parsed.origin === new URL(BASE_URL).origin) {
    throw invalid('Не можна скорочувати адреси цього сервісу');
  }
  return text;
}

function checkAlias(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,32}$/.test(value)) {
    throw new HttpError(400, 'INVALID_ALIAS', 'alias має містити 3-32 символи: літери, цифри, _ і -');
  }
  // Express не розрізняє регістр шляхів, тому порівнюємо з маленькими літерами
  if (RESERVED.includes(value.toLowerCase())) {
    throw new HttpError(400, 'INVALID_ALIAS', 'Це слово зарезервоване сервером');
  }
  return value;
}

function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
}

function insertLink(code, url) {
  return db.one('INSERT INTO links (code, url) VALUES ($1, $2) RETURNING *', [code, url]);
}

// Унікальність гарантує PRIMARY KEY: якщо код уже є, база повертає помилку 23505
async function insertWithGeneratedCode(url) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await insertLink(generateCode(), url);
    } catch (err) {
      if (err.code !== UNIQUE_VIOLATION) {
        throw err;
      }
    }
  }
  throw new Error('Не вдалося згенерувати унікальний код');
}

// ---------- Маршрути ----------

// POST /api/links - створити посилання
router.post('/', async (req, res) => {
  const body = getBody(req);
  const url = checkUrl(body.url);

  let row;
  if (body.alias === undefined) {
    row = await insertWithGeneratedCode(url);
  } else {
    const alias = checkAlias(body.alias);
    try {
      row = await insertLink(alias, url);
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        throw new HttpError(409, 'ALIAS_TAKEN', 'Alias вже зайнятий');
      }
      throw err;
    }
  }

  res.status(201).location(`/api/links/${row.code}`).json(toLink(row));
});

// GET /api/links - перелік усіх посилань, найновіші першими
router.get('/', async (req, res) => {
  const rows = await db.any('SELECT * FROM links ORDER BY created_at DESC, code');
  res.json(rows.map(toLink));
});

// GET /api/links/:code - одне посилання (лічильник не змінюється)
router.get('/:code', async (req, res) => {
  const row = await db.oneOrNone('SELECT * FROM links WHERE code = $1', [req.params.code]);
  if (!row) {
    throw notFound();
  }
  res.json(toLink(row));
});

export default router;
