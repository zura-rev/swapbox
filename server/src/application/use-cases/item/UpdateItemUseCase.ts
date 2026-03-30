import type { IItemRepository } from '../../repositories/IItemRepository';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateItemUseCase {
  constructor(private readonly itemRepo: IItemRepository) {}

  async execute(id: string, userId: string, body: any) {
    const existing = await this.itemRepo.findByIdSimple(id);
    if (!existing) throw new AppError('ნივთი ვერ მოიძებნა', 404);
    if (existing.userId !== userId) throw new AppError('არ გაქვს უფლება', 403);

    const { title, description, type, condition, categoryId, wantsDescription, status } = body;
    return this.itemRepo.update(id, {
      ...(title && { title }),
      ...(description && { description }),
      ...(type && { type }),
      ...(condition && { condition }),
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(wantsDescription !== undefined && { wantsDescription }),
      ...(status && { status }),
    });
  }
}
