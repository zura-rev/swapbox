import type { IOfferRepository } from '../../repositories/IOfferRepository';
import type { IItemRepository } from '../../repositories/IItemRepository';
import type { INotificationService } from '../../services/INotificationService';
import { AppError } from '../../../shared/errors/AppError';

export class CreateOfferUseCase {
  constructor(
    private readonly offerRepo: IOfferRepository,
    private readonly itemRepo: IItemRepository,
    private readonly notificationService: INotificationService,
  ) {}

  async execute(
    fromUserId: string,
    itemId: string,
    message?: string,
    images?: { url: string; filename: string; sortOrder: number }[],
  ) {
    const item = await this.itemRepo.findByIdSimple(itemId);
    if (!item) throw new AppError('ნივთი ვერ მოიძებნა', 404);
    if (item.userId === fromUserId) throw new AppError('საკუთარ ნივთზე ვერ გააკეთებ შეთავაზებას', 400);
    if (item.status !== 'active') throw new AppError('ნივთი აღარ არის აქტიური', 400);

    const existing = await this.offerRepo.findByItemAndUser(itemId, fromUserId);
    if (existing) throw new AppError('უკვე გაგზავნილი გაქვს შეთავაზება ამ ნივთზე', 409);

    const offer = await this.offerRepo.create({ itemId, fromUserId, toUserId: item.userId, message, images });
    this.offerRepo.incrementItemOfferCount(itemId);

    this.notificationService.create(
      item.userId,
      'offer_received',
      'ახალი შეთავაზება',
      `${(offer as any).fromUser?.displayName || 'ვინმე'} გაგზავნა შეთავაზება: "${item.title}"`,
      { offerId: offer.id, itemId, itemTitle: item.title },
    );

    return offer;
  }
}
