import prisma from './infrastructure/database/prisma.client';

// Infrastructure Repositories
import { PrismaUserRepository } from './infrastructure/repositories/PrismaUserRepository';
import { PrismaItemRepository } from './infrastructure/repositories/PrismaItemRepository';
import { PrismaOfferRepository } from './infrastructure/repositories/PrismaOfferRepository';
import { PrismaChatRepository } from './infrastructure/repositories/PrismaChatRepository';
import { PrismaReviewRepository } from './infrastructure/repositories/PrismaReviewRepository';
import { PrismaCategoryRepository } from './infrastructure/repositories/PrismaCategoryRepository';
import { PrismaNotificationRepository } from './infrastructure/repositories/PrismaNotificationRepository';

// Infrastructure Services
import { NotificationService } from './infrastructure/services/notification.service';
import { UploadService } from './infrastructure/services/upload.service';
import { SocketService } from './infrastructure/services/socket.service';
import type { Server } from 'socket.io';

// Auth Use Cases
import { RegisterUseCase } from './application/use-cases/auth/RegisterUseCase';
import { LoginUseCase } from './application/use-cases/auth/LoginUseCase';
import { LogoutUseCase } from './application/use-cases/auth/LogoutUseCase';
import { GetMeUseCase } from './application/use-cases/auth/GetMeUseCase';

// Item Use Cases
import { GetItemsUseCase } from './application/use-cases/item/GetItemsUseCase';
import { GetItemUseCase } from './application/use-cases/item/GetItemUseCase';
import { CreateItemUseCase } from './application/use-cases/item/CreateItemUseCase';
import { UpdateItemUseCase } from './application/use-cases/item/UpdateItemUseCase';
import { DeleteItemUseCase } from './application/use-cases/item/DeleteItemUseCase';
import { ToggleSaveUseCase } from './application/use-cases/item/ToggleSaveUseCase';
import { GetSavedItemsUseCase } from './application/use-cases/item/GetSavedItemsUseCase';
import { CompleteItemUseCase } from './application/use-cases/item/CompleteItemUseCase';

// Offer Use Cases
import { CreateOfferUseCase } from './application/use-cases/offer/CreateOfferUseCase';
import { GetOffersUseCase } from './application/use-cases/offer/GetOffersUseCase';
import { AcceptOfferUseCase } from './application/use-cases/offer/AcceptOfferUseCase';
import { RejectOfferUseCase } from './application/use-cases/offer/RejectOfferUseCase';

// Chat Use Cases
import { GetConversationsUseCase } from './application/use-cases/chat/GetConversationsUseCase';
import { GetMessagesUseCase } from './application/use-cases/chat/GetMessagesUseCase';
import { SendMessageUseCase } from './application/use-cases/chat/SendMessageUseCase';
import { DeleteMessageUseCase } from './application/use-cases/chat/DeleteMessageUseCase';
import { EditMessageUseCase } from './application/use-cases/chat/EditMessageUseCase';
import { BlockUserUseCase } from './application/use-cases/chat/BlockUserUseCase';
import { GetOrCreateConversationUseCase } from './application/use-cases/chat/GetOrCreateConversationUseCase';

// User Use Cases
import { GetUserUseCase } from './application/use-cases/user/GetUserUseCase';
import { UpdateUserUseCase } from './application/use-cases/user/UpdateUserUseCase';
import { SearchUsersUseCase } from './application/use-cases/user/SearchUsersUseCase';

// Category Use Cases
import { GetCategoriesUseCase } from './application/use-cases/category/GetCategoriesUseCase';

// Review Use Cases
import { CreateReviewUseCase } from './application/use-cases/review/CreateReviewUseCase';

// Notification Use Cases
import { GetNotificationsUseCase } from './application/use-cases/notification/GetNotificationsUseCase';
import { MarkAllReadUseCase } from './application/use-cases/notification/MarkAllReadUseCase';
import { MarkOneReadUseCase } from './application/use-cases/notification/MarkOneReadUseCase';
import { DeleteNotificationUseCase } from './application/use-cases/notification/DeleteNotificationUseCase';

// Controllers
import { AuthController } from './presentation/controllers/auth.controller';
import { ItemController } from './presentation/controllers/item.controller';
import { UserController } from './presentation/controllers/user.controller';
import { OfferController } from './presentation/controllers/offer.controller';
import { ChatController } from './presentation/controllers/chat.controller';
import { ReviewController } from './presentation/controllers/review.controller';
import { NotificationController } from './presentation/controllers/notification.controller';
import { UploadController } from './presentation/controllers/upload.controller';
import { CategoryController } from './presentation/controllers/category.controller';
import { CaptchaController } from './presentation/controllers/captcha.controller';

// ─── Repositories ───
const userRepo = new PrismaUserRepository(prisma);
const itemRepo = new PrismaItemRepository(prisma);
const offerRepo = new PrismaOfferRepository(prisma);
const chatRepo = new PrismaChatRepository(prisma);
const reviewRepo = new PrismaReviewRepository(prisma);
const categoryRepo = new PrismaCategoryRepository(prisma);
const notificationRepo = new PrismaNotificationRepository(prisma);

// ─── Infrastructure Services ───
const notificationService = new NotificationService(notificationRepo);
const uploadService = new UploadService(userRepo);

// ─── Auth Use Cases ───
const registerUseCase = new RegisterUseCase(userRepo);
const loginUseCase = new LoginUseCase(userRepo);
const logoutUseCase = new LogoutUseCase(userRepo);
const getMeUseCase = new GetMeUseCase(userRepo);

// ─── Item Use Cases ───
const getItemsUseCase = new GetItemsUseCase(itemRepo);
const getItemUseCase = new GetItemUseCase(itemRepo, offerRepo, reviewRepo);
const createItemUseCase = new CreateItemUseCase(itemRepo, categoryRepo);
const updateItemUseCase = new UpdateItemUseCase(itemRepo);
const deleteItemUseCase = new DeleteItemUseCase(itemRepo, categoryRepo);
const toggleSaveUseCase = new ToggleSaveUseCase(itemRepo);
const getSavedItemsUseCase = new GetSavedItemsUseCase(itemRepo);
const completeItemUseCase = new CompleteItemUseCase(itemRepo, offerRepo, chatRepo);

// ─── Offer Use Cases ───
// AcceptOfferUseCase and RejectOfferUseCase accept an optional ISocketService.
// Call wireSocketService(io) after socket setup to enable real-time events.
const createOfferUseCase = new CreateOfferUseCase(offerRepo, itemRepo, notificationService);
const getOffersUseCase = new GetOffersUseCase(offerRepo);
const acceptOfferUseCase = new AcceptOfferUseCase(offerRepo, chatRepo, notificationService);
const rejectOfferUseCase = new RejectOfferUseCase(offerRepo, notificationService);

// ─── Chat Use Cases ───
const getConversationsUseCase = new GetConversationsUseCase(chatRepo);
const getMessagesUseCase = new GetMessagesUseCase(chatRepo);
const sendMessageUseCase = new SendMessageUseCase(chatRepo);
const deleteMessageUseCase = new DeleteMessageUseCase(chatRepo);
const editMessageUseCase = new EditMessageUseCase(chatRepo);
const blockUserUseCase = new BlockUserUseCase(chatRepo);
const getOrCreateConversationUseCase = new GetOrCreateConversationUseCase(chatRepo);

// ─── User Use Cases ───
const getUserUseCase = new GetUserUseCase(userRepo);
const updateUserUseCase = new UpdateUserUseCase(userRepo);
const searchUsersUseCase = new SearchUsersUseCase(userRepo);

// ─── Category Use Cases ───
const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepo);

// ─── Review Use Cases ───
const createReviewUseCase = new CreateReviewUseCase(reviewRepo, userRepo);

// ─── Notification Use Cases ───
const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepo);
const markAllReadUseCase = new MarkAllReadUseCase(notificationRepo);
const markOneReadUseCase = new MarkOneReadUseCase(notificationRepo);
const deleteNotificationUseCase = new DeleteNotificationUseCase(notificationRepo);

// ─── Controllers ───
export const captchaController = new CaptchaController();

export const authController = new AuthController(
  registerUseCase,
  loginUseCase,
  logoutUseCase,
  getMeUseCase,
);

export const itemController = new ItemController(
  getItemsUseCase,
  getItemUseCase,
  createItemUseCase,
  updateItemUseCase,
  deleteItemUseCase,
  toggleSaveUseCase,
  getSavedItemsUseCase,
  completeItemUseCase,
);

export const userController = new UserController(
  searchUsersUseCase,
  getUserUseCase,
  updateUserUseCase,
);

export const offerController = new OfferController(
  createOfferUseCase,
  getOffersUseCase,
  acceptOfferUseCase,
  rejectOfferUseCase,
  captchaController,
);

export const chatController = new ChatController(
  getConversationsUseCase,
  getMessagesUseCase,
  getOrCreateConversationUseCase,
  sendMessageUseCase,
  deleteMessageUseCase,
  editMessageUseCase,
  blockUserUseCase,
);

export const reviewController = new ReviewController(createReviewUseCase);

export const notificationController = new NotificationController(
  getNotificationsUseCase,
  markAllReadUseCase,
  markOneReadUseCase,
  deleteNotificationUseCase,
);

export const uploadController = new UploadController(uploadService);

export const categoryController = new CategoryController(getCategoriesUseCase);

/**
 * Called from index.ts after socket.io Server is initialized.
 * Wires the SocketService into use-cases that need real-time events.
 */
export function wireSocketService(io: Server): void {
  const socketService = new SocketService(io);
  acceptOfferUseCase.setSocketService(socketService);
  rejectOfferUseCase.setSocketService(socketService);
}

// Export repos and services needed by socket setup
export { prisma, chatRepo, notificationRepo };
