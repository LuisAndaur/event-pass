FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8084
# Carga la auto-instrumentación de OpenTelemetry antes de la app (zero-code).
CMD ["node", "--require", "@opentelemetry/auto-instrumentations-node/register", "server.js"]
