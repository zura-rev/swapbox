export interface ItemImage {
  id: string;
  itemId: string;
  url: string;
  filename: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}

export interface Item {
  id: string;
  userId: string;
  categoryId: number;
  title: string;
  description: string;
  type: string;
  condition: string;
  status: string;
  wantsDescription: string | null;
  city: string;
  viewCount: number;
  saveCount: number;
  offerCount: number;
  isPromoted: boolean;
  promotedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
