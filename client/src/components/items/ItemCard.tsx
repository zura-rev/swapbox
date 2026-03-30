import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn, timeAgo, getInitials, CONDITION_MAP, TYPE_MAP } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  item: any;
  onSaveToggle?: () => void;
}

export default function ItemCard({ item, onSaveToggle }: Props) {
  const [saved, setSaved] = useState(item.isSaved);
  const [hov, setHov] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const primaryImg = item.images?.find((i: any) => i.isPrimary) || item.images?.[0];
  const cond = CONDITION_MAP[item.condition] || CONDITION_MAP.good;
  const isGift = item.type === 'gift';

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data } = await api.post(`/items/${item.id}/save`);
      setSaved(data.saved);
      onSaveToggle?.();
    } catch {
      toast.error('შესვლა საჭიროა');
    }
  };

  return (
    <Link to={`/items/${item.id}`} className="group block h-full" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className={cn(
        'h-full flex flex-col bg-white dark:bg-gray-800/80 rounded-2xl overflow-hidden transition-all duration-300',
        'border border-transparent hover:border-gray-200 dark:hover:border-gray-700',
        hov && '-translate-y-1 shadow-lg'
      )}>
        {/* Image */}
        <div className="relative h-48 shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800">
          {primaryImg && (
            <img
              src={primaryImg.url}
              alt={item.title}
              onLoad={() => setImgLoaded(true)}
              className={cn('w-full h-full object-cover transition-all duration-500 group-hover:scale-105', imgLoaded ? 'opacity-100' : 'opacity-0')}
            />
          )}
          <span className={cn(
            'absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide text-white uppercase',
            isGift ? 'bg-gradient-to-r from-gift-500 to-gift-400' : 'bg-gradient-to-r from-brand-500 to-brand-400'
          )}>
            {TYPE_MAP[item.type]}
          </span>
          <button onClick={toggleSave} className={cn(
            'absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all backdrop-blur-sm',
            saved ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-black/40 text-gray-400 hover:text-red-500'
          )}>
            {saved ? '♥' : '♡'}
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/35 to-transparent" />
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 text-white text-[11px]">
            <div className="w-5 h-5 rounded-full bg-brand-400 flex items-center justify-center text-[8px] font-bold">
              {getInitials(item.user?.displayName || 'U')}
            </div>
            {item.user?.displayName}
          </div>
          <span className="absolute bottom-2 right-2.5 text-white/70 text-[10px]">{timeAgo(item.createdAt)}</span>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-3.5">
          <h3 className="text-sm font-semibold leading-snug line-clamp-1">{item.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
          <div className="flex items-center justify-between mt-2.5">
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cond.color }} />
              {cond.label}
            </span>
            <span className="text-[10px] text-amber-500">{'★'.repeat(Math.round(item.user?.rating || 5))} <span className="text-gray-400">{item.user?.rating}</span></span>
          </div>
          <div className="mt-2.5 min-h-[32px]">
            {item.type === 'swap' && item.wantsDescription && (
              <div className="py-1.5 px-2.5 bg-brand-400/5 dark:bg-brand-400/10 border-l-2 border-brand-400 rounded-r-lg">
                <span className="text-[10px] font-semibold text-brand-400">სანაცვლოდ: </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{item.wantsDescription}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
