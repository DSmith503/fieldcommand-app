import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { getUser, clearAuth, isAdmin, cn } from '../utils/api';
import { LayoutDashboard, FolderKanban, Calendar, Clock, FileText, MessageSquare, Users, UserCog, Sparkles, Activity, LogOut, Menu, X, Zap, Wrench, Receipt } from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/service-calls', icon: Wrench, label: 'Service Calls' },
  { to: '/change-orders', icon: FileText, label: 'Change Orders' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/time', icon: Clock, label: 'Time Clock' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/ask', icon: Sparkles, label: 'Just Ask AI' },
];
const ADMIN_NAV = [
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/team', icon: UserCog, label: 'Team' },
  { to: '/activity', icon: Activity, label: 'Activity' },
];

export default function Layout() {
  const user = getUser();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const links = isAdmin() ? [...NAV, ...ADMIN_NAV] : NAV;
  const logout = () => { clearAuth(); nav('/login'); };
  const ini = user?.name?.split(' ').map(w => w[0]).join('') || '?';

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="hidden lg:flex flex-col w-56 bg-zinc-900/50 border-r border-zinc-800/50 fixed inset-y-0 left-0 z-40">
        <div className="p-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-400/15 flex items-center justify-center"><Zap className="w-4 h-4 text-brand-400" /></div>
          <div><p className="text-sm font-bold text-zinc-100 leading-none">FieldCommand</p><p className="text-[10px] text-zinc-600 mt-0.5">Elite Technologies</p></div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {links.map(l => <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors', isActive ? 'bg-brand-400/10 text-brand-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50')}><l.icon className="w-4 h-4 flex-shrink-0" />{l.label}</NavLink>)}
        </nav>
        <div className="p-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-900" style={{ backgroundColor: user?.color || '#CBA135' }}>{ini}</div>
            <div className="min-w-0 flex-1"><p className="text-xs font-medium text-zinc-300 truncate">{user?.name}</p><p className="text-[10px] text-zinc-600">{user?.role}</p></div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors w-full rounded-lg hover:bg-zinc-800/50"><LogOut className="w-3.5 h-3.5" /> Sign Out</button>
        </div>
      </aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50 h-14 flex items-center justify-between px-4">
        <button onClick={() => setOpen(!open)} className="p-2 text-zinc-400">{open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-brand-400" /><span className="font-bold text-sm">FieldCommand</span></div>
      </div>
      {open && <div className="lg:hidden fixed inset-0 z-40 bg-zinc-950/95 pt-14"><nav className="p-4 space-y-1">
        {links.map(l => <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className={({ isActive }) => cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm', isActive ? 'bg-brand-400/10 text-brand-400' : 'text-zinc-400')}><l.icon className="w-5 h-5" />{l.label}</NavLink>)}
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-500 w-full"><LogOut className="w-5 h-5" /> Sign Out</button>
      </nav></div>}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0"><div className="max-w-6xl mx-auto p-4 lg:p-8"><Outlet /></div></main>
    </div>
  );
}
