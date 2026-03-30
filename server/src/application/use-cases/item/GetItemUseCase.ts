import type { IItemRepository } from '../../repositories/IItemRepository';
import type { IOfferRepository } from '../../repositories/IOfferRepository';
import type { IReviewRepository } from '../../repositories/IReviewRepository';
import { AppError } from '../../../shared/errors/AppError';

export class GetItemUseCase {
  constructor(
    private readonly itemRepo: IItemRepository,
    private readonly offerRepo: IOfferRepository,
    private readonly reviewRepo: IReviewRepository,
  ) {}

  async execute(id: string, userId?: string) {
    const item = await this.itemRepo.findById(id);
    if (!item) throw new AppError('ნივთი ვერ მოიძებნა', 404);

    this.itemRepo.incrementViewCount(id);

    let isSaved = false;
    let hasOffer = false;
    let hasReviewed = false;
    if (userId) {
      const [saved, offer, review] = await Promise.all([
        this.itemRepo.findSaved(userId, id),
        this.offerRepo.findByItemAndUser(id, userId),
        userId !== item.userId ? this.reviewRepo.findByReviewerAndItem(userId, id) : Promise.resolve(null),
      ]);
      isSaved = !!saved;
      hasOffer = !!offer;
      hasReviewed = !!review;
    }

    return { ...item, isSaved, hasOffer, hasReviewed };
  }
}
