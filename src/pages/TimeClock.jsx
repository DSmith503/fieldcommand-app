import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { api, fmtDate, fmtMoney, isAdmin, getUser, cn } from '../utils/api';
import { Card, Badge, Avatar, Spinner, PageHeader, Button, Modal, Input, Select, Textarea, Tabs, EmptyState, useToast } from '../components/UI';
import { Clock, Play, Square, Plus, AlertTriangle, Users } from 'lucide-react';

export default function TimeClock() {
  const me = getUser();
  const admin = isAdmin();
  const toast = useToast();
  const { data: dayClock, loading: dcLoad, reload: rDC } = useApi('/time/day-clock');
  const { data: myEntries, loading: eLoad, reload: rEntries } = useApi('/time/entries');
  const { data: projects } = useApi('/projects');
  const { data: serviceCalls } = useApi('/service-calls');
  const { data: users } = useApi('/users');
  const [tab, setTab] = useState('clock');
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '16:30', project_id: '', service_call_id: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [adminEntries, setAdminEntries] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminFilters, setAdminFilters] = useState({ user_id: '', start_date: '', end_date: '' });
  const [activeDayClocks, setActiveDayClocks] = useState([]);

  const isClockedIn = dayClock && !dayClock.clock_out;

  // Admin: load all users' entries
  useEffect(() => {
    if (admin && tab === 'team') {
      setAdminLoading(true);
      const p = new URLSearchParams();
      if (adminFilters.user_id) p.set('user_id', adminFilters.user_id);
      if (adminFilters.start_date) p.set('start_date', adminFilters.start_date);
      if (adminFilters.end_date) p.set('end_date', adminFilters.end_date);
      Promise.all([
        api('/time/admin/all?' + p.toString()),
        api('/time/admin/day-clocks'),
      ]).then(([entries, clocks]) => {
        setAdminEntries(entries || []);
        setActiveDayClocks(clocks || []);
      }).catch(console.error).finally(() => setAdminLoading(false));
    }
  }, [admin, tab, adminFilters]);

  async function toggleDayClock() {
    setBusy(true);
    try {
      if (isClockedIn) {
        await api('/time/day-clock/out', { method: 'POST' });
        toast('Clocked out!');
      } else {
        await api('/time/day-clock/in', { method: 'POST' });
        toast('Clocked in!');
      }
      rDC();
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  }

  async function submitManual() {
    if (!manual.date || !manual.start_time || !manual.end_time) { toast('Date and times required', 'error'); return; }
    setBusy(true);
    try {
      await api('/time/manual-entry', { method: 'POST', body: JSON.stringify(manual) });
      setShowManual(false);
      setManual({ date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '16:30', project_id: '', service_call_id: '', notes: '' });
      rEntries(); toast('Manual entry saved');
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  }

  // Calculate hours from start/end
  function calcHours(start, end) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100;
  }

  if (dcLoad || eLoad) return <Spinner />;

  const entries = myEntries || [];
  const totalHours = entries.reduce((s, e) => s + Number(e.hours || 0), 0);

  const tabs = [{ id: 'clock', label: 'My Time' }];
  if (admin) tabs.push({ id: 'team', label: 'Team Hours' });

  return (
    <div>
      <PageHeader title="Time Clock" subtitle={admin ? 'Track time and view team hours' : 'Track your work hours'}
        action={<Button onClick={() => setShowManual(true)}><Plus className="w-4 h-4" /> Manual Entry</Button>} />

      {admin && <Tabs items={tabs} active={tab} onChange={setTab} />}

      {tab === 'clock' && <>
        {/* Day Clock Card */}
        <Card className="p-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isClockedIn ? "bg-emerald-500/20" : "bg-zinc-800")}>
              <Clock className={cn("w-6 h-6", isClockedIn ? "text-emerald-400" : "text-zinc-500")} />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold">{isClockedIn ? 'Clocked In' : 'Clocked Out'}</p>
              {isClockedIn && dayClock?.clock_in && <p className="text-xs text-emerald-400 font-mono">Since {new Date(dayClock.clock_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>}
            </div>
          </div>
          <button onClick={toggleDayClock} disabled={busy} className={cn("px-8 py-3 rounded-2xl text-base font-semibold transition-all flex items-center gap-2 mx-auto", isClockedIn ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-gradient-to-br from-brand-400 to-[#D4AF37] text-white shadow-lg shadow-brand-400/20")}>
            {isClockedIn ? <><Square className="w-5 h-5" /> Clock Out</> : <><Play className="w-5 h-5" /> Clock In</>}
          </button>
        </Card>

        {/* My Entries */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-zinc-400">My Time Entries</p>
          <p className="text-sm font-bold font-mono text-brand-400">{totalHours.toFixed(1)}h total</p>
        </div>
        {entries.length === 0 ? <EmptyState icon={Clock} title="No time entries" sub="Clock in or add a manual entry" /> :
        entries.slice(0, 30).map(e => (
          <Card key={e.id} className="p-4 mb-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{fmtDate(e.date)}</p>
                  {e.manual && <Badge variant="pending">Manual</Badge>}
                  <Badge>{e.entry_type || 'general'}</Badge>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {e.start_time && new Date(e.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {e.end_time && ' → ' + new Date(e.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
                {e.project_address && <p className="text-xs text-blue-400 mt-0.5">{e.project_address}</p>}
                {e.notes && <p className="text-xs text-zinc-600 mt-0.5">{e.notes}</p>}
              </div>
              <p className="text-lg font-bold font-mono text-zinc-200">{Number(e.hours || 0).toFixed(1)}h</p>
            </div>
          </Card>
        ))}
      </>}

      {/* Admin Team View */}
      {tab === 'team' && admin && <>
        {/* Active Clocks */}
        {activeDayClocks.length > 0 && <Card className="p-4 mb-4">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Currently Clocked In</p>
          <div className="flex flex-wrap gap-3">
            {activeDayClocks.map(c => <div key={c.id} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-xl">
              <Avatar name={c.user_name} color={c.user_color} size="sm" />
              <div><p className="text-sm font-medium">{c.user_name}</p><p className="text-[10px] text-emerald-400 font-mono">Since {new Date(c.clock_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p></div>
            </div>)}
          </div>
        </Card>}

        {/* Filters */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Select label="Employee" value={adminFilters.user_id} onChange={e => setAdminFilters({ ...adminFilters, user_id: e.target.value })}>
            <option value="">All</option>
            {(users || []).filter(u => u.role !== 'admin').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Input label="From" type="date" value={adminFilters.start_date} onChange={e => setAdminFilters({ ...adminFilters, start_date: e.target.value })} />
          <Input label="To" type="date" value={adminFilters.end_date} onChange={e => setAdminFilters({ ...adminFilters, end_date: e.target.value })} />
        </div>

        {/* Summary by User */}
        {!adminLoading && adminEntries.length > 0 && (() => {
          const byUser = {};
          adminEntries.forEach(e => {
            if (!byUser[e.user_name]) byUser[e.user_name] = { color: e.user_color, hours: 0, entries: 0, rate: e.hourly_rate || 0, manual: 0 };
            byUser[e.user_name].hours += Number(e.hours || 0);
            byUser[e.user_name].entries++;
            if (e.manual) byUser[e.user_name].manual++;
          });
          return <div className="grid md:grid-cols-2 gap-3 mb-4">
            {Object.entries(byUser).map(([name, d]) => <Card key={name} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Avatar name={name} color={d.color} />
                <div className="flex-1"><p className="font-semibold">{name}</p><p className="text-[10px] text-zinc-500">{d.entries} entries{d.manual > 0 && ` · ${d.manual} manual`}</p></div>
                <div className="text-right"><p className="text-lg font-bold font-mono text-brand-400">{d.hours.toFixed(1)}h</p>{d.rate > 0 && <p className="text-[10px] text-zinc-500">{fmtMoney(d.hours * d.rate)}</p>}</div>
              </div>
            </Card>)}
          </div>;
        })()}

        {/* All Entries */}
        {adminLoading ? <Spinner /> : adminEntries.length === 0 ? <EmptyState icon={Users} title="No entries" sub="Adjust filters or wait for team to log time" /> :
        adminEntries.slice(0, 50).map(e => (
          <Card key={e.id} className="p-4 mb-1.5">
            <div className="flex items-center gap-3">
              <Avatar name={e.user_name} color={e.user_color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{e.user_name}</p>
                  {e.manual && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />MANUAL</span>}
                  <Badge>{e.entry_type || 'general'}</Badge>
                </div>
                <p className="text-xs text-zinc-500">{fmtDate(e.date)}
                  {e.start_time && ' · ' + new Date(e.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {e.end_time && ' → ' + new Date(e.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
                {e.project_address && <p className="text-xs text-blue-400">{e.project_address}</p>}
                {e.service_call_description && <p className="text-xs text-orange-400">{e.service_call_description}</p>}
                {e.notes && <p className="text-xs text-zinc-600">{e.notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold font-mono">{Number(e.hours || 0).toFixed(1)}h</p>
                {e.hourly_rate > 0 && <p className="text-[10px] text-zinc-500">{fmtMoney(Number(e.hours || 0) * e.hourly_rate)}</p>}
              </div>
            </div>
          </Card>
        ))}
      </>}

      {/* Manual Entry Modal */}
      <Modal open={showManual} onClose={() => setShowManual(false)} title="Manual Time Entry">
        <div className="space-y-3">
          <Input label="Date *" type="date" value={manual.date} onChange={e => setManual({ ...manual, date: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time *" type="time" value={manual.start_time} onChange={e => setManual({ ...manual, start_time: e.target.value })} />
            <Input label="End Time *" type="time" value={manual.end_time} onChange={e => setManual({ ...manual, end_time: e.target.value })} />
          </div>
          {manual.start_time && manual.end_time && <p className="text-xs text-zinc-500">Hours: <span className="font-mono font-bold text-brand-400">{calcHours(manual.start_time, manual.end_time)}h</span></p>}
          <Select label="Project" value={manual.project_id} onChange={e => setManual({ ...manual, project_id: e.target.value, service_call_id: '' })}>
            <option value="">None</option>
            {(projects || []).map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
          </Select>
          <Select label="Service Call" value={manual.service_call_id} onChange={e => setManual({ ...manual, service_call_id: e.target.value, project_id: '' })}>
            <option value="">None</option>
            {(serviceCalls || []).map(sc => <option key={sc.id} value={sc.id}>{sc.description?.substring(0, 50)}</option>)}
          </Select>
          <Textarea label="Notes" rows={2} value={manual.notes} onChange={e => setManual({ ...manual, notes: e.target.value })} placeholder="What did you work on?" />
          <p className="text-[10px] text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> This entry will be flagged as manually entered</p>
          <Button onClick={submitManual} disabled={busy}>{busy ? 'Saving...' : 'Save Entry'}</Button>
        </div>
      </Modal>
    </div>
  );
}
