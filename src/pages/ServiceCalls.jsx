import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { api, isAdmin, fmtDate, cn } from "../utils/api";
import { Card, Badge, Avatar, Spinner, PageHeader, Button, Modal, Input, Textarea, Select, EmptyState } from "../components/UI";
import { Wrench, Plus, Phone, MapPin, Calendar } from "lucide-react";

const PRI = { urgent: "bg-red-950/60 text-red-400", normal: "bg-amber-950/60 text-amber-400", low: "bg-zinc-800 text-zinc-400" };
const STS = { open: "bg-blue-950/60 text-blue-400", scheduled: "bg-purple-950/60 text-purple-400", "in-progress": "bg-amber-950/60 text-amber-400", resolved: "bg-emerald-950/60 text-emerald-400", closed: "bg-zinc-800 text-zinc-500" };

export default function ServiceCalls() {
  const { data: calls, loading, reload } = useApi("/service-calls");
  const { data: projects } = useApi("/projects");
  const { data: users } = useApi("/users");
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [filter, setFilter] = useState("active");

  if (loading) return <Spinner />;

  const filtered = (calls || []).filter(c => {
    if (filter === "active") return ["open", "scheduled", "in-progress"].includes(c.status);
    if (filter === "resolved") return ["resolved", "closed"].includes(c.status);
    return true;
  });

  return (
    <div>
      <PageHeader title="Service Calls" subtitle={(calls?.length || 0) + " total"}
        action={isAdmin() && <Button onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus className="w-4 h-4" /> New Service Call</Button>} />
      <div className="flex gap-2 mb-4">
        {["active", "resolved", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn("text-xs px-3 py-1.5 rounded-lg transition-colors capitalize", filter === f ? "bg-brand-400/10 text-brand-400" : "text-zinc-500 hover:text-zinc-300")}>{f}</button>
        ))}
      </div>
      {!filtered.length ? <EmptyState icon={Wrench} title="No service calls" /> : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={c.id} onClick={() => setShowDetail(c)} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full uppercase font-semibold", PRI[c.priority])}>{c.priority}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full uppercase font-semibold", STS[c.status])}>{c.status}</span>
                    {c.project_address && <span className="text-[11px] text-zinc-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.project_address}</span>}
                  </div>
                  <p className="text-sm text-zinc-200">{c.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-600">
                    {c.assigned_name && <span className="flex items-center gap-1"><Avatar name={c.assigned_name} color={c.assigned_color} size="sm" />{c.assigned_name}</span>}
                    {c.scheduled_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(c.scheduled_date)}{c.scheduled_time ? " at " + c.scheduled_time : ""}</span>}
                    {c.client_name && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.client_name}</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {showNew && <NewSCModal projects={projects} users={users} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); reload(); }} />}
      {showDetail && <SCDetail call={showDetail} users={users} onClose={() => setShowDetail(null)} onUpdated={() => { setShowDetail(null); reload(); }} />}
    </div>
  );
}

function NewSCModal({ projects, users, onClose, onCreated }) {
  const [form, setForm] = useState({ project_id: "", assigned_to: "", description: "", priority: "normal", scheduled_date: "", scheduled_time: "", client_name: "", client_phone: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const up = (k, v) => setForm({ ...form, [k]: v });

  function onProjectSelect(pid) {
    up("project_id", pid);
    if (pid) {
      const p = (projects || []).find(x => x.id === pid);
      if (p) setForm(prev => ({ ...prev, project_id: pid, client_name: prev.client_name || p.client_name || "", client_phone: prev.client_phone || p.client_phone || "", address: prev.address || p.address || "" }));
    }
  }

  async function submit() {
    if (!form.description) { setError("Description is required"); return; }
    setBusy(true); setError("");
    try { await api("/service-calls", { method: "POST", body: JSON.stringify(form) }); onCreated(); }
    catch (e) { setError(e.message); }
    setBusy(false);
  }

  return (
    <Modal open={true} onClose={onClose} title="New Service Call">
      <div className="space-y-3">
        <Select label="Related Project" value={form.project_id} onChange={e => onProjectSelect(e.target.value)}>
          <option value="">None (standalone)</option>
          {(projects || []).map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
        </Select>
        <Textarea label="Issue Description *" rows={3} value={form.description} onChange={e => up("description", e.target.value)} placeholder="Describe the issue..." />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Priority" value={form.priority} onChange={e => up("priority", e.target.value)}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
          </Select>
          <Select label="Assign Tech" value={form.assigned_to} onChange={e => up("assigned_to", e.target.value)}>
            <option value="">Unassigned</option>
            {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Scheduled Date" type="date" value={form.scheduled_date} onChange={e => up("scheduled_date", e.target.value)} />
          <Input label="Scheduled Time" value={form.scheduled_time} onChange={e => up("scheduled_time", e.target.value)} placeholder="9:00 AM" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Client Name" value={form.client_name} onChange={e => up("client_name", e.target.value)} />
          <Input label="Client Phone" value={form.client_phone} onChange={e => up("client_phone", e.target.value)} />
        </div>
        <Input label="Address" value={form.address} onChange={e => up("address", e.target.value)} placeholder="Job address" />
        {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
        <Button onClick={submit} disabled={busy}>{busy ? "Creating..." : "Create Service Call"}</Button>
      </div>
    </Modal>
  );
}

function SCDetail({ call, users, onClose, onUpdated }) {
  const [status, setStatus] = useState(call.status);
  const [resolution, setResolution] = useState(call.resolution_notes || "");
  const [assignedTo, setAssignedTo] = useState(call.assigned_to || "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try { await api("/service-calls/" + call.id, { method: "PATCH", body: JSON.stringify({ status, resolution_notes: resolution, assigned_to: assignedTo || null }) }); onUpdated(); }
    catch (e) { alert(e.message); }
    setBusy(false);
  }

  return (
    <Modal open={true} onClose={onClose} title="Service Call Details">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-xs px-2 py-0.5 rounded-full uppercase font-semibold", PRI[call.priority])}>{call.priority}</span>
          {call.project_address && <span className="text-xs text-zinc-500">{call.project_address}</span>}
        </div>
        <p className="text-sm text-zinc-200">{call.description}</p>
        <div className="text-xs text-zinc-500 space-y-1">
          {call.client_name && <p>Client: {call.client_name}{call.client_phone ? " - " + call.client_phone : ""}</p>}
          {call.address && <p>Address: {call.address}</p>}
          {call.scheduled_date && <p>Scheduled: {fmtDate(call.scheduled_date)}{call.scheduled_time ? " at " + call.scheduled_time : ""}</p>}
          <p>Created: {fmtDate(call.created_at)} by {call.created_by_name}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="open">Open</option><option value="scheduled">Scheduled</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
          </Select>
          <Select label="Assigned To" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </div>
        <Textarea label="Resolution Notes" rows={3} value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Describe what was done..." />
        <Button onClick={save} disabled={busy}>{busy ? "Saving..." : "Update"}</Button>
      </div>
    </Modal>
  );
}
