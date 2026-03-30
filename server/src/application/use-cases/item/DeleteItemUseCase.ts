import type { IItemRepository } from '../../repositories/IItemRepository';
import type { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteItemUseCase {
  constructor(
    private readonly itemRepo: IItemRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(id: string, userId: string) {
    const existing = await this.itemRepo.findByIdSimple(id);
    if (!existing) throw new AppError('ნივთი ვერ მოიძებნა', 404);
    if (existing.userId !== userId) throw new AppError('არ გაქვს უფლება', 403);

    await this.itemRepo.delete(id);
    await this.categoryRepo.updateCount(existing.categoryId, -1);
  }
}
