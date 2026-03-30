import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { cn, CONDITION_MAP, categoryName } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CONDITIONS = Object.entries(CONDITION_MAP);

export default function EditItemPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'swap' | 'gift'>('swap');
  const [condition, setCondition] = useState('good');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [wants, setWants] = useState('');

  // existing images (already uploaded)
  const [existingImages, setExistingImages] = useState<any[]>([]);
  // new files to upload
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/items/${id}`),
      api.get('/categories'),
    ]).then(([{ data: item }, { data: cats }]) => {
      setTitle(item.title);
      setDescription(item.description || '');
      setType(item.type);
      setCondition(item.condition);
      setCategoryId(item.categoryId);
      setWants(item.wantsDescription || '');
      setExistingImages(item.images || []);
      setCategories(cats);
      setLoading(false);
    }).catch(() => nav('/'));
  }, [id]);

  const totalImages = existingImages.length + newFiles.length;

  const removeExisting = (imgId: number) => {
    setExistingImages(p => p.filter((i: any) => i.id !== imgId));
  };

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    const arr = Array.from(fl).slice(0, 5 - totalImages);
    setNewFiles(p => [...p, ...arr]);
    setNewPreviews(p => [...p, ...arr.map(f => URL.createObjectURL(f))]);
  };

  const removeNew = (i: number) => {
    URL.revokeObjectURL(newPreviews[i]);
    setNewFiles(p => p.filter((_, idx) => idx !== i));
    setNewPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('სახელი სავალდებულოა'); return; }
    if (totalImages === 0) { toast.error('მინიმუმ 1 ფოტო'); return; }

    setSaving(true);
    try {
      // Upload new images
      const uploaded: any[] = [];
      for (let i = 0; i < newFiles.length; i++) {
        const fd = new FormData();
        fd.append('image', newFiles[i]);
        fd.append('sortOrder', String(existingImages.length + i));
        fd.append('isPrimary', String(existingImages.length === 0 && i === 0));
        const { data } = await api.post('/upload/item-image', fd);
        uploaded.push(data);
      }

      await api.put(`/items/${id}`, {
        title, description, type, condition, categoryId,
        wantsDescription: type === 'swap' ? wants : null,
        existingImageIds: existingImages.map((i: any) => i.id),
        newImages: uploaded,
      });

      toast.success('განცხადება განახლდა!');
      nav(`/items/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'შეცდომა');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all';

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">‹</button>
        <h1 className="text-xl font-bold">{t('editItemTitle')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photos */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">ფოტოები ({totalImages}/5)</label>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => addFiles(e.target.files)} className="hidden" />
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((img: any, i: number) => (
              <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img src={img.url} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExisting(img.id)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center">✕</button>
                {i === 0 && <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-brand-400 text-white text-[9px] font-bold">მთავარი</span>}
              </div>
            ))}
            {newPreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img src={src} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNew(i)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center">✕</button>
              </div>
            ))}
            {totalImages < 5 && (
              <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 hover:border-brand-400 transition-colors">
                <span className="text-2xl opacity-30">📷</span>
                <span className="text-[10px] text-gray-400">ატვირთვა</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('titleField')}</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} required />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('descriptionField')}</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className={cn(inputCls, 'resize-y')} required />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">{t('typeField')}</label>
          <div className="grid grid-cols-2 gap-2">
            {([{ v: 'swap', l: '⇄ გაცვლა', c: 'brand' }, { v: 'gift', l: '◈ საჩუქარი', c: 'gift' }] as const).map(t => (
              <button key={t.v} type="button" onClick={() => setType(t.v)} className={cn(
                'py-3 rounded-xl border-2 text-sm font-semibold transition-all',
                type === t.v
                  ? t.c === 'brand' ? 'border-brand-400 bg-brand-400/10 text-brand-400' : 'border-gift-500 bg-gift-500/10 text-gift-500'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500'
              )}>{t.l}</button>
            ))}
          </div>
        </div>

        {type === 'swap' && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">რა გინდა სანაცვლოდ?</label>
            <input value={wants} onChange={e => setWants(e.target.value)} className={inputCls} />
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

        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-brand-400 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50">
          {saving ? t('saving') : t('saveBtn')}
        </button>
      </form>
    </main>
  );
}
