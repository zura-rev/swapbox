import type { PrismaClient } from '@prisma/client';
import type { IReviewRepository } from '../../application/repositories/IReviewRepository';

const reviewerSelect = { id: true, displayName: true, avatarUrl: true } as const;

export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: {
    reviewerId: string; reviewedId: string; rating: number;
    comment?: string; itemId?: string; offerId?: string;
  }) {
    return this.prisma.review.create({
      data: {
        reviewerId: data.reviewerId,
        reviewedId: data.reviewedId,
        rating: data.rating,
        comment: data.comment,
        itemId: data.itemId || null,
        offerId: data.offerId || null,
      },
      include: { reviewer: { select: reviewerSelect } },
    });
  }

  aggregateRating(reviewedId: string) {
    return this.prisma.review.aggregate({
      where: { reviewedId },
      _avg: { rating: true },
      _count: { rating: true },
    });
  }

  findByReviewerAndItem(reviewerId: string, itemId: string) {
    return this.prisma.review.findFirst({ where: { reviewerId, itemId } });
  }

  findByReviewedId(reviewedId: string) {
    return this.prisma.review.findMany({
      where: { reviewedId },
      include: { reviewer: { select: reviewerSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
