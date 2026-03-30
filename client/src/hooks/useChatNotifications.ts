import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSocket } from './useSocket';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import api from '@/lib/api';

const TYPE_ICONS: Record<string, string> = {
  offer_received: '📬',
  offer_accepted: '🎉',
  offer_rejected: '❌',
  new_message: '💬',
};

export function useChatNotifications() {
  const { user } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const { setHasUnread, prependNotification, setNotifications, incrementChatUnread, setChatUnreadCount } = useNotifications();
  const locationRef = useRef(location.pathname);

  useEffect(() => { locationRef.current = location.pathname; }, [location.pathname]);

  // Load initial notifications + unread message count
  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(({ data }) => setNotifications(data)).catch(() => {});
    api.get('/chat').then(({ data }) => {
      const total = data.reduce((s: number, c: any) => s + (c.unreadCount || 0), 0);
      setChatUnreadCount(total);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const setup = () => {
      const socket = getSocket();
      if (!socket) return null;

      // New message notification
      const handleChatNotify = (newMsg: any) => {
        setHasUnread(true);
        const senderName = newMsg.sender?.displayName || 'ვინმე';
        const isOnChatPage = locationRef.current.startsWith('/chat');
        if (!isOnChatPage) {
          incrementChatUnread();
          toast(`💬 ${senderName}: ${newMsg.content}`, { duration: 4000, style: { maxWidth: '320px' } });
        }
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification(`SwapBox — ${senderName}`, { body: newMsg.content, icon: '/favicon.ico' });
        }
      };

      // Persistent notification from server
      const handleNotificationNew = (notif: any) => {
        if (!['offer_received', 'offer_accepted', 'offer_rejected'].includes(notif.type)) return;
        prependNotification(notif);
        const icon = TYPE_ICONS[notif.type] || '🔔';
        if (notif.type !== 'new_message') {
          // Message toasts are handled by chat:notify already
          toast(`${icon} ${notif.title}${notif.body ? `\n${notif.body}` : ''}`, {
            duration: 5000,
            style: { maxWidth: '340px', whiteSpace: 'pre-line' },
          });
        }
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification(`SwapBox — ${notif.title}`, { body: notif.body || '', icon: '/favicon.ico' });
        }
      };

      socket.on('chat:notify', handleChatNotify);
      socket.on('notification:new', handleNotificationNew);

      return () => {
        socket.off('chat:notify', handleChatNotify);
        socket.off('notification:new', handleNotificationNew);
      };
    };

    let cleanup: (() => void) | null = setup();
    if (!cleanup) {
      const timer = setTimeout(() => { cleanup = setup(); }, 1500);
      return () => { clearTimeout(timer); cleanup?.(); };
    }
    return cleanup;
  }, [user, setHasUnread, prependNotification]);
}
