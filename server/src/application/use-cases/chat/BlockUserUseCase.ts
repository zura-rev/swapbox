import type { IChatRepository } from '../../repositories/IChatRepository';
import { AppError } from '../../../shared/errors/AppError';

export class BlockUserUseCase {
  constructor(private readonly chatRepo: IChatRepository) {}

  async block(blockerId: string, blockedId: string) {
    if (blockedId === blockerId) throw new AppError('საკუთარ თავს ვერ დაბლოკავ', 400);
    await this.chatRepo.blockUser(blockerId, blockedId);
    await this.chatRepo.closeConversationsBetween(blockerId, blockedId);
    return { blocked: true };
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.chatRepo.unblockUser(blockerId, blockedId);
    return { blocked: false };
  }

  async listBlocked(blockerId: string) {
    return this.chatRepo.listBlocked(blockerId);
  }

  async isBlocked(blockerId: string, blockedId: string) {
    const blocked = await this.chatRepo.isBlocked(blockerId, blockedId);
    return { blocked };
  }
}
