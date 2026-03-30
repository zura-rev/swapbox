import type { IOfferRepository } from '../../repositories/IOfferRepository';
import type { IChatRepository } from '../../repositories/IChatRepository';
import type { INotificationService } from '../../services/INotificationService';
import type { ISocketService } from '../../services/ISocketService';
import { AppError } from '../../../shared/errors/AppError';

export class AcceptOfferUseCase {
  private socketService: ISocketService | null = null;

  constructor(
    private readonly offerRepo: IOfferRepository,
    private readonly chatRepo: IChatRepository,
    private readonly notificationService: INotificationService,
  ) {}

  setSocketService(socketService: ISocketService): void {
    this.socketService = socketService;
  }

  async execute(offerId: string, userId: string) {
    const offer = await this.offerRepo.findById(offerId);
    if (!offer) throw new AppError('შეთავაზება ვერ მოიძებნა', 404);
    if (offer.toUserId !== userId) throw new AppError('არ გაქვს უფლება', 403);
    if (offer.status !== 'pending') throw new AppError('შეთავაზება უკვე დამუშავებულია', 400);

    const conv = await this.chatRepo.findOrCreateConversation(
      offer.fromUserId,
      offer.toUserId,
      offer.itemId,
      offer.id,
    );

    const updated = await this.offerRepo.updateStatus(offerId, 'accepted');

    if (this.socketService) {
      this.socketService.emitToUser(offer.fromUserId, 'offer:accepted', {
        offerId,
        conversationId: conv.id,
        itemTitle: (offer as any).item?.title,
      });
    }

    this.notificationService.create(
      offer.fromUserId,
      'offer_accepted',
      'შეთავაზება მიღებულია!',
      `"${(offer as any).item?.title}" — ახლა შეგიძლია ჩეთი დაიწყო`,
      { offerId, conversationId: conv.id, itemTitle: (offer as any).item?.title },
    );

    return { offer: updated, conversationId: conv.id };
  }
}
