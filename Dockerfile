# Simple Dockerfile for the Node.js SSH proxy
FROM node:18-alpine
WORKDIR /app
COPY package.json package.json
RUN npm install --production
COPY server.js server.js
COPY public public
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
