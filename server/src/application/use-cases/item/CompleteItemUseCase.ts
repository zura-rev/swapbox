import type { IItemRepository } from '../../repositories/IItemRepository';
import type { IOfferRepository } from '../../repositories/IOfferRepository';
import type { IChatRepository } from '../../repositories/IChatRepository';
import { AppError } from '../../../shared/errors/AppError';

export class CompleteItemUseCase {
  constructor(
    private readonly itemRepo: IItemRepository,
    private readonly offerRepo: IOfferRepository,
    private readonly chatRepo: IChatRepository,
  ) {}

  async execute(id: string, userId: string) {
    const existing = await this.itemRepo.findByIdSimple(id);
    if (!existing) throw new AppError('ნივთი ვერ მოიძებნა', 404);
    if (existing.userId !== userId) throw new AppError('არ გაქვს უფლება', 403);
    if (existing.status !== 'active' && existing.status !== 'reserved') {
      throw new AppError('ნივთი უკვე დასრულებულია', 400);
    }

    await this.itemRepo.update(id, { status: 'completed' });
    await this.offerRepo.cancelAllForItem(id);
    await this.chatRepo.closeConversationsByItemId(id);

    return { success: true };
  }
}
