import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
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
        await register({ email, password, username, displayName });
        toast.success('რეგისტრაცია წარმატებულია!');
      }
      nav('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1c2a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-200 flex items-center justify-center text-white text-2xl font-extrabold mx-auto mb-4">⇄</div>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">SwapBox</h1>
          <p className="text-sm text-gray-500 mt-1">გაცვალე, გააჩუქე, გაახარე</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
              {t === 'login' ? 'შესვლა' : 'რეგისტრაცია'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">სახელი</label>
                <input placeholder="მაგ: ნიკა მეგრელიშვილი" value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Username</label>
                <input placeholder="მაგ: nika_m" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} required />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">ელ. ფოსტა</label>
            <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">პაროლი</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-brand-400 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50">
            {loading ? '...' : tab === 'login' ? 'შესვლა' : 'რეგისტრაცია'}
          </button>
        </form>
      </div>
    </div>
  );
}
