import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { UploadService } from '../../infrastructure/services/upload.service';

export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * @swagger
   * /api/upload/item-image:
   *   post:
   *     tags: [Upload]
   *     summary: ნივთის ფოტოს ატვირთვა
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [image]
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *               sortOrder:
   *                 type: integer
   *               isPrimary:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: ფოტო ატვირთულია
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 url: { type: string }
   *                 filename: { type: string }
   *                 sortOrder: { type: integer }
   *                 isPrimary: { type: boolean }
   *       400:
   *         description: ფოტო სავალდებულოა
   */
  async uploadItemImage(req: AuthRequest, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ error: 'ფოტო სავალდებულოა' });

      const result = await this.uploadService.processItemImage(
        req.file.buffer,
        parseInt(req.body.sortOrder || '0'),
        req.body.isPrimary === 'true',
      );
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'ფოტოს ატვირთვის შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/upload/avatar:
   *   post:
   *     tags: [Upload]
   *     summary: ავატარის ატვირთვა
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [avatar]
   *             properties:
   *               avatar:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: ავატარი ატვირთულია
   */
  async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ error: 'ფოტო სავალდებულოა' });
      const result = await this.uploadService.processAvatar(req.file.buffer, req.userId!);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'ავატარის ატვირთვის შეცდომა' });
    }
  }
}
