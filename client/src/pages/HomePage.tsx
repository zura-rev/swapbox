import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import ItemCard from '@/components/items/ItemCard';
import { cn, timeAgo, getInitials, CONDITION_MAP, TYPE_MAP } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, { color: string; icon: React.ReactNode }> = {
  all: { color: '#6366f1', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>) },
  cars: { color: '#3b82f6', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3v-5l2.5-5h13l2.5 5v5h-2"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M5.5 12h13"/></svg>) },
  electronics: { color: '#8b5cf6', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>) },
  clothing: { color: '#ec4899', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>) },
  furniture: { color: '#f59e0b', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v3"/><path d="M2 16a2 2 0 002 2h16a2 2 0 002-2v-5a2 2 0 00-4 0v2H6v-2a2 2 0 00-4 0v5z"/><path d="M6 18v2M18 18v2"/></svg>) },
  sports: { color: '#22c55e', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="3" height="4" rx="1"/><rect x="18" y="10" width="3" height="4" rx="1"/><rect x="5" y="7.5" width="2" height="9" rx="1"/><rect x="17" y="7.5" width="2" height="9" rx="1"/><line x1="7" y1="12" x2="17" y2="12"/></svg>) },
  gaming: { color: '#a855f7', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="13" rx="3"/><path d="M7 13h2M8 12v2"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="14" r="1" fill="currentColor" stroke="none"/></svg>) },
  books: { color: '#f97316', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20"/><line x1="10" y1="7" x2="16" y2="7"/><line x1="10" y1="11" x2="14" y2="11"/></svg>) },
  kids: { color: '#ef4444', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round"/></svg>) },
  other: { color: '#64748b', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>) },
};

const TYPES = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'swap', labelKey: 'filterSwap' },
  { value: 'gift', labelKey: 'filterGift' },
];

const ALL_CAT = { id: 'all', slug: 'all', nameKa: 'ყველა' };
const LIMIT = 20;

// ─── Feed Card ────────────────────────────────────────────────────────────────
function FeedCard({ item, onSaveToggle }: { item: any; onSaveToggle: () => void }) {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(item.isSaved);
  const primaryImg = item.images?.find((i: any) => i.isPrimary) || item.images?.[0];
  const cond = CONDITION_MAP[item.condition] || CONDITION_MAP.good;
  const isGift = item.type === 'gift';

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data } = await api.post(`/items/${item.id}/save`);
      setSaved(data.saved);
      onSaveToggle();
    } catch {}
  };

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md transition-all">
      {/* User row */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
        <div className="w-9 h-9 rounded-full bg-brand-400 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
          {item.user?.avatarUrl
            ? <img src={item.user.avatarUrl} className="w-full h-full object-cover" />
            : getInitials(item.user?.displayName || 'U')
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{item.user?.displayName}</p>
          <p className="text-[11px] text-gray-400">{timeAgo(item.createdAt)} · {item.city}</p>
        </div>
        <span className={cn(
          'text-[10px] font-bold px-2.5 py-1 rounded-full text-white shrink-0',
          isGift ? 'bg-gradient-to-r from-gift-500 to-gift-400' : 'bg-gradient-to-r from-brand-500 to-brand-400'
        )}>
          {TYPE_MAP[item.type]}
        </span>
      </div>

      {/* Image */}
      <Link to={`/items/${item.id}`} className="block relative">
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
          {primaryImg
            ? <img src={primaryImg.url} alt={item.title} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center opacity-20"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>
          }
          {item.images?.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md">+{item.images.length - 1}</span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="px-4 py-3">
        <Link to={`/items/${item.id}`}>
          <h3 className="text-base font-bold leading-snug hover:text-brand-400 transition-colors mb-1">{item.title}</h3>
        </Link>
        {item.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2.5">{item.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cond.color }} />{cond.label}
          </span>
          {item.category?.nameKa && (
            <span className="text-[11px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-500">{item.category.nameKa}</span>
          )}
        </div>

        {item.type === 'swap' && item.wantsDescription && (
          <div className="py-2 px-3 bg-brand-400/5 dark:bg-brand-400/10 border-l-2 border-brand-400 rounded-r-xl mb-2.5">
            <span className="text-[11px] font-semibold text-brand-400">სანაცვლოდ: </span>
            <span className="text-[12px] text-gray-500 dark:text-gray-400">{item.wantsDescription}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {item.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              {item.saveCount || 0}
            </span>
          </div>
          <button
            onClick={toggleSave}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all',
              saved ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500'
            )}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            {saved ? t('addToFavorites') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState<any[]>([ALL_CAT]);
  const [view, setView] = useState<'grid' | 'feed'>(() =>
    (localStorage.getItem('homeView') as 'grid' | 'feed') || 'grid'
  );

  // Derive filters directly from URL — always in sync
  const cat    = searchParams.get('category') || 'all';
  const type   = searchParams.get('type')     || 'all';
  const search = searchParams.get('search')   || '';

  const setCat = (val: string) => setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    val === 'all' ? next.delete('category') : next.set('category', val);
    return next;
  }, { replace: true });

  const setType = (val: string) => setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    val === 'all' ? next.delete('type') : next.set('type', val);
    return next;
  }, { replace: true });

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Persist view preference
  const setViewPersist = (v: 'grid' | 'feed') => {
    setView(v);
    localStorage.setItem('homeView', v);
  };

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      const sorted = [...data].sort((a: any, b: any) => {
        if (a.slug === 'cars') return -1;
        if (b.slug === 'cars') return 1;
        return a.sortOrder - b.sortOrder;
      });
      setCategories([ALL_CAT, ...sorted]);
    }).catch(() => {});
  }, []);

  // Reset & fetch first page when filters change
  const fetchFirst = useCallback(async () => {
    setLoading(true);
    setItems([]);
    setPage(1);
    setHasMore(true);
    try {
      const params: any = { page: 1, limit: LIMIT };
      if (search) params.search = search;
      if (cat !== 'all') params.category = cat;
      if (type !== 'all') params.type = type;
      const { data } = await api.get('/items', { params });
      setItems(data.items);
      setTotal(data.total);
      setHasMore(data.items.length === LIMIT && data.items.length < data.total);
    } catch { setHasMore(false); }
    finally { setLoading(false); }
  }, [search, cat, type]);

  useEffect(() => { fetchFirst(); }, [fetchFirst]);

  // Load more
  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params: any = { page: nextPage, limit: LIMIT };
      if (search) params.search = search;
      if (cat !== 'all') params.category = cat;
      if (type !== 'all') params.type = type;
      const { data } = await api.get('/items', { params });
      setItems(prev => [...prev, ...data.items]);
      setPage(nextPage);
      setHasMore(data.items.length === LIMIT && items.length + data.items.length < data.total);
    } catch { setHasMore(false); }
    finally { setLoadingMore(false); }
  }, [loadingMore, hasMore, page, search, cat, type, items.length]);

  // IntersectionObserver sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) fetchMore();
    }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchMore]);

  const swaps = items.filter(i => i.type === 'swap').length;
  const gifts = items.filter(i => i.type === 'gift').length;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">

      {/* Category grid */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
        {categories.map(c => {
          const active = cat === String(c.id);
          const meta = ICON_MAP[c.slug] || ICON_MAP.other;
          return (
            <button key={c.id} onClick={() => setCat(String(c.id))} className={cn(
              'flex flex-col items-center gap-2 py-3.5 rounded-2xl transition-all duration-200 outline-none',
              active ? 'bg-white dark:bg-gray-800 shadow-md scale-[1.04]' : 'hover:bg-white/60 dark:hover:bg-gray-800/50 hover:scale-[1.02]'
            )}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5 transition-all duration-200"
                style={{ background: active ? meta.color : `${meta.color}18`, color: active ? '#fff' : meta.color, boxShadow: active ? `0 4px 14px ${meta.color}55` : 'none' }}>
                {meta.icon}
              </div>
              <span className="text-[9.5px] font-semibold leading-tight text-center w-full px-1 truncate" style={{ color: active ? meta.color : undefined }}>
                {active ? c.nameKa : <span className="text-gray-500 dark:text-gray-400">{c.nameKa}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1">
          {TYPES.map(typeOpt => (
            <button key={typeOpt.value} onClick={() => setType(typeOpt.value)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              type === typeOpt.value ? 'bg-brand-400 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}>{t(typeOpt.labelKey)}</button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 text-xs">
            <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">{total} ნივთი</span>
            <span className="px-2 py-1 rounded-lg bg-brand-400/10 text-brand-400 font-medium">⇄ {swaps}</span>
            <span className="px-2 py-1 rounded-lg bg-gift-500/10 text-gift-500 font-medium">◈ {gifts}</span>
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <button onClick={() => setViewPersist('grid')} title="გრიდი" className={cn(
              'w-8 h-8 flex items-center justify-center transition-all',
              view === 'grid' ? 'bg-brand-400 text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            )}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button onClick={() => setViewPersist('feed')} title="ლენტა" className={cn(
              'w-8 h-8 flex items-center justify-center transition-all',
              view === 'feed' ? 'bg-brand-400 text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            )}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3 opacity-30">◇</div>
          <p className="text-sm">{t('noItems')}</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
          {items.map((item, i) => (
            <div key={item.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: 'both' }}>
              <ItemCard item={item} onSaveToggle={fetchFirst} />
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-4">
          {items.map((item, i) => (
            <div key={item.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: 'both' }}>
              <FeedCard item={item} onSaveToggle={fetchFirst} />
            </div>
          ))}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more spinner */}
      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* End of list */}
      {!loading && !hasMore && items.length > 0 && (
        <p className="text-center text-xs text-gray-400 py-6">ყველა {total} ნივთი ნაჩვენებია</p>
      )}
    </main>
  );
}
