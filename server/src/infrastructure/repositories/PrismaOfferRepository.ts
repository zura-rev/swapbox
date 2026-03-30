import type { PrismaClient } from '@prisma/client';
import type { IOfferRepository } from '../../application/repositories/IOfferRepository';

const offerInclude = {
  item: {
    select: {
      id: true, title: true, type: true,
      images: { select: { url: true }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
    },
  },
  fromUser: { select: { id: true, displayName: true, avatarUrl: true, rating: true } },
  toUser: { select: { id: true, displayName: true, avatarUrl: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
} as const;

export class PrismaOfferRepository implements IOfferRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByItemAndUser(itemId: string, fromUserId: string) {
    return this.prisma.offer.findFirst({
      where: { itemId, fromUserId, status: 'pending' },
    });
  }

  findById(id: string) {
    return this.prisma.offer.findUnique({ where: { id }, include: offerInclude });
  }

  async create(data: {
    itemId: string;
    fromUserId: string;
    toUserId: string;
    message?: string;
    images?: { url: string; filename: string; sortOrder: number }[];
  }) {
    const { images, ...offerData } = data;
    return this.prisma.offer.create({
      data: {
        ...offerData,
        ...(images && images.length > 0 ? {
          images: { create: images },
        } : {}),
      },
      include: offerInclude,
    });
  }

  updateStatus(id: string, status: 'accepted' | 'rejected' | 'cancelled' | 'completed') {
    return this.prisma.offer.update({ where: { id }, data: { status } });
  }

  findReceived(toUserId: string) {
    return this.prisma.offer.findMany({
      where: { toUserId, status: 'pending' },
      include: offerInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findSent(fromUserId: string) {
    return this.prisma.offer.findMany({
      where: { fromUserId },
      include: offerInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  incrementItemOfferCount(itemId: string) {
    return this.prisma.item.update({
      where: { id: itemId },
      data: { offerCount: { increment: 1 } },
    });
  }

  cancelAllForItem(itemId: string) {
    return this.prisma.offer.updateMany({
      where: { itemId, status: 'pending' },
      data: { status: 'cancelled' },
    });
  }
}
