import type { IUserRepository } from '../../repositories/IUserRepository';

export class SearchUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(q: string) {
    return this.userRepo.search(q);
  }
}
