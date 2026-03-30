import type { IUserRepository } from '../../repositories/IUserRepository';

export class LogoutUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string) {
    await this.userRepo.update(userId, { isOnline: false }).catch(() => {});
  }
}
