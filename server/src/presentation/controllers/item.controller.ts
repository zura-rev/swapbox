import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { GetItemsUseCase } from '../../application/use-cases/item/GetItemsUseCase';
import type { GetItemUseCase } from '../../application/use-cases/item/GetItemUseCase';
import type { CreateItemUseCase } from '../../application/use-cases/item/CreateItemUseCase';
import type { UpdateItemUseCase } from '../../application/use-cases/item/UpdateItemUseCase';
import type { DeleteItemUseCase } from '../../application/use-cases/item/DeleteItemUseCase';
import type { ToggleSaveUseCase } from '../../application/use-cases/item/ToggleSaveUseCase';
import type { GetSavedItemsUseCase } from '../../application/use-cases/item/GetSavedItemsUseCase';
import type { CompleteItemUseCase } from '../../application/use-cases/item/CompleteItemUseCase';

export class ItemController {
  constructor(
    private readonly getItemsUseCase: GetItemsUseCase,
    private readonly getItemUseCase: GetItemUseCase,
    private readonly createItemUseCase: CreateItemUseCase,
    private readonly updateItemUseCase: UpdateItemUseCase,
    private readonly deleteItemUseCase: DeleteItemUseCase,
    private readonly toggleSaveUseCase: ToggleSaveUseCase,
    private readonly getSavedItemsUseCase: GetSavedItemsUseCase,
    private readonly completeItemUseCase: CompleteItemUseCase,
  ) {}

  /**
   * @swagger
   * /api/items:
   *   get:
   *     tags: [Items]
   *     summary: ნივთების სია ფილტრებით
   *     parameters:
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *       - in: query
   *         name: category
   *         schema: { type: string }
   *       - in: query
   *         name: type
   *         schema: { type: string, enum: [swap, gift, all] }
   *       - in: query
   *         name: condition
   *         schema: { type: string }
   *       - in: query
   *         name: city
   *         schema: { type: string }
   *       - in: query
   *         name: sort
   *         schema: { type: string, enum: [newest, oldest, popular] }
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *     responses:
   *       200:
   *         description: ნივთების სია
   */
  async list(req: AuthRequest, res: Response) {
    try {
      const { search, category, type, condition, city, sort = 'newest', page = '1', limit = '20' } =
        req.query as Record<string, string>;

      const result = await this.getItemsUseCase.execute(
        { search, category, type, condition, city, sort },
        parseInt(page),
        parseInt(limit),
        req.userId,
      );
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'ნივთების ჩატვირთვის შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/items/{id}:
   *   get:
   *     tags: [Items]
   *     summary: ნივთის დეტალები
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: ნივთის სრული ინფორმაცია
   *       404:
   *         description: ნივთი ვერ მოიძებნა
   */
  async getOne(req: AuthRequest, res: Response) {
    try {
      const item = await this.getItemUseCase.execute(req.params.id as string, req.userId);
      res.json(item);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'ნივთის ჩატვირთვის შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/items:
   *   post:
   *     tags: [Items]
   *     summary: ახალი ნივთის დამატება
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [title, description, type, condition, categoryId]
   *             properties:
   *               title: { type: string }
   *               description: { type: string }
   *               type: { type: string, enum: [swap, gift] }
   *               condition: { type: string, enum: [new, like_new, good, fair] }
   *               categoryId: { type: integer }
   *               wantsDescription: { type: string }
   *               city: { type: string }
   *               images:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     url: { type: string }
   *                     filename: { type: string }
   *                     sortOrder: { type: integer }
   *                     isPrimary: { type: boolean }
   *     responses:
   *       201:
   *         description: ნივთი დამატებულია
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const item = await this.createItemUseCase.execute(req.userId!, req.body);
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: 'ნივთის დამატების შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/items/{id}:
   *   put:
   *     tags: [Items]
   *     summary: ნივთის განახლება
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: ნივთი განახლდა
   *       403:
   *         description: არ გაქვს უფლება
   *       404:
   *         description: ნივთი ვერ მოიძებნა
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const item = await this.updateItemUseCase.execute(req.params.id as string, req.userId!, req.body);
      res.json(item);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'ნივთის განახლების შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/items/{id}:
   *   delete:
   *     tags: [Items]
   *     summary: ნივთის წაშლა
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: ნივთი წაშლილია
   *       403:
   *         description: არ გაქვს უფლება
   */
  async remove(req: AuthRequest, res: Response) {
    try {
      await this.deleteItemUseCase.execute(req.params.id as string, req.userId!);
      res.json({ message: 'წაშლილია' });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'წაშლის შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/items/{id}/save:
   *   post:
   *     tags: [Items]
   *     summary: ნივთის შენახვა / გაუქმება
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: შეიცავს saved სტატუსს
   */
  async toggleSave(req: AuthRequest, res: Response) {
    try {
      const result = await this.toggleSaveUseCase.execute(req.userId!, req.params.id as string);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  async getSaved(req: AuthRequest, res: Response) {
    try {
      const items = await this.getSavedItemsUseCase.execute(req.userId!);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  async complete(req: AuthRequest, res: Response) {
    try {
      const result = await this.completeItemUseCase.execute(req.params.id as string, req.userId!);
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }
}
