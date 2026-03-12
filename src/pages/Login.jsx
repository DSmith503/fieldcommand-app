import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuth } from '../utils/api';
import { Zap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleLogin() {
    if (!email || !password) { setError('Email and password required'); return; }
    setLoading(true); setError('');
    try {
      const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setAuth(res.token, res.user);
      nav('/');
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-400/10 border border-brand-400/20 mb-4"><Zap className="w-7 h-7 text-brand-400" /></div>
          <h1 className="text-2xl font-bold text-zinc-100">FieldCommand</h1>
          <p className="text-sm text-zinc-500 mt-1">Elite Technologies of Texas</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div><label className="text-xs font-medium text-zinc-400 mb-1.5 block">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50" placeholder="you@elitetechoftexas.com" /></div>
          <div><label className="text-xs font-medium text-zinc-400 mb-1.5 block">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50" placeholder="Enter password" /></div>
          {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={handleLogin} disabled={loading} className="w-full bg-brand-400 hover:bg-brand-500 text-zinc-900 font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In'}</button>
        </div>
      </div>
    </div>
  );
}
