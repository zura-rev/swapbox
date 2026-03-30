import { Request, Response } from 'express';
import type { GetCategoriesUseCase } from '../../application/use-cases/category/GetCategoriesUseCase';

export class CategoryController {
  constructor(private readonly getCategoriesUseCase: GetCategoriesUseCase) {}

  /**
   * @swagger
   * /api/categories:
   *   get:
   *     tags: [Categories]
   *     summary: კატეგორიების სია
   *     responses:
   *       200:
   *         description: კატეგორიების სია
   */
  async list(_req: Request, res: Response) {
    try {
      const categories = await this.getCategoriesUseCase.execute();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }
}
