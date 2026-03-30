import type { IUserRepository } from '../../repositories/IUserRepository';
import { AppError } from '../../../shared/errors/AppError';

export class GetMeUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('მომხმარებელი ვერ მოიძებნა', 404);
    return user;
  }
}
