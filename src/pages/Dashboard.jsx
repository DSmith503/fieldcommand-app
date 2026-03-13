import { useApi } from '../hooks/useApi';
import { getUser, isAdmin, fmtMoney, cn } from '../utils/api';
import { Card, Badge, Avatar, Spinner, Widget } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, FolderKanban, AlertTriangle, Wrench, TrendingUp, ChevronRight, Newspaper, DollarSign } from 'lucide-react';

const ELITE_LOGO = "https://img1.wsimg.com/isteam/ip/514739c3-e1e5-4fa0-81a4-9f7a09e701a3/logo/6f3c0d46-f2e3-4700-8e26-bb72bad64f34.png";

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}

export default function Dashboard() {
  const user = getUser();
  const nav = useNavigate();
  const { data: projects, loading } = useApi('/projects');
  const { data: serviceCalls } = useApi('/service-calls');
  const { data: activity } = useApi(isAdmin() ? '/activity?limit=8' : '/schedule');

  if (loading) return <Spinner />;

  const active = projects?.filter(p => p.status === 'in-progress') || [];
  const openSC = serviceCalls?.filter(s => ['open','scheduled','in-progress'].includes(s.status)) || [];
  const unassigned = serviceCalls?.filter(s => !s.assigned_to && s.status !== 'resolved' && s.status !== 'closed') || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = (activity || []).filter(e => e.date === todayStr || (e.created_at && e.created_at.startsWith(todayStr)));

  return (
    <div>
      {/* Greeting */}
      <div className="flex items-center gap-4 mb-8">
        <img src={ELITE_LOGO} alt="Elite Tech" className="h-10 object-contain" onError={e => e.target.style.display='none'} />
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-zinc-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Today's Schedule - Full Width */}
        <Widget icon={Calendar} iconColor="#CBA135" iconBg="#CBA13522" title="Today's Schedule" subtitle={todayEvents.length + " items today"} onClick={() => nav('/schedule')} span>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-zinc-500">No appointments scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.slice(0, 4).map((e, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.025] rounded-2xl" style={{ borderLeft: '3px solid ' + (e.user_color || '#CBA135') }}>
                  <Avatar name={e.user_name || user.name} color={e.user_color || user.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.description || e.project?.address || 'Scheduled'}</p>
                    <p className="text-xs text-zinc-500 font-mono">{e.shift || e.start_time || ''}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>
              ))}
            </div>
          )}
        </Widget>

        {/* Active Projects */}
        <Widget icon={FolderKanban} iconColor="#A78BFA" iconBg="#8E3AE822" title="Active Projects" subtitle={active.length + " in progress"} onClick={() => nav('/projects')}>
          {active.length === 0 ? <p className="text-sm text-zinc-500">No active projects</p> : (
            <div className="space-y-2">
              {active.slice(0, 3).map(p => (
                <div key={p.id} className="px-3 py-2 bg-white/[0.025] rounded-xl" style={{ borderLeft: '3px solid ' + (p.progress > 60 ? '#34D399' : p.progress > 30 ? '#F59E0B' : '#60A5FA') }}>
                  <p className="text-sm font-medium">{p.address}</p>
                  {p.client_name && <p className="text-xs text-zinc-600">{p.client_name}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-white/[0.06] rounded-full"><div className="h-full rounded-full transition-all" style={{ width: p.progress + '%', background: p.progress > 60 ? '#34D399' : p.progress > 30 ? '#F59E0B' : '#60A5FA' }} /></div>
                    <span className="text-xs font-bold font-mono" style={{ color: p.progress > 60 ? '#34D399' : p.progress > 30 ? '#F59E0B' : '#60A5FA' }}>{p.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Widget>

        {/* Open Service Calls */}
        <Widget icon={Wrench} iconColor="#F97316" iconBg="#F9731622" title="Service Calls" subtitle={openSC.length + " open"} onClick={() => nav('/service-calls')}>
          {openSC.length === 0 ? <p className="text-sm text-zinc-500">No open service calls</p> : (
            <div className="space-y-2">
              {openSC.slice(0, 3).map(sc => (
                <div key={sc.id} className="flex items-center gap-2 text-sm">
                  <Badge variant={sc.priority}>{sc.priority}</Badge>
                  <span className="text-zinc-300 truncate flex-1">{sc.description?.substring(0, 40)}</span>
                </div>
              ))}
            </div>
          )}
        </Widget>

        {/* Quick Stats - Full Width */}
        <Card className="p-5 col-span-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Projects', value: active.length, color: '#A78BFA', icon: FolderKanban },
              { label: 'Open Service Calls', value: openSC.length, color: '#F97316', icon: Wrench },
              { label: 'Unassigned', value: unassigned.length, color: '#F59E0B', icon: AlertTriangle },
              { label: 'Total Projects', value: projects?.length || 0, color: '#34D399', icon: TrendingUp },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        {isAdmin() && <Widget icon={TrendingUp} iconColor="#34D399" iconBg="#22C55E22" title="Recent Activity" subtitle="Latest updates" span>
          <div className="space-y-1.5">
            {(activity || []).slice(0, 6).map((a, i) => (
              <div key={a.id || i} className="flex items-center gap-2 px-3 py-2 bg-white/[0.015] rounded-xl text-sm">
                {a.user_color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.user_color }} />}
                <span className="text-zinc-300 truncate flex-1">{a.description}</span>
                <span className="text-[10px] text-zinc-600 flex-shrink-0">{a.user_name}</span>
              </div>
            ))}
          </div>
        </Widget>}
      </div>
    </div>
  );
}
