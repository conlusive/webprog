import app from './app.js';
import { pgp } from './db.js';

const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`Сервер запущено на порту ${port}`);
});

// docker stop надсилає SIGTERM: коректно закриваємо сервер і з'єднання з базою
function shutdown() {
  server.close(() => {
    pgp.end();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
