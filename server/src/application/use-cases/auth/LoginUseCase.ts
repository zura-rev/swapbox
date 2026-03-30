import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { IUserRepository } from '../../repositories/IUserRepository';
import { AppError } from '../../../shared/errors/AppError';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class LoginUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(body: unknown) {
    const data = loginSchema.parse(body);

    const user = await this.userRepo.findByEmail(data.email);
    if (!user) throw new AppError('არასწორი ელ.ფოსტა ან პაროლი', 400);

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new AppError('არასწორი ელ.ფოსტა ან პაროლი', 400);

    await this.userRepo.update(user.id, { isOnline: true });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    });
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}
