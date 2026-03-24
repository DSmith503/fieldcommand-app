import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { cn, initials } from '../utils/api';

// ─── Toast System ───
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return <ToastCtx.Provider value={show}>{children}
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => <div key={t.id} style={{ padding: '12px 20px', borderRadius: 16, fontSize: 13, fontWeight: 500, color: '#fff', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', animation: 'slideIn .3s ease', background: t.type === 'error' ? 'rgba(239,68,68,.9)' : t.type === 'info' ? 'rgba(59,130,246,.9)' : 'rgba(34,197,94,.9)', boxShadow: '0 8px 30px rgba(0,0,0,.3)' }}>{t.msg}</div>)}
    </div>
    <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
  </ToastCtx.Provider>;
}
export const useToast = () => useContext(ToastCtx);

// ─── Core Components ───
export function Badge({ children, variant = 'default' }) {
  const s = { 'not-started':'bg-zinc-800 text-zinc-400', 'in-progress':'bg-amber-950/60 text-amber-400', completed:'bg-emerald-950/60 text-emerald-400', pending:'bg-amber-950/60 text-amber-400', approved:'bg-emerald-950/60 text-emerald-400', denied:'bg-red-950/60 text-red-400', open:'bg-blue-950/60 text-blue-400', scheduled:'bg-purple-950/60 text-purple-400', resolved:'bg-emerald-950/60 text-emerald-400', closed:'bg-zinc-800 text-zinc-500', urgent:'bg-red-950/60 text-red-400', normal:'bg-amber-950/60 text-amber-400', low:'bg-zinc-800 text-zinc-400', admin:'bg-brand-400/15 text-brand-400', employee:'bg-zinc-800 text-zinc-400', programmer:'bg-blue-950/60 text-blue-400', technician:'bg-purple-950/60 text-purple-400', installer:'bg-emerald-950/60 text-emerald-400', default:'bg-zinc-800 text-zinc-400' };
  return <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap', s[variant] || s.default)}>{children}</span>;
}

export function Avatar({ name, color, size = 'md' }) {
  const sz = { sm:'w-6 h-6 text-[9px]', md:'w-8 h-8 text-[11px]', lg:'w-10 h-10 text-sm', xl:'w-12 h-12 text-base' };
  return <div className={cn('rounded-full flex items-center justify-center font-bold text-zinc-900 flex-shrink-0', sz[size])} style={{ backgroundColor: color || '#CBA135' }}>{initials(name)}</div>;
}

export const Card = ({ children, className, onClick }) => <div onClick={onClick} className={cn('bg-white/[0.035] backdrop-blur-xl border border-white/[0.06] rounded-2xl transition-all duration-300', onClick && 'cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.1]', className)}>{children}</div>;

export function PageHeader({ title, subtitle, action }) {
  return <div className="flex items-start justify-between mb-6 gap-4 flex-wrap"><div><h1 className="text-xl lg:text-2xl font-bold text-zinc-100">{title}</h1>{subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}</div>{action}</div>;
}

export const EmptyState = ({ icon: I, title, sub }) => <div className="text-center py-16">{I && <I className="w-10 h-10 text-zinc-700 mx-auto mb-3" />}<p className="text-zinc-500 font-medium">{title}</p>{sub && <p className="text-sm text-zinc-600 mt-1">{sub}</p>}</div>;

export const Spinner = () => <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-zinc-700 border-t-brand-400 rounded-full animate-spin" /></div>;

export const Input = ({ label, className, ...p }) => <div>{label && <label className="text-xs font-medium text-zinc-400 mb-1.5 block">{label}</label>}<input className={cn('w-full bg-white/[0.025] border border-white/[0.06] rounded-2xl px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600 transition-colors', className)} {...p} /></div>;

export function Button({ children, variant = 'primary', className, ...p }) {
  const s = { primary:'bg-gradient-to-br from-brand-400 to-[#D4AF37] hover:brightness-110 text-white font-semibold shadow-lg shadow-brand-400/20', secondary:'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06]', danger:'bg-red-600/20 hover:bg-red-600/30 text-red-400', ghost:'hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-300' };
  return <button className={cn('px-5 py-2.5 rounded-2xl text-sm transition-all duration-300 disabled:opacity-50 flex items-center gap-2', s[variant], className)} {...p}>{children}</button>;
}

export const Select = ({ label, children, className, ...p }) => <div>{label && <label className="text-xs font-medium text-zinc-400 mb-1.5 block">{label}</label>}<select className={cn('w-full bg-[#0a0a0c] border border-white/[0.06] rounded-2xl px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 transition-colors [&>option]:bg-[#0a0a0c] [&>option]:text-zinc-100', className)} {...p}>{children}</select></div>;

export const Textarea = ({ label, className, ...p }) => <div>{label && <label className="text-xs font-medium text-zinc-400 mb-1.5 block">{label}</label>}<textarea className={cn('w-full bg-white/[0.025] border border-white/[0.06] rounded-2xl px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600 transition-colors resize-none', className)} {...p} /></div>;

// ─── Slide-up Modal ───
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-[#121216]/95 backdrop-blur-[60px] border border-white/[0.08] rounded-t-[28px] lg:rounded-[28px] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp .4s cubic-bezier(.34,1.56,.64,1)' }}>
      <div className="w-9 h-1 rounded-full bg-white/15 mx-auto mt-3 mb-2 lg:hidden" />
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-xl bg-white/[0.06] text-zinc-400 hover:text-zinc-200">&times;</button>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  </div>;
}

export function Tabs({ items, active, onChange }) {
  return <div className="flex gap-1 mb-4 flex-wrap">{items.map(t => <button key={t.id} onClick={() => onChange(t.id)} className={cn('text-xs px-3 py-1.5 rounded-xl transition-colors', active === t.id ? 'bg-brand-400/10 text-brand-400 border border-brand-400/30' : 'text-zinc-500 hover:text-zinc-300')}>{t.label}</button>)}</div>;
}

// ─── Widget Card (for dashboard) ───
export function Widget({ icon: I, iconColor, iconBg, title, subtitle, onClick, children, span }) {
  return <Card onClick={onClick} className={cn('p-5', span && 'col-span-full')}>
    <div className="flex items-center gap-3 mb-3">
      {I && <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: iconBg || '#CBA13522' }}><I className="w-5 h-5" style={{ color: iconColor || '#CBA135' }} /></div>}
      <div><p className="font-bold text-base">{title}</p>{subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}</div>
    </div>
    {children}
  </Card>;
}
