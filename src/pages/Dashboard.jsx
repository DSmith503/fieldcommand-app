import { useApi } from '../hooks/useApi';
import { getUser, isAdmin, fmtMoney, cn } from '../utils/api';
import { Card, Badge, Avatar, Spinner, PageHeader } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Clock, MessageSquare, TrendingUp, AlertTriangle, Wrench } from 'lucide-react';

export default function Dashboard() {
  const user = getUser();
  const nav = useNavigate();
  const { data: projects, loading } = useApi('/projects');
  const { data: serviceCalls } = useApi('/service-calls');
  const { data: activity } = useApi(isAdmin() ? '/activity?limit=10' : '/messages');

  if (loading) return <Spinner />;

  const active = projects?.filter(p => p.status === 'in-progress') || [];
  const openSC = serviceCalls?.filter(s => ['open','scheduled','in-progress'].includes(s.status)) || [];
  const unassignedSC = serviceCalls?.filter(s => !s.assigned_to && s.status !== 'resolved' && s.status !== 'closed') || [];

  return (
    <div>
      <PageHeader title={"Welcome back, " + (user?.name?.split(' ')[0] || '')} subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active Projects', value: active.length, icon: FolderKanban, color: 'text-blue-400' },
          { label: 'Total Projects', value: projects?.length || 0, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Open Service Calls', value: openSC.length, icon: Wrench, color: 'text-orange-400' },
          { label: 'Unassigned', value: unassignedSC.length, icon: AlertTriangle, color: 'text-amber-400' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><s.icon className={cn('w-4 h-4 mb-2', s.color)} /><p className="text-2xl font-bold text-zinc-100">{s.value}</p><p className="text-xs text-zinc-500 mt-0.5">{s.label}</p></Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Projects</h2>
          <div className="space-y-2">{(projects || []).slice(0, 6).map(p => (
            <Card key={p.id} onClick={() => nav('/projects/' + p.id)} className="p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-zinc-100 text-sm truncate">{p.address}</p><p className="text-xs text-zinc-500 mt-0.5">{p.client_name || 'No client'}</p></div><Badge variant={p.status}>{p.status}</Badge></div>
              <div className="mt-3 flex items-center gap-3"><div className="flex-1 bg-zinc-800 rounded-full h-1.5"><div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: p.progress + '%' }} /></div><span className="text-xs text-zinc-500 tabular-nums">{p.progress}%</span></div>
            </Card>
          ))}</div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Recent Activity</h2>
          <div className="space-y-1.5">{(activity || []).slice(0, 8).map((a, i) => (
            <Card key={a.id || i} className="px-4 py-3"><p className="text-sm text-zinc-300">{a.description || a.text}</p><p className="text-[11px] text-zinc-600 mt-1">{a.user_name && <><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: a.user_color }} />{a.user_name} &middot; </>}{new Date(a.created_at).toLocaleString()}</p></Card>
          ))}</div>
        </div>
      </div>
    </div>
  );
}
