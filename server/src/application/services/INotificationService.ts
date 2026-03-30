export interface INotificationService {
  create(userId: string, type: string, title: string, body?: string, data?: object): Promise<any>;
}
