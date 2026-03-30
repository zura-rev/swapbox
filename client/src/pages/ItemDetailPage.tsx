import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo, getInitials, CONDITION_MAP, TYPE_MAP, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({ images, startIndex, onClose }: {
  images: any[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const isDragging = useRef(false);

  const prev = () => { setIdx(i => (i - 1 + images.length) % images.length); resetZoom(); };
  const next = () => { setIdx(i => (i + 1) % images.length); resetZoom(); };
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(4, Math.max(1, z - e.deltaY * 0.001)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    isDragging.current = true;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
    });
  };

  const handleMouseUp = () => { dragRef.current = null; };

  const handleImgClick = () => {
    if (!isDragging.current) {
      setZoom(z => z > 1 ? 1 : 2);
      if (zoom > 1) setPan({ x: 0, y: 0 });
    }
    isDragging.current = false;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/60 text-sm">{idx + 1} / {images.length}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(4, z + 0.5))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors">+</button>
          <button onClick={() => { resetZoom(); }} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors">{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors">−</button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-2">✕</button>
        </div>
      </div>

      {/* Main image */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        <img
          src={images[idx]?.url}
          alt=""
          onClick={handleImgClick}
          draggable={false}
          className="max-h-full max-w-full object-contain transition-transform duration-150"
          style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
        />

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors text-lg">‹</button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors text-lg">›</button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto shrink-0 justify-center">
          {images.map((img: any, i: number) => (
            <button
              key={img.id ?? i}
              onClick={() => { setIdx(i); resetZoom(); }}
              className={cn('w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all', i === idx ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80')}
            >
              <img src={img.url} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ItemDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [offerSent, setOfferSent] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerStep, setOfferStep] = useState<'form' | 'captcha' | null>(null);
  const [offerDescription, setOfferDescription] = useState('');
  const [offerImages, setOfferImages] = useState<{ url: string; filename: string; sortOrder: number }[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [captcha, setCaptcha] = useState<{ id: string; target: string; grid: string[] } | null>(null);
  const [captchaSelected, setCaptchaSelected] = useState<number[]>([]);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  const handleDelete = async () => {
    if (!window.confirm('განცხადების წაშლა გსურთ?')) return;
    setDeleting(true);
    try {
      await api.delete(`/items/${id}`);
      toast.success('განცხადება წაიშალა');
      nav('/');
    } catch {
      toast.error('წაშლის შეცდომა');
      setDeleting(false);
    }
  };

  useEffect(() => {
    api.get(`/items/${id}`).then(({ data }) => {
      setItem(data);
      setOfferSent(!!data.hasOffer);
      setSaved(!!data.isSaved);
      setHasReviewed(!!data.hasReviewed);
      setReviews(data.reviews || []);
      setLoading(false);
    }).catch(() => { nav('/'); });
  }, [id]);

  const toggleSave = async () => {
    if (!user) { nav('/auth'); return; }
    setSavingItem(true);
    try {
      const { data } = await api.post(`/items/${id}/save`);
      setSaved(data.saved);
      toast.success(data.saved ? 'ფავორიტებში დაემატა' : 'ფავორიტებიდან წაიშალა');
    } catch {
      toast.error('შეცდომა');
    } finally {
      setSavingItem(false);
    }
  };

  const submitReview = async (rating?: number) => {
    const finalRating = rating ?? reviewRating;
    if (!finalRating) return;
    setReviewLoading(true);
    try {
      const { data } = await api.post('/reviews', {
        reviewedId: item.userId,
        rating: finalRating,
        itemId: item.id,
      });
      setReviews(prev => [{ ...data, reviewer: { id: user!.id, displayName: user!.displayName, avatarUrl: user!.avatarUrl } }, ...prev]);
      setHasReviewed(true);
      setReviewRating(0);
      setReviewComment('');
      toast.success('შეფასება დაემატა!');
    } catch (err: any) {
      if (err?.response?.status === 400) toast.error(err.response.data?.error || 'შეცდომა');
      else toast.error('შეფასების შეცდომა');
    } finally {
      setReviewLoading(false);
    }
  };

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const { data } = await api.get('/captcha');
      setCaptcha(data);
      setCaptchaSelected([]);
      setOfferStep('captcha');
    } catch {
      toast.error('გთხოვთ სცადოთ თავიდან');
    } finally {
      setCaptchaLoading(false);
    }
  };

  const openOfferFlow = async () => {
    if (!user) { nav('/auth'); return; }
    if (offerSent || offerLoading) return;
    if (item.type === 'swap') {
      setOfferDescription('');
      setOfferImages([]);
      setOfferStep('form');
    } else {
      await loadCaptcha();
    }
  };

  const handleOfferImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (offerImages.length + files.length > 4) {
      toast.error('მაქსიმუმ 4 სურათი');
      return;
    }
    setUploadingImages(true);
    try {
      const uploaded: typeof offerImages = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append('image', files[i]);
        const { data } = await api.post('/upload/item-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push({ url: data.url, filename: data.filename || files[i].name, sortOrder: offerImages.length + i });
      }
      setOfferImages(prev => [...prev, ...uploaded]);
    } catch {
      toast.error('სურათის ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploadingImages(false);
    }
  };

  const toggleCaptchaCell = (i: number) => {
    setCaptchaSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const sendOffer = async (captchaId: string, captchaAnswer: string) => {
    if (!user) return;
    setOfferLoading(true);
    setOfferStep(null);
    try {
      await api.post('/offers', {
        itemId: item.id,
        captchaId,
        captchaAnswer,
        message: offerDescription || undefined,
        images: offerImages.length > 0 ? offerImages : undefined,
      });
      setOfferSent(true);
      toast.success(item.type === 'gift' ? 'მოთხოვნა გაიგზავნა!' : 'შეთავაზება გაიგზავნა!');
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setOfferSent(true);
        toast('უკვე გაგზავნილი გაქვს შეთავაზება');
      } else if (err?.response?.status === 400 && err?.response?.data?.error?.includes('captcha')) {
        toast.error('Captcha არასწორია. სცადეთ თავიდან.');
        loadCaptcha();
      } else {
        toast.error('გაგზავნა ვერ მოხერხდა');
      }
    } finally {
      setOfferLoading(false);
    }
  };

if (loading || !item) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isOwner = user?.id === item.userId;
  const isGift = item.type === 'gift';
  const cond = CONDITION_MAP[item.condition];
  const images = item.images || [];

  return (
    <>
      {lightbox !== null && (
        <Lightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div>
            <div
              className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-zoom-in group"
              onClick={() => images.length > 0 && setLightbox(activeImg)}
            >
              {images[activeImg] && (
                <img src={images[activeImg].url} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              )}
              <span className={cn('absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white', isGift ? 'bg-gradient-to-r from-gift-500 to-gift-400' : 'bg-gradient-to-r from-brand-500 to-brand-400')}>
                {TYPE_MAP[item.type]}
              </span>
              {images.length > 0 && (
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  🔍 გადიდება
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.map((img: any, i: number) => (
                  <button
                    key={img.id ?? i}
                    onClick={() => setActiveImg(i)}
                    className={cn('w-16 h-16 rounded-xl overflow-hidden border-2 transition-all', activeImg === i ? 'border-brand-400' : 'border-transparent opacity-60 hover:opacity-100')}
                  >
                    <img src={img.url} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
            <Link to={`/profile/${item.userId}`} className="flex items-center gap-3 py-3 mb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-brand-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                {item.user?.avatarUrl ? <img src={item.user.avatarUrl} className="w-full h-full object-cover" /> : getInitials(item.user?.displayName || 'U')}
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold">{item.user?.displayName} {item.user?.isVerified && <span className="text-brand-400">✓</span>}</span>
                <div className="text-xs text-gray-500">
                  <span className="text-amber-500">{'★'.repeat(Math.round(item.user?.rating || 5))}</span> {item.user?.rating} · {item.user?.totalReviews} შეფასება
                </div>
              </div>
              <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
            </Link>

            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{item.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
                <span className="w-2 h-2 rounded-full" style={{ background: cond?.color }} />{cond?.label}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">{item.category?.icon} {item.category?.nameKa}</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">👁 {item.viewCount}</span>
            </div>

            {item.type === 'swap' && item.wantsDescription && (
              <div className="p-3.5 rounded-xl bg-brand-400/5 dark:bg-brand-400/10 border border-brand-400/20 mb-5">
                <div className="text-[10px] font-bold text-brand-400 uppercase tracking-wide mb-1">სანაცვლოდ ეძებს</div>
                <div className="text-sm">{item.wantsDescription}</div>
              </div>
            )}

            {!isOwner ? (
              <div className="flex gap-2">
                <button
                  onClick={openOfferFlow}
                  disabled={offerSent || offerLoading || captchaLoading}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-white font-semibold transition-colors',
                    offerSent
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isGift
                      ? 'bg-gift-500 hover:bg-gift-600'
                      : 'bg-brand-400 hover:bg-brand-500',
                    (offerLoading || captchaLoading) && 'opacity-70'
                  )}
                >
                  {offerLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  ) : offerSent ? (
                    isGift ? '✓ მოთხოვნა გაიგზავნა' : '✓ შეთავაზება გაიგზავნა'
                  ) : (
                    isGift ? '◈ მინდა ეს ნივთი' : '⇄ შევთავაზო გაცვლა'
                  )}
                </button>
                {/* Save / Favourite button */}
                <button
                  onClick={toggleSave}
                  disabled={savingItem}
                  title={saved ? 'ფავორიტებიდან წაშლა' : 'ფავორიტებში დამატება'}
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all border',
                    saved
                      ? 'bg-red-500 border-red-600 text-white hover:bg-red-600'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-300'
                  )}
                >
                  {savingItem
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : saved ? '♥' : '♡'}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => nav(`/items/${id}/edit`)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">✏️ რედაქტირება</button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                  {deleting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : '🗑'}
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Offer modal — Step 1: Form (swap only) */}
      {offerStep === 'form' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-base font-bold">შენი შეთავაზება</h3>
                <p className="text-xs text-gray-400 mt-0.5">"{item.title}"-ის სანაცვლოდ</p>
              </div>
              <button onClick={() => setOfferStep(null)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">რას სთავაზობ სანაცვლოდ? *</label>
                <textarea
                  value={offerDescription}
                  onChange={e => setOfferDescription(e.target.value)}
                  placeholder="აღწერე შენი ნივთი — მოდელი, მდგომარეობა, სხვა დეტალები..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm resize-none outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">სურათები (სურვილისამებრ, მაქს. 4)</label>
                <div className="grid grid-cols-4 gap-2">
                  {offerImages.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img src={img.url} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setOfferImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full text-white flex items-center justify-center text-xs hover:bg-red-500 transition-colors"
                      >✕</button>
                    </div>
                  ))}
                  {offerImages.length < 4 && (
                    <label className={`aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-400/5 transition-colors ${uploadingImages ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploadingImages ? (
                        <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="text-xl text-gray-400">+</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">სურათი</span>
                        </>
                      )}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleOfferImageUpload(e.target.files)} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <button
                onClick={() => setOfferStep(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                გაუქმება
              </button>
              <button
                onClick={() => { if (offerDescription.trim()) loadCaptcha(); else toast.error('გთხოვთ შეიყვანოთ შეთავაზების აღწერა'); }}
                disabled={!offerDescription.trim() || uploadingImages}
                className="flex-1 py-2.5 rounded-xl bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                შემდეგი →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer modal — Step 2: Emoji Captcha */}
      {offerStep === 'captcha' && captcha && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold">მე რობოტი არ ვარ</h3>
              <button onClick={() => setOfferStep(item.type === 'swap' ? 'form' : null)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs hover:bg-gray-200 transition-colors">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              დააჭირეთ ყველა <span className="text-xl">{captcha.target}</span>-ს
            </p>

            {/* 3×3 grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {captcha.grid.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => toggleCaptchaCell(i)}
                  className={`relative aspect-square rounded-xl text-3xl flex items-center justify-center transition-all border-2 ${
                    captchaSelected.includes(i)
                      ? 'border-brand-400 bg-brand-400/10 scale-95 shadow-inner'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-brand-400/50 hover:scale-95'
                  }`}
                >
                  {emoji}
                  {captchaSelected.includes(i) && (
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-brand-400 rounded-full flex items-center justify-center text-[8px] text-white font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center mb-3">
              {captchaSelected.length === 0 ? 'არცერთი არ არის შერჩეული' : `${captchaSelected.length} შერჩეული`}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setOfferStep(item.type === 'swap' ? 'form' : null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {item.type === 'swap' ? '← უკან' : 'გაუქმება'}
              </button>
              <button
                onClick={() => sendOffer(captcha.id, JSON.stringify(captchaSelected.sort((a,b)=>a-b)))}
                disabled={captchaSelected.length === 0}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${isGift ? 'bg-gift-500 hover:bg-gift-600' : 'bg-brand-400 hover:bg-brand-500'} disabled:opacity-50`}
              >
                გაგზავნა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating widget — non-owners only */}
      {user && !isOwner && (
        <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50">
          <div className="flex-1">
            <p className="text-sm font-semibold mb-0.5">შეაფასე მომხმარებელი</p>
            <p className="text-xs text-gray-400">ანონიმური რეიტინგი</p>
          </div>
          {hasReviewed ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="text-amber-400 text-lg">{'★'.repeat(reviewRating || 5)}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
          ) : (
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => { setReviewRating(star); submitReview(star); }}
                  onMouseEnter={() => setReviewHover(star)}
                  onMouseLeave={() => setReviewHover(0)}
                  disabled={reviewLoading}
                  className="text-2xl transition-all hover:scale-125 active:scale-95 disabled:opacity-50"
                >
                  <span className={(reviewHover || reviewRating) >= star ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}>★</span>
                </button>
              ))}
              {reviewLoading && <span className="ml-2 w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />}
            </div>
          )}
        </div>
      )}
      </main>
    </>
  );
}
