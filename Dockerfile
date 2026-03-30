FROM node:20-alpine

WORKDIR /app

# Build client
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Install server deps
COPY server/package*.json ./server/
COPY server/prisma/ ./server/prisma/
RUN cd server && npm install

# Generate Prisma client (dummy URL for build-time validation only)
RUN cd server && DATABASE_URL=postgresql://dummy:dummy@localhost/dummy npx prisma generate

# Compile TypeScript
COPY server/ ./server/
RUN cd server && npx tsc

ENV NODE_ENV=production
EXPOSE 5000

CMD ["sh", "-c", "echo 'DATABASE_URL='$DATABASE_URL && node server/dist/index.js"]
