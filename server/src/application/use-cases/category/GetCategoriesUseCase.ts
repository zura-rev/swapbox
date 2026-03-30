import type { ICategoryRepository } from '../../repositories/ICategoryRepository';

export class GetCategoriesUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute() {
    return this.categoryRepo.findAll();
  }
}
