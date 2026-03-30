import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  city: string;
  role: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  token: string | null;
  fetchUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; username: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  token: localStorage.getItem('token'),

  fetchUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, loading: false });
    } catch {
      set({ user: null, loading: false });
      localStorage.removeItem('token');
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token });
  },

  register: async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token });
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
