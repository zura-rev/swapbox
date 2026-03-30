import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './presentation/routes/auth.routes';
import itemRoutes from './presentation/routes/item.routes';
import userRoutes from './presentation/routes/user.routes';
import chatRoutes from './presentation/routes/chat.routes';
import reviewRoutes from './presentation/routes/review.routes';
import uploadRoutes from './presentation/routes/upload.routes';
import categoryRoutes from './presentation/routes/category.routes';
import offerRoutes from './presentation/routes/offer.routes';
import captchaRoutes from './presentation/routes/captcha.routes';
import notificationRoutes from './presentation/routes/notification.routes';

import { setupSocket } from './infrastructure/services/socket.service';
import { prisma, chatRepo, notificationRepo, wireSocketService } from './container';
import { swaggerSpec } from './swagger/swagger';
import { globalLimiter, authLimiter } from './presentation/middleware/rateLimiter.middleware';

dotenv.config();

const app = express();
const server = createServer(app);

const isProd = process.env.NODE_ENV === 'production';
const allowedOrigin = isProd ? false : (process.env.CLIENT_URL || 'http://localhost:5173');

const io = new Server(server, {
  cors: isProd ? undefined : {
    origin: allowedOrigin,
    credentials: true,
  },
});

setupSocket(io, prisma, chatRepo, notificationRepo);
wireSocketService(io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(isProd ? { origin: false } : {
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'სერვერის შეცდომა' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`SwapBox server running on http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };
