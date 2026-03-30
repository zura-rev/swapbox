export interface OfferImage {
  id: string;
  offerId: string;
  url: string;
  filename: string;
  sortOrder: number;
  createdAt: Date;
}

export interface Offer {
  id: string;
  itemId: string;
  fromUserId: string;
  toUserId: string;
  message: string | null;
  offerItemId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
