# SwapBox Server — Architecture Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Layer Descriptions](#3-layer-descriptions)
   - [Domain Layer](#31-domain-layer)
   - [Application Layer](#32-application-layer)
   - [Infrastructure Layer](#33-infrastructure-layer)
   - [Presentation Layer](#34-presentation-layer)
   - [Shared](#35-shared)
4. [Dependency Rule](#4-dependency-rule)
5. [Adding New Features](#5-adding-new-features)
6. [Container and Dependency Injection](#6-container-and-dependency-injection)
7. [Error Handling](#7-error-handling)
8. [Real-Time Events (Socket.io)](#8-real-time-events-socketio)
9. [Environment Variables](#9-environment-variables)
10. [Database](#10-database)
11. [API Documentation](#11-api-documentation)
12. [Code Review — Fixes Applied](#12-code-review--fixes-applied)

---

## 1. Project Overview

**SwapBox** is a platform for swapping and gifting items between users. Users can list items they want to trade or give away, make offers on other users' items, chat in real time, and leave reviews.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express 4 |
| Database | PostgreSQL via Prisma ORM |
| Real-time | Socket.io |
| Authentication | JWT (HTTP-only cookies) |
| Image Processing | Sharp (WebP conversion) |
| File Uploads | Multer (memory storage) |
| Validation | Zod |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Rate Limiting | express-rate-limit |

### Architecture Style

Clean Architecture (also known as Ports and Adapters / Hexagonal Architecture). The codebase is organized into concentric layers where inner layers have no knowledge of outer layers.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION                             │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│   │ Controllers │  │   Routes    │  │     Middleware        │   │
│   │             │  │             │  │  (auth, rateLimiter)  │   │
│   └──────┬──────┘  └─────────────┘  └──────────────────────┘   │
│          │ calls use-cases                                       │
└──────────┼──────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                         APPLICATION                             │
│                                                                 │
│   ┌──────────────────────────┐   ┌──────────────────────────┐   │
│   │       Use Cases          │   │   Repository Interfaces  │   │
│   │  (business logic only)   │   │    IUserRepository       │   │
│   │                          │   │    IItemRepository       │   │
│   │  auth/  item/  offer/    │   │    IOfferRepository      │   │
│   │  chat/  user/  review/   │   │    IChatRepository       │   │
│   │  notification/ category/ │   │    IReviewRepository     │   │
│   └──────────────────────────┘   │    ICategoryRepository   │   │
│                                  │    INotificationRepository│  │
│   ┌──────────────────────────┐   └──────────────────────────┘   │
│   │   Service Interfaces     │                                   │
│   │  INotificationService    │                                   │
│   │  ISocketService          │                                   │
│   └──────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
           │ implements interfaces
┌──────────▼──────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE                            │
│                                                                 │
│   ┌─────────────────────┐   ┌──────────────────────────────┐    │
│   │    Repositories     │   │          Services            │    │
│   │  PrismaUserRepo     │   │  NotificationService         │    │
│   │  PrismaItemRepo     │   │  SocketService               │    │
│   │  PrismaOfferRepo    │   │  UploadService               │    │
│   │  PrismaChatRepo     │   └──────────────────────────────┘    │
│   │  PrismaReviewRepo   │                                        │
│   │  PrismaCategoryRepo │   ┌──────────────────────────────┐    │
│   │  PrismaNotifRepo    │   │          Database            │    │
│   └─────────────────────┘   │       prisma.client.ts       │    │
│                             └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                          DOMAIN                                 │
│                                                                 │
│   User   Item   Offer   Conversation   Message                  │
│   Review   Notification                                         │
│   (Pure TypeScript interfaces — zero dependencies)              │
└─────────────────────────────────────────────────────────────────┘

                    ─────────────────────
                         SHARED
                    ─────────────────────
                       AppError
```

**Dependency direction:** arrows point inward. Outer layers depend on inner layers. Inner layers never import from outer layers.

---

## 3. Layer Descriptions

### 3.1 Domain Layer

**Location:** `src/domain/`

The innermost layer. Contains pure TypeScript interfaces that describe the core business entities. These files have **zero imports** from any other part of the codebase.

```
src/domain/
└── entities/
    ├── index.ts          (barrel re-export)
    ├── User.ts
    ├── Item.ts
    ├── Offer.ts
    ├── Conversation.ts
    ├── Message.ts
    ├── Review.ts
    └── Notification.ts
```

**Rules:**
- No imports from application, infrastructure, or presentation layers
- No class instances — only `interface` and `type` declarations
- No business logic

**Example (`User.ts`):**
```typescript
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  // ...
}
```

---

### 3.2 Application Layer

**Location:** `src/application/`

Contains business logic. Use-cases orchestrate repository calls and service calls to fulfill specific application operations. This layer only imports from:
- `domain/entities/` — entity types
- `application/repositories/` — repository interfaces (ports)
- `application/services/` — service interfaces (ports)
- `shared/errors/` — AppError

It **never** imports from `infrastructure/` or `presentation/`.

```
src/application/
├── repositories/
│   ├── index.ts                    (barrel re-export)
│   ├── IUserRepository.ts
│   ├── IItemRepository.ts
│   ├── IOfferRepository.ts
│   ├── IChatRepository.ts
│   ├── IReviewRepository.ts
│   ├── ICategoryRepository.ts
│   └── INotificationRepository.ts
├── services/
│   ├── index.ts                    (barrel re-export)
│   ├── INotificationService.ts
│   └── ISocketService.ts
└── use-cases/
    ├── auth/
    │   ├── RegisterUseCase.ts
    │   ├── LoginUseCase.ts
    │   ├── LogoutUseCase.ts
    │   └── GetMeUseCase.ts
    ├── item/
    │   ├── GetItemsUseCase.ts
    │   ├── GetItemUseCase.ts
    │   ├── CreateItemUseCase.ts
    │   ├── UpdateItemUseCase.ts
    │   ├── DeleteItemUseCase.ts
    │   ├── ToggleSaveUseCase.ts
    │   ├── GetSavedItemsUseCase.ts
    │   └── CompleteItemUseCase.ts
    ├── offer/
    │   ├── CreateOfferUseCase.ts
    │   ├── GetOffersUseCase.ts
    │   ├── AcceptOfferUseCase.ts
    │   └── RejectOfferUseCase.ts
    ├── chat/
    │   ├── GetConversationsUseCase.ts
    │   ├── GetMessagesUseCase.ts
    │   ├── SendMessageUseCase.ts
    │   ├── DeleteMessageUseCase.ts
    │   ├── EditMessageUseCase.ts
    │   ├── BlockUserUseCase.ts
    │   └── GetOrCreateConversationUseCase.ts
    ├── user/
    │   ├── GetUserUseCase.ts
    │   ├── UpdateUserUseCase.ts
    │   └── SearchUsersUseCase.ts
    ├── category/
    │   └── GetCategoriesUseCase.ts
    ├── review/
    │   └── CreateReviewUseCase.ts
    └── notification/
        ├── GetNotificationsUseCase.ts
        ├── MarkAllReadUseCase.ts
        ├── MarkOneReadUseCase.ts
        └── DeleteNotificationUseCase.ts
```

**Use-case conventions:**
- Simple use-cases: one `execute()` method
- Multi-action use-cases: named methods (e.g. `BlockUserUseCase.block()`, `.unblock()`, `.listBlocked()`, `.isBlocked()`)
- Receive dependencies via constructor injection (all typed as interfaces)
- Throw `AppError` for domain/business errors

**Repository interfaces (ports):**
```typescript
// application/repositories/IUserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<any | null>;
  create(data: { email: string; password: string; username: string; displayName: string }): Promise<any>;
  update(id: string, data: Record<string, any>): Promise<any>;
  // ...
}
```

**Service interfaces (ports):**
```typescript
// application/services/INotificationService.ts
export interface INotificationService {
  create(userId: string, type: string, title: string, body?: string, data?: object): Promise<any>;
}

// application/services/ISocketService.ts
export interface ISocketService {
  emitToUser(userId: string, event: string, data: unknown): void;
  emitToConversation(conversationId: string, event: string, data: unknown): void;
}
```

---

### 3.3 Infrastructure Layer

**Location:** `src/infrastructure/`

Contains all external integrations: database access (via Prisma), file uploads (Sharp + Multer), real-time (Socket.io), and notifications. This layer implements the interfaces defined in the application layer.

```
src/infrastructure/
├── database/
│   └── prisma.client.ts          (singleton PrismaClient)
├── repositories/
│   ├── index.ts                  (barrel re-export)
│   ├── PrismaUserRepository.ts
│   ├── PrismaItemRepository.ts
│   ├── PrismaOfferRepository.ts
│   ├── PrismaChatRepository.ts
│   ├── PrismaReviewRepository.ts
│   ├── PrismaCategoryRepository.ts
│   └── PrismaNotificationRepository.ts
└── services/
    ├── index.ts                  (barrel re-export)
    ├── notification.service.ts   (implements INotificationService)
    ├── socket.service.ts         (SocketService implements ISocketService)
    └── upload.service.ts
```

**Prisma repositories** implement the repository interfaces:
```typescript
// infrastructure/repositories/PrismaUserRepository.ts
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: userSelect });
  }
  // ...
}
```

**Services:**
- `NotificationService` — creates DB notification records and broadcasts via Socket.io. Implements `INotificationService`.
- `SocketService` — wraps `socket.io` Server to provide `emitToUser` and `emitToConversation`. Implements `ISocketService`.
- `UploadService` — processes images with Sharp and persists avatar URL via `IUserRepository`.

**`socket.service.ts`** also exports `setupSocket()`, the main socket initialization function called at app startup. It handles all real-time chat events: `chat:message`, `chat:edit`, `chat:delete`, `chat:reaction`, `chat:typing`, `chat:read`, and user presence (`user:online`, `user:offline`).

---

### 3.4 Presentation Layer

**Location:** `src/presentation/`

HTTP interface layer: routes, controllers, and middleware. Controllers receive HTTP requests, call exactly one use-case per action, and return HTTP responses. No business logic belongs here.

```
src/presentation/
├── controllers/
│   ├── auth.controller.ts
│   ├── item.controller.ts
│   ├── user.controller.ts
│   ├── offer.controller.ts
│   ├── chat.controller.ts
│   ├── review.controller.ts
│   ├── notification.controller.ts
│   ├── upload.controller.ts
│   ├── category.controller.ts
│   └── captcha.controller.ts
├── middleware/
│   ├── auth.middleware.ts        (JWT auth + optionalAuth)
│   └── rateLimiter.middleware.ts (globalLimiter, authLimiter, offerLimiter)
└── routes/
    ├── auth.routes.ts
    ├── item.routes.ts
    ├── user.routes.ts
    ├── offer.routes.ts
    ├── chat.routes.ts
    ├── review.routes.ts
    ├── notification.routes.ts
    ├── upload.routes.ts
    ├── category.routes.ts
    └── captcha.routes.ts
```

**Controller pattern:**
```typescript
export class ItemController {
  constructor(
    private readonly getItemsUseCase: GetItemsUseCase,
    // ... other use cases
  ) {}

  async list(req: AuthRequest, res: Response) {
    try {
      const result = await this.getItemsUseCase.execute(filters, page, limit, req.userId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Error' });
    }
  }
}
```

**Middleware:**
- `auth` — validates JWT, attaches `req.userId`, returns 401 if invalid
- `optionalAuth` — attaches `req.userId` if a valid token is present, never blocks
- `globalLimiter` — 300 requests per 15 minutes per IP
- `authLimiter` — 15 requests per 15 minutes on `/api/auth/*` (protects login/register)
- `offerLimiter` — 20 offers per hour per IP

**`CaptchaController`** is self-contained: generates emoji-grid captchas in memory and validates submitted answers. Used by `OfferController` before creating an offer.

---

### 3.5 Shared

**Location:** `src/shared/`

Cross-cutting concerns that any layer may import.

```
src/shared/
└── errors/
    └── AppError.ts
```

`AppError` is a typed error class with an HTTP `status` code:
```typescript
export class AppError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'AppError';
  }
}
```

---

## 4. Dependency Rule

**The Dependency Rule:** source code dependencies must always point inward — toward higher-level policies.

```
Presentation → Application → Domain
Infrastructure → Application → Domain
```

| Layer | May import from |
|-------|----------------|
| Domain | Nothing (zero dependencies) |
| Application | Domain, Shared |
| Infrastructure | Application (interfaces), Domain, Shared |
| Presentation | Application (use-cases), Shared |
| container.ts | All layers (composition root) |

**What is FORBIDDEN:**
- Application layer importing from `infrastructure/` or `presentation/`
- Application layer importing `PrismaClient` directly
- Domain layer importing from any other layer
- Use-cases importing concrete service classes (must use interfaces)

**The only exception is `container.ts`** — it is the "composition root" and is explicitly allowed to import from all layers in order to wire everything together.

---

## 5. Adding New Features

This is a step-by-step guide for adding a complete new feature (e.g., "item reports").

### Step 1: Add entity to Domain (if needed)

Create `src/domain/entities/Report.ts`:
```typescript
export interface Report {
  id: string;
  reporterId: string;
  itemId: string;
  reason: string;
  createdAt: Date;
}
```

Export it from the barrel file `src/domain/entities/index.ts`:
```typescript
export type { Report } from './Report';
```

### Step 2: Add repository interface

Create `src/application/repositories/IReportRepository.ts`:
```typescript
export interface IReportRepository {
  create(data: { reporterId: string; itemId: string; reason: string }): Promise<any>;
  findByReporterAndItem(reporterId: string, itemId: string): Promise<any | null>;
}
```

Export it from `src/application/repositories/index.ts`:
```typescript
export type { IReportRepository } from './IReportRepository';
```

### Step 3: Create use-case

Create `src/application/use-cases/report/CreateReportUseCase.ts`:
```typescript
import type { IReportRepository } from '../../repositories/IReportRepository';
import type { IItemRepository } from '../../repositories/IItemRepository';
import { AppError } from '../../../shared/errors/AppError';

export class CreateReportUseCase {
  constructor(
    private readonly reportRepo: IReportRepository,
    private readonly itemRepo: IItemRepository,
  ) {}

  async execute(reporterId: string, itemId: string, reason: string) {
    const item = await this.itemRepo.findByIdSimple(itemId);
    if (!item) throw new AppError('ნივთი ვერ მოიძებნა', 404);
    if (item.userId === reporterId) throw new AppError('საკუთარ ნივთს ვერ დარეპორტავ', 400);

    const existing = await this.reportRepo.findByReporterAndItem(reporterId, itemId);
    if (existing) throw new AppError('უკვე დარეპორტებულია', 409);

    return this.reportRepo.create({ reporterId, itemId, reason });
  }
}
```

### Step 4: Implement in Infrastructure

Add the Prisma model to `prisma/schema.prisma` and run migration:
```bash
npx prisma migrate dev --name add_report_model
```

Create `src/infrastructure/repositories/PrismaReportRepository.ts`:
```typescript
import type { PrismaClient } from '@prisma/client';
import type { IReportRepository } from '../../application/repositories/IReportRepository';

export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: { reporterId: string; itemId: string; reason: string }) {
    return this.prisma.report.create({ data });
  }

  findByReporterAndItem(reporterId: string, itemId: string) {
    return this.prisma.report.findFirst({ where: { reporterId, itemId } });
  }
}
```

Export it from `src/infrastructure/repositories/index.ts`:
```typescript
export { PrismaReportRepository } from './PrismaReportRepository';
```

### Step 5: Create the controller

Create `src/presentation/controllers/report.controller.ts`:
```typescript
import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { CreateReportUseCase } from '../../application/use-cases/report/CreateReportUseCase';

export class ReportController {
  constructor(private readonly createReportUseCase: CreateReportUseCase) {}

  async create(req: AuthRequest, res: Response) {
    try {
      const { itemId, reason } = req.body;
      if (!itemId || !reason) return res.status(400).json({ error: 'itemId და reason სავალდებულოა' });
      const report = await this.createReportUseCase.execute(req.userId!, itemId, reason);
      res.status(201).json(report);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }
}
```

### Step 6: Register the route

Create `src/presentation/routes/report.routes.ts`:
```typescript
import { Router } from 'express';
import { reportController } from '../../container';
import { auth } from '../middleware/auth.middleware';

const router = Router();
router.post('/', auth, (req, res) => reportController.create(req as any, res));
export default router;
```

Add the route to `src/index.ts`:
```typescript
import reportRoutes from './presentation/routes/report.routes';
// ...
app.use('/api/reports', reportRoutes);
```

### Step 7: Wire in container.ts

Add to `src/container.ts`:
```typescript
import { PrismaReportRepository } from './infrastructure/repositories/PrismaReportRepository';
import { CreateReportUseCase } from './application/use-cases/report/CreateReportUseCase';
import { ReportController } from './presentation/controllers/report.controller';

// In the Repositories section:
const reportRepo = new PrismaReportRepository(prisma);

// In the Use Cases section:
const createReportUseCase = new CreateReportUseCase(reportRepo, itemRepo);

// In the Controllers section:
export const reportController = new ReportController(createReportUseCase);
```

---

## 6. Container and Dependency Injection

**Location:** `src/container.ts`

SwapBox uses **manual dependency injection** — all wiring happens in a single composition root file. There is no IoC framework.

The initialization order in `container.ts` is:
1. Create the Prisma client (database connection)
2. Instantiate all repository implementations (pass `prisma` to each)
3. Instantiate infrastructure services (pass repositories to each)
4. Instantiate use-cases (pass repositories and service interfaces to each)
5. Instantiate controllers (pass use-cases to each)
6. Export controllers (consumed by route files)

All route files import their controller singleton from `container.ts`:
```typescript
// presentation/routes/item.routes.ts
import { itemController } from '../../container';
```

### Socket service wiring

`SocketService` requires the `socket.io` Server instance, which is created in `index.ts` after the HTTP server is set up. To avoid a circular dependency, `container.ts` exports a `wireSocketService(io)` function. `index.ts` calls it immediately after `setupSocket()`:

```typescript
// index.ts
setupSocket(io, prisma, chatRepo, notificationRepo);
wireSocketService(io); // wires ISocketService into AcceptOfferUseCase and RejectOfferUseCase
```

This gives use-cases access to real-time socket emission without directly depending on socket.io.

---

## 7. Error Handling

### AppError

All business errors are thrown as `AppError` instances:
```typescript
throw new AppError('ნივთი ვერ მოიძებნა', 404);
throw new AppError('არ გაქვს უფლება', 403);
throw new AppError('უკვე გაგზავნილი გაქვს შეთავაზება', 409);
```

### Controller error handling

Each controller method wraps the use-case call in try/catch:
```typescript
try {
  const result = await this.someUseCase.execute(...);
  res.json(result);
} catch (err: any) {
  res.status(err.status || 500).json({ error: err.message || 'Default error message' });
}
```

The `err.status` pattern works because `AppError` exposes a `status` property. Any non-AppError thrown will fall back to status 500.

### Global error handler

`index.ts` registers a global Express error handler as a safety net:
```typescript
app.use((err: any, _req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'სერვერის შეცდომა' });
});
```

### Zod validation errors

Auth use-cases use Zod schemas for input validation. `ZodError` is caught in auth controllers and mapped to HTTP 400:
```typescript
if (err instanceof z.ZodError) {
  return res.status(400).json({ error: err.errors[0].message });
}
```

---

## 8. Real-Time Events (Socket.io)

**Setup:** `src/infrastructure/services/socket.service.ts`

Socket.io is initialized in `index.ts` via `setupSocket()`. Authentication is performed in the socket middleware using the same JWT secret as the HTTP layer.

### Events emitted by server

| Event | Room | Description |
|-------|------|-------------|
| `user:online` | broadcast | User connected |
| `user:offline` | broadcast | User disconnected |
| `chat:message` | `conv:{id}` | New message in a conversation |
| `chat:notify` | `user:{id}` | Notification of new message for recipient |
| `chat:edit` | `conv:{id}` | Message edited |
| `chat:delete` | `conv:{id}` | Message soft-deleted |
| `chat:reaction` | `conv:{id}` | Emoji reaction added/removed |
| `chat:typing` | `conv:{id}` | User is typing indicator |
| `chat:read` | `conv:{id}` | Messages marked as read |
| `chat:error` | socket | Error in chat operation |
| `notification:new` | `user:{id}` | New push notification |
| `offer:accepted` | `user:{id}` | Offer accepted notification |
| `offer:rejected` | `user:{id}` | Offer rejected notification |
| `conv:closed` | `user:{id}` | Conversation closed |

### Events listened by server

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:join` | `conversationId: string` | Join a conversation room |
| `chat:leave` | `conversationId: string` | Leave a conversation room |
| `chat:message` | `{ conversationId, content, replyToId? }` | Send a message |
| `chat:delete` | `{ messageId, conversationId }` | Delete a message |
| `chat:edit` | `{ messageId, conversationId, content }` | Edit a message |
| `chat:reaction` | `{ messageId, emoji, conversationId }` | Toggle emoji reaction |
| `chat:typing` | `{ conversationId, isTyping }` | Typing indicator |
| `chat:read` | `{ conversationId }` | Mark messages as read |
| `disconnect` | — | Client disconnected |

### ISocketService interface

Use-cases that need to emit socket events depend on `ISocketService` (application/services layer), not on socket.io directly:

```typescript
export interface ISocketService {
  emitToUser(userId: string, event: string, data: unknown): void;
  emitToConversation(conversationId: string, event: string, data: unknown): void;
}
```

`SocketService` in infrastructure implements this interface by wrapping the `socket.io` Server instance.

---

## 9. Environment Variables

Create a `.env` file in `server/` (see `.env.example` if provided):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiry (e.g. `7d`, `24h`) |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `PORT` | No | `5000` | HTTP server port |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed CORS origin (development only) |

**Example `.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/swapbox"
JWT_SECRET="your-super-secret-key-here"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=5000
CLIENT_URL="http://localhost:5173"
```

**Security notes:**
- `JWT_SECRET` must be a long, random string (at least 32 characters recommended)
- In production, set `NODE_ENV=production` — this disables CORS for cross-origin requests and tightens cookie settings (Secure flag)
- Never commit `.env` to version control

---

## 10. Database

### Prisma setup

The database schema is defined in `prisma/schema.prisma`. The Prisma client is a singleton created in `src/infrastructure/database/prisma.client.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
```

### Key models

| Model | Description |
|-------|-------------|
| `User` | Registered users with profile, stats, and online status |
| `Item` | Items listed for swap or gift |
| `ItemImage` | Images belonging to an item |
| `Offer` | Offer made by one user on another user's item |
| `OfferImage` | Images attached to an offer |
| `Conversation` | Chat conversation between two users, optionally linked to an item/offer |
| `Message` | A message within a conversation |
| `MessageReaction` | Emoji reaction on a message |
| `Review` | Star rating and comment left by one user for another |
| `Notification` | In-app notification record |
| `Category` | Item categories with item counts |
| `SavedItem` | Junction table for users saving items |
| `ChatBlock` | Block record between two users |

### Database commands

```bash
# Run pending migrations (development)
npm run db:migrate

# Seed the database with initial data
npm run db:seed

# Open Prisma Studio (visual DB browser)
npm run db:studio

# Generate Prisma client after schema changes
npx prisma generate
```

### Migrations workflow

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe_your_change`
3. Prisma generates migration SQL in `prisma/migrations/`
4. Commit both the updated schema and the migration files

---

## 11. API Documentation

Swagger UI is available at:
- **Development:** `http://localhost:5000/api/docs`
- **Raw JSON spec:** `http://localhost:5000/api/docs.json`

Swagger annotations are written as JSDoc comments directly in controller files. The `swagger-jsdoc` package reads the `src/presentation/controllers/*.ts` glob pattern.

### API Routes Summary

| Prefix | Description |
|--------|-------------|
| `POST /api/auth/register` | Register new user |
| `POST /api/auth/login` | Login |
| `POST /api/auth/logout` | Logout (requires auth) |
| `GET /api/auth/me` | Current user profile (requires auth) |
| `GET /api/items` | List items with filters |
| `GET /api/items/:id` | Item details |
| `POST /api/items` | Create item (auth) |
| `PUT /api/items/:id` | Update item (auth, owner) |
| `DELETE /api/items/:id` | Delete item (auth, owner) |
| `POST /api/items/:id/save` | Toggle save item (auth) |
| `POST /api/items/:id/complete` | Mark item as complete (auth, owner) |
| `GET /api/items/saved` | Get saved items (auth) |
| `GET /api/users/search` | Search users by query |
| `GET /api/users/:id` | Public user profile |
| `PUT /api/users/me` | Update own profile (auth) |
| `GET /api/offers/received` | Received offers (auth) |
| `GET /api/offers/sent` | Sent offers (auth) |
| `POST /api/offers` | Create offer (auth, captcha) |
| `POST /api/offers/:id/accept` | Accept offer (auth) |
| `POST /api/offers/:id/reject` | Reject offer (auth) |
| `GET /api/chat` | List conversations (auth) |
| `GET /api/chat/:id/messages` | Get messages (auth) |
| `POST /api/chat` | Get or create conversation (auth) |
| `POST /api/chat/:id/messages` | Send message REST fallback (auth) |
| `DELETE /api/chat/:id/messages/:msgId` | Delete message (auth) |
| `PATCH /api/chat/:id/messages/:msgId` | Edit message (auth) |
| `POST /api/chat/block/:userId` | Block user (auth) |
| `DELETE /api/chat/block/:userId` | Unblock user (auth) |
| `GET /api/reviews/user/:id` | User reviews |
| `POST /api/reviews` | Create review (auth) |
| `GET /api/notifications` | List notifications (auth) |
| `PATCH /api/notifications/read-all` | Mark all read (auth) |
| `PATCH /api/notifications/:id/read` | Mark one read (auth) |
| `DELETE /api/notifications/:id` | Delete one notification (auth) |
| `DELETE /api/notifications/all` | Delete all notifications (auth) |
| `GET /api/categories` | List categories |
| `POST /api/upload/item-image` | Upload item image (auth, multipart) |
| `POST /api/upload/avatar` | Upload avatar (auth, multipart) |
| `GET /api/captcha` | Generate captcha challenge |
| `GET /api/health` | Health check |

---

## 12. Code Review — Fixes Applied

The following architectural issues were identified and fixed during the code review:

### Fixed: Layer violations in use-cases

**Problem:** Several use-cases imported `PrismaClient` or infrastructure services directly, violating the Dependency Rule.

| Use Case | Old Violation | Fix Applied |
|----------|--------------|-------------|
| `CompleteItemUseCase` | Imported `PrismaClient` and `socket.service` | Now uses `IChatRepository.closeConversationsByItemId()` |
| `AcceptOfferUseCase` | Imported `PrismaClient` and `socket.service` | Now uses `IChatRepository.findOrCreateConversation()` and `ISocketService` |
| `RejectOfferUseCase` | Imported `socket.service` directly | Now uses `ISocketService` interface |
| `CreateOfferUseCase` | Imported concrete `NotificationService` class | Now uses `INotificationService` interface |
| `BlockUserUseCase` | Imported `PrismaClient` directly | Now uses `IChatRepository` block methods |

### Fixed: Missing IChatRepository methods

**Problem:** `BlockUserUseCase` used Prisma directly because `IChatRepository` lacked block and conversation management methods.

**Fix:** Added the following methods to `IChatRepository` and implemented them in `PrismaChatRepository`:
- `findConversationsByItemId(itemId)`
- `closeConversationsByItemId(itemId)`
- `findOrCreateConversation(p1, p2, itemId, offerId)`
- `reopenConversation(id, offerId)`
- `blockUser(blockerId, blockedId)`
- `unblockUser(blockerId, blockedId)`
- `listBlocked(blockerId)`
- `isBlocked(blockerId, blockedId)`
- `closeConversationsBetween(userId1, userId2)`

### Fixed: Fat controller accessing repository directly

**Problem:** `CategoryController` injected `ICategoryRepository` directly and called `findAll()` — skipping the use-case layer entirely.

**Fix:** Created `GetCategoriesUseCase` in `application/use-cases/category/`. Updated `CategoryController` to depend on the use-case. Updated `container.ts` wiring.

### Fixed: New service interfaces added

**Problem:** Use-cases depended on concrete infrastructure classes (`NotificationService`, Socket.io `Server`), making them impossible to test in isolation and violating the Dependency Rule.

**Fix:** Added two new interface files:
- `application/services/INotificationService.ts`
- `application/services/ISocketService.ts`

`NotificationService` now declares `implements INotificationService`. `SocketService` (new class) declares `implements ISocketService`.

### Added: Barrel index files

Added `index.ts` barrel re-export files to:
- `src/domain/entities/index.ts`
- `src/application/repositories/index.ts`
- `src/application/services/index.ts`
- `src/infrastructure/repositories/index.ts`
- `src/infrastructure/services/index.ts`

These enable clean imports like:
```typescript
import type { IUserRepository, IItemRepository } from '../application/repositories';
```

### Added: SocketService class

Added `SocketService` class to `socket.service.ts` that implements `ISocketService`. This allows use-cases to emit real-time events without coupling to socket.io.

### Verified: Zero TypeScript errors

After all fixes: `npx tsc --noEmit` exits with 0 errors.
