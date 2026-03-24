import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { api, isAdmin, fmtDate, cn } from "../utils/api";
import { Card, Badge, Avatar, Spinner, PageHeader, Button, Modal, Input, Textarea, Select, EmptyState, useToast } from "../components/UI";
import { Wrench, Plus, Phone, MapPin, Calendar, Camera, Image } from "lucide-react";

const PRI = { urgent: "bg-red-950/60 text-red-400", normal: "bg-amber-950/60 text-amber-400", low: "bg-zinc-800 text-zinc-400" };

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
        action={isAdmin() && <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> New Service Call</Button>} />
      <div className="flex gap-2 mb-4">
        {["active", "resolved", "all"].map(f => <button key={f} onClick={() => setFilter(f)} className={cn("text-xs px-3 py-1.5 rounded-xl capitalize", filter === f ? "bg-brand-400/10 text-brand-400 border border-brand-400/30" : "text-zinc-500 hover:text-zinc-300")}>{f}</button>)}
      </div>
      {!filtered?.length ? <EmptyState icon={Wrench} title="No service calls" sub="Create one to get started" /> : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={c.id} onClick={() => setShowDetail(c)} className="p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant={c.priority}>{c.priority}</Badge>
                <Badge variant={c.status}>{c.status}</Badge>
                {c.assigned_name && <span className="text-xs text-zinc-500">{c.assigned_name}</span>}
              </div>
              <p className="text-sm text-zinc-200 mb-1">{c.description}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                {c.client_name && <span>{c.client_name}</span>}
                {(c.address || c.project_address) && <span><MapPin className="w-3 h-3 inline" /> {c.address || c.project_address}</span>}
                {c.scheduled_date && <span><Calendar className="w-3 h-3 inline" /> {fmtDate(c.scheduled_date)}</span>}
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
          <Select label="Priority" value={form.priority} onChange={e => up("priority", e.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="urgent">Urgent</option></Select>
          <Select label="Assign Tech" value={form.assigned_to} onChange={e => up("assigned_to", e.target.value)}><option value="">Unassigned</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
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
  const toast = useToast();
  const [status, setStatus] = useState(call.status);
  const [resolution, setResolution] = useState(call.resolution_notes || "");
  const [assignedTo, setAssignedTo] = useState(call.assigned_to || "");
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoNote, setPhotoNote] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [showPhotoSection, setShowPhotoSection] = useState(false);

  async function loadPhotos() {
    try { const p = await api("/service-calls/" + call.id + "/photos"); setPhotos(p || []); }
    catch { }
  }

  async function uploadPhoto() {
    if (!photoFile) return;
    setPhotoBusy(true);
    try {
      const fd = new FormData();
      fd.append('photo', photoFile);
      if (photoNote) fd.append('note', photoNote);
      const token = localStorage.getItem('fc_token');
      const base = import.meta.env.VITE_API_URL || '/api';
      await fetch(base + '/service-calls/' + call.id + '/photos', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: fd,
      });
      toast('Photo uploaded!');
      setPhotoFile(null); setPhotoNote("");
      loadPhotos();
    } catch { toast('Upload failed', 'error'); }
    setPhotoBusy(false);
  }

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
          <Badge variant={call.priority}>{call.priority}</Badge>
          <Badge variant={call.status}>{call.status}</Badge>
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

        {/* Photos Section */}
        <div>
          <button onClick={() => { setShowPhotoSection(!showPhotoSection); if (!showPhotoSection) loadPhotos(); }} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-brand-400 transition-colors">
            <Camera className="w-4 h-4" /> Photos {photos.length > 0 && <span className="text-emerald-400">({photos.length})</span>}
          </button>
          {showPhotoSection && <div className="mt-3 space-y-2">
            {photos.map(p => <Card key={p.id} className="p-3">
              <div className="flex items-center gap-2"><Avatar name={p.user_name} color={p.user_color} size="sm" /><span className="text-xs text-zinc-400">{p.user_name} · {new Date(p.created_at).toLocaleString()}</span></div>
              {p.note && <p className="text-sm text-zinc-300 mt-1">{p.note}</p>}
              <p className="text-xs text-zinc-600 mt-0.5">{p.original_name}</p>
            </Card>)}
            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">{photoFile ? photoFile.name : 'Add a photo'}</p>
              <input type="file" accept="image/*" capture="environment" onChange={e => setPhotoFile(e.target.files[0])} className="text-xs text-zinc-500" />
            </div>
            {photoFile && <>
              <Input placeholder="Note (optional)" value={photoNote} onChange={e => setPhotoNote(e.target.value)} />
              <Button variant="secondary" onClick={uploadPhoto} disabled={photoBusy}>{photoBusy ? 'Uploading...' : 'Upload Photo'}</Button>
            </>}
          </div>}
        </div>

        <Button onClick={save} disabled={busy}>{busy ? "Saving..." : "Update"}</Button>
      </div>
    </Modal>
  );
}
