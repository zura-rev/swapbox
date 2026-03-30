import type { IUserRepository } from '../../repositories/IUserRepository';
import { AppError } from '../../../shared/errors/AppError';

export class GetUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string) {
    const user = await this.userRepo.findPublicProfile(id);
    if (!user) throw new AppError('მომხმარებელი ვერ მოიძებნა', 404);
    return user;
  }
}
