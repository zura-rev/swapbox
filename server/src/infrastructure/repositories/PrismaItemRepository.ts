import type { PrismaClient } from '@prisma/client';
import type { IItemRepository, ItemFilters } from '../../application/repositories/IItemRepository';

const itemUserSelect = {
  id: true, username: true, displayName: true,
  avatarUrl: true, rating: true, totalReviews: true,
  isVerified: true, isOnline: true,
} as const;

export class PrismaItemRepository implements IItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(filters: ItemFilters, skip: number, take: number) {
    const where = this._buildWhere(filters);
    const orderBy = this._buildOrderBy(filters.sort);

    return this.prisma.item.findMany({
      where,
      include: {
        user: { select: itemUserSelect },
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { savedBy: true, offers: true } },
      },
      orderBy: [{ isPromoted: 'desc' }, orderBy],
      skip,
      take,
    });
  }

  count(filters: ItemFilters) {
    return this.prisma.item.count({ where: this._buildWhere(filters) });
  }

  findById(id: string) {
    return this.prisma.item.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, username: true, displayName: true,
            avatarUrl: true, bio: true, rating: true,
            totalReviews: true, totalSwaps: true, totalGifts: true,
            isVerified: true, isOnline: true, createdAt: true,
          },
        },
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          include: {
            reviewer: { select: { id: true, displayName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  findByIdSimple(id: string) {
    return this.prisma.item.findUnique({ where: { id } });
  }

  create(data: {
    userId: string; title: string; description: string; type: string;
    condition: string; categoryId: number; wantsDescription?: string | null;
    city?: string;
    images?: { url: string; filename: string; sortOrder: number; isPrimary: boolean }[];
  }) {
    return this.prisma.item.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        type: data.type as any,
        condition: data.condition as any,
        categoryId: data.categoryId,
        wantsDescription: data.wantsDescription ?? null,
        city: data.city || 'თბილისი',
        images: data.images?.length ? { create: data.images } : undefined,
      },
      include: { user: true, category: true, images: true },
    });
  }

  update(id: string, data: Record<string, any>) {
    return this.prisma.item.update({
      where: { id },
      data,
      include: { user: true, category: true, images: true },
    });
  }

  delete(id: string) {
    return this.prisma.item.delete({ where: { id } });
  }

  incrementViewCount(id: string) {
    return this.prisma.item.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  }

  findSaved(userId: string, itemId: string) {
    return this.prisma.savedItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
  }

  getSavedIds(userId: string) {
    return this.prisma.savedItem.findMany({ where: { userId }, select: { itemId: true } });
  }

  createSaved(userId: string, itemId: string) {
    return this.prisma.savedItem.create({ data: { userId, itemId } });
  }

  deleteSaved(userId: string, itemId: string) {
    return this.prisma.savedItem.delete({ where: { userId_itemId: { userId, itemId } } });
  }

  getSavedItems(userId: string) {
    return this.prisma.savedItem.findMany({
      where: { userId },
      include: {
        item: {
          include: {
            user: { select: itemUserSelect },
            category: true,
            images: { orderBy: { sortOrder: 'asc' } },
            _count: { select: { savedBy: true, offers: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateSaveCount(id: string, delta: 1 | -1) {
    return this.prisma.item.update({
      where: { id },
      data: { saveCount: delta === 1 ? { increment: 1 } : { decrement: 1 } },
    }).catch(() => {});
  }

  private _buildWhere(filters: ItemFilters) {
    const where: any = { status: 'active' };
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { wantsDescription: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { category: { nameKa: { contains: filters.search, mode: 'insensitive' } } },
        { category: { nameEn: { contains: filters.search, mode: 'insensitive' } } },
        { category: { nameRu: { contains: filters.search, mode: 'insensitive' } } },
        { user: { displayName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { username: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    if (filters.category && filters.category !== 'all') where.categoryId = Number(filters.category);
    if (filters.type && filters.type !== 'all') where.type = filters.type;
    if (filters.condition) where.condition = filters.condition;
    if (filters.city) where.city = filters.city;
    return where;
  }

  private _buildOrderBy(sort?: string) {
    if (sort === 'oldest') return { createdAt: 'asc' as const };
    if (sort === 'popular') return { viewCount: 'desc' as const };
    return { createdAt: 'desc' as const };
  }
}
