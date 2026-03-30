import { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { SearchUsersUseCase } from '../../application/use-cases/user/SearchUsersUseCase';
import type { GetUserUseCase } from '../../application/use-cases/user/GetUserUseCase';
import type { UpdateUserUseCase } from '../../application/use-cases/user/UpdateUserUseCase';

export class UserController {
  constructor(
    private readonly searchUsersUseCase: SearchUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  async search(req: Request, res: Response) {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q) return res.json([]);
      const users = await this.searchUsersUseCase.execute(q);
      res.json(users);
    } catch {
      res.status(500).json({ error: 'შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     tags: [Users]
   *     summary: მომხმარებლის საჯარო პროფილი
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: მომხმარებლის პროფილი ნივთებითა და შეფასებებით
   *       404:
   *         description: მომხმარებელი ვერ მოიძებნა
   */
  async getProfile(req: Request, res: Response) {
    try {
      const user = await this.getUserUseCase.execute(req.params.id as string);
      res.json(user);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/users/me:
   *   put:
   *     tags: [Users]
   *     summary: საკუთარი პროფილის განახლება
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               displayName: { type: string }
   *               bio: { type: string }
   *               phone: { type: string }
   *               city: { type: string }
   *     responses:
   *       200:
   *         description: პროფილი განახლდა
   */
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const user = await this.updateUserUseCase.execute(req.userId!, req.body);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'პროფილის განახლების შეცდომა' });
    }
  }
}
