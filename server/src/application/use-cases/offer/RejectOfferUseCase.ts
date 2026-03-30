import type { IOfferRepository } from '../../repositories/IOfferRepository';
import type { INotificationService } from '../../services/INotificationService';
import type { ISocketService } from '../../services/ISocketService';
import { AppError } from '../../../shared/errors/AppError';

export class RejectOfferUseCase {
  private socketService: ISocketService | null = null;

  constructor(
    private readonly offerRepo: IOfferRepository,
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

    const updated = await this.offerRepo.updateStatus(offerId, 'rejected');

    if (this.socketService) {
      this.socketService.emitToUser(offer.fromUserId, 'offer:rejected', {
        offerId,
        itemTitle: (offer as any).item?.title,
      });
    }

    this.notificationService.create(
      offer.fromUserId,
      'offer_rejected',
      'შეთავაზება უარყოფილია',
      `"${(offer as any).item?.title}" — შეთავაზება არ იქნა მიღებული`,
      { offerId, itemTitle: (offer as any).item?.title },
    );

    return updated;
  }
}
