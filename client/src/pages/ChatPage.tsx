import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { getSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { cn, timeAgo, getInitials, CONDITION_MAP, TYPE_MAP } from '@/lib/utils';

const REACT_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥', '🎉', '🙏'];

// ─── Content type helpers ─────────────────────────────────────────────────────
const LOC_PREFIX = '__LOC__';
const IMG_PREFIX = '__IMG__';

function encodeLocation(lat: number, lng: number) {
  return `${LOC_PREFIX}${JSON.stringify({ lat, lng })}`;
}
function decodeLocation(content: string): { lat: number; lng: number } | null {
  if (!content?.startsWith(LOC_PREFIX)) return null;
  try { return JSON.parse(content.slice(LOC_PREFIX.length)); } catch { return null; }
}
function decodeImage(content: string): string | null {
  return content?.startsWith(IMG_PREFIX) ? content.slice(IMG_PREFIX.length) : null;
}
function contentPreview(content: string) {
  if (!content) return 'ახალი ჩატი';
  if (content.startsWith(LOC_PREFIX)) return '📍 ლოკაცია';
  if (content.startsWith(IMG_PREFIX)) return '🖼 სურათი';
  return content;
}

// ─── Location Map Card ────────────────────────────────────────────────────────
function LocationCard({ lat, lng, mine }: { lat: number; lng: number; mine: boolean }) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008},${lat - 0.005},${lng + 0.008},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`;
  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <div className={cn('rounded-2xl overflow-hidden border shadow-sm', mine ? 'rounded-br-sm border-brand-500/30' : 'rounded-bl-sm border-gray-200 dark:border-gray-600')} style={{ width: 230 }}>
      <div className="relative" style={{ height: 140 }}>
        <iframe src={mapUrl} width="230" height="140" style={{ border: 0, display: 'block', pointerEvents: 'none' }} loading="lazy" title="location" />
        <a href={mapsLink} target="_blank" rel="noreferrer" className="absolute inset-0" title="Google Maps-ზე გახსნა" />
      </div>
      <a href={mapsLink} target="_blank" rel="noreferrer" className={cn('flex items-center gap-2 px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80', mine ? 'bg-brand-400 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200')}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ლოკაციის გახსნა
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto opacity-60"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
  );
}

const EMOJIS = [
  '😀','😂','🥹','😍','🥰','😎','😭','😡','🤔','😅',
  '🙏','👍','👎','👏','🤝','🫶','💪','🤦','🤷','✌️',
  '❤️','🧡','💛','💚','💙','💜','🖤','💔','🔥','✨',
  '🎉','🎊','🏆','🌟','⭐','🎁','💯','😴','🥳','😇',
  '🤩','🥺','😤','😏','🤣','😬','🫠','😵','🤯','🆗',
];

interface Reaction { id: string; emoji: string; userId: string; user: { displayName: string } }
interface ReplyTo { id: string; content: string; deletedAt: string | null; sender: { displayName: string } }
interface Message {
  id: string; conversationId: string; senderId: string; content: string;
  isRead: boolean; isEdited: boolean; deletedAt: string | null;
  replyToId: string | null; replyTo: ReplyTo | null;
  createdAt: string;
  sender: { id: string; displayName: string; avatarUrl: string | null };
  reactions: Reaction[];
}

// ─── Reaction hover bar ───────────────────────────────────────────────────────
function ReactionBar({ mine, onReact }: { mine: boolean; onReact: (e: string) => void }) {
  return (
    <div className={cn('absolute -top-8 flex items-center gap-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-1.5 py-1 shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto', mine ? 'right-0' : 'left-0')}>
      {REACT_EMOJIS.map(e => (
        <button key={e} onClick={() => onReact(e)} className="w-6 h-6 text-sm flex items-center justify-center hover:scale-125 transition-transform">{e}</button>
      ))}
    </div>
  );
}

// ─── Reaction pills ───────────────────────────────────────────────────────────
function ReactionPills({ reactions, userId, onReact }: { reactions: Reaction[]; userId: string; onReact: (e: string) => void }) {
  if (!reactions.length) return null;
  const grouped: Record<string, { count: number; users: string[]; mine: boolean }> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [], mine: false };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.user.displayName);
    if (r.userId === userId) grouped[r.emoji].mine = true;
  }
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, d]) => (
        <button key={emoji} onClick={() => onReact(emoji)} title={d.users.join(', ')}
          className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-all', d.mine ? 'bg-brand-400/15 border-brand-400/40 text-brand-600 dark:text-brand-300' : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600')}>
          <span>{emoji}</span><span className="font-semibold">{d.count}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
interface CtxMenuState { x: number; y: number; msg: Message }
function ContextMenu({ ctx, userId, onReply, onEdit, onDelete, onForward, onCopy, onClose }: {
  ctx: CtxMenuState; userId: string;
  onReply: () => void; onEdit: () => void; onDelete: () => void;
  onForward: () => void; onCopy: () => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mine = ctx.msg.senderId === userId;
  const isDeleted = !!ctx.msg.deletedAt;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Adjust position so menu stays in viewport
  const style: React.CSSProperties = { position: 'fixed', zIndex: 100 };
  if (ctx.x + 180 > window.innerWidth) { style.right = window.innerWidth - ctx.x; }
  else { style.left = ctx.x; }
  if (ctx.y + 200 > window.innerHeight) { style.bottom = window.innerHeight - ctx.y; }
  else { style.top = ctx.y; }

  const Item = ({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
    <button onClick={() => { onClick(); onClose(); }} className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors rounded-lg', danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200')}>
      <span className="w-4 text-center">{icon}</span>{label}
    </button>
  );

  return (
    <div ref={ref} style={style} className="w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden p-1">
      {!isDeleted && <Item icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>} label="Reply" onClick={onReply} />}
      {!isDeleted && <Item icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>} label="კოპირება" onClick={onCopy} />}
      {!isDeleted && <Item icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>} label="გადაგზავნა" onClick={onForward} />}
      {mine && !isDeleted && <Item icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} label="შეცვლა" onClick={onEdit} />}
      {mine && <Item icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>} label="წაშლა" onClick={onDelete} danger />}
    </div>
  );
}

// ─── Forward Dialog ───────────────────────────────────────────────────────────
function ForwardDialog({ convs, activeId, onForward, onClose }: {
  convs: any[]; activeId: string; onForward: (conv: any) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = convs.filter(c => c.id !== activeId && c.otherUser?.displayName?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-80 overflow-hidden shadow-2xl">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="font-bold text-sm">გადაგზავნა</span>
          <button onClick={onClose} className="w-6 h-6 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-sm">✕</button>
        </div>
        <div className="px-3 py-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ჩატის ძებნა..." className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:border-brand-400" />
        </div>
        <div className="max-h-60 overflow-y-auto pb-2">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">სხვა ჩატი არ მოიძებნა</p>
          ) : filtered.map(c => (
            <button key={c.id} onClick={() => onForward(c)} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-brand-400 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                {c.otherUser?.avatarUrl ? <img src={c.otherUser.avatarUrl} className="w-full h-full object-cover" alt="" /> : getInitials(c.otherUser?.displayName || 'U')}
              </div>
              <span className="text-sm font-medium">{c.otherUser?.displayName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Item panel (right sidebar) ───────────────────────────────────────────────
function ItemPanel({ item }: { item: any }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const images: { id: string; url: string }[] = item.images ?? [];
  const cond = CONDITION_MAP[item.condition];
  const isGift = item.type === 'gift';

  return (
    <div className="hidden lg:flex w-[220px] shrink-0 flex-col bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 cursor-zoom-in shrink-0 group" onClick={() => images.length && setLightbox(imgIdx)}>
        {images[imgIdx] ? <img src={images[imgIdx].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📷</div>}
        <span className={cn('absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white', isGift ? 'bg-gift-500' : 'bg-brand-400')}>{TYPE_MAP[item.type]}</span>
        {images.length > 1 && <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-lg">{imgIdx + 1}/{images.length}</span>}
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 px-2.5 pt-2 shrink-0">
          {images.map((img, i) => (
            <button key={img.id ?? i} onClick={() => setImgIdx(i)} className={cn('w-10 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0', i === imgIdx ? 'border-brand-400' : 'border-transparent opacity-60 hover:opacity-90')}>
              <img src={img.url} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2.5">
        <h3 className="text-sm font-bold leading-tight text-gray-900 dark:text-white line-clamp-2">{item.title}</h3>
        <div className="flex flex-wrap gap-1">
          {cond && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cond.color }} />{cond.label}</span>}
          {item.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{item.category.icon} {item.category.nameKa}</span>}
          {item.city && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">📍 {item.city}</span>}
        </div>
        {item.description && <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-4">{item.description}</p>}
        {item.type === 'swap' && item.wantsDescription && (
          <div className="p-2 rounded-xl bg-brand-400/8 border border-brand-400/20">
            <div className="text-[9px] font-bold text-brand-400 uppercase tracking-wide mb-0.5">სანაცვლოდ</div>
            <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2">{item.wantsDescription}</p>
          </div>
        )}
        {item.user && (
          <Link to={`/profile/${item.user.id}`} className="flex items-center gap-2 py-2 border-t border-gray-100 dark:border-gray-700/60 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-brand-400 overflow-hidden shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
              {item.user.avatarUrl ? <img src={item.user.avatarUrl} className="w-full h-full object-cover" /> : getInitials(item.user.displayName)}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold truncate flex items-center gap-1">{item.user.displayName}{item.user.isVerified && <span className="text-brand-400 text-[10px]">✓</span>}</div>
              <div className="text-[9px] text-amber-500">{'★'.repeat(Math.round(item.user.rating || 0))}<span className="text-gray-400 ml-1">{item.user.rating?.toFixed(1)}</span></div>
            </div>
          </Link>
        )}
      </div>
      <div className="px-2.5 pb-2.5 shrink-0">
        <Link to={`/items/${item.id}`} className={cn('block w-full py-2 rounded-xl text-white text-xs font-semibold text-center transition-colors', isGift ? 'bg-gift-500 hover:bg-gift-600' : 'bg-brand-400 hover:bg-brand-500')}>
          განცხადების ნახვა →
        </Link>
      </div>
      {lightbox !== null && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" onClick={() => setLightbox(null)}>✕</button>
          {images.length > 1 && (<>
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white text-xl flex items-center justify-center" onClick={e => { e.stopPropagation(); setLightbox(i => ((i ?? 0) - 1 + images.length) % images.length); }}>‹</button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white text-xl flex items-center justify-center" onClick={e => { e.stopPropagation(); setLightbox(i => ((i ?? 0) + 1) % images.length); }}>›</button>
          </>)}
          <img src={images[lightbox].url} className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          <span className="absolute bottom-4 text-white/50 text-sm">{lightbox + 1} / {images.length}</span>
        </div>
      )}
    </div>
  );
}

// ─── Read receipt icon ─────────────────────────────────────────────────────────
function ReadReceipt({ isRead }: { isRead: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn('shrink-0', isRead ? 'stroke-blue-300' : 'stroke-white/50')}>
      {isRead
        ? <><polyline points="1 12 7 18 23 6"/><polyline points="5 12 11 18 23 6" className="opacity-0"/></>
        : <><polyline points="5 12 11 18 23 6"/></>}
    </svg>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-0.5 px-3 py-2">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const { clearChatUnread } = useNotifications();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [convs, setConvs] = useState<any[]>([]);
  const [convSearch, setConvSearch] = useState('');
  const [active, setActive] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);

  // New feature states
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<any>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const msgSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ESC closes context menu / msg search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setCtxMenu(null); setShowMsgSearch(false); setMsgSearch(''); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const openConv = useCallback(async (conv: any) => {
    setActive(conv);
    setMessages([]);
    setReplyingTo(null);
    setEditingMsg(null);
    setMsg('');
    setShowMsgSearch(false);
    setMsgSearch('');
    setConvs(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
    try {
      const { data } = await api.get(`/chat/${conv.id}/messages`);
      setMessages(data);
      // Emit read receipt
      const socket = getSocket();
      if (socket) socket.emit('chat:read', { conversationId: conv.id });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'შეტყობინებების ჩატვირთვა ვერ მოხერხდა');
    }
  }, []);

  useEffect(() => { clearChatUnread(); }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav('/auth'); return; }
    const openId = searchParams.get('open');
    api.get('/chat').then(({ data }) => {
      setConvs(data);
      setLoading(false);
      if (openId) {
        const found = data.find((c: any) => c.id === openId);
        if (found) openConv(found);
      }
    }).catch(() => setLoading(false));
  }, [user, authLoading, searchParams, openConv]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Active conversation socket
  useEffect(() => {
    if (!active) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('chat:join', active.id);

    const handleMsg = (newMsg: any) => {
      if (newMsg.conversationId !== active.id) return;
      setMessages(p => [...p, { ...newMsg, reactions: newMsg.reactions ?? [] }]);
      setConvs(prev => prev.map(c =>
        c.id === newMsg.conversationId ? { ...c, lastMessageText: newMsg.content, lastMessageAt: newMsg.createdAt } : c
      ));
      // Auto-send read receipt if we're in this conversation
      socket.emit('chat:read', { conversationId: active.id });
    };

    const handleDelete = ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m));
    };

    const handleEdit = ({ messageId, content }: { messageId: string; content: string }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, isEdited: true } : m));
    };

    const handleReaction = (data: { messageId: string; emoji: string; userId: string; added: boolean }) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== data.messageId) return m;
        if (data.added) {
          return { ...m, reactions: [...m.reactions, { id: `tmp_${Date.now()}`, emoji: data.emoji, userId: data.userId, user: { displayName: data.userId } }] };
        }
        return { ...m, reactions: m.reactions.filter(r => !(r.userId === data.userId && r.emoji === data.emoji)) };
      }));
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === user?.id) return;
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      setTypingUser(data.isTyping ? (activeRef.current?.otherUser?.displayName || 'ვინმე') : null);
      if (data.isTyping) {
        typingClearRef.current = setTimeout(() => setTypingUser(null), 3500);
      }
    };

    const handleRead = ({ conversationId }: { conversationId: string }) => {
      if (conversationId !== active.id) return;
      setMessages(prev => prev.map(m => m.senderId === user?.id ? { ...m, isRead: true } : m));
    };

    socket.on('chat:message', handleMsg);
    socket.on('chat:delete', handleDelete);
    socket.on('chat:edit', handleEdit);
    socket.on('chat:reaction', handleReaction);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:read', handleRead);

    return () => {
      socket.emit('chat:leave', active.id);
      socket.off('chat:message', handleMsg);
      socket.off('chat:delete', handleDelete);
      socket.off('chat:edit', handleEdit);
      socket.off('chat:reaction', handleReaction);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:read', handleRead);
      setTypingUser(null);
    };
  }, [active, user]);

  // Non-active conversation notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleNotify = (newMsg: any) => {
      if (activeRef.current?.id === newMsg.conversationId) return;
      setConvs(prev => prev.map(c =>
        c.id === newMsg.conversationId
          ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessageText: newMsg.content, lastMessageAt: newMsg.createdAt }
          : c
      ));
      toast(`💬 ${newMsg.sender?.displayName ?? 'ვინმე'}: ${contentPreview(newMsg.content)}`, { duration: 5000 });
    };

    const handleConvClosed = ({ conversationId }: { conversationId: string }) => {
      setConvs(prev => prev.map(c => c.id === conversationId ? { ...c, status: 'closed' } : c));
      if (activeRef.current?.id === conversationId) {
        setActive((prev: any) => prev ? { ...prev, status: 'closed' } : prev);
      }
    };

    const handleOfferAccepted = ({ conversationId, itemTitle }: any) => {
      toast.success(`შეთავაზება მიღებული! ახლა შეგიძლია დაწერო: ${itemTitle ?? ''}`);
      api.get('/chat').then(({ data }) => setConvs(data)).catch(() => {});
    };

    const handleOfferRejected = ({ itemTitle }: any) => {
      toast.error(`შეთავაზება უარყოფილია: ${itemTitle ?? ''}`);
    };

    socket.on('chat:notify', handleNotify);
    socket.on('conv:closed', handleConvClosed);
    socket.on('offer:accepted', handleOfferAccepted);
    socket.on('offer:rejected', handleOfferRejected);

    return () => {
      socket.off('chat:notify', handleNotify);
      socket.off('conv:closed', handleConvClosed);
      socket.off('offer:accepted', handleOfferAccepted);
      socket.off('offer:rejected', handleOfferRejected);
    };
  }, [user]);

  // Input change with typing indicator
  const handleInputChange = (val: string) => {
    setMsg(val);
    const socket = getSocket();
    if (socket && active) {
      socket.emit('chat:typing', { conversationId: active.id, isTyping: true });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socket.emit('chat:typing', { conversationId: active.id, isTyping: false });
      }, 2000);
    }
  };

  const sendMsg = async () => {
    if (!msg.trim() || !active) return;
    const trimmed = msg.trim();

    if (editingMsg) {
      // Edit mode
      setMsg(''); setEditingMsg(null);
      const socket = getSocket();
      if (socket) {
        socket.emit('chat:edit', { messageId: editingMsg.id, conversationId: active.id, content: trimmed });
      } else {
        try {
          await api.patch(`/chat/${active.id}/messages/${editingMsg.id}`, { content: trimmed });
          setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, content: trimmed, isEdited: true } : m));
        } catch { toast.error('შეცვლა ვერ მოხერხდა'); }
      }
      return;
    }

    setMsg('');
    const replyId = replyingTo?.id;
    setReplyingTo(null);
    setShowEmoji(false);

    // Stop typing
    const socket = getSocket();
    if (socket) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.emit('chat:typing', { conversationId: active.id, isTyping: false });
      socket.emit('chat:message', { conversationId: active.id, content: trimmed, replyToId: replyId });
    } else {
      try {
        const { data } = await api.post(`/chat/${active.id}/messages`, { content: trimmed, replyToId: replyId });
        setMessages(p => [...p, { ...data, reactions: [] }]);
      } catch {
        toast.error('შეტყობინება ვერ გაიგზავნა');
        setMsg(trimmed);
      }
    }
  };

  const deleteMsg = async (m: Message) => {
    if (!active) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('chat:delete', { messageId: m.id, conversationId: active.id });
    } else {
      try {
        await api.delete(`/chat/${active.id}/messages/${m.id}`);
        setMessages(prev => prev.map(x => x.id === m.id ? { ...x, deletedAt: new Date().toISOString() } : x));
      } catch { toast.error('წაშლა ვერ მოხერხდა'); }
    }
  };

  const forwardToConv = async (targetConv: any, m: Message) => {
    const content = m.content;
    const socket = getSocket();
    if (socket) {
      // Join temporarily to send
      socket.emit('chat:join', targetConv.id);
      socket.emit('chat:message', { conversationId: targetConv.id, content });
      setTimeout(() => socket.emit('chat:leave', targetConv.id), 500);
    } else {
      await api.post(`/chat/${targetConv.id}/messages`, { content }).catch(() => {});
    }
    toast.success(`გადაგზავნილია → ${targetConv.otherUser?.displayName}`);
  };

  const handleReact = (messageId: string, emoji: string) => {
    const socket = getSocket();
    if (socket && active) socket.emit('chat:reaction', { messageId, emoji, conversationId: active.id });
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) { setMsg(m => m + emoji); return; }
    const s = input.selectionStart ?? msg.length;
    const e = input.selectionEnd ?? msg.length;
    const newMsg = msg.slice(0, s) + emoji + msg.slice(e);
    setMsg(newMsg);
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(s + emoji.length, s + emoji.length); });
  };

  const sendLocation = () => {
    if (!active) return;
    if (!navigator.geolocation) { toast.error('თქვენი ბრაუზერი ლოკაციას არ უჭერს მხარს'); return; }
    toast('ლოკაცია იძებნება...', { icon: '📍', id: 'loc' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('loc');
        const content = encodeLocation(pos.coords.latitude, pos.coords.longitude);
        const socket = getSocket();
        if (socket) socket.emit('chat:message', { conversationId: active.id, content });
        else api.post(`/chat/${active.id}/messages`, { content }).then(({ data }) => setMessages(p => [...p, { ...data, reactions: [] }])).catch(() => toast.error('ლოკაციის გაგზავნა ვერ მოხერხდა'));
      },
      (err) => {
        toast.dismiss('loc');
        if (err.code === err.PERMISSION_DENIED) toast.error('ლოკაციაზე წვდომა უარყოფილია');
        else toast.error('ლოკაციის მიღება ვერ მოხერხდა');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    e.target.value = '';
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post('/upload/item-image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const content = `${IMG_PREFIX}${data.url}`;
      const socket = getSocket();
      if (socket) socket.emit('chat:message', { conversationId: active.id, content });
      else {
        const { data: msg } = await api.post(`/chat/${active.id}/messages`, { content });
        setMessages(p => [...p, { ...msg, reactions: [] }]);
      }
    } catch { toast.error('ფოტოს გაგზავნა ვერ მოხერხდა'); }
    finally { setUploading(false); }
  };

  const loadConversations = useCallback(() => {
    api.get('/chat').then(({ data }) => setConvs(data)).catch(() => {});
  }, []);

  const blockUser = async (targetId: string) => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ ამ მომხმარებლის დაბლოკვა?')) return;
    try {
      await api.post(`/chat/block/${targetId}`);
      toast.success('მომხმარებელი დაბლოკილია');
      loadConversations();
    } catch { toast.error('შეცდომა'); }
  };

  // Filtered messages for search
  const displayedMessages = msgSearch.trim()
    ? messages.filter(m => !m.deletedAt && m.content.toLowerCase().includes(msgSearch.toLowerCase()))
    : messages;

  const totalUnread = convs.reduce((s, c) => s + (c.unreadCount || 0), 0);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-5 flex items-center gap-2">
        შეტყობინებები
        {totalUnread > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-semibold">{totalUnread > 99 ? '99+' : totalUnread}</span>}
      </h1>

      <div className="flex gap-3 h-[74vh]">

        {/* ── Conversation list ─────────────────────────────────────────── */}
        <div className="hidden sm:flex w-[200px] shrink-0 flex-col bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-3 pt-2.5 pb-2 border-b border-gray-200 dark:border-gray-700 shrink-0 space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">ჩატები {convs.length > 0 && `(${convs.length})`}</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600/50">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={convSearch} onChange={e => setConvSearch(e.target.value)} placeholder="ძებნა..." className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-gray-400 min-w-0" />
              {convSearch && <button onClick={() => setConvSearch('')} className="text-gray-400 hover:text-gray-600 text-sm leading-none">×</button>}
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {(() => {
              const filtered = convSearch.trim() ? convs.filter(c => c.otherUser?.displayName?.toLowerCase().includes(convSearch.toLowerCase()) || c.lastMessageText?.toLowerCase().includes(convSearch.toLowerCase())) : convs;
              if (convs.length === 0) return <p className="p-5 text-center text-xs text-gray-400">ჩატები არ გაქვს</p>;
              if (filtered.length === 0) return <p className="p-5 text-center text-xs text-gray-400">"{convSearch}" — ვერ მოიძებნა</p>;
              return filtered.map(conv => {
                const isActive = active?.id === conv.id;
                return (
                  <button key={conv.id} onClick={() => openConv(conv)} className={cn('w-full flex items-start gap-2 px-3 py-2.5 text-left transition-all border-b border-gray-100 dark:border-gray-700/40 relative', isActive ? 'bg-brand-400/10 dark:bg-brand-400/15' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40')}>
                    {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-400" />}
                    <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                      {conv.otherUser?.avatarUrl ? <img src={conv.otherUser.avatarUrl} className="w-full h-full object-cover" /> : getInitials(conv.otherUser?.displayName || 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={cn('text-xs truncate', isActive || conv.unreadCount > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300')}>{conv.otherUser?.displayName}</span>
                        {conv.unreadCount > 0 ? (
                          <span className="shrink-0 min-w-[18px] h-[18px] bg-brand-400 text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1">{conv.unreadCount > 9 ? '9+' : conv.unreadCount}</span>
                        ) : (
                          <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                        )}
                      </div>
                      <div className={cn('text-[10px] truncate', conv.unreadCount > 0 ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-400')}>
                        {contentPreview(conv.lastMessageText)}
                      </div>
                      {conv.item && (
                        <div className="flex items-center gap-1 mt-1">
                          {conv.item.images?.[0]?.url && <img src={conv.item.images[0].url} className="w-3.5 h-3.5 rounded object-cover shrink-0" />}
                          <span className="text-[10px] text-brand-400 font-medium truncate">{conv.item.title}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </div>

        {/* ── Chat window ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {active ? (
            <>
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                  {active.otherUser?.avatarUrl ? <img src={active.otherUser.avatarUrl} className="w-full h-full object-cover" /> : getInitials(active.otherUser?.displayName || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold leading-tight">{active.otherUser?.displayName}</div>
                  <div className="text-[10px] text-gray-400">
                    {typingUser ? (
                      <span className="text-brand-400 animate-pulse">⌨️ წერს...</span>
                    ) : active.otherUser?.isOnline ? '🟢 ონლაინ' : 'ოფლაინ'}
                  </div>
                </div>
                {active.status === 'closed' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">🔒 დახურული</span>}
                {/* Search in messages */}
                <button
                  onClick={() => { setShowMsgSearch(s => !s); setTimeout(() => msgSearchRef.current?.focus(), 50); }}
                  className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all border', showMsgSearch ? 'bg-brand-400/10 border-brand-400/30 text-brand-400' : 'text-gray-400 hover:text-gray-600 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700')}
                  title="ძებნა შეტყობინებებში"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
                {active.otherUser?.id && (
                  <button onClick={() => blockUser(active.otherUser.id)} title="მომხმარებლის დაბლოკვა" className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800/50">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  </button>
                )}
              </div>

              {/* Message search bar */}
              {showMsgSearch && (
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700/60 flex items-center gap-2 bg-brand-400/5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input ref={msgSearchRef} value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="შეტყობინებაში ძებნა..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
                  {msgSearch && <span className="text-[10px] text-gray-400 shrink-0">{displayedMessages.length} შედეგი</span>}
                  <button onClick={() => { setMsgSearch(''); setShowMsgSearch(false); }} className="text-gray-400 hover:text-gray-600 text-sm">×</button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1" onContextMenu={e => e.preventDefault()}>
                {displayedMessages.length === 0 && !msgSearch && (
                  <div className="text-center text-sm text-gray-400 py-10"><div className="text-3xl mb-2">👋</div><p>საუბარი დაიწყე!</p></div>
                )}
                {displayedMessages.length === 0 && msgSearch && (
                  <div className="text-center text-sm text-gray-400 py-10"><p>"{msgSearch}" — ვერ მოიძებნა</p></div>
                )}
                {displayedMessages.map((m, i) => {
                  const mine = m.senderId === user?.id;
                  const loc = !m.deletedAt ? decodeLocation(m.content) : null;
                  const imgUrl = !m.deletedAt ? decodeImage(m.content) : null;
                  const prevMsg = displayedMessages[i - 1];
                  const showDateDivider = !prevMsg || new Date(m.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  const sameAsPrev = prevMsg && prevMsg.senderId === m.senderId && !showDateDivider;
                  const time = new Date(m.createdAt).toLocaleTimeString('ka', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={m.id}>
                      {showDateDivider && (
                        <div className="flex items-center gap-3 py-2 my-1">
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                          <span className="text-[10px] text-gray-400 font-medium shrink-0">
                            {new Date(m.createdAt).toLocaleDateString('ka', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        </div>
                      )}
                      <div className={cn('flex flex-col', mine ? 'items-end' : 'items-start', sameAsPrev ? 'mt-0.5' : 'mt-2')}>
                        <div
                          className="relative group"
                          onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, msg: m }); }}
                        >
                          <ReactionBar mine={mine} onReact={e => handleReact(m.id, e)} />

                          {/* Reply hover button */}
                          {!m.deletedAt && (
                            <button
                              onClick={() => { setReplyingTo(m); setEditingMsg(null); inputRef.current?.focus(); }}
                              className={cn('absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10', mine ? '-left-8' : '-right-8')}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                            </button>
                          )}

                          {m.deletedAt ? (
                            <div className={cn('max-w-[280px] px-3.5 py-2 rounded-2xl text-sm italic opacity-40 flex items-center gap-2', mine ? 'bg-brand-400 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-700 rounded-bl-sm')}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                              <span>შეტყობინება წაშლილია</span>
                            </div>
                          ) : loc ? (
                            <div>
                              <LocationCard lat={loc.lat} lng={loc.lng} mine={mine} />
                              <div className={cn('mt-0.5 px-1 flex items-center gap-1', mine ? 'justify-end' : 'justify-start')}>
                                <span className="text-[9px] text-gray-400">{time}</span>
                                {mine && <ReadReceipt isRead={m.isRead} />}
                              </div>
                            </div>
                          ) : imgUrl ? (
                            <div>
                              <img
                                src={imgUrl}
                                alt="image"
                                className={cn('max-w-[240px] rounded-2xl cursor-zoom-in', mine ? 'rounded-br-sm' : 'rounded-bl-sm')}
                                onClick={() => setLightboxImg(imgUrl)}
                              />
                              <div className={cn('mt-0.5 px-1 flex items-center gap-1', mine ? 'justify-end' : 'justify-start')}>
                                <span className="text-[9px] text-gray-400">{time}</span>
                                {mine && <ReadReceipt isRead={m.isRead} />}
                              </div>
                            </div>
                          ) : (
                            <div className={cn('max-w-[320px] rounded-2xl text-sm break-words', mine ? 'bg-brand-400 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-700 rounded-bl-sm')}>
                              {/* Quoted reply */}
                              {m.replyTo && (
                                <div className={cn('mx-2 mt-2 px-2.5 py-1.5 rounded-xl border-l-2 text-[11px] cursor-pointer', mine ? 'bg-white/15 border-white/50' : 'bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500')}
                                  onClick={() => {
                                    const el = document.getElementById(`msg-${m.replyTo!.id}`);
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    el?.classList.add('ring-2', 'ring-brand-400', 'ring-offset-1');
                                    setTimeout(() => el?.classList.remove('ring-2', 'ring-brand-400', 'ring-offset-1'), 1500);
                                  }}
                                >
                                  <p className={cn('font-semibold truncate', mine ? 'text-white/80' : 'text-brand-500')}>{m.replyTo.sender.displayName}</p>
                                  <p className={cn('truncate opacity-70', mine ? 'text-white' : 'text-gray-600 dark:text-gray-300')}>
                                    {m.replyTo.deletedAt ? 'წაშლილია' : contentPreview(m.replyTo.content)}
                                  </p>
                                </div>
                              )}
                              <div className="px-3.5 py-2">
                                {m.content}
                                <span className={cn('ml-2 align-bottom inline-flex items-center gap-0.5', mine ? 'text-white/60' : 'text-gray-400')}>
                                  <span className="text-[9px]">{time}</span>
                                  {m.isEdited && <span className="text-[9px] italic opacity-60"> • შეცვლილი</span>}
                                  {mine && <ReadReceipt isRead={m.isRead} />}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div id={`msg-${m.id}`} className="scroll-mt-4">
                          <ReactionPills reactions={m.reactions} userId={user!.id} onReact={e => handleReact(m.id, e)} />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typingUser && (
                  <div className="flex items-start gap-2 mt-2">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              {active?.status === 'closed' ? (
                <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">🔒 ჩატი დახურულია</div>
              ) : (
                <div className="px-3 pb-3 shrink-0 border-t border-gray-100 dark:border-gray-700/60 pt-2.5">
                  {/* Emoji picker */}
                  {showEmoji && (
                    <div ref={emojiRef} className="mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-2.5">
                      <div className="grid grid-cols-10 gap-0.5">
                        {EMOJIS.map(e => (
                          <button key={e} type="button" onClick={() => insertEmoji(e)} className="w-8 h-8 text-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">{e}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reply preview */}
                  {replyingTo && (
                    <div className="mb-2 flex items-start gap-2 px-3 py-2 bg-brand-400/8 rounded-xl border-l-2 border-brand-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400 shrink-0 mt-0.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-brand-400">{replyingTo.sender.displayName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{contentPreview(replyingTo.content)}</p>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 text-sm shrink-0">×</button>
                    </div>
                  )}

                  {/* Edit mode banner */}
                  {editingMsg && (
                    <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-l-2 border-amber-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex-1">შეტყობინების შეცვლა</span>
                      <button onClick={() => { setEditingMsg(null); setMsg(''); }} className="text-gray-400 hover:text-gray-600 text-sm">×</button>
                    </div>
                  )}

                  {/* Input row */}
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowEmoji(s => !s)} className={cn('w-8 h-8 rounded-xl text-lg flex items-center justify-center transition-colors shrink-0', showEmoji ? 'bg-brand-400/15 text-brand-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400')}>😊</button>

                    {/* Location */}
                    <button type="button" onClick={sendLocation} title="ლოკაციის გაზიარება" className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </button>

                    {/* Image upload */}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} title="ფოტოს გაგზავნა" className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand-400 disabled:opacity-40">
                      {uploading
                        ? <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                    </button>

                    <input
                      ref={inputRef}
                      placeholder={editingMsg ? 'შეცვლილი ტექსტი...' : 'შეტყობინება...'}
                      value={msg}
                      onChange={e => handleInputChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } if (e.key === 'Escape') { setReplyingTo(null); setEditingMsg(null); setMsg(''); } }}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:border-brand-400 transition-all"
                    />
                    <button onClick={sendMsg} disabled={!msg.trim()} className="w-9 h-9 rounded-xl bg-brand-400 text-white flex items-center justify-center disabled:opacity-40 transition-colors hover:bg-brand-500 shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-5xl mb-3 opacity-20">💬</div>
                <p className="text-sm">აირჩიე ჩატი</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Item panel ────────────────────────────────────────────────── */}
        {active?.item && <ItemPanel item={active.item} />}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          ctx={ctxMenu} userId={user!.id}
          onReply={() => { setReplyingTo(ctxMenu.msg); setEditingMsg(null); inputRef.current?.focus(); }}
          onEdit={() => { setEditingMsg(ctxMenu.msg); setReplyingTo(null); setMsg(ctxMenu.msg.content); inputRef.current?.focus(); }}
          onDelete={() => deleteMsg(ctxMenu.msg)}
          onForward={() => setForwardMsg(ctxMenu.msg)}
          onCopy={() => { navigator.clipboard.writeText(ctxMenu.msg.content); toast.success('კოპირებულია'); }}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Forward dialog */}
      {forwardMsg && (
        <ForwardDialog
          convs={convs} activeId={active?.id}
          onForward={targetConv => forwardToConv(targetConv, forwardMsg)}
          onClose={() => setForwardMsg(null)}
        />
      )}

      {/* Image lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" onClick={() => setLightboxImg(null)}>✕</button>
          <img src={lightboxImg} className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </main>
  );
}
