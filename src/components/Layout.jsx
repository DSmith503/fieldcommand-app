import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { getUser, clearAuth, isAdmin, cn } from '../utils/api';
import { LayoutDashboard, FolderKanban, Calendar, Clock, FileText, MessageSquare, Users, Sparkles, LogOut, Menu, X, Wrench, Receipt, Phone, Settings } from 'lucide-react';
import { useState } from 'react';
import CircuitBG from './CircuitBG';

const LOGO = "https://img1.wsimg.com/isteam/ip/514739c3-e1e5-4fa0-81a4-9f7a09e701a3/logo/6f3c0d46-f2e3-4700-8e26-bb72bad64f34.png";

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/schedule', icon: Calendar, label: 'Calendar' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/service-calls', icon: Wrench, label: 'Service Calls' },
  { to: '/change-orders', icon: FileText, label: 'Change Orders' },
  { to: '/time', icon: Clock, label: 'Time Clock' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/messages', icon: MessageSquare, label: 'Messenger' },
  { to: '/support', icon: Phone, label: 'Vendor Support' },
  { to: '/ask', icon: Sparkles, label: 'Just Ask' },
];
const ADMIN_NAV = [
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/admin', icon: Settings, label: 'Admin Panel' },
];

export default function Layout() {
  const user = getUser();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const links = isAdmin() ? [...NAV, ...ADMIN_NAV] : NAV;
  const logout = () => { clearAuth(); nav('/login'); };
  const ini = user?.name?.split(' ').map(w => w[0]).join('') || '?';

  return (
    <div className="min-h-screen flex relative" style={{ background: '#030305' }}>
      <CircuitBG />
      <aside className="hidden lg:flex flex-col w-56 border-r border-white/[0.06] fixed inset-y-0 left-0 z-40" style={{ background: 'rgba(3,3,5,0.88)', backdropFilter: 'blur(40px) saturate(1.6)', WebkitBackdropFilter: 'blur(40px) saturate(1.6)' }}>
        <div className="p-5 flex items-center gap-3">
          <img src={LOGO} alt="Elite" className="h-8 object-contain" onError={e => e.target.style.display = 'none'} />
          <div><p className="text-sm font-bold text-zinc-100 leading-none">FieldCommand</p><p className="text-[10px] text-zinc-600 mt-0.5">Elite Technologies</p></div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {links.map(l => <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => cn('flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-300', isActive ? 'bg-brand-400/10 text-brand-400 border border-brand-400/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]')}><l.icon className="w-4 h-4 flex-shrink-0" />{l.label}</NavLink>)}
        </nav>
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-2 mb-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-900" style={{ backgroundColor: user?.color || '#CBA135' }}>{ini}</div><div className="min-w-0 flex-1"><p className="text-xs font-medium text-zinc-300 truncate">{user?.name}</p><p className="text-[10px] text-zinc-600">{user?.role}</p></div></div>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors w-full rounded-xl hover:bg-white/[0.04]"><LogOut className="w-3.5 h-3.5" /> Sign Out</button>
        </div>
      </aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] h-14 flex items-center justify-between px-4" style={{ background: 'rgba(3,3,5,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <button onClick={() => setOpen(!open)} className="p-2 text-zinc-400">{open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        <div className="flex items-center gap-2"><img src={LOGO} alt="" className="h-6" onError={e => e.target.style.display = 'none'} /><span className="font-bold text-sm">FieldCommand</span></div>
      </div>
      {open && <div className="lg:hidden fixed inset-0 z-40 pt-14" style={{ background: 'rgba(3,3,5,0.95)' }}><nav className="p-4 space-y-1">
        {links.map(l => <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className={({ isActive }) => cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm', isActive ? 'bg-brand-400/10 text-brand-400' : 'text-zinc-400')}><l.icon className="w-5 h-5" />{l.label}</NavLink>)}
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-500 w-full"><LogOut className="w-5 h-5" /> Sign Out</button>
      </nav></div>}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 relative z-10"><div className="max-w-6xl mx-auto p-4 lg:p-8"><Outlet /></div></main>
    </div>
  );
}
