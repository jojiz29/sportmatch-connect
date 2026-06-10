FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
COPY server/tsconfig*.json ./
COPY server/nest-cli.json ./
COPY server/src ./src
COPY server/prisma ./prisma

RUN npm install && npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]