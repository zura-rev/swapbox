import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  data: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationStore {
  hasUnread: boolean;
  setHasUnread: (v: boolean) => void;
  notifications: AppNotification[];
  setNotifications: (n: AppNotification[]) => void;
  prependNotification: (n: AppNotification) => void;
  markAllRead: () => void;
  markOneRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
  chatUnreadCount: number;
  setChatUnreadCount: (n: number) => void;
  incrementChatUnread: () => void;
  clearChatUnread: () => void;
}

export const useNotifications = create<NotificationStore>((set, get) => ({
  hasUnread: false,
  setHasUnread: (v) => set({ hasUnread: v }),
  notifications: [],
  setNotifications: (notifications) => set({
    notifications,
    hasUnread: notifications.some(n => !n.isRead),
    unreadCount: notifications.filter(n => !n.isRead).length,
  }),
  prependNotification: (n) => {
    const notifications = [n, ...get().notifications];
    set({
      notifications,
      hasUnread: true,
      unreadCount: notifications.filter(x => !x.isRead).length,
    });
  },
  markAllRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, isRead: true })),
    hasUnread: false,
    unreadCount: 0,
  })),
  markOneRead: (id) => set(s => {
    const notifications = s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    return {
      notifications,
      hasUnread: notifications.some(n => !n.isRead),
      unreadCount: notifications.filter(n => !n.isRead).length,
    };
  }),
  removeNotification: (id) => set(s => {
    const notifications = s.notifications.filter(n => n.id !== id);
    return {
      notifications,
      hasUnread: notifications.some(n => !n.isRead),
      unreadCount: notifications.filter(n => !n.isRead).length,
    };
  }),
  clearAll: () => set({ notifications: [], hasUnread: false, unreadCount: 0 }),
  unreadCount: 0,
  chatUnreadCount: 0,
  setChatUnreadCount: (n) => set({ chatUnreadCount: n }),
  incrementChatUnread: () => set(s => ({ chatUnreadCount: s.chatUnreadCount + 1 })),
  clearChatUnread: () => set({ chatUnreadCount: 0 }),
}));
