import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { getUser, isAdmin, fmtMoney, cn } from '../utils/api';
import { Card, Badge, Avatar, Spinner, Widget } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, FolderKanban, Wrench, TrendingUp, ChevronRight, Newspaper, ExternalLink } from 'lucide-react';

const LOGO = "https://img1.wsimg.com/isteam/ip/514739c3-e1e5-4fa0-81a4-9f7a09e701a3/logo/6f3c0d46-f2e3-4700-8e26-bb72bad64f34.png";
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"; };

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

function spark(pos) {
  const pts = Array.from({ length: 20 }, (_, i) => 50 + Math.sin(i * 0.5) * 15 + (pos ? 0.3 : -0.3) * i + Math.sin(i * 1.7) * 5);
  const mn = Math.min(...pts); const mx = Math.max(...pts);
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i / 19) * 70},${28 - ((p - mn) / (mx - mn || 1)) * 28}`).join(" ");
}

const SRC_COLORS = { "CEDIA": "#CBA135", "CE Pro": "#A78BFA", "Residential Systems": "#60A5FA", "rAVe": "#34D399" };

export default function Dashboard() {
  const user = getUser();
  const nav = useNavigate();
  const { data: projects, loading } = useApi('/projects');
  const { data: serviceCalls } = useApi('/service-calls');
  const { data: schedule } = useApi('/schedule');
  const { data: stockData } = useApi('/market/stocks');
  const { data: newsData } = useApi('/market/news');
  const [period, setPeriod] = useState("1D");

  if (loading) return <Spinner />;

  const active = projects?.filter(p => p.status === 'in-progress') || [];
  const openSC = serviceCalls?.filter(s => ['open', 'scheduled', 'in-progress'].includes(s.status)) || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = (schedule || []).filter(e => e.date && (e.date === todayStr || e.date.startsWith(todayStr)));
  const stocks = stockData?.stocks || [];
  const news = newsData?.articles || [];

  return (
    <div>
      {/* Greeting */}
      <div className="flex items-center gap-4 mb-8">
        <img src={LOGO} alt="Elite Tech" className="h-10 object-contain" onError={e => e.target.style.display = 'none'} />
        <div>
          <h1 className="text-2xl font-bold">{greet()}, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-zinc-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Today's Schedule */}
        <Widget icon={Calendar} iconColor="#CBA135" iconBg="#CBA13522" title="Today's Schedule" subtitle={todayEvents.length + " appointment" + (todayEvents.length !== 1 ? "s" : "") + " today"} onClick={() => nav('/schedule')} span>
          {todayEvents.length === 0 ? <p className="text-sm text-zinc-500">No appointments scheduled for today</p> : (
            <div className="space-y-2">
              {todayEvents.slice(0, 5).map((e, i) => (
                <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 bg-white/[0.025] rounded-2xl" style={{ borderLeft: '3px solid ' + (e.user_color || '#CBA135') }}>
                  <Avatar name={e.user_name || user.name} color={e.user_color || user.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{e.description || e.project?.address || 'Scheduled'}</p>
                    <p className="text-xs text-zinc-500 font-mono">{e.shift || e.start_time || ''}</p>
                    {e.project?.client_name && <p className="text-[11px] text-zinc-600">{e.project.client_name}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>
              ))}
            </div>
          )}
        </Widget>

        {/* Weekly Hours */}
        <Widget icon={Clock} iconColor="#34D399" iconBg="#22C55E22" title="Hours This Week" subtitle="Clock entries">
          <p className="text-4xl font-bold font-mono text-emerald-400">0<span className="text-base text-zinc-500">h</span></p>
          <p className="text-xs text-zinc-600 mt-1">Time clock tracks hours automatically</p>
        </Widget>

        {/* Messages */}
        <Widget icon={MessageSquare} iconColor="#60A5FA" iconBg="#3A8EE822" title="Messages" subtitle="Recent conversations" onClick={() => nav('/messages')}>
          <p className="text-sm text-zinc-500">View your conversations</p>
        </Widget>

        {/* Active Projects */}
        <Widget icon={FolderKanban} iconColor="#A78BFA" iconBg="#8E3AE822" title="Active Projects" subtitle={active.length + " in progress"} onClick={() => nav('/projects')} span>
          {active.length === 0 ? <p className="text-sm text-zinc-500">No active projects</p> : (
            <div className="grid md:grid-cols-2 gap-2.5">
              {active.slice(0, 4).map(p => {
                const clr = p.progress > 60 ? '#34D399' : p.progress > 30 ? '#F59E0B' : '#60A5FA';
                return <div key={p.id} className="px-3.5 py-2.5 bg-white/[0.025] rounded-2xl" style={{ borderLeft: '3px solid ' + clr }}>
                  <p className="text-sm font-semibold">{p.address}</p>
                  {p.client_name && <p className="text-[11px] text-zinc-600 mb-1.5">{p.client_name}</p>}
                  <div className="flex items-center gap-2"><div className="flex-1 h-1 bg-white/[0.06] rounded-full"><div className="h-full rounded-full" style={{ width: p.progress + '%', background: clr }} /></div><span className="text-xs font-bold font-mono" style={{ color: clr }}>{p.progress}%</span></div>
                </div>;
              })}
            </div>
          )}
        </Widget>

        {/* Industry News - LIVE */}
        <Card className="p-5 col-span-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-400/10 flex items-center justify-center"><Newspaper className="w-5 h-5 text-brand-400" /></div>
            <div>
              <p className="font-bold text-base">Industry News</p>
              <p className="text-xs text-zinc-500">CEDIA · CE Pro · Residential Systems · rAVe{newsData?.source === 'live' && <span className="text-emerald-400 ml-2">● Live</span>}</p>
            </div>
          </div>
          <div className="space-y-2">
            {news.length ? news.map((n, i) => {
              const clr = SRC_COLORS[n.source] || '#71717A';
              return <div key={i} onClick={() => n.url && window.open(n.url, '_blank')} className="px-3.5 py-3 bg-white/[0.025] rounded-2xl cursor-pointer hover:bg-white/[0.04] transition-colors" style={{ borderLeft: '3px solid ' + clr }}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: clr }}>{n.source}</span>
                  <span className="text-[10px] text-zinc-600">{timeAgo(n.publishedAt)}</span>
                </div>
                <p className="text-sm font-semibold text-zinc-100 mb-1 leading-snug">{n.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{n.summary}</p>
                {n.url && <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-600"><ExternalLink className="w-3 h-3" />Read more</div>}
              </div>;
            }) : <p className="text-sm text-zinc-500 py-4 text-center">Loading news...</p>}
          </div>
        </Card>

        {/* Industry Stocks - LIVE */}
        <Card className="p-5 col-span-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <p className="font-bold text-base">Industry Stocks</p>
                <p className="text-xs text-zinc-500">Brands in the CI & smart home space{stocks.some(s => s.price) && <span className="text-emerald-400 ml-2">● Live</span>}</p>
              </div>
            </div>
            <div className="flex gap-0.5 bg-white/[0.025] rounded-xl p-0.5">
              {["1D", "1W", "1M", "3M", "1Y"].map(p => <button key={p} onClick={() => setPeriod(p)} className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono", period === p ? "bg-brand-400 text-white" : "text-zinc-500")}>{p}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {stocks.map(s => {
              const up = s.change > 0; const clr = s.price ? (up ? '#34D399' : '#F87171') : '#71717A';
              return <div key={s.symbol} className="px-3.5 py-2.5 bg-white/[0.025] rounded-2xl flex items-center justify-between">
                <div className="min-w-0"><p className="text-sm font-bold font-mono">{s.symbol}</p><p className="text-[11px] text-zinc-600 truncate">{s.name}</p></div>
                {s.price ? <div className="flex items-center gap-2">
                  <svg width={70} height={28} className="flex-shrink-0"><path d={spark(up)} fill="none" stroke={clr} strokeWidth="1.5" /></svg>
                  <div className="text-right"><p className="text-sm font-bold font-mono">${s.price.toFixed(2)}</p><p className="text-[10px] font-semibold font-mono" style={{ color: clr }}>{up ? '+' : ''}{(s.pct || 0).toFixed(2)}%</p></div>
                </div> : <span className="text-[10px] text-zinc-600 italic">{s.error ? 'No API key' : 'Private'}</span>}
              </div>;
            })}
          </div>
          {!stocks.some(s => s.price) && <p className="text-xs text-zinc-600 text-center mt-3">Add FINNHUB_API_KEY in Railway to see live prices</p>}
        </Card>

      </div>
    </div>
  );
}
