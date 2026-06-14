# Container image for the Express API. Build context is ./backend.
FROM node:22-alpine

WORKDIR /app

# Copy manifest first so the dependency layer is cached unless it changes.
COPY package.json ./
RUN npm install --omit=dev

# Then copy the source.
COPY . .

EXPOSE 4000
CMD ["node", "src/server.js"]
