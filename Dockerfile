FROM node:20-alpine

ENV MODO="prod"

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npm run start:${MODO}"]