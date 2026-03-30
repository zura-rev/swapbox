#!/bin/bash
set -e

echo "==> Installing client dependencies..."
cd client && npm install

echo "==> Building client..."
npm run build

echo "==> Installing server dependencies..."
cd ../server && npm install

echo "==> Generating Prisma client..."
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

echo "==> Compiling TypeScript..."
npx tsc

echo "==> Build complete!"
