import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api, isAdmin, fmtMoney } from '../utils/api';
import { Card, Badge, Avatar, Spinner, PageHeader, Button, Modal, Input, Select, EmptyState } from '../components/UI';
import { UserCog, Plus } from 'lucide-react';

export default function Team() {
  const { data: users, loading, reload } = useApi('/users');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', hourly_rate: '', color: '#60A5FA' });
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try { await api('/users', { method: 'POST', body: JSON.stringify({ ...form, hourly_rate: Number(form.hourly_rate) || 0 }) }); setShowNew(false); setForm({ name: '', email: '', password: '', role: 'employee', hourly_rate: '', color: '#60A5FA' }); reload(); }
    catch (e) { alert(e.message); }
    setBusy(false);
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Team" subtitle={(users?.length || 0) + ' members'} action={isAdmin() && <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> Add User</Button>} />
      {(users || []).map(u => (
        <Card key={u.id} className="p-4 mb-2 flex items-center gap-4">
          <Avatar name={u.name} color={u.color} size="lg" />
          <div className="min-w-0 flex-1"><p className="font-medium text-zinc-100">{u.name}</p><p className="text-xs text-zinc-500">{u.email}</p></div>
          <div className="text-right flex-shrink-0"><Badge variant={u.role}>{u.role}</Badge>{u.role === 'employee' && <p className="text-xs text-zinc-500 mt-1">{fmtMoney(u.hourly_rate)}/hr</p>}</div>
        </Card>
      ))}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Team Member"><div className="space-y-3">
        <Input label="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <Input label="Email *" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <Input label="Password *" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="employee">Employee</option><option value="admin">Admin</option></Select>
          <Input label="Hourly Rate" type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} />
        </div>
        <Button onClick={submit} disabled={busy}>{busy ? 'Creating...' : 'Add User'}</Button>
      </div></Modal>
    </div>
  );
}
