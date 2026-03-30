import type { IItemRepository } from '../../repositories/IItemRepository';
import type { ICategoryRepository } from '../../repositories/ICategoryRepository';

export class CreateItemUseCase {
  constructor(
    private readonly itemRepo: IItemRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(userId: string, body: any) {
    const { title, description, type, condition, categoryId, wantsDescription, city, images } = body;

    const item = await this.itemRepo.create({
      userId,
      title,
      description,
      type,
      condition,
      categoryId: parseInt(categoryId),
      wantsDescription: type === 'swap' ? wantsDescription : null,
      city,
      images,
    });

    await this.categoryRepo.updateCount(parseInt(categoryId), 1);
    return item;
  }
}
