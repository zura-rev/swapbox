import type { IUserRepository } from '../../repositories/IUserRepository';

export class UpdateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, body: { displayName?: string; bio?: string; phone?: string; city?: string }) {
    const { displayName, bio, phone, city } = body;
    return this.userRepo.update(userId, {
      ...(displayName && { displayName }),
      ...(bio !== undefined && { bio }),
      ...(phone !== undefined && { phone }),
      ...(city && { city }),
    });
  }
}
