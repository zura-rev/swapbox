import { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { CreateReviewUseCase } from '../../application/use-cases/review/CreateReviewUseCase';

export class ReviewController {
  constructor(private readonly createReviewUseCase: CreateReviewUseCase) {}

  /**
   * @swagger
   * /api/reviews:
   *   post:
   *     tags: [Reviews]
   *     summary: შეფასების დამატება
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [reviewedId, rating]
   *             properties:
   *               reviewedId: { type: string }
   *               rating: { type: integer, minimum: 1, maximum: 5 }
   *               comment: { type: string }
   *               itemId: { type: string }
   *               offerId: { type: string }
   *     responses:
   *       201:
   *         description: შეფასება დამატებულია
   *       400:
   *         description: საკუთარ თავს ვერ შეაფასებ
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const review = await this.createReviewUseCase.execute(req.userId!, req.body);
      res.status(201).json(review);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეფასების შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/reviews/user/{id}:
   *   get:
   *     tags: [Reviews]
   *     summary: მომხმარებლის შეფასებები
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: შეფასებების სია
   */
  async getUserReviews(req: Request, res: Response) {
    try {
      const reviews = await this.createReviewUseCase.getUserReviews(req.params.id as string);
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }
}
