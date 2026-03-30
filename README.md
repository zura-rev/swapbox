# SwapBox — React + Express + PostgreSQL

ნივთების გაცვლა-გაჩუქების პლატფორმა.

## სწრაფი დაწყება

### 1. PostgreSQL

დააინსტალირე [PostgreSQL](https://www.postgresql.org/download/) ან გამოიყენე cloud:
- [Railway](https://railway.app) — უფასო tier
- [Neon](https://neon.tech) — უფასო tier
- [Supabase](https://supabase.com) — უფასო tier (მხოლოდ DB)

### 2. Setup

```bash
# დამოკიდებულებები
npm run install:all

# Server env
cd server
# თუ .env.example გაქვს, დააკოპირე .env-ში
# (PowerShell) Copy-Item .env.example .env
# შეავსე DATABASE_URL და JWT_SECRET

cd ..

# მიგრაცია
npm run db:migrate -- --name init

# Seed (კატეგორიები)
npm run db:seed

# uploads საქაღალდე
# (PowerShell) New-Item -ItemType Directory -Force uploads
```

### 3. გაშვება

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Prisma Studio: `cd server && npx prisma studio`

## ტექნოლოგიები

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, React Router, Tailwind CSS, Zustand |
| Backend | Express.js, TypeScript, Prisma ORM, Socket.io |
| Database | PostgreSQL |
| Auth | JWT (httpOnly cookies), bcrypt |
| Upload | Multer + Sharp (resize/webp) |
| Realtime | Socket.io (chat, online status, typing) |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | რეგისტრაცია |
| POST | /api/auth/login | შესვლა |
| POST | /api/auth/logout | გამოსვლა |
| GET | /api/auth/me | მიმდინარე მომხმარებელი |
| GET | /api/items | ნივთების სია (filter, search, paginate) |
| GET | /api/items/:id | ნივთის დეტალები |
| POST | /api/items | ახალი ნივთი |
| PUT | /api/items/:id | ნივთის განახლება |
| DELETE | /api/items/:id | ნივთის წაშლა |
| POST | /api/items/:id/save | შენახვა/წაშლა toggle |
| GET | /api/users/:id | პროფილი |
| PUT | /api/users/me | პროფილის განახლება |
| GET | /api/chat | ჩატების სია |
| GET | /api/chat/:id/messages | შეტყობინებები |
| POST | /api/chat | ახალი ჩატი |
| POST | /api/reviews | შეფასება |
| POST | /api/upload/item-image | ფოტო ატვირთვა |
| POST | /api/upload/avatar | ავატარი |
| GET | /api/categories | კატეგორიები |
