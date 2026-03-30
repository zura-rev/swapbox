import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn, timeAgo, getInitials, CONDITION_MAP, typeLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

function FavoriteCard({ item, onRemove }: { item: any; onRemove: () => void }) {
  const { t } = useTranslation();
  const [removing, setRemoving] = useState(false);
  const primaryImg = item.images?.find((i: any) => i.isPrimary) || item.images?.[0];
  const cond = CONDITION_MAP[item.condition] || CONDITION_MAP.good;
  const isGift = item.type === 'gift';

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(true);
    try {
      await api.post(`/items/${item.id}/save`);
      onRemove();
      toast.success(t('removedFromFavoritesToast'));
    } catch {
      setRemoving(false);
    }
  };

  return (
    <Link to={`/items/${item.id}`} className="group block">
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
          {primaryImg
            ? <img src={primaryImg.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center opacity-20"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>
          }
          {/* Type badge */}
          <span className={cn(
            'absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase',
            isGift ? 'bg-gradient-to-r from-gift-500 to-gift-400' : 'bg-gradient-to-r from-brand-500 to-brand-400'
          )}>{typeLabel(item.type)}</span>

          {/* Remove button */}
          <button
            onClick={handleRemove}
            disabled={removing}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-sm transition-all shadow"
            title={t('removeFromFavorites')}
          >
            {removing ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '♥'}
          </button>

          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 text-white text-[11px]">
            <div className="w-5 h-5 rounded-full bg-brand-400 flex items-center justify-center text-[8px] font-bold overflow-hidden">
              {item.user?.avatarUrl
                ? <img src={item.user.avatarUrl} className="w-full h-full object-cover" />
                : getInitials(item.user?.displayName || 'U')}
            </div>
            {item.user?.displayName}
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5">
          <h3 className="text-sm font-semibold leading-snug line-clamp-1 mb-1">{item.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2.5">{item.description}</p>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cond.color }} />
              {t(cond.tKey)}
            </span>
            <span className="text-[10px] text-gray-400">{item.city}</span>
          </div>
          {item.savedAt && (
            <p className="text-[10px] text-gray-400 mt-2">{t('savedAt')} {timeAgo(item.savedAt)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get('/items/saved')
      .then(({ data }) => setItems(data))
      .catch(() => toast.error(t('loadError')))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = search.trim()
    ? items.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase()) ||
        i.city?.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 text-lg">♥</span>
            {t('favoritesTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? t('loading') : t('savedListingsCount', { n: items.length })}
          </p>
        </div>
      </div>

      {/* Search */}
      {!loading && items.length > 0 && (
        <div className="relative mb-6 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchFavorites')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center text-4xl mb-4">♡</div>
          <h2 className="text-lg font-semibold mb-2">{t('noFavorites')}</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">{t('tapToFavorite')}</p>
          <Link to="/" className="px-5 py-2.5 rounded-xl bg-brand-400 text-white text-sm font-semibold hover:bg-brand-500 transition-colors">
            {t('browsListings')}
          </Link>
        </div>
      )}

      {/* No search results */}
      {!loading && items.length > 0 && filtered.length === 0 && (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm">{t('notFoundQuery', { query: search })}</p>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <FavoriteCard
              key={item.id}
              item={item}
              onRemove={() => setItems(prev => prev.filter(i => i.id !== item.id))}
            />
          ))}
        </div>
      )}
    </main>
  );
}
