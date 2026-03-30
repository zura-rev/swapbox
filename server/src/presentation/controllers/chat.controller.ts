import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { GetConversationsUseCase } from '../../application/use-cases/chat/GetConversationsUseCase';
import type { GetMessagesUseCase } from '../../application/use-cases/chat/GetMessagesUseCase';
import type { GetOrCreateConversationUseCase } from '../../application/use-cases/chat/GetOrCreateConversationUseCase';
import type { SendMessageUseCase } from '../../application/use-cases/chat/SendMessageUseCase';
import type { DeleteMessageUseCase } from '../../application/use-cases/chat/DeleteMessageUseCase';
import type { EditMessageUseCase } from '../../application/use-cases/chat/EditMessageUseCase';
import type { BlockUserUseCase } from '../../application/use-cases/chat/BlockUserUseCase';

export class ChatController {
  constructor(
    private readonly getConversationsUseCase: GetConversationsUseCase,
    private readonly getMessagesUseCase: GetMessagesUseCase,
    private readonly getOrCreateConversationUseCase: GetOrCreateConversationUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly deleteMessageUseCase: DeleteMessageUseCase,
    private readonly editMessageUseCase: EditMessageUseCase,
    private readonly blockUserUseCase: BlockUserUseCase,
  ) {}

  /**
   * @swagger
   * /api/chat:
   *   get:
   *     tags: [Chat]
   *     summary: საუბრების სია
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: მიმდინარე მომხმარებლის საუბრები
   */
  async list(req: AuthRequest, res: Response) {
    try {
      const conversations = await this.getConversationsUseCase.execute(req.userId!);
      res.json(conversations);
    } catch (err) {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/chat/{id}/messages:
   *   get:
   *     tags: [Chat]
   *     summary: საუბრის შეტყობინებები
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: შეტყობინებების სია
   *       403:
   *         description: არ გაქვს წვდომა
   */
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const messages = await this.getMessagesUseCase.execute(req.params.id as string, req.userId!);
      res.json(messages);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/chat:
   *   post:
   *     tags: [Chat]
   *     summary: საუბრის შექმნა ან არსებულის მოძებნა
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [otherUserId]
   *             properties:
   *               otherUserId: { type: string }
   *               itemId: { type: string }
   *     responses:
   *       200:
   *         description: საუბარი
   */
  async getOrCreate(req: AuthRequest, res: Response) {
    try {
      const { otherUserId, itemId } = req.body;
      if (!otherUserId) return res.status(400).json({ error: 'otherUserId საჭიროა' });
      const conv = await this.getOrCreateConversationUseCase.execute(req.userId!, otherUserId, itemId);
      res.json(conv);
    } catch (err: any) {
      console.error('getOrCreate error:', err);
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/chat/{id}/messages:
   *   post:
   *     tags: [Chat]
   *     summary: შეტყობინების გაგზავნა (REST fallback)
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [content]
   *             properties:
   *               content: { type: string }
   *     responses:
   *       201:
   *         description: შეტყობინება გაიგზავნა
   */
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const message = await this.sendMessageUseCase.execute(req.params.id as string, req.userId!, req.body.content, req.body.replyToId);
      res.status(201).json(message);
    } catch (err) {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  async deleteMessage(req: AuthRequest, res: Response) {
    try {
      await this.deleteMessageUseCase.execute(req.params.msgId as string, req.userId!);
      res.json({ deleted: true });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }

  async editMessage(req: AuthRequest, res: Response) {
    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'content სავალდებულოა' });
      await this.editMessageUseCase.execute(req.params.msgId as string, req.userId!, content.trim());
      res.json({ edited: true });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }

  async blockUser(req: AuthRequest, res: Response) {
    try {
      const targetId = req.params.userId as string;
      const result = await this.blockUserUseCase.block(req.userId!, targetId);
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }

  async unblockUser(req: AuthRequest, res: Response) {
    try {
      const targetId = req.params.userId as string;
      const result = await this.blockUserUseCase.unblock(req.userId!, targetId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  async listBlocked(req: AuthRequest, res: Response) {
    try {
      const users = await this.blockUserUseCase.listBlocked(req.userId!);
      res.json(users);
    } catch {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  async isBlocked(req: AuthRequest, res: Response) {
    try {
      const targetId = req.params.userId as string;
      const result = await this.blockUserUseCase.isBlocked(req.userId!, targetId);
      res.json(result);
    } catch {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }
}
