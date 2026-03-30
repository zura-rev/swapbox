export interface IOfferRepository {
  findByItemAndUser(itemId: string, fromUserId: string): Promise<any | null>;
  findById(id: string): Promise<any | null>;
  create(data: {
    itemId: string;
    fromUserId: string;
    toUserId: string;
    message?: string;
    images?: { url: string; filename: string; sortOrder: number }[];
  }): Promise<any>;
  updateStatus(id: string, status: 'accepted' | 'rejected' | 'cancelled' | 'completed'): Promise<any>;
  findReceived(toUserId: string): Promise<any[]>;
  findSent(fromUserId: string): Promise<any[]>;
  incrementItemOfferCount(itemId: string): Promise<any>;
  cancelAllForItem(itemId: string): Promise<any>;
}
