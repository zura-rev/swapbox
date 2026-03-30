export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  itemId: string | null;
  lastMessageText: string | null;
  lastMessageAt: Date;
  createdAt: Date;
  status: string;
  offerId: string | null;
}
