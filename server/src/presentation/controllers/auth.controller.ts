import { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { RegisterUseCase } from '../../application/use-cases/auth/RegisterUseCase';
import type { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import type { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase';
import type { GetMeUseCase } from '../../application/use-cases/auth/GetMeUseCase';

function setTokenCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: მომხმარებლის რეგისტრაცია
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, displayName, username]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 6
   *               displayName:
   *                 type: string
   *                 minLength: 2
   *               username:
   *                 type: string
   *                 minLength: 3
   *     responses:
   *       201:
   *         description: წარმატებული რეგისტრაცია
   *       400:
   *         description: ვალიდაციის შეცდომა ან email/username დაკავებულია
   */
  async register(req: Request, res: Response) {
    try {
      const result = await this.registerUseCase.execute(req.body);
      setTokenCookie(res, result.token);
      res.status(201).json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
      res.status(err.status || 500).json({ error: err.message || 'რეგისტრაციის შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: სისტემაში შესვლა
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: წარმატებული შესვლა
   *       400:
   *         description: არასწორი მონაცემები
   */
  async login(req: Request, res: Response) {
    try {
      const result = await this.loginUseCase.execute(req.body);
      setTokenCookie(res, result.token);
      res.json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
      res.status(err.status || 500).json({ error: err.message || 'შესვლის შეცდომა' });
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: სისტემიდან გამოსვლა
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: წარმატებული გამოსვლა
   */
  async logout(req: AuthRequest, res: Response) {
    await this.logoutUseCase.execute(req.userId!);
    res.clearCookie('token');
    res.json({ message: 'გამოსვლა წარმატებულია' });
  }

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: მიმდინარე მომხმარებლის მონაცემები
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: მომხმარებლის პროფილი
   *       401:
   *         description: არ ხარ ავტორიზებული
   */
  async me(req: AuthRequest, res: Response) {
    try {
      const user = await this.getMeUseCase.execute(req.userId!);
      res.json(user);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}
