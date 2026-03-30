import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { getInitials, timeAgo, cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/i18n/config';

// ── Recent searches helpers ────────────────────────────────────────────────────
const RECENT_KEY = 'swapbox_recent_searches';
const MAX_RECENT = 8;
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function addRecent(q: string) {
  const prev = getRecent().filter(s => s !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}
function removeRecent(q: string) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter(s => s !== q)));
}

// ── Notification type config ──────────────────────────────────────────────────
const NOTIF_CONFIG: Record<string, { icon: string; color: string }> = {
  offer_received: { icon: '📬', color: 'bg-brand-400/10 text-brand-400' },
  offer_accepted: { icon: '🎉', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  offer_rejected: { icon: '❌', color: 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
  new_message:    { icon: '💬', color: 'bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400' },
};

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const { t } = useTranslation();
  const nav = useNavigate();

  // popup shows only unread offer notifications
  const unread = notifications.filter(n => !n.isRead);

  const handleClick = (notif: any) => {
    markOneRead(notif.id);
    api.patch(`/notifications/${notif.id}/read`).catch(() => {});
    onClose();
    if (notif.type === 'offer_accepted' && notif.data?.conversationId) {
      nav(`/chat?open=${notif.data.conversationId}`);
    } else {
      nav('/offers');
    }
  };

  const handleMarkAll = () => {
    markAllRead();
    api.patch('/notifications/read-all').catch(() => {});
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{t('notifications')}</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={handleMarkAll} className="text-xs text-brand-400 hover:text-brand-500 font-medium transition-colors">
            {t('markAllRead')}
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
        {unread.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-3xl mb-2">🔔</div>
            <p className="text-sm text-gray-400">{t('noNotifications')}</p>
          </div>
        ) : (
          unread.map(notif => {
            const cfg = NOTIF_CONFIG[notif.type] || { icon: '🔔', color: 'bg-gray-100 text-gray-500' };
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors bg-brand-400/5 dark:bg-brand-400/5"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{notif.title}</p>
                  {notif.body && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0 mt-1.5" />
              </button>
            );
          })
        )}
      </div>

    </div>
  );
}

// ── Search Dropdown (Facebook-style) ─────────────────────────────────────────
interface SearchDropdownProps {
  query: string;
  onSelect: (path: string, term?: string) => void;
  onClose: () => void;
}

function SearchDropdown({ query, onSelect, onClose }: SearchDropdownProps) {
  const [results, setResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => getRecent());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setUserResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [itemsRes, usersRes] = await Promise.all([
          api.get('/items', { params: { search: query, limit: 5 } }),
          api.get('/users/search', { params: { q: query } }),
        ]);
        setResults(itemsRes.data.items || []);
        setUserResults(usersRes.data || []);
      } catch {
        setResults([]); setUserResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [query]);

  const hasResults = results.length > 0 || userResults.length > 0;

  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up">

      {/* Recent searches (no query) */}
      {!query.trim() && recent.length > 0 && (
        <div className="py-1">
          <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t('recentSearches')}</p>
          {recent.map(term => (
            <div key={term} className="flex items-center gap-3 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
              <button
                className="flex-1 flex items-center gap-3 py-2.5 text-left"
                onMouseDown={e => { e.preventDefault(); onSelect(`/?search=${encodeURIComponent(term)}`, term); }}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200">{term}</span>
              </button>
              <button
                onMouseDown={e => {
                  e.preventDefault();
                  removeRecent(term);
                  setRecent(getRecent());
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-all text-sm"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state for empty query and no recents */}
      {!query.trim() && recent.length === 0 && (
        <div className="py-6 text-center text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-40">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p className="text-sm">{t('searchHint')}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-5 flex justify-center">
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {!loading && hasResults && (
        <div className="py-1 max-h-[420px] overflow-y-auto">
          {/* Items */}
          {results.length > 0 && (
            <>
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t('listings')}</p>
              {results.map((item: any) => (
                <button key={item.id}
                  onMouseDown={e => { e.preventDefault(); onSelect(`/items/${item.id}`, query); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                    {item.images?.[0]
                      ? <img src={item.images[0].url} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-base opacity-30">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 truncate">{item.category?.nameKa}{item.city ? ` · ${item.city}` : ''}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.type === 'swap' ? 'bg-brand-400/10 text-brand-400' : 'bg-gift-500/10 text-gift-500'}`}>
                    {item.type === 'swap' ? 'გაცვლა' : 'საჩუქარი'}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Users */}
          {userResults.length > 0 && (
            <>
              <p className={`px-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide ${results.length > 0 ? 'pt-3 border-t border-gray-100 dark:border-gray-700 mt-1' : 'pt-2'}`}>{t('users')}</p>
              {userResults.map((u: any) => (
                <button key={u.id}
                  onMouseDown={e => { e.preventDefault(); onSelect(`/profile/${u.id}`, query); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-400/20 shrink-0 flex items-center justify-center">
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} className="w-full h-full object-cover" alt="" />
                      : <span className="text-xs font-bold text-brand-400">{(u.displayName || u.username || '?')[0].toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold truncate">{u.displayName}</p>
                      {u.isVerified && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-brand-400">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      @{u.username}{u.city ? ` · ${u.city}` : ''}{u._count?.items != null ? ` · ${u._count.items} განცხადება` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* See all results row */}
          <div className="border-t border-gray-100 dark:border-gray-700 mt-1">
            <button
              onMouseDown={e => { e.preventDefault(); onSelect(`/?search=${encodeURIComponent(query)}`, query); }}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-brand-400">{t('allResults')} "{query}"</p>
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && query.trim() && !hasResults && (
        <div className="py-8 text-center text-gray-400">
          <p className="text-sm">"{query}" — {t('notFound')}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function Layout() {
  const { user, logout, loading } = useAuth();
  const { unreadCount, chatUnreadCount, clearChatUnread } = useNotifications();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  // Sync searchQuery from URL on navigation
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('search') || '';
    setSearchQuery(q);
  }, [location.search]);

  // Close notif panel on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  // Close search dropdown on outside click
  useEffect(() => {
    if (!searchFocused) return;
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchFocused]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // ESC closes search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchFocused(false); searchInputRef.current?.blur(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Ctrl+K / Cmd+K focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearchSelect = useCallback((path: string, term?: string) => {
    if (term?.trim()) { addRecent(term.trim()); setSearchQuery(term.trim()); }
    setSearchFocused(false);
    searchInputRef.current?.blur();
    nav(path);
  }, [nav]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addRecent(searchQuery.trim());
      setSearchFocused(false);
      searchInputRef.current?.blur();
      nav(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1c2a] text-gray-900 dark:text-gray-100 transition-colors">
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#1e1c2a]/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <rect width="34" height="34" rx="10" fill="url(#logo-g)"/>
              <defs>
                <linearGradient id="logo-g" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#5DCAA5"/>
                  <stop offset="1" stopColor="#0F6E56"/>
                </linearGradient>
              </defs>
              {/* Top arrow → */}
              <path d="M7 14.5 C7 10 27 10 27 14.5" stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
              <path d="M23 11.5 L27 14.5 L23 17.5" stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Bottom arrow ← */}
              <path d="M27 19.5 C27 24 7 24 7 19.5" stroke="rgba(255,255,255,0.75)" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
              <path d="M11 16.5 L7 19.5 L11 22.5" stroke="rgba(255,255,255,0.75)" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[15px] font-extrabold tracking-tight">
                <span className="text-brand-400">Swap</span><span className="text-gray-900 dark:text-white">Box</span>
              </span>
            </div>
          </Link>

          {/* Search input + dropdown */}
          <div ref={searchRef} className="relative flex-1">
            <form onSubmit={handleSearchSubmit}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all',
                searchFocused
                  ? 'border-brand-400/60 bg-white dark:bg-gray-800 shadow-sm shadow-brand-400/10'
                  : searchQuery
                  ? 'border-brand-400/40 bg-brand-400/5'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder={t('search')}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 min-w-0"
              />
              {searchQuery ? (
                <button type="button" onClick={() => { setSearchQuery(''); nav('/'); searchInputRef.current?.focus(); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-base leading-none shrink-0">×</button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-400 shrink-0">⌘K</kbd>
              )}
            </form>
            {searchFocused && (
              <SearchDropdown
                query={searchQuery}
                onSelect={handleSearchSelect}
                onClose={() => setSearchFocused(false)}
              />
            )}
          </div>

          {/* Language switcher */}
          <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-0.5">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={cn(
                  'px-2 py-1 rounded-lg text-[11px] font-semibold transition-all',
                  i18n.language === lang.code
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>

          {/* Theme */}
          <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {dark ? '☀️' : '🌙'}
          </button>

          {/* Notification bell */}
          {user && (
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(o => !o)}
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
                  notifOpen
                    ? 'bg-brand-400 border-brand-500 text-white shadow-md shadow-brand-400/30'
                    : unreadCount > 0
                    ? 'bg-brand-400/10 border-brand-400/30 text-brand-400 hover:bg-brand-400/20'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="შეტყობინებები"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white dark:border-[#1e1c2a] flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
            </div>
          )}

          {/* Chat icon */}
          {user && (
            <Link to="/chat" onClick={clearChatUnread} className={cn(
              'relative w-9 h-9 rounded-full flex items-center justify-center transition-all border',
              location.pathname === '/chat'
                ? 'bg-brand-400 border-brand-500 text-white shadow-md shadow-brand-400/30'
                : chatUnreadCount > 0
                ? 'bg-brand-400/10 border-brand-400/30 text-brand-400 hover:bg-brand-400/20'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            )} title="ჩატი">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {chatUnreadCount > 0 && location.pathname !== '/chat' && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white dark:border-[#1e1c2a] flex items-center justify-center">
                  {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User + Add grouped on the right */}
          {!loading && (user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => nav('/items/new')}
                className="px-3 py-1.5 rounded-xl bg-brand-400 text-white text-xs font-semibold hover:bg-brand-500 transition-colors"
              >
                <span className="hidden sm:inline">{t('add')}</span>
                <span className="sm:hidden">+</span>
              </button>
              <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="w-9 h-9 rounded-full bg-brand-400 text-white text-xs font-bold flex items-center justify-center overflow-hidden ring-2 ring-brand-400/30 hover:ring-brand-400/60 transition-all">
                {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : getInitials(user.displayName)}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden animate-slide-up">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold">{user.displayName}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">👤 {t('myProfile')}</Link>
                    <Link to="/my-items" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">📝 {t('myItems')}</Link>
                    <Link to="/favorites" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">♥ {t('favorites')}</Link>
                    <Link to="/offers" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">📋 {t('offers')}</Link>
                    <button onClick={() => { logout(); setMenuOpen(false); nav('/'); }} className="w-full text-left px-3 py-2.5 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t('logout')}</button>
                  </div>
                </>
              )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => nav('/items/new')} className="px-3 py-1.5 rounded-xl bg-brand-400 text-white text-xs font-semibold hover:bg-brand-500 transition-colors">{t('add')}</button>
              <Link to="/auth" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-400 transition-colors">{t('login')}</Link>
            </div>
          ))}
        </div>
      </header>

      <Outlet />
    </div>
  );
}
