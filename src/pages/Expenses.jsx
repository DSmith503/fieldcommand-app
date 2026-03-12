import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api, fmtMoney, fmtDate } from '../utils/api';
import { Card, Badge, Avatar, Spinner, PageHeader, Button, Modal, Input, Select, Textarea, Tabs, EmptyState } from '../components/UI';
import { Receipt, Plus, Upload } from 'lucide-react';

export default function Expenses() {
  const { data: expenses, loading, reload } = useApi('/expenses');
  const { data: projects } = useApi('/projects');
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState('all');

  if (loading) return <Spinner />;
  const filtered = filter === 'all' ? expenses : filter === 'reimbursable' ? (expenses || []).filter(e => e.reimbursable) : (expenses || []).filter(e => e.project_id);
  const total = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const reimb = (expenses || []).filter(e => e.reimbursable).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHeader title="Expenses" subtitle={(expenses?.length || 0) + ' entries \u00B7 ' + fmtMoney(total) + ' total \u00B7 ' + fmtMoney(reimb) + ' reimbursable'} action={<Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> Add Expense</Button>} />
      <Tabs items={[{id:'all',label:'All'},{id:'job',label:'Job-Linked'},{id:'reimbursable',label:'Reimbursable'}]} active={filter} onChange={setFilter} />
      {!filtered?.length ? <EmptyState icon={Receipt} title="No expenses" /> : filtered.map(e => (
        <Card key={e.id} className="p-4 mb-2 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0"><Receipt className="w-4 h-4 text-zinc-400" /></div>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-zinc-100">{e.title}</p>{e.description && <p className="text-xs text-zinc-500 mt-0.5">{e.description}</p>}<div className="flex gap-2 mt-1 flex-wrap"><Badge>{e.category}</Badge>{e.project_address && <span className="text-xs text-blue-400">{e.project_address}</span>}{e.reimbursable && <Badge variant="pending">Reimbursable</Badge>}<span className="text-xs text-zinc-600">{e.user_name} &middot; {fmtDate(e.date)}</span></div></div>
          <p className="text-base font-bold text-zinc-100 flex-shrink-0">{fmtMoney(e.amount)}</p>
        </Card>
      ))}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Expense"><div className="space-y-3">
        <Input label="Title *" placeholder="What was purchased" />
        <Textarea label="Details" rows={2} placeholder="Description..." />
        <div className="grid grid-cols-2 gap-3"><Input label="Amount ($) *" type="number" /><Input label="Date" type="date" /></div>
        <div className="grid grid-cols-2 gap-3"><Select label="Category"><option>Materials</option><option>Gas</option><option>Tools</option><option>Subcontractor</option><option>Misc</option></Select><Select label="Link to Job"><option value="">None</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</Select></div>
        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center"><Upload className="w-5 h-5 text-zinc-600 mx-auto mb-1" /><p className="text-xs text-zinc-500">Upload receipt</p><input type="file" accept="image/*" className="mt-2 text-xs text-zinc-500" /></div>
        <Button onClick={() => setShowNew(false)}>Save Expense</Button>
      </div></Modal>
    </div>
  );
}
