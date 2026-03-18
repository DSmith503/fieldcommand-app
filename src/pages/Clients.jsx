import { useState, useEffect, useCallback } from "react";
import { api, isAdmin, fmtDate } from "../utils/api";
import { Card, Badge, Spinner, PageHeader, Button, Modal, Input, Textarea, EmptyState } from "../components/UI";
import { Users, Plus, Search, Edit } from "lucide-react";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", billing_address: "", job_address: "", notes: "", source: "" });
  const [busy, setBusy] = useState(false);
  const up = (k, v) => setForm({ ...form, [k]: v });

  const load = useCallback(() => {
    setLoading(true);
    api("/clients" + (search ? "?search=" + encodeURIComponent(search) : "")).then(setClients).catch(console.error).finally(() => setLoading(false));
  }, [search]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  async function submit() {
    setBusy(true);
    try { await api("/clients", { method: "POST", body: JSON.stringify(form) }); setShowNew(false); setForm({ name: "", phone: "", email: "", billing_address: "", job_address: "", notes: "", source: "" }); load(); }
    catch (e) { alert(e.message); } setBusy(false);
  }
  async function openDetail(c) {
    setDetail(c); setDetailLoading(true);
    try { setDetailData(await api("/clients/" + c.id)); } catch (e) { console.error(e); }
    setDetailLoading(false);
  }
  async function saveEdit() {
    if (!editing) return; setBusy(true);
    try { await api("/clients/" + editing.id, { method: "PATCH", body: JSON.stringify(editing) }); setEditing(null); setDetail(null); setDetailData(null); load(); }
    catch (e) { alert(e.message); } setBusy(false);
  }

  return (
    <div>
      <PageHeader title="Clients" subtitle={(clients?.length || 0) + " total"} action={isAdmin() && <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> Add Client</Button>} />
      <div className="mb-4 relative"><Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" /></div>

      {loading ? <Spinner /> : !clients?.length ? <EmptyState icon={Users} title="No clients found" /> : (
        <div className="space-y-2">{clients.map(c => (
          <Card key={c.id} onClick={() => openDetail(c)} className="p-4">
            <p className="text-sm font-semibold text-zinc-100">{c.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-zinc-500">
              {c.phone && <span>{c.phone}</span>}{c.email && <span>{c.email}</span>}{c.job_address && <span>{c.job_address}</span>}
            </div>
          </Card>
        ))}</div>
      )}

      {/* Detail */}
      <Modal open={!!detail && !editing} onClose={() => { setDetail(null); setDetailData(null); }} title="Client Details">
        {detail && <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div><h3 className="text-lg font-bold">{detail.name}</h3><div className="text-sm text-zinc-500 mt-1 space-y-0.5">{detail.phone && <p>{detail.phone}</p>}{detail.email && <p>{detail.email}</p>}{detail.job_address && <p>{detail.job_address}</p>}{detail.source && <p>Source: {detail.source}</p>}{detail.notes && <p className="text-zinc-600 mt-2">{detail.notes}</p>}</div></div>
            {isAdmin() && <Button variant="secondary" onClick={() => setEditing({ ...detail })} className="text-xs py-1 px-3"><Edit className="w-3.5 h-3.5" /> Edit</Button>}
          </div>
          {detailLoading ? <Spinner /> : detailData && <>
            <div><h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Projects</h4>
              {(detailData.projects || []).length ? detailData.projects.map(p => <div key={p.id} className="flex justify-between items-center py-2 border-b border-zinc-800/30 text-sm"><span className="text-zinc-200">{p.address}</span><Badge variant={p.status}>{p.status}</Badge></div>) : <p className="text-xs text-zinc-600">No projects</p>}
            </div>
            <div><h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Service Calls</h4>
              {(detailData.service_calls || []).length ? detailData.service_calls.map(sc => <div key={sc.id} className="py-2 border-b border-zinc-800/30"><div className="flex gap-2"><Badge variant={sc.priority}>{sc.priority}</Badge><Badge variant={sc.status}>{sc.status}</Badge></div><p className="text-sm text-zinc-300 mt-1">{sc.description}</p>{sc.scheduled_date && <p className="text-xs text-zinc-600">{fmtDate(sc.scheduled_date)}</p>}</div>) : <p className="text-xs text-zinc-600">No service calls</p>}
            </div>
          </>}
        </div>}
      </Modal>

      {/* Edit */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Client">
        {editing && <div className="space-y-3">
          <Input label="Name *" value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Input label="Phone" value={editing.phone || ""} onChange={e => setEditing({ ...editing, phone: e.target.value })} /><Input label="Email" value={editing.email || ""} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
          <Input label="Job Address" value={editing.job_address || ""} onChange={e => setEditing({ ...editing, job_address: e.target.value })} />
          <Input label="Billing Address" value={editing.billing_address || ""} onChange={e => setEditing({ ...editing, billing_address: e.target.value })} />
          <Input label="Source" value={editing.source || ""} onChange={e => setEditing({ ...editing, source: e.target.value })} />
          <Textarea label="Notes" rows={3} value={editing.notes || ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
          <Button onClick={saveEdit} disabled={busy}>{busy ? "Saving..." : "Save Changes"}</Button>
        </div>}
      </Modal>

      {/* Add */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Client"><div className="space-y-3">
        <Input label="Name *" value={form.name} onChange={e => up("name", e.target.value)} placeholder="Client name" />
        <div className="grid grid-cols-2 gap-3"><Input label="Phone" value={form.phone} onChange={e => up("phone", e.target.value)} placeholder="(555) 123-4567" /><Input label="Email" value={form.email} onChange={e => up("email", e.target.value)} placeholder="client@email.com" /></div>
        <Input label="Job Address" value={form.job_address} onChange={e => up("job_address", e.target.value)} placeholder="123 Main St" />
        <Input label="Source" value={form.source} onChange={e => up("source", e.target.value)} placeholder="referral, website..." />
        <Textarea label="Notes" rows={3} value={form.notes} onChange={e => up("notes", e.target.value)} />
        <Button onClick={submit} disabled={busy || !form.name}>{busy ? "Saving..." : "Add Client"}</Button>
      </div></Modal>
    </div>
  );
}
