import type { IItemRepository } from '../../repositories/IItemRepository';

export class ToggleSaveUseCase {
  constructor(private readonly itemRepo: IItemRepository) {}

  async execute(userId: string, itemId: string) {
    const existing = await this.itemRepo.findSaved(userId, itemId);
    if (existing) {
      await this.itemRepo.deleteSaved(userId, itemId);
      this.itemRepo.updateSaveCount(itemId, -1);
      return { saved: false };
    } else {
      await this.itemRepo.createSaved(userId, itemId);
      this.itemRepo.updateSaveCount(itemId, 1);
      return { saved: true };
    }
  }
}
