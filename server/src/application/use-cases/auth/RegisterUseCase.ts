import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { IUserRepository } from '../../repositories/IUserRepository';
import { AppError } from '../../../shared/errors/AppError';

export const registerSchema = z.object({
  email: z.string().email('არასწორი ელ.ფოსტა'),
  password: z.string().min(6, 'მინიმუმ 6 სიმბოლო'),
  displayName: z.string().min(2, 'მინიმუმ 2 სიმბოლო'),
});

function generateUsername(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export class RegisterUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(body: unknown) {
    const data = registerSchema.parse(body);

    const existingByEmail = await this.userRepo.findByEmailOrUsername(data.email, data.email);
    if (existingByEmail && existingByEmail.email === data.email) {
      throw new AppError('ელ.ფოსტა უკვე რეგისტრირებულია', 400);
    }

    // Auto-generate unique username from email prefix
    let username = generateUsername(data.email);
    let attempt = 0;
    while (await this.userRepo.findByEmailOrUsername('', username)) {
      attempt++;
      username = `${generateUsername(data.email)}_${attempt}`;
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await this.userRepo.create({
      email: data.email,
      password: hashedPassword,
      username,
      displayName: data.displayName,
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    });
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}
