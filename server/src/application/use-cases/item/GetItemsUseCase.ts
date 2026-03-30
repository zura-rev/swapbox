import type { IItemRepository, ItemFilters } from '../../repositories/IItemRepository';

export class GetItemsUseCase {
  constructor(private readonly itemRepo: IItemRepository) {}

  async execute(filters: ItemFilters, page: number, limit: number, userId?: string) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.itemRepo.findMany(filters, skip, limit),
      this.itemRepo.count(filters),
    ]);

    let savedIds = new Set<string>();
    if (userId) {
      const saved = await this.itemRepo.getSavedIds(userId);
      savedIds = new Set(saved.map(s => s.itemId));
    }

    return {
      items: items.map(item => ({ ...item, isSaved: savedIds.has(item.id) })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
