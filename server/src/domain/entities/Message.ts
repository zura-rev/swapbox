export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  replyToId: string | null;
  isEdited: boolean;
  deletedAt: Date | null;
  createdAt: Date;
}
