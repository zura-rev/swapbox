export interface ItemFilters {
  search?: string;
  category?: string;
  type?: string;
  condition?: string;
  city?: string;
  sort?: string;
}

export interface IItemRepository {
  findMany(filters: ItemFilters, skip: number, take: number): Promise<any[]>;
  count(filters: ItemFilters): Promise<number>;
  findById(id: string): Promise<any | null>;
  findByIdSimple(id: string): Promise<any | null>;
  create(data: {
    userId: string;
    title: string;
    description: string;
    type: string;
    condition: string;
    categoryId: number;
    wantsDescription?: string | null;
    city?: string;
    images?: { url: string; filename: string; sortOrder: number; isPrimary: boolean }[];
  }): Promise<any>;
  update(id: string, data: Record<string, any>): Promise<any>;
  delete(id: string): Promise<any>;
  incrementViewCount(id: string): Promise<any>;
  findSaved(userId: string, itemId: string): Promise<any | null>;
  getSavedIds(userId: string): Promise<{ itemId: string }[]>;
  createSaved(userId: string, itemId: string): Promise<any>;
  deleteSaved(userId: string, itemId: string): Promise<any>;
  getSavedItems(userId: string): Promise<any[]>;
  updateSaveCount(id: string, delta: 1 | -1): Promise<any>;
}
