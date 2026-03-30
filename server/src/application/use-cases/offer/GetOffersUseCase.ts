import type { IOfferRepository } from '../../repositories/IOfferRepository';

export class GetOffersUseCase {
  constructor(private readonly offerRepo: IOfferRepository) {}

  listReceived(userId: string) {
    return this.offerRepo.findReceived(userId);
  }

  listSent(userId: string) {
    return this.offerRepo.findSent(userId);
  }
}
