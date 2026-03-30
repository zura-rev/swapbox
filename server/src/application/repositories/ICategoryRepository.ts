export interface ICategoryRepository {
  findAll(): Promise<any[]>;
  updateCount(id: number, delta: 1 | -1): Promise<any>;
}
