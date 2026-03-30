import type { IItemRepository } from '../../repositories/IItemRepository';

export class GetSavedItemsUseCase {
  constructor(private readonly itemRepo: IItemRepository) {}

  async execute(userId: string) {
    const rows = await this.itemRepo.getSavedItems(userId);
    return rows.map(row => ({ ...row.item, isSaved: true, savedAt: row.createdAt }));
  }
}
