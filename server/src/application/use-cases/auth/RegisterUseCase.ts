import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { IUserRepository } from '../../repositories/IUserRepository';
import { AppError } from '../../../shared/errors/AppError';

export const registerSchema = z.object({
  email: z.string().email('არასწორი ელ.ფოსტა'),
  password: z.string().min(6, 'მინიმუმ 6 სიმბოლო'),
  displayName: z.string().min(2, 'მინიმუმ 2 სიმბოლო'),
  username: z.string().min(3, 'მინიმუმ 3 სიმბოლო').regex(/^[a-zA-Z0-9_]+$/, 'მხოლოდ ლათინური ასოები და ციფრები'),
});

export class RegisterUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(body: unknown) {
    const data = registerSchema.parse(body);

    const existing = await this.userRepo.findByEmailOrUsername(data.email, data.username);
    if (existing) {
      throw new AppError(
        existing.email === data.email ? 'ელ.ფოსტა უკვე რეგისტრირებულია' : 'Username დაკავებულია',
        400,
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await this.userRepo.create({
      email: data.email,
      password: hashedPassword,
      username: data.username,
      displayName: data.displayName,
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    });
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}
