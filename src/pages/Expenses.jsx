import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api, fmtMoney, fmtDate, isAdmin } from '../utils/api';
import { Card, Badge, Avatar, Spinner, PageHeader, Button, Modal, Input, Select, Textarea, Tabs, EmptyState } from '../components/UI';
import { Receipt, Plus, Upload } from 'lucide-react';

export default function Expenses() {
  const { data: expenses, loading, reload } = useApi('/expenses');
  const { data: projects } = useApi('/projects');
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', amount: '', date: new Date().toISOString().split('T')[0],
    category: 'Materials', project_id: '', reimbursable: false,
  });
  const [receipt, setReceipt] = useState(null);

  const up = (k, v) => setForm({ ...form, [k]: v });

  async function submit() {
    if (!form.title || !form.amount) { alert('Title and amount are required'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('amount', form.amount);
      fd.append('date', form.date);
      fd.append('category', form.category);
      if (form.project_id) fd.append('project_id', form.project_id);
      fd.append('reimbursable', form.reimbursable);
      if (receipt) fd.append('receipt', receipt);

      const token = localStorage.getItem('fc_token');
      const base = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(base + '/expenses', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: fd,
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || 'Failed'); }

      setShowNew(false);
      setForm({ title: '', description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Materials', project_id: '', reimbursable: false });
      setReceipt(null);
      reload();
    } catch (e) { alert(e.message); }
    setBusy(false);
  }

  if (loading) return <Spinner />;
  const filtered = filter === 'all' ? expenses
    : filter === 'reimbursable' ? (expenses || []).filter(e => e.reimbursable)
    : filter === 'fuel' ? (expenses || []).filter(e => e.category === 'Gas')
    : (expenses || []).filter(e => e.project_id);
  const total = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const reimb = (expenses || []).filter(e => e.reimbursable).reduce((s, e) => s + Number(e.amount), 0);
  const fuelTotal = (expenses || []).filter(e => e.category === 'Gas').reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHeader title="Expenses"
        subtitle={(expenses?.length || 0) + ' entries · ' + fmtMoney(total) + ' total · ' + fmtMoney(reimb) + ' reimbursable · ' + fmtMoney(fuelTotal) + ' fuel'}
        action={<Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> Add Expense</Button>} />

      <Tabs items={[
        {id:'all', label:'All'},
        {id:'job', label:'Job-Linked'},
        {id:'fuel', label:'Fuel'},
        {id:'reimbursable', label:'Reimbursable'},
      ]} active={filter} onChange={setFilter} />

      {!filtered?.length ? <EmptyState icon={Receipt} title="No expenses" sub="Add one with the button above" /> : filtered.map(e => (
        <Card key={e.id} className="p-4 mb-2 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-100">{e.title}</p>
            {e.description && <p className="text-xs text-zinc-500 mt-0.5">{e.description}</p>}
            <div className="flex gap-2 mt-1 flex-wrap">
              <Badge>{e.category}</Badge>
              {e.project_address && <span className="text-xs text-blue-400">{e.project_address}</span>}
              {e.reimbursable && <Badge variant="pending">Reimbursable</Badge>}
              <span className="text-xs text-zinc-600">{e.user_name} · {fmtDate(e.date)}</span>
            </div>
          </div>
          <p className="text-base font-bold text-zinc-100 flex-shrink-0">{fmtMoney(e.amount)}</p>
        </Card>
      ))}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Expense">
        <div className="space-y-3">
          <Input label="Title *" value={form.title} onChange={e => up('title', e.target.value)} placeholder="What was purchased" />
          <Textarea label="Details" rows={2} value={form.description} onChange={e => up('description', e.target.value)} placeholder="Description..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount ($) *" type="number" value={form.amount} onChange={e => up('amount', e.target.value)} placeholder="0.00" />
            <Input label="Date" type="date" value={form.date} onChange={e => up('date', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={e => up('category', e.target.value)}>
              <option value="Materials">Materials</option>
              <option value="Gas">Gas / Fuel</option>
              <option value="Tools">Tools</option>
              <option value="Subcontractor">Subcontractor</option>
              <option value="Misc">Misc</option>
            </Select>
            <Select label="Link to Project" value={form.project_id} onChange={e => up('project_id', e.target.value)}>
              <option value="">None (general)</option>
              {(projects || []).map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="reimb" checked={form.reimbursable} onChange={e => up('reimbursable', e.target.checked)} className="rounded" />
            <label htmlFor="reimb" className="text-sm text-zinc-400">Reimbursable (I paid out of pocket)</label>
          </div>
          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center">
            <Upload className="w-5 h-5 text-zinc-600 mx-auto mb-1" />
            <p className="text-xs text-zinc-500">{receipt ? receipt.name : 'Upload receipt photo'}</p>
            <input type="file" accept="image/*" onChange={e => setReceipt(e.target.files[0])} className="mt-2 text-xs text-zinc-500" />
          </div>
          <Button onClick={submit} disabled={busy || !form.title || !form.amount}>
            {busy ? 'Saving...' : 'Save Expense'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
