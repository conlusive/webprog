import http from 'node:http';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Command } from 'commander';
import superagent from 'superagent';

// ---------- 1. Параметри командного рядка ----------
const program = new Command();

program
  .helpOption('--help', 'показати довідку') // -h потрібен для --host
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера')
  .requiredOption('-c, --cache <path>', 'тека для кешу картинок');

program.parse();

const options = program.opts();
const port = Number(options.port); // listen() потребує число, а не рядок

// ---------- 2. Допоміжні функції ----------

// Надсилає текстову відповідь (повідомлення про результат або помилку)
function sendText(res, status, text, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(text);
}

// ---------- 3. Обробка запиту ----------

// Єдиний колбек у програмі - обробник запиту, тому він async
async function handleRequest(req, res) {
  try {
    if (!['GET', 'PUT', 'DELETE'].includes(req.method)) {
      sendText(res, 405, 'Метод не підтримується', { Allow: 'GET, PUT, DELETE' });
      return;
    }

    // Шлях має вигляд /<код стану>: рівно три цифри, тому в імені файлу
    // не може бути "../" чи "/". Рядок запиту (?x=1) відкидаємо
    const match = /^\/(\d{3})$/.exec(req.url.split('?')[0]);
    if (!match) {
      sendText(res, 404, 'Не знайдено: очікується шлях /<код стану>, наприклад /404');
      return;
    }
    const code = match[1];

    sendText(res, 501, 'Ще не реалізовано');
  } catch (err) {
    console.error('Помилка:', err.message);
    sendText(res, 500, 'Внутрішня помилка сервера');
  }
}

// ---------- 4. Запуск сервера ----------
try {
  // тека кешу створюється до початку приймання запитів
  await fs.mkdir(options.cache, { recursive: true });

  const server = http.createServer(handleRequest);
  server.listen(port, options.host);
  // once() повертає проміс: він виконується на 'listening' і відхиляється на 'error'
  await once(server, 'listening');

  console.log(`Проксі запущено: http://${options.host}:${port}/`);
} catch (err) {
  console.error('Не вдалося запустити сервер: ' + err.message);
  process.exit(1);
}
