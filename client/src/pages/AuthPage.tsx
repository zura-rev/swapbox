import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function AuthPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
        toast.success('მოგესალმებით!');
      } else {
        await register({ email, password, displayName });
        toast.success('რეგისტრაცია წარმატებულია!');
      }
      nav('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1c2a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-200 flex items-center justify-center text-white text-2xl font-extrabold mx-auto mb-4">⇄</div>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">SwapBox</h1>
          <p className="text-sm text-gray-500 mt-1">{t('authSubtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === tabKey ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
              {tabKey === 'login' ? t('tabLogin') : t('tabRegister')}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('displayName')}</label>
              <input placeholder={t('displayNamePlaceholder')} value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputCls} required />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('email')}</label>
            <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{t('password')}</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-brand-400 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50">
            {loading ? (tab === 'login' ? t('loggingIn') : t('registering')) : tab === 'login' ? t('loginBtn') : t('registerBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
