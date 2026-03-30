import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getInitials, timeAgo } from '@/lib/utils';
import ItemCard from '@/components/items/ItemCard';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const profileId = id || me?.id;

  useEffect(() => {
    if (!profileId) return;
    api.get(`/users/${profileId}`).then(({ data }) => { setProfile(data); setLoading(false); }).catch(() => setLoading(false));
  }, [profileId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="text-center py-20 text-gray-500">პროფილი ვერ მოიძებნა</div>;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-200 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
            {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : getInitials(profile.displayName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold">{profile.displayName}</h1>
              {profile.isVerified && <span className="text-brand-400">✓</span>}
            </div>
            <p className="text-sm text-gray-500">@{profile.username}</p>
            {profile.bio && <p className="text-sm text-gray-500 mt-2">{profile.bio}</p>}
            <div className="flex gap-6 mt-4">
              {[
                { n: profile.items?.length || 0, l: 'განცხადება' },
                { n: profile.totalSwaps, l: 'გაცვლა' },
                { n: profile.totalGifts, l: 'საჩუქარი' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg font-bold">{s.n}</div>
                  <div className="text-xs text-gray-500">{s.l}</div>
                </div>
              ))}
              <div className="text-center">
                <div className="text-amber-500 text-lg">{'★'.repeat(Math.round(profile.rating))}</div>
                <div className="text-xs text-gray-500">{profile.rating}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <h2 className="text-lg font-bold mb-4">{t('allListings')}</h2>
      {!profile.items?.length ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">{t('noItems')}</p>
          {profileId === me?.id && <Link to="/items/new" className="text-sm text-brand-400 font-medium mt-2 inline-block">+ პირველი განცხადების დამატება</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {profile.items.map((item: any) => <ItemCard key={item.id} item={{ ...item, user: profile }} />)}
        </div>
      )}

      {/* Reviews */}
      {profile.reviewsReceived?.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-4">{t('reviews')} ({profile.reviewsReceived.length})</h2>
          <div className="space-y-3">
            {profile.reviewsReceived.map((r: any) => (
              <div key={r.id} className="flex gap-3 p-4 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-gift-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {getInitials(r.reviewer?.displayName || 'U')}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{r.reviewer?.displayName}</span>
                    <span className="text-amber-500 text-xs">{'★'.repeat(r.rating)}</span>
                    <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-500">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
