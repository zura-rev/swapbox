import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { cn, CONDITION_MAP, categoryName } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CONDITIONS = Object.entries(CONDITION_MAP);

export default function NewItemPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'swap' | 'gift'>('swap');
  const [condition, setCondition] = useState('good');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      setCategories(data);
      if (data.length > 0) setCategoryId(data[0].id);
    }).catch(() => {});
  }, []);
  const [wants, setWants] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles).slice(0, 5 - files.length);
    setFiles(p => [...p, ...arr]);
    setPreviews(p => [...p, ...arr.map(f => URL.createObjectURL(f))]);
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error(t('titleRequired')); return; }
    if (files.length === 0) { toast.error(t('minOnePhoto')); return; }

    setLoading(true);
    try {
      // Upload images first
      const images: { url: string; filename: string; sortOrder: number; isPrimary: boolean }[] = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append('image', files[i]);
        fd.append('sortOrder', String(i));
        fd.append('isPrimary', String(i === 0));
        const { data } = await api.post('/upload/item-image', fd);
        images.push(data);
      }

      // Create item
      const { data: item } = await api.post('/items', {
        title, description, type, condition,
        categoryId, wantsDescription: type === 'swap' ? wants : undefined,
        images,
      });

      toast.success(t('itemAdded'));
      nav(`/items/${item.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all';

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">{t('newItemTitle')}</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photos */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">{t('photosLabel')} ({files.length}/5)</label>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => addFiles(e.target.files)} className="hidden" />
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img src={src} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeFile(i)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center">✕</button>
                {i === 0 && <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-brand-400 text-white text-[9px] font-bold">{t('primaryBadge')}</span>}
              </div>
            ))}
            {files.length < 5 && (
              <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 hover:border-brand-400 transition-colors">
                <span className="text-2xl opacity-30">📷</span>
                <span className="text-[10px] text-gray-400">{t('uploadPhoto')}</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('titleField')}</label>
          <input placeholder={t('titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} className={inputCls} required />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('descriptionField')}</label>
          <textarea placeholder={t('descriptionPlaceholder')} value={description} onChange={e => setDescription(e.target.value)} rows={4} className={cn(inputCls, 'resize-y')} required />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">{t('typeField')}</label>
          <div className="grid grid-cols-2 gap-2">
            {([{ v: 'swap', c: 'brand' }, { v: 'gift', c: 'gift' }] as const).map(tab => (
              <button key={tab.v} type="button" onClick={() => setType(tab.v)} className={cn(
                'py-3 rounded-xl border-2 text-sm font-semibold transition-all',
                type === tab.v
                  ? tab.c === 'brand' ? 'border-brand-400 bg-brand-400/10 text-brand-400' : 'border-gift-500 bg-gift-500/10 text-gift-500'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500'
              )}>{tab.v === 'swap' ? t('swapTypeLabel') : t('giftTypeLabel')}</button>
            ))}
          </div>
        </div>

        {type === 'swap' && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('wantsExchangeLabel')}</label>
            <input placeholder={t('wantsExchangePlaceholder')} value={wants} onChange={e => setWants(e.target.value)} className={inputCls} />
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">{t('categoryField')}</label>
          <div className="grid grid-cols-4 gap-1.5">
            {categories.map(c => (
              <button key={c.id} type="button" onClick={() => setCategoryId(c.id)} className={cn(
                'py-2 rounded-xl border text-xs font-medium transition-all text-center',
                categoryId === c.id ? 'border-brand-400 bg-brand-400/10 text-brand-400' : 'border-gray-200 dark:border-gray-700 text-gray-500'
              )}>
                <span className="block text-base mb-0.5">{c.icon}</span>{categoryName(c)}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">{t('conditionField')}</label>
          <div className="grid grid-cols-4 gap-1.5">
            {CONDITIONS.map(([key, val]) => (
              <button key={key} type="button" onClick={() => setCondition(key)} className={cn(
                'py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                condition === key ? 'border-brand-400 bg-brand-400/10 text-brand-400' : 'border-gray-200 dark:border-gray-700 text-gray-500'
              )}>
                <span className="w-2 h-2 rounded-full" style={{ background: val.color }} />{val.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-brand-400 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50">
          {loading ? t('loading') : t('publishBtn')}
        </button>
      </form>
    </main>
  );
}
