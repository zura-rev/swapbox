export interface INotificationRepository {
  create(userId: string, type: string, title: string, body?: string, data?: object): Promise<any>;
  list(userId: string): Promise<any[]>;
  deleteOne(id: string, userId: string): Promise<any>;
  deleteAll(userId: string): Promise<any>;
  markAllRead(userId: string): Promise<any>;
  markOneRead(id: string, userId: string): Promise<any>;
  unreadCount(userId: string): Promise<number>;
}
