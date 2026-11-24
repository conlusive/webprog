FROM node:22-alpine
WORKDIR /app

# Спочатку лише package*.json - щоб шар із залежностями кешувався
COPY package*.json ./
RUN npm ci --omit=dev

# Решту файлів проєкту (без того, що в .dockerignore)
COPY . .

EXPOSE 3000
CMD ["node", "src/server.js"]
