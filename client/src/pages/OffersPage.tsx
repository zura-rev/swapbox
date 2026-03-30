import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function OffersPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { t } = useTranslation();
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { nav('/auth'); return; }
    Promise.all([
      api.get('/offers/received'),
      api.get('/offers/sent'),
    ]).then(([r, s]) => {
      setReceived(r.data);
      setSent(s.data);
    }).finally(() => setLoading(false));
  }, [user]);

  const accept = async (id: string) => {
    setActing(id);
    try {
      const { data } = await api.post(`/offers/${id}/accept`);
      setReceived(prev => prev.filter(o => o.id !== id));
      toast.success(t('offerAcceptedToast'));
      nav(`/chat?open=${data.conversationId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('error'));
    } finally {
      setActing(null);
    }
  };

  const reject = async (id: string) => {
    setActing(id);
    try {
      await api.post(`/offers/${id}/reject`);
      setReceived(prev => prev.filter(o => o.id !== id));
      toast.success(t('offerRejectedToast'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('error'));
    } finally {
      setActing(null);
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: t('statusPending'),
    accepted: t('statusAccepted'),
    rejected: t('statusRejected'),
    cancelled: t('statusCancelled'),
    completed: t('statusCompleted'),
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    completed: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const list = tab === 'received' ? received : sent;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">{t('offersTitle')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5">
        {(['received', 'sent'] as const).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tabKey ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {tabKey === 'received'
              ? `📥 ${t('received')} (${received.filter(o => o.status === 'pending').length})`
              : `📤 ${t('sent')} (${sent.filter(o => o.status === 'pending').length})`}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{t('noOffers')}</p>
      ) : (
        <div className="space-y-3">
          {list.map((offer: any) => (
            <div key={offer.id} className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex gap-3">
                {/* Item image */}
                <Link to={`/items/${offer.item?.id}`} className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                  {offer.item?.images?.[0] ? (
                    <img src={offer.item.images[0].url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/items/${offer.item?.id}`} className="font-semibold text-sm hover:text-brand-400 transition-colors line-clamp-1">
                      {offer.item?.title}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[offer.status]}`}>
                      {STATUS_LABELS[offer.status]}
                    </span>
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-5 h-5 rounded-full bg-brand-400 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                      {offer.fromUser?.avatarUrl
                        ? <img src={offer.fromUser.avatarUrl} className="w-full h-full object-cover" />
                        : getInitials(offer.fromUser?.displayName || 'U')}
                    </div>
                    <span className="text-xs text-gray-500">
                      {tab === 'received' ? offer.fromUser?.displayName : offer.toUser?.displayName}
                    </span>
                    <span className="text-xs text-gray-400">· {timeAgo(offer.createdAt)}</span>
                  </div>

                  {offer.message && (
                    <div className="mt-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t('offerProposes')}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{offer.message}</p>
                    </div>
                  )}

                  {/* Offer images */}
                  {offer.images && offer.images.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {offer.images.map((img: any, i: number) => (
                        <img
                          key={i}
                          src={img.url}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-gray-600"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {tab === 'received' && offer.status === 'pending' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => accept(offer.id)}
                    disabled={acting === offer.id}
                    className="flex-1 py-2 rounded-xl bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    {acting === offer.id ? '...' : t('accept')}
                  </button>
                  <button
                    onClick={() => reject(offer.id)}
                    disabled={acting === offer.id}
                    className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    {t('reject')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
