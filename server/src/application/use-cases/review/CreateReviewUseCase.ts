import type { IReviewRepository } from '../../repositories/IReviewRepository';
import type { IUserRepository } from '../../repositories/IUserRepository';
import { AppError } from '../../../shared/errors/AppError';

export class CreateReviewUseCase {
  constructor(
    private readonly reviewRepo: IReviewRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(reviewerId: string, body: {
    reviewedId: string; rating: number; comment?: string; itemId?: string; offerId?: string;
  }) {
    if (body.reviewedId === reviewerId) {
      throw new AppError('საკუთარ თავს ვერ შეაფასებ', 400);
    }

    const review = await this.reviewRepo.create({
      reviewerId,
      reviewedId: body.reviewedId,
      rating: parseInt(String(body.rating)),
      comment: body.comment,
      itemId: body.itemId,
      offerId: body.offerId,
    });

    const stats = await this.reviewRepo.aggregateRating(body.reviewedId);
    await this.userRepo.updateRating(
      body.reviewedId,
      Math.round((stats._avg.rating || 5) * 100) / 100,
      stats._count.rating,
    );

    return review;
  }

  getUserReviews(userId: string) {
    return this.reviewRepo.findByReviewedId(userId);
  }
}
