import type { PrismaClient } from '@prisma/client';
import type { ICategoryRepository } from '../../application/repositories/ICategoryRepository';

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  updateCount(id: number, delta: 1 | -1) {
    return this.prisma.category.update({
      where: { id },
      data: { itemCount: delta === 1 ? { increment: 1 } : { decrement: 1 } },
    }).catch(() => {});
  }
}
