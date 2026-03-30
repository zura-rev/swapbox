export interface Review {
  id: string;
  reviewerId: string;
  reviewedId: string;
  offerId: string | null;
  itemId: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
}
