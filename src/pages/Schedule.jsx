import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { api, cn, isAdmin } from "../utils/api";
import { Card, Badge, Avatar, Spinner, Modal, Button, Input, Select } from "../components/UI";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";

function toDS(d) { if (!d) return null; const s = String(d); return s.includes("T") ? s.split("T")[0] : s.substring(0, 10); }
function mkDS(dt) { return dt.getFullYear() + "-" + String(dt.getMonth()+1).padStart(2,"0") + "-" + String(dt.getDate()).padStart(2,"0"); }
function fmtDay(ds) { return new Date(ds + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); }
function fmtShort(ds) { return new Date(ds + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }

function TechPicker({ users, selected, onChange, label }) {
  const sel = selected || [];
  function toggle(uid) { onChange(sel.includes(uid) ? sel.filter(x => x !== uid) : [...sel, uid]); }
  return <div><label className="text-xs font-medium text-zinc-400 mb-1.5 block">{label || "Team"}</label>
    <div className="flex flex-wrap gap-2">{(users || []).map(u => {
      const active = sel.includes(u.id);
      return <button key={u.id} type="button" onClick={() => toggle(u.id)} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors", active ? "border-brand-400 bg-brand-400/10 text-brand-400" : "border-zinc-700/50 text-zinc-400 hover:border-zinc-600")}>
        <Avatar name={u.name} color={u.color} size="sm" />{u.name.split(" ")[0]}
      </button>;
    })}</div>
  </div>;
}

function getWeekDates(baseDate) {
  const d = new Date(baseDate); const day = d.getDay();
  const sun = new Date(d); sun.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => { const dt = new Date(sun); dt.setDate(sun.getDate() + i); return mkDS(dt); });
}

export default function Schedule() {
  const { data: events, loading: el, reload: rEv } = useApi("/schedule");
  const { data: serviceCalls, loading: sl, reload: rSc } = useApi("/service-calls");
  const { data: users } = useApi("/users");
  const { data: projects } = useApi("/projects");
  const [view, setView] = useState("month");
  const [cur, setCur] = useState(new Date());
  const [sel, setSel] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ user_id: "", attendee_ids: [], project_id: "", date: "", start_time: "", end_time: "", event_type: "install", description: "" });
  const [busy, setBusy] = useState(false);
  if (el || sl) return <Spinner />;

  const items = [];
  (events || []).forEach(e => { const d = toDS(e.date); if (d) items.push({ id: e.id, _id: "e-" + e.id, type: "event", date: d, time: e.start_time || e.shift, eventType: e.event_type, userName: e.user_name, userColor: e.user_color, userId: e.user_id, description: e.description, shift: e.shift, start_time: e.start_time, end_time: e.end_time, project: e.project, project_id: e.project_id, completed: e.completed, attendees: e.attendees || [] }); });
  (serviceCalls || []).forEach(sc => { const d = toDS(sc.scheduled_date); if (d) items.push({ id: sc.id, _id: "sc-" + sc.id, type: "sc", date: d, time: sc.scheduled_time, priority: sc.priority, status: sc.status, userName: sc.assigned_name, userColor: sc.assigned_color, userId: sc.assigned_to, description: sc.description, address: sc.address || sc.project_address, clientName: sc.client_name }); });

  const gr = {}; items.forEach(i => { if (!gr[i.date]) gr[i.date] = []; gr[i.date].push(i); });
  const y = cur.getFullYear(), m = cur.getMonth(), d = cur.getDate();
  const todayStr = mkDS(new Date());

  // Month
  const fd = new Date(y, m, 1).getDay(); const dim = new Date(y, m + 1, 0).getDate();
  const mName = cur.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const cells = []; const pdm = new Date(y, m, 0).getDate();
  for (let i = fd - 1; i >= 0; i--) cells.push({ dt: mkDS(new Date(y, m - 1, pdm - i)), day: pdm - i, cur: false });
  for (let i = 1; i <= dim; i++) cells.push({ dt: mkDS(new Date(y, m, i)), day: i, cur: true });
  const need = 42 - cells.length; for (let i = 1; i <= need; i++) cells.push({ dt: mkDS(new Date(y, m + 1, i)), day: i, cur: false });

  // Week
  const weekDates = getWeekDates(cur);
  const weekLabel = fmtShort(weekDates[0]) + " — " + fmtShort(weekDates[6]);

  // Day
  const dayStr = mkDS(cur);

  const ec = (it) => it.type === "sc" ? { bg: "bg-orange-900/40", tx: "text-orange-300", bl: "border-l-orange-500" } : it.eventType === "meeting" ? { bg: "bg-purple-900/40", tx: "text-purple-300", bl: "border-l-purple-500" } : it.eventType === "task" ? { bg: "bg-amber-900/40", tx: "text-amber-300", bl: "border-l-amber-500" } : { bg: "bg-blue-900/40", tx: "text-blue-300", bl: "border-l-blue-500" };
  const listDates = Object.keys(gr).sort();

  function openItem(it) {
    setSel(it);
    if (it.type === "event") setEditForm({ date: it.date, start_time: it.start_time || "", end_time: it.end_time || "", user_id: it.userId || "", attendee_ids: (it.attendees || []).map(a => a.id), description: it.description || "" });
    else setEditForm({ scheduled_date: it.date, scheduled_time: it.time || "", assigned_to: it.userId || "", status: it.status || "open" });
  }
  async function saveEdit() {
    if (!sel || !editForm) return; setBusy(true);
    try {
      if (sel.type === "event") await api("/schedule/" + sel.id, { method: "PATCH", body: JSON.stringify(editForm) });
      else await api("/service-calls/" + sel.id, { method: "PATCH", body: JSON.stringify(editForm) });
      setSel(null); setEditForm(null); rEv(); rSc();
    } catch (e) { alert(e.message); } setBusy(false);
  }
  async function deleteEvent() {
    if (!sel || sel.type !== "event") return; if (!confirm("Delete this event?")) return;
    try { await api("/schedule/" + sel.id, { method: "DELETE" }); setSel(null); rEv(); } catch (e) { alert(e.message); }
  }
  async function createEvent() {
    if (!newForm.user_id || !newForm.date) { alert("Select a lead tech and date"); return; } setBusy(true);
    try { await api("/schedule", { method: "POST", body: JSON.stringify(newForm) }); setShowNew(false); setNewForm({ user_id: "", attendee_ids: [], project_id: "", date: "", start_time: "", end_time: "", event_type: "install", description: "" }); rEv(); }
    catch (e) { alert(e.message); } setBusy(false);
  }

  // Nav helpers
  function nav(dir) {
    if (view === "month") setCur(new Date(y, m + dir, 1));
    else if (view === "week") { const n = new Date(cur); n.setDate(d + dir * 7); setCur(n); }
    else if (view === "day") { const n = new Date(cur); n.setDate(d + dir); setCur(n); }
  }
  const headerTitle = view === "month" ? mName : view === "week" ? weekLabel : fmtDay(dayStr);

  function renderItem(it) {
    const cl = ec(it);
    return <button key={it._id} onClick={() => openItem(it)} className={cn("w-full text-left px-3 py-2 rounded-xl border-l-2 mb-1.5 hover:brightness-110 transition-all", cl.bg, cl.bl)}>
      <div className="flex items-center gap-2">
        <Avatar name={it.userName || "?"} color={it.userColor} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-xs font-semibold", cl.tx)}>{it.type === "sc" ? "SC" : it.eventType === "meeting" ? "MTG" : it.eventType === "task" ? "TASK" : "INSTALL"}</span>
            <span className="text-sm text-zinc-200 truncate">{it.description || it.project?.address || it.userName}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span>{it.userName}</span>
            {it.time && <span className="font-mono">{String(it.time).replace(/ /g, "")}</span>}
            {it.shift && !it.time && <span className="font-mono">{it.shift}</span>}
            {it.attendees?.length > 0 && <span>+{it.attendees.length}</span>}
          </div>
        </div>
        {it.type === "sc" && <Badge variant={it.priority}>{it.priority}</Badge>}
      </div>
    </button>;
  }

  return (<div>
    {/* Header */}
    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <button onClick={() => setCur(new Date())} className="text-xs px-3 py-1.5 rounded-xl bg-brand-400/10 text-brand-400 hover:bg-brand-400/20">Today</button>
        <button onClick={() => nav(-1)} className="p-1.5 rounded-lg hover:bg-zinc-800/50 text-zinc-400"><ChevronLeft className="w-5 h-5" /></button>
        <button onClick={() => nav(1)} className="p-1.5 rounded-lg hover:bg-zinc-800/50 text-zinc-400"><ChevronRight className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold text-zinc-100">{headerTitle}</h1>
      </div>
      <div className="flex gap-2">
        {isAdmin() && <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> Schedule Visit</Button>}
        <div className="flex gap-0.5 bg-[#0a0a0c] rounded-xl p-0.5 border border-zinc-800/50">
          {["month", "week", "day", "list"].map(v => <button key={v} onClick={() => setView(v)} className={cn("text-xs px-3 py-1.5 rounded-lg capitalize", view === v ? "bg-brand-400/10 text-brand-400" : "text-zinc-500 hover:text-zinc-300")}>{v}</button>)}
        </div>
      </div>
    </div>

    {/* MONTH VIEW */}
    {view === "month" && <div className="border border-zinc-800/50 rounded-xl overflow-hidden bg-[#0a0a0c]">
      <div className="grid grid-cols-7 border-b border-zinc-800/50">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(dd => <div key={dd} className="text-[10px] font-semibold text-zinc-500 text-center py-2 bg-[#08080a]">{dd}</div>)}</div>
      <div className="grid grid-cols-7">{cells.map((c, i) => {
        const di = gr[c.dt] || []; const isT = c.dt === todayStr;
        return <div key={i} onClick={() => { setCur(new Date(c.dt + "T12:00:00")); setView("day"); }} className={cn("min-h-[100px] border-b border-r border-zinc-800/30 p-1 bg-[#0a0a0c] cursor-pointer hover:bg-[#0e0e12] transition-colors", !c.cur && "bg-[#070709]", isT && "bg-brand-400/5")}>
          <div className="flex justify-between items-center px-1 mb-0.5"><span className={cn("text-xs font-medium", isT ? "text-brand-400 font-bold" : c.cur ? "text-zinc-400" : "text-zinc-700")}>{c.day}</span>{di.length > 0 && <span className="text-[9px] text-zinc-600">{di.length}</span>}</div>
          <div className="space-y-0.5">{di.slice(0, 4).map(it => { const cl = ec(it); return <div key={it._id} onClick={e => { e.stopPropagation(); openItem(it); }} className={cn("w-full text-left text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate hover:opacity-80 cursor-pointer", cl.bg, cl.tx, cl.bl)}>{it.time && <span className="font-semibold">{String(it.time).replace(/ /g, "")} </span>}{it.type === "sc" ? (it.description || "").substring(0, 25) : ((it.userName ? it.userName.split(" ")[0] : "") + " - " + (it.description || it.shift || "")).substring(0, 30)}</div>; })}
            {di.length > 4 && <p className="text-[9px] text-zinc-600 px-1">+{di.length - 4} more</p>}
          </div></div>;
      })}</div>
    </div>}

    {/* WEEK VIEW */}
    {view === "week" && <div className="border border-zinc-800/50 rounded-xl overflow-hidden bg-[#0a0a0c]">
      <div className="grid grid-cols-7 border-b border-zinc-800/50">
        {weekDates.map(ds => {
          const dt = new Date(ds + "T12:00:00");
          const isT = ds === todayStr;
          const dayItems = gr[ds] || [];
          return <div key={ds} className={cn("border-r border-zinc-800/30 last:border-r-0", isT && "bg-brand-400/5")}>
            <div onClick={() => { setCur(new Date(ds + "T12:00:00")); setView("day"); }} className={cn("text-center py-2 border-b border-zinc-800/30 cursor-pointer hover:bg-[#0e0e12]", isT && "bg-brand-400/5")}>
              <p className="text-[10px] text-zinc-500 uppercase">{dt.toLocaleDateString("en-US", { weekday: "short" })}</p>
              <p className={cn("text-lg font-bold", isT ? "text-brand-400" : "text-zinc-300")}>{dt.getDate()}</p>
            </div>
            <div className="p-1.5 min-h-[300px] space-y-1">
              {dayItems.map(it => {
                const cl = ec(it);
                return <button key={it._id} onClick={() => openItem(it)} className={cn("w-full text-left text-[10px] px-2 py-1.5 rounded-lg border-l-2 hover:brightness-110 transition-all", cl.bg, cl.tx, cl.bl)}>
                  <p className="font-semibold truncate">{it.type === "sc" ? "SC" : it.eventType?.toUpperCase().substring(0, 3)}</p>
                  <p className="truncate text-zinc-300">{it.userName?.split(" ")[0]}</p>
                  {it.time && <p className="font-mono text-zinc-500">{String(it.time).replace(/ /g, "")}</p>}
                </button>;
              })}
              {dayItems.length === 0 && <p className="text-[9px] text-zinc-700 text-center pt-4">—</p>}
            </div>
          </div>;
        })}
      </div>
    </div>}

    {/* DAY VIEW */}
    {view === "day" && <div className="bg-[#0a0a0c] border border-zinc-800/50 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold", dayStr === todayStr ? "bg-brand-400/10 text-brand-400" : "bg-zinc-800 text-zinc-400")}>{cur.getDate()}</div>
        <div>
          <p className="font-bold text-zinc-100">{cur.toLocaleDateString("en-US", { weekday: "long" })}</p>
          <p className="text-xs text-zinc-500">{cur.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="ml-auto text-sm text-zinc-500">{(gr[dayStr] || []).length} item{(gr[dayStr] || []).length !== 1 ? "s" : ""}</div>
      </div>
      {(gr[dayStr] || []).length === 0 ? <div className="text-center py-12"><Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" /><p className="text-zinc-500 text-sm">Nothing scheduled</p></div>
      : (gr[dayStr] || []).map(it => renderItem(it))}
    </div>}

    {/* LIST VIEW */}
    {view === "list" && <div>
      {!listDates.length ? <div className="text-center py-16"><Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500">No scheduled items</p></div>
      : listDates.map(date => <div key={date} className="mb-6">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{fmtDay(date)}</h3>
        <div>{gr[date].map(it => renderItem(it))}</div>
      </div>)}
    </div>}

    {/* Edit Modal */}
    <Modal open={!!sel} onClose={() => { setSel(null); setEditForm(null); }} title={sel?.type === "sc" ? "Edit Service Call" : "Edit Schedule Event"}>
      {sel && editForm && <div className="space-y-3">
        <p className="text-sm text-zinc-300">{sel.description}</p>
        {sel.address && <p className="text-xs text-zinc-500">{sel.address}</p>}
        {sel.project && <p className="text-xs text-zinc-500">Project: {sel.project.address}</p>}
        {sel.type === "event" && sel.attendees?.length > 0 && <div className="flex gap-1 flex-wrap">{[{ name: sel.userName, color: sel.userColor }, ...sel.attendees].map((a, i) => <div key={i} className="flex items-center gap-1 text-xs text-zinc-400"><Avatar name={a.name} color={a.color} size="sm" />{a.name?.split(" ")[0]}</div>)}</div>}
        {sel.type === "event" ? <>
          <Input label="Date" type="date" value={editForm.date || ""} onChange={e => setEditForm({...editForm, date: e.target.value})} />
          <div className="grid grid-cols-2 gap-3"><Input label="Start Time" value={editForm.start_time || ""} onChange={e => setEditForm({...editForm, start_time: e.target.value})} placeholder="8:00 AM" /><Input label="End Time" value={editForm.end_time || ""} onChange={e => setEditForm({...editForm, end_time: e.target.value})} placeholder="5:00 PM" /></div>
          <Select label="Lead Tech" value={editForm.user_id || ""} onChange={e => setEditForm({...editForm, user_id: e.target.value})}><option value="">Select...</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
          <TechPicker users={(users || []).filter(u => u.id !== editForm.user_id)} selected={editForm.attendee_ids || []} onChange={ids => setEditForm({...editForm, attendee_ids: ids})} label="Additional Techs" />
          <Input label="Description" value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} />
          <div className="flex gap-2"><Button onClick={saveEdit} disabled={busy}>{busy ? "Saving..." : "Save"}</Button>{isAdmin() && <Button variant="danger" onClick={deleteEvent}>Delete</Button>}</div>
        </> : <>
          <Input label="Date" type="date" value={toDS(editForm.scheduled_date) || ""} onChange={e => setEditForm({...editForm, scheduled_date: e.target.value})} />
          <Input label="Time" value={editForm.scheduled_time || ""} onChange={e => setEditForm({...editForm, scheduled_time: e.target.value})} placeholder="9:00 AM" />
          <Select label="Assigned Tech" value={editForm.assigned_to || ""} onChange={e => setEditForm({...editForm, assigned_to: e.target.value})}><option value="">Unassigned</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
          <Select label="Status" value={editForm.status || "open"} onChange={e => setEditForm({...editForm, status: e.target.value})}><option value="open">Open</option><option value="scheduled">Scheduled</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option></Select>
          <Button onClick={saveEdit} disabled={busy}>{busy ? "Saving..." : "Save"}</Button>
        </>}
      </div>}
    </Modal>

    {/* Create Modal */}
    <Modal open={showNew} onClose={() => setShowNew(false)} title="Schedule Visit">
      <div className="space-y-3">
        <Select label="Lead Tech *" value={newForm.user_id} onChange={e => setNewForm({...newForm, user_id: e.target.value})}><option value="">Select...</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <TechPicker users={(users || []).filter(u => u.id !== newForm.user_id)} selected={newForm.attendee_ids} onChange={ids => setNewForm({...newForm, attendee_ids: ids})} label="Additional Techs" />
        <Select label="Project" value={newForm.project_id} onChange={e => setNewForm({...newForm, project_id: e.target.value})}><option value="">No project</option>{(projects || []).map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</Select>
        <Input label="Date *" type="date" value={newForm.date} onChange={e => setNewForm({...newForm, date: e.target.value})} />
        <div className="grid grid-cols-2 gap-3"><Input label="Start Time" value={newForm.start_time} onChange={e => setNewForm({...newForm, start_time: e.target.value})} placeholder="8:00 AM" /><Input label="End Time" value={newForm.end_time} onChange={e => setNewForm({...newForm, end_time: e.target.value})} placeholder="5:00 PM" /></div>
        <Select label="Type" value={newForm.event_type} onChange={e => setNewForm({...newForm, event_type: e.target.value})}><option value="install">Install</option><option value="meeting">Meeting</option><option value="task">Task</option></Select>
        <Input label="Description" value={newForm.description} onChange={e => setNewForm({...newForm, description: e.target.value})} placeholder="What's being done..." />
        <Button onClick={createEvent} disabled={busy}>{busy ? "Creating..." : "Schedule Visit"}</Button>
      </div>
    </Modal>
  </div>);
}
