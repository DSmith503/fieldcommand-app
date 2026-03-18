import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api, isAdmin, fmtMoney } from '../utils/api';
import { Card, Badge, Spinner, PageHeader, Button, Modal, Select, Textarea, Input, Tabs, EmptyState } from '../components/UI';
import { FileText, Plus, Trash2 } from 'lucide-react';

export default function ChangeOrders() {
  const { data: orders, loading, reload } = useApi('/change-orders');
  const { data: projects } = useApi('/projects');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ project_id: '', text: '', cost: '' });
  const [filter, setFilter] = useState('all');

  async function submit() {
    if (!form.project_id || !form.text) return;
    try { await api('/change-orders', { method: 'POST', body: JSON.stringify({ ...form, cost: Number(form.cost) || 0 }) }); setShowNew(false); setForm({ project_id: '', text: '', cost: '' }); reload(); }
    catch (e) { alert(e.message); }
  }

  async function updateStatus(id, status) {
    try { await api('/change-orders/' + id, { method: 'PATCH', body: JSON.stringify({ status }) }); reload(); }
    catch (e) { alert(e.message); }
  }

  async function deleteCO(id) {
    if (!confirm('Delete this change order?')) return;
    try { await api('/change-orders/' + id, { method: 'DELETE' }); reload(); }
    catch (e) { alert(e.message); }
  }

  if (loading) return <Spinner />;
  const filtered = filter === 'all' ? orders : (orders || []).filter(co => co.status === filter);
  const pending = (orders || []).filter(c => c.status === 'pending').length;
  const approved = (orders || []).filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.cost || 0), 0);

  return (
    <div>
      <PageHeader title="Change Orders" subtitle={(orders?.length || 0) + ' total · ' + pending + ' pending · ' + fmtMoney(approved) + ' approved'} action={<Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> Submit CO</Button>} />
      <Tabs items={[{id:'all',label:'All'},{id:'pending',label:'Pending ('+pending+')'},{id:'approved',label:'Approved'},{id:'denied',label:'Denied'}]} active={filter} onChange={setFilter} />
      {!filtered?.length ? <EmptyState icon={FileText} title="No change orders" /> : filtered.map(co => (
        <Card key={co.id} className="p-4 mb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1"><p className="text-sm text-zinc-200">{co.text}</p><p className="text-xs text-zinc-500 mt-1">{co.project_address} · {fmtMoney(co.cost)} · {co.submitted_by_name} · {new Date(co.created_at).toLocaleDateString()}</p></div>
            <div className="flex items-center gap-2">
              <Badge variant={co.status}>{co.status}</Badge>
              {isAdmin() && <button onClick={() => deleteCO(co.id)} className="text-zinc-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          </div>
          {isAdmin() && co.status === 'pending' && <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800/50"><Button onClick={() => updateStatus(co.id, 'approved')} className="text-xs py-1 px-3">Approve</Button><Button variant="danger" onClick={() => updateStatus(co.id, 'denied')} className="text-xs py-1 px-3">Deny</Button></div>}
        </Card>
      ))}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Submit Change Order"><div className="space-y-3">
        <Select label="Project *" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}><option value="">Select...</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</Select>
        <Textarea label="Description *" rows={3} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Describe the change..." />
        <Input label="Cost ($)" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
        <Button onClick={submit}>Submit</Button>
      </div></Modal>
    </div>
  );
}
