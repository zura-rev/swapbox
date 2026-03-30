import type { PrismaClient } from '@prisma/client';
import type { IUserRepository } from '../../application/repositories/IUserRepository';

const userSelect = {
  id: true, email: true, username: true, displayName: true,
  avatarUrl: true, bio: true, phone: true, city: true, role: true,
  rating: true, totalReviews: true, totalSwaps: true, totalGifts: true,
  isVerified: true, isOnline: true, createdAt: true,
} as const;

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  search(q: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, username: true, displayName: true,
        avatarUrl: true, city: true, rating: true,
        totalReviews: true, isVerified: true,
        _count: { select: { items: true } },
      },
      take: 4,
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: userSelect });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByEmailOrUsername(email: string, username: string) {
    return this.prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  }

  create(data: { email: string; password: string; username: string; displayName: string }) {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Record<string, any>) {
    return this.prisma.user.update({ where: { id }, data });
  }

  updateRating(id: string, rating: number, totalReviews: number) {
    return this.prisma.user.update({ where: { id }, data: { rating, totalReviews } });
  }

  findPublicProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, displayName: true, avatarUrl: true,
        bio: true, city: true, role: true, rating: true,
        totalReviews: true, totalSwaps: true, totalGifts: true,
        isVerified: true, isOnline: true, createdAt: true,
        items: {
          where: { status: 'active' },
          include: { images: { where: { isPrimary: true } }, category: true },
          orderBy: { createdAt: 'desc' as const },
        },
        reviewsReceived: {
          include: { reviewer: { select: { id: true, displayName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' as const },
          take: 10,
        },
      },
    });
  }
}
