import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import Layout from '@/components/layout/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import ItemDetailPage from '@/pages/ItemDetailPage';
import NewItemPage from '@/pages/NewItemPage';
import EditItemPage from '@/pages/EditItemPage';
import ProfilePage from '@/pages/ProfilePage';
import ChatPage from '@/pages/ChatPage';
import OffersPage from '@/pages/OffersPage';
import MyItemsPage from '@/pages/MyItemsPage';
import FavoritesPage from '@/pages/FavoritesPage';

function AppInner() {
  const { fetchUser } = useAuth();
  useSocket();
  useChatNotifications();

  useEffect(() => {
    fetchUser();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/items/new" element={<PrivateRoute><NewItemPage /></PrivateRoute>} />
        <Route path="/items/:id/edit" element={<PrivateRoute><EditItemPage /></PrivateRoute>} />
        <Route path="/my-items" element={<PrivateRoute><MyItemsPage /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/offers" element={<OffersPage />} />
      </Route>
      <Route path="/auth" element={<AuthPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontSize: '14px' } }} />
      <AppInner />
    </BrowserRouter>
  );
}
