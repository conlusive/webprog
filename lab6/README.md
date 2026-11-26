# Лабораторна робота №6 - сервіс скорочення посилань на Express.js

Express 5 + PostgreSQL (pg-promise), усе запускається в Docker. API описано в `openapi.yaml`,
документація Swagger UI будується з цього файлу.

## Запуск

    cp .env.sample .env        # і задайте власний POSTGRES_PASSWORD
    docker compose up --build

Після запуску:

- Swagger UI - http://localhost:8080/docs
- перевірка стану - http://localhost:8080/health
- коротке посилання - http://localhost:8080/<код>

Зупинка: `docker compose down` (дані зберігаються), `docker compose down --volumes` (дані видаляються).
Команди для перевірки API - у `test.txt`.
