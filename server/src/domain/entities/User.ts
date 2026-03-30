export interface User {
  id: string;
  email: string;
  password: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  phone: string | null;
  city: string;
  role: string;
  rating: number;
  totalReviews: number;
  totalSwaps: number;
  totalGifts: number;
  isVerified: boolean;
  isOnline: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
