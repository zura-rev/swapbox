import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn, timeAgo, CONDITION_MAP, TYPE_MAP } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MyItemsPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'swap' | 'gift'>('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    if (!user) return;
    api.get(`/users/${user.id}`)
      .then(({ data }) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    setPage(1);
    return items.filter(item => {
      const matchesSearch = !query.trim() ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.category?.nameKa?.toLowerCase().includes(query.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [items, query, filterType]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" — წაიშალოს?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/items/${id}`);
      toast.success('წაიშალა');
      setItems(p => p.filter(i => i.id !== id));
    } catch {
      toast.error('წაშლის შეცდომა');
    } finally {
      setDeletingId(null);
    }
  };

  const swapCount = items.filter(i => i.type === 'swap').length;
  const giftCount = items.filter(i => i.type === 'gift').length;
  const totalViews = items.reduce((s, i) => s + (i.viewCount || 0), 0);
  const totalSaves = items.reduce((s, i) => s + (i.saveCount || 0), 0);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold mb-1">ჩემი განცხადებები</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">განცხადებების მართვა, რედაქტირება და წაშლა</p>
      </div>

      {/* Stats row */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'სულ', value: items.length, color: 'text-gray-700 dark:text-gray-200', bg: 'bg-gray-100 dark:bg-gray-800' },
            { label: 'გაცვლა', value: swapCount, color: 'text-brand-400', bg: 'bg-brand-400/10' },
            { label: 'საჩუქარი', value: giftCount, color: 'text-gift-500', bg: 'bg-gift-500/10' },
            { label: 'ნახვა', value: totalViews, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-2xl px-4 py-3 text-center', s.bg)}>
              <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex gap-2 mb-5">
        {/* Search input */}
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="განცხადების ძებნა..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          {(['all', 'swap', 'gift'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                'px-3 py-2 text-xs font-medium transition-all',
                filterType === t
                  ? t === 'swap' ? 'bg-brand-400 text-white'
                    : t === 'gift' ? 'bg-gift-500 text-white'
                    : 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800'
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              {t === 'all' ? 'ყველა' : t === 'swap' ? '⇄' : '◈'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>

      /* Empty state */
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">განცხადებები არ გაქვთ</p>
        </div>

      /* No search results */
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3 opacity-30">🔍</div>
          <p className="text-sm">"{query}"-ს შესაბამისი განცხადება ვერ მოიძებნა</p>
          <button onClick={() => setQuery('')} className="mt-3 text-xs text-brand-400 hover:underline">გასუფთავება</button>
        </div>

      /* List */
      ) : (
        <div className="space-y-2.5">
          {paginated.map((item, idx) => {
            const img = item.images?.find((i: any) => i.isPrimary) || item.images?.[0];
            const cond = CONDITION_MAP[item.condition] || CONDITION_MAP.good;
            const isGift = item.type === 'gift';
            return (
              <div
                key={item.id}
                className="flex gap-3 bg-white dark:bg-gray-800/80 rounded-2xl p-3 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all animate-slide-up"
                style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
              >
                {/* Thumbnail */}
                <Link to={`/items/${item.id}`} className="shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {img
                    ? <img src={img.url} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center opacity-30">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      </div>
                  }
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white',
                        isGift ? 'bg-gift-500' : 'bg-brand-400'
                      )}>
                        {TYPE_MAP[item.type]}
                      </span>
                      <span className="text-[10px] text-gray-400">{item.category?.nameKa}</span>
                    </div>
                    <Link to={`/items/${item.id}`}>
                      <p className="text-sm font-semibold truncate hover:text-brand-400 transition-colors">{item.title}</p>
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cond.color }} />
                      {cond.label}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {item.viewCount || 0}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      {item.saveCount || 0}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">{timeAgo(item.createdAt)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-1.5 shrink-0 justify-center">
                  <button
                    onClick={() => nav(`/items/${item.id}/edit`)}
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center hover:bg-brand-400/10 hover:text-brand-400 transition-all"
                    title="რედაქტირება"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={deletingId === item.id}
                    className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-500 transition-all disabled:opacity-40"
                    title="წაშლა"
                  >
                    {deletingId === item.id
                      ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-gray-400">
            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >«</button>
            <button
              onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >‹</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all',
                      page === p
                        ? 'bg-brand-400 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >{p}</button>
                )
              )}

            <button
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >›</button>
            <button
              onClick={() => { setPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >»</button>
          </div>
        </div>
      )}
    </main>
  );
}
