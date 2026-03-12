import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { api, isAdmin, cn } from "../utils/api";
import { Card, Badge, Avatar, Spinner, PageHeader, Button, Modal, Input, Textarea, Select, EmptyState } from "../components/UI";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Plus, Upload, X, ChevronDown, ChevronUp } from "lucide-react";

export default function Projects() {
  const { data: projects, loading, reload } = useApi("/projects");
  const { data: users } = useApi("/users");
  const nav = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [mode, setMode] = useState(null);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Projects" subtitle={(projects?.length || 0) + " total"}
        action={isAdmin() && (
          <div className="flex gap-2">
            <Button onClick={() => { setMode("manual"); setShowNew(true); }} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Project
            </Button>
            <Button variant="secondary" onClick={() => { setMode("pdf"); setShowPdf(true); }} className="flex items-center gap-2">
              <Upload className="w-4 h-4" /> From PDF
            </Button>
          </div>
        )} />

      {!projects?.length ? <EmptyState icon={FolderKanban} title="No projects yet" sub="Create your first project above" /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {projects.map(p => (
            <Card key={p.id} onClick={() => nav("/projects/" + p.id)} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-100 truncate">{p.address}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">{p.client_name || "No client"}</p>
                </div>
                <Badge variant={p.status}>{p.status}</Badge>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 bg-zinc-800 rounded-full h-1.5"><div className="h-full bg-brand-400 rounded-full" style={{ width: p.progress + "%" }} /></div>
                <span className="text-xs text-zinc-500 tabular-nums">{p.progress}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                {(p.assigned_users || []).map(u => <Avatar key={u.id} name={u.name} color={u.color} size="sm" />)}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showNew && <CreateProjectModal users={users} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); reload(); }} />}
      {showPdf && <PdfUploadModal users={users} onClose={() => setShowPdf(false)} onCreated={() => { setShowPdf(false); reload(); }} />}
    </div>
  );
}

function CreateProjectModal({ users, onClose, onCreated }) {
  const [form, setForm] = useState({
    address: "", client_name: "", client_phone: "", client_email: "",
    labor_budget: "", installer_summary: "", assigned_user_ids: [],
  });
  const [areas, setAreas] = useState([{ name: "", tasks: [""] }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const up = (k, v) => setForm({ ...form, [k]: v });

  function toggleUser(id) {
    const ids = form.assigned_user_ids.includes(id)
      ? form.assigned_user_ids.filter(x => x !== id)
      : [...form.assigned_user_ids, id];
    up("assigned_user_ids", ids);
  }

  function updateArea(idx, field, value) {
    const copy = [...areas];
    copy[idx] = { ...copy[idx], [field]: value };
    setAreas(copy);
  }

  function updateTask(areaIdx, taskIdx, value) {
    const copy = [...areas];
    copy[areaIdx].tasks[taskIdx] = value;
    setAreas(copy);
  }

  function addTask(areaIdx) {
    const copy = [...areas];
    copy[areaIdx].tasks.push("");
    setAreas(copy);
  }

  function removeTask(areaIdx, taskIdx) {
    const copy = [...areas];
    copy[areaIdx].tasks = copy[areaIdx].tasks.filter((_, i) => i !== taskIdx);
    setAreas(copy);
  }

  function addArea() {
    setAreas([...areas, { name: "", tasks: [""] }]);
  }

  function removeArea(idx) {
    setAreas(areas.filter((_, i) => i !== idx));
  }

  async function submit() {
    if (!form.address) { setError("Address is required"); return; }
    setBusy(true); setError("");
    try {
      const cleanAreas = areas
        .filter(a => a.name.trim())
        .map(a => ({ name: a.name, tasks: a.tasks.filter(t => t.trim()) }));

      await api("/projects", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          labor_budget: form.labor_budget ? Number(form.labor_budget) : null,
          areas: cleanAreas.length ? cleanAreas : undefined,
        }),
      });
      onCreated();
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  return (
    <Modal open={true} onClose={onClose} title="Create Project">
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        <Input label="Job Address *" value={form.address} onChange={e => up("address", e.target.value)} placeholder="1234 Oak Street, Dallas, TX" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Client Name" value={form.client_name} onChange={e => up("client_name", e.target.value)} placeholder="John Smith" />
          <Input label="Client Phone" value={form.client_phone} onChange={e => up("client_phone", e.target.value)} placeholder="(555) 123-4567" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Client Email" value={form.client_email} onChange={e => up("client_email", e.target.value)} placeholder="client@email.com" />
          <Input label="Labor Budget" type="number" value={form.labor_budget} onChange={e => up("labor_budget", e.target.value)} placeholder="5000" />
        </div>
        <Textarea label="Summary / Notes" rows={2} value={form.installer_summary} onChange={e => up("installer_summary", e.target.value)} placeholder="Brief description of the job..." />

        {/* Assign Team Members */}
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Assign Team Members</label>
          <div className="flex flex-wrap gap-2">
            {(users || []).map(u => (
              <button key={u.id} type="button" onClick={() => toggleUser(u.id)}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border",
                  form.assigned_user_ids.includes(u.id)
                    ? "border-brand-400/50 bg-brand-400/10 text-brand-400"
                    : "border-zinc-700/50 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600")}>
                <Avatar name={u.name} color={u.color} size="sm" />
                {u.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Areas & Tasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-400">Areas & Tasks</label>
            <button type="button" onClick={addArea} className="text-xs text-brand-400 hover:text-brand-500">+ Add Area</button>
          </div>
          {areas.map((area, aIdx) => (
            <div key={aIdx} className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <input value={area.name} onChange={e => updateArea(aIdx, "name", e.target.value)}
                  placeholder={"Area name (e.g. Master Bedroom, Kitchen)"}
                  className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" />
                {areas.length > 1 && (
                  <button type="button" onClick={() => removeArea(aIdx)} className="text-zinc-600 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                )}
              </div>
              {area.tasks.map((task, tIdx) => (
                <div key={tIdx} className="flex items-center gap-2 mb-1 ml-4">
                  <span className="text-zinc-600 text-xs">-</span>
                  <input value={task} onChange={e => updateTask(aIdx, tIdx, e.target.value)}
                    placeholder="Task description"
                    className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded px-2.5 py-1 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" />
                  {area.tasks.length > 1 && (
                    <button type="button" onClick={() => removeTask(aIdx, tIdx)} className="text-zinc-700 hover:text-red-400 p-0.5"><X className="w-3 h-3" /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addTask(aIdx)} className="text-xs text-zinc-500 hover:text-zinc-300 ml-4 mt-1">+ Add Task</button>
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
        <Button onClick={submit} disabled={busy}>{busy ? "Creating..." : "Create Project"}</Button>
      </div>
    </Modal>
  );
}

function PdfUploadModal({ users, onClose, onCreated }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [form, setForm] = useState(null);
  const [areas, setAreas] = useState([]);
  const [assignedIds, setAssignedIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function uploadAndParse() {
    if (!file) return;
    setParsing(true); setError("");
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const token = localStorage.getItem("fc_token");
      const BASE = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(BASE + "/ai/parse-pdf", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token },
        body: formData,
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Upload failed");
      }
      const data = await res.json();
      setParsed(data.parsed);
      setForm({
        address: data.parsed.address || "",
        client_name: data.parsed.client_name || "",
        client_phone: data.parsed.client_phone || "",
        client_email: data.parsed.client_email || "",
        labor_budget: data.parsed.labor_budget || "",
        installer_summary: data.parsed.installer_summary || "",
      });
      setAreas(data.parsed.areas || [{ name: "General", tasks: [] }]);
    } catch (e) { setError(e.message); }
    setParsing(false);
  }

  function toggleUser(id) {
    setAssignedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function createProject() {
    if (!form.address) { setError("Address is required"); return; }
    setBusy(true); setError("");
    try {
      await api("/projects", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          labor_budget: form.labor_budget ? Number(form.labor_budget) : null,
          assigned_user_ids: assignedIds,
          areas: areas.filter(a => a.name),
        }),
      });
      onCreated();
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  return (
    <Modal open={true} onClose={onClose} title="Create Project from PDF">
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {!parsed ? (
          <>
            <p className="text-sm text-zinc-400">Upload an installer PDF and AI will extract the project details, areas, and tasks automatically.</p>
            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center">
              <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])}
                className="block mx-auto text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer" />
              {file && <p className="text-xs text-zinc-500 mt-2">{file.name}</p>}
            </div>
            {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
            <Button onClick={uploadAndParse} disabled={!file || parsing}>
              {parsing ? "Parsing with AI..." : "Upload & Parse"}
            </Button>
            {parsing && (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-brand-400 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-zinc-500">AI is reading the PDF and extracting project details...</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg px-3 py-2">
              <p className="text-xs text-emerald-400">PDF parsed successfully. Review and edit the details below, then create the project.</p>
            </div>

            <Input label="Job Address *" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Client Name" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
              <Input label="Client Phone" value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} />
            </div>
            <Textarea label="Summary" rows={2} value={form.installer_summary} onChange={e => setForm({ ...form, installer_summary: e.target.value })} />

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Assign Team Members</label>
              <div className="flex flex-wrap gap-2">
                {(users || []).map(u => (
                  <button key={u.id} type="button" onClick={() => toggleUser(u.id)}
                    className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border",
                      assignedIds.includes(u.id)
                        ? "border-brand-400/50 bg-brand-400/10 text-brand-400"
                        : "border-zinc-700/50 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600")}>
                    <Avatar name={u.name} color={u.color} size="sm" />
                    {u.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-2 block">Areas & Tasks (from PDF)</label>
              {areas.map((area, i) => (
                <div key={i} className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-3 mb-2">
                  <p className="text-sm font-medium text-zinc-200 mb-1">{area.name}</p>
                  {(area.tasks || []).map((t, j) => (
                    <p key={j} className="text-xs text-zinc-400 ml-3">- {typeof t === "string" ? t : t.text}</p>
                  ))}
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
            <Button onClick={createProject} disabled={busy}>{busy ? "Creating..." : "Create Project"}</Button>
          </>
        )}
      </div>
    </Modal>
  );
}
