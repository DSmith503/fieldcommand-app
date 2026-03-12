import { cn, initials } from '../utils/api';

export function Badge({ children, variant = 'default' }) {
  const s = { 'not-started':'bg-zinc-800 text-zinc-400', 'in-progress':'bg-amber-950/60 text-amber-400',
    completed:'bg-emerald-950/60 text-emerald-400', pending:'bg-amber-950/60 text-amber-400',
    approved:'bg-emerald-950/60 text-emerald-400', denied:'bg-red-950/60 text-red-400',
    open:'bg-blue-950/60 text-blue-400', scheduled:'bg-purple-950/60 text-purple-400',
    resolved:'bg-emerald-950/60 text-emerald-400', closed:'bg-zinc-800 text-zinc-500',
    urgent:'bg-red-950/60 text-red-400', normal:'bg-amber-950/60 text-amber-400', low:'bg-zinc-800 text-zinc-400',
    admin:'bg-brand-400/15 text-brand-400', employee:'bg-zinc-800 text-zinc-400', default:'bg-zinc-800 text-zinc-400' };
  return <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap', s[variant] || s.default)}>{children}</span>;
}
export function Avatar({ name, color, size = 'md' }) {
  const sz = { sm:'w-6 h-6 text-[9px]', md:'w-8 h-8 text-[11px]', lg:'w-10 h-10 text-sm' };
  return <div className={cn('rounded-full flex items-center justify-center font-bold text-zinc-900 flex-shrink-0', sz[size])} style={{ backgroundColor: color || '#CBA135' }}>{initials(name)}</div>;
}
export const Card = ({ children, className, onClick }) => <div onClick={onClick} className={cn('bg-zinc-900/50 border border-zinc-800/50 rounded-xl', onClick && 'cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-700/50 transition-all', className)}>{children}</div>;
export function PageHeader({ title, subtitle, action }) {
  return <div className="flex items-start justify-between mb-6 gap-4"><div><h1 className="text-xl lg:text-2xl font-bold text-zinc-100">{title}</h1>{subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}</div>{action}</div>;
}
export const EmptyState = ({ icon: I, title, sub }) => <div className="text-center py-16">{I && <I className="w-10 h-10 text-zinc-700 mx-auto mb-3" />}<p className="text-zinc-500 font-medium">{title}</p>{sub && <p className="text-sm text-zinc-600 mt-1">{sub}</p>}</div>;
export const Spinner = () => <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-zinc-700 border-t-brand-400 rounded-full animate-spin" /></div>;
export const Input = ({ label, className, ...p }) => <div>{label && <label className="text-xs font-medium text-zinc-400 mb-1.5 block">{label}</label>}<input className={cn('w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600 transition-colors', className)} {...p} /></div>;
export function Button({ children, variant = 'primary', className, ...p }) {
  const s = { primary:'bg-brand-400 hover:bg-brand-500 text-zinc-900 font-semibold', secondary:'bg-zinc-800 hover:bg-zinc-700 text-zinc-300', danger:'bg-red-600/20 hover:bg-red-600/30 text-red-400', ghost:'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-300' };
  return <button className={cn('px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2', s[variant], className)} {...p}>{children}</button>;
}
export const Select = ({ label, children, className, ...p }) => <div>{label && <label className="text-xs font-medium text-zinc-400 mb-1.5 block">{label}</label>}<select className={cn('w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-brand-400/50 transition-colors', className)} {...p}>{children}</select></div>;
export const Textarea = ({ label, className, ...p }) => <div>{label && <label className="text-xs font-medium text-zinc-400 mb-1.5 block">{label}</label>}<textarea className={cn('w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600 transition-colors resize-none', className)} {...p} /></div>;
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}><div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between p-5 border-b border-zinc-800/50"><h2 className="text-lg font-bold text-zinc-100">{title}</h2><button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xl leading-none">&times;</button></div><div className="p-5">{children}</div></div></div>;
}
export function Tabs({ items, active, onChange }) {
  return <div className="flex gap-1 mb-4 flex-wrap">{items.map(t => <button key={t.id} onClick={() => onChange(t.id)} className={cn('text-xs px-3 py-1.5 rounded-lg transition-colors', active === t.id ? 'bg-brand-400/10 text-brand-400' : 'text-zinc-500 hover:text-zinc-300')}>{t.label}</button>)}</div>;
}
