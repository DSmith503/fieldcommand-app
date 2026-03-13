import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { api, fmtMoney, fmtDate, cn } from '../utils/api';
import { Card, Badge, Avatar, Spinner, PageHeader, Button, Modal, Input, Select, Tabs, useToast } from '../components/UI';
import { UserCog, Plus, Trash2, BarChart3, Phone, Globe, Mail } from 'lucide-react';

const VENDORS = [
  {c:"Lighting",n:"Lutron",p:"(800) 523-9466",e:"support@lutron.com"},
  {c:"Lighting",n:"DMF Lighting",p:"(800) 285-5411",e:"support@dmflighting.com"},
  {c:"Automation",n:"Control4",p:"(888) 400-4070",e:"support@control4.com"},
  {c:"Automation",n:"Savant",p:"(877) 728-2685",e:"support@savant.com"},
  {c:"Automation",n:"Crestron",p:"(800) 237-2041",e:"support@crestron.com"},
  {c:"Networking",n:"Ubiquiti",p:"(408) 942-3085",e:"support via ui.com"},
  {c:"Networking",n:"Araknis",p:"(866) 838-5052",e:"techsupport@snapone.com"},
  {c:"Audio",n:"Sonos",p:"(800) 680-2345",e:"support@sonos.com"},
  {c:"Audio",n:"Sonance",p:"(949) 492-7777",e:"techsupport@sonance.com"},
  {c:"Video",n:"Sony Pro",p:"(866) 769-7669",e:"prosupport@sony.com"},
];

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const { data: users, loading: uLoad, reload: rUsers } = useApi('/users');
  const { data: projects } = useApi('/projects');
  const [activityData, setActivityData] = useState([]);
  const [actLoading, setActLoading] = useState(false);
  const [actFilters, setActFilters] = useState({ user_id: '', start_date: '', end_date: '' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'technician', hourly_rate: '', color: '#60A5FA' });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (tab === 'log') {
      setActLoading(true);
      const p = new URLSearchParams({ limit: '200' });
      if (actFilters.user_id) p.set('user_id', actFilters.user_id);
      if (actFilters.start_date) p.set('start_date', actFilters.start_date);
      if (actFilters.end_date) p.set('end_date', actFilters.end_date);
      api('/activity?' + p.toString()).then(setActivityData).catch(console.error).finally(() => setActLoading(false));
    }
  }, [tab, actFilters]);

  async function addUser() {
    if (!newUser.name || !newUser.email || !newUser.password) { toast('Fill in all required fields', 'error'); return; }
    setBusy(true);
    try {
      await api('/users', { method: 'POST', body: JSON.stringify({ ...newUser, hourly_rate: Number(newUser.hourly_rate) || 0 }) });
      setShowAddUser(false); setNewUser({ name: '', email: '', password: '', role: 'technician', hourly_rate: '', color: '#60A5FA' }); rUsers(); toast('User added!');
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  }

  async function deleteUser(id) {
    if (!confirm('Remove this user?')) return;
    try { await api('/users/' + id, { method: 'DELETE' }); rUsers(); toast('User removed'); }
    catch (e) { toast(e.message, 'error'); }
  }

  if (uLoad) return <Spinner />;

  // Performance analytics
  const employees = (users || []).filter(u => u.role !== 'admin');

  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="User management, activity log & performance tracking" />

      <Tabs items={[
        { id: 'users', label: '👤 Users' },
        { id: 'log', label: '📋 Activity Log' },
        { id: 'performance', label: '📊 Performance' },
        { id: 'vendors', label: '🏢 Vendors' },
        { id: 'cloud', label: '☁️ Cloud' },
      ]} active={tab} onChange={setTab} />

      {/* ── Users ── */}
      {tab === 'users' && <div>
        <div className="flex justify-end mb-4"><Button onClick={() => setShowAddUser(true)}><Plus className="w-4 h-4" /> Add User</Button></div>
        {(users || []).map(u => (
          <Card key={u.id} className="p-4 mb-2 flex items-center gap-4">
            <Avatar name={u.name} color={u.color} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{u.name}</p>
              <p className="text-xs text-zinc-500">{u.email}</p>
            </div>
            <div className="text-right flex-shrink-0 flex items-center gap-3">
              <div><Badge variant={u.role}>{u.role}</Badge>{u.hourly_rate > 0 && <p className="text-xs text-zinc-500 mt-1">{fmtMoney(u.hourly_rate)}/hr</p>}</div>
              <button onClick={() => deleteUser(u.id)} className="text-zinc-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </Card>
        ))}
        <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title="Add Team Member"><div className="space-y-3">
          <Input label="Full Name *" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
          <Input label="Email *" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
          <Input label="Password *" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Role" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}><option value="installer">Installer</option><option value="technician">Technician</option><option value="programmer">Programmer</option><option value="admin">Admin</option></Select>
            <Input label="Hourly Rate" type="number" value={newUser.hourly_rate} onChange={e => setNewUser({ ...newUser, hourly_rate: e.target.value })} />
          </div>
          <Button onClick={addUser} disabled={busy}>{busy ? 'Creating...' : 'Add User'}</Button>
        </div></Modal>
      </div>}

      {/* ── Activity Log ── */}
      {tab === 'log' && <div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Select label="User" value={actFilters.user_id} onChange={e => setActFilters({ ...actFilters, user_id: e.target.value })}><option value="">All</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
          <Input label="From" type="date" value={actFilters.start_date} onChange={e => setActFilters({ ...actFilters, start_date: e.target.value })} />
          <Input label="To" type="date" value={actFilters.end_date} onChange={e => setActFilters({ ...actFilters, end_date: e.target.value })} />
        </div>
        {actLoading ? <Spinner /> : (activityData || []).map(l => (
          <Card key={l.id} className="px-4 py-3 mb-1.5">
            <p className="text-sm text-zinc-300">{l.description}</p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-600">
              {l.user_color && <span className="w-2 h-2 rounded-full" style={{ background: l.user_color }} />}
              <span>{l.user_name}</span><span>·</span><span>{new Date(l.created_at).toLocaleString()}</span>
              {l.project_address && <><span>·</span><span>{l.project_address}</span></>}
            </div>
          </Card>
        ))}
        {!actLoading && !activityData?.length && <p className="text-center text-zinc-500 py-12">No activity matching filters</p>}
      </div>}

      {/* ── Performance ── */}
      {tab === 'performance' && <div>
        <Card className="p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <p className="font-bold">Team Performance</p>
          </div>
          <p className="text-xs text-zinc-500 mb-4">Hours logged, project breakdown, and cost analysis per team member. Connect time tracking data for live analytics.</p>
          {employees.length === 0 ? <p className="text-zinc-500 text-sm">No employees to show</p> : employees.map(u => (
            <Card key={u.id} className="p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={u.name} color={u.color} />
                <div className="flex-1"><p className="font-semibold">{u.name}</p><Badge variant={u.role}>{u.role}</Badge></div>
                <div className="text-right">
                  <p className="text-lg font-bold font-mono text-brand-400">0h</p>
                  <p className="text-[10px] text-zinc-500">{fmtMoney(u.hourly_rate)}/hr</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/[0.025] rounded-xl py-2"><p className="text-base font-bold font-mono">0</p><p className="text-[10px] text-zinc-500">Sessions</p></div>
                <div className="bg-white/[0.025] rounded-xl py-2"><p className="text-base font-bold font-mono">0h</p><p className="text-[10px] text-zinc-500">Avg/Day</p></div>
                <div className="bg-white/[0.025] rounded-xl py-2"><p className="text-base font-bold font-mono">$0</p><p className="text-[10px] text-zinc-500">Labor Cost</p></div>
              </div>
            </Card>
          ))}
        </Card>
      </div>}

      {/* ── Vendors ── */}
      {tab === 'vendors' && <div>
        <Card className="p-5">
          <p className="font-bold mb-3">Vendor Directory ({VENDORS.length} vendors)</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Array.from(new Set(VENDORS.map(v => v.c))).map(c => <span key={c} className="text-xs px-2.5 py-1 rounded-xl bg-white/[0.025] border border-white/[0.06] text-zinc-400">{c} ({VENDORS.filter(v => v.c === c).length})</span>)}
          </div>
          <div className="space-y-2">
            {VENDORS.map((v, i) => <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <div><p className="text-sm font-medium">{v.n}</p><p className="text-[11px] text-zinc-600">{v.c}</p></div>
              <div className="flex gap-3">
                <a href={"tel:" + v.p.replace(/[^\d]/g, '')} className="text-xs text-zinc-400 hover:text-brand-400"><Phone className="w-3.5 h-3.5" /></a>
                <a href={"mailto:" + v.e} className="text-xs text-zinc-400 hover:text-blue-400"><Mail className="w-3.5 h-3.5" /></a>
              </div>
            </div>)}
          </div>
          <p className="text-xs text-zinc-600 mt-3">Full vendor directory available on the Vendor Support page</p>
        </Card>
      </div>}

      {/* ── Cloud ── */}
      {tab === 'cloud' && <div className="space-y-3">
        {[
          { name: "Google Drive", icon: "📁", desc: "Sync files, create Sheets & Docs" },
          { name: "Dropbox", icon: "📦", desc: "Cloud file storage & sharing" },
          { name: "Google Sheets", icon: "📊", desc: "Create & edit spreadsheets" },
          { name: "QuickBooks", icon: "💰", desc: "Accounting & invoicing integration" },
        ].map(ci => (
          <Card key={ci.name} className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{ci.icon}</span>
              <div><p className="font-semibold">{ci.name}</p><p className="text-xs text-zinc-500">{ci.desc}</p></div>
            </div>
            <Button variant="secondary" onClick={() => toast && toast(ci.name + ' requires OAuth setup in production.', 'info')}>Connect</Button>
          </Card>
        ))}
      </div>}
    </div>
  );
}
