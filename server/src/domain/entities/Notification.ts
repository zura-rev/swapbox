export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  data: object;
  isRead: boolean;
  createdAt: Date;
}
