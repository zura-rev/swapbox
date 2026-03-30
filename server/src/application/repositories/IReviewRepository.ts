export interface IReviewRepository {
  create(data: {
    reviewerId: string;
    reviewedId: string;
    rating: number;
    comment?: string;
    itemId?: string;
    offerId?: string;
  }): Promise<any>;
  aggregateRating(reviewedId: string): Promise<{ _avg: { rating: number | null }; _count: { rating: number } }>;
  findByReviewerAndItem(reviewerId: string, itemId: string): Promise<any | null>;
  findByReviewedId(reviewedId: string): Promise<any[]>;
}
