import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, fmtMoney, fmtDate, isAdmin, getUser, cn } from '../utils/api';
import { Card, Badge, Avatar, Spinner, Button, Modal, Input, Select, Textarea, Tabs, EmptyState, useToast } from '../components/UI';
import { ArrowLeft, Check, Plus, Upload, FileText, Send, Edit, Clock, DollarSign, Trash2, Calendar, Camera, Award, Image, Pencil } from 'lucide-react';
import { useApi } from '../hooks/useApi';

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const me = getUser();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [toggling, setToggling] = useState(null);
  const [showStatus, setShowStatus] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [showCO, setShowCO] = useState(false);
  const [coText, setCOText] = useState('');
  const [coCost, setCOCost] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showAssign, setShowAssign] = useState(null);
  const [assigneeMap, setAssigneeMap] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [assigneeMap, setAssigneeMap] = useState({});
  const [showReassign, setShowReassign] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedForm, setSchedForm] = useState({ user_id: '', date: '', start_time: '', end_time: '', description: '' });
  const [schedEvents, setSchedEvents] = useState([]);
  const [editSched, setEditSched] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(null); // task id
  const [photoNote, setPhotoNote] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [taskPhotos, setTaskPhotos] = useState({}); // { taskId: [photos] }
  const [photoBusy, setPhotoBusy] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const { data: users } = useApi('/users');

  const load = useCallback(() => {
    api('/projects/' + id).then(setProject).catch(console.error).finally(() => setLoading(false));
    api('/schedule?project_id=' + id).then(setSchedEvents).catch(() => setSchedEvents([]));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function loadTaskPhotos(taskId) {
    try { const photos = await api('/projects/tasks/' + taskId + '/photos'); setTaskPhotos(p => ({ ...p, [taskId]: photos })); }
    catch { }
  }

  async function uploadTaskPhoto() {
    if (!photoFile || !showPhotoUpload) return;
    setPhotoBusy(true);
    try {
      const fd = new FormData();
      fd.append('photo', photoFile);
      if (photoNote) fd.append('note', photoNote);
      const token = localStorage.getItem('fc_token');
      const base = import.meta.env.VITE_API_URL || '/api';
      await fetch(base + '/projects/tasks/' + showPhotoUpload + '/photos', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: fd,
      });
      toast('Photo uploaded!');
      setShowPhotoUpload(null); setPhotoFile(null); setPhotoNote('');
      loadTaskPhotos(showPhotoUpload);
    } catch (e) { toast('Upload failed', 'error'); }
    setPhotoBusy(false);
  }

  async function toggleTask(taskId) {
    setToggling(taskId);
    try { await api('/projects/tasks/' + taskId + '/toggle', { method: 'PATCH' }); load(); } catch (e) { console.error(e); }
    setToggling(null);
  }
  async function assignTask(taskId, userId) {
    try { await api('/projects/tasks/' + taskId + '/assign', { method: 'PATCH', body: JSON.stringify({ user_id: userId }) }); setShowAssign(null); load(); } catch (e) { alert(e.message); }
  }
  async function editTask(taskId) {
    if (!editTaskText.trim()) return;
    try { await api('/projects/tasks/' + taskId + '/edit', { method: 'PATCH', body: JSON.stringify({ text: editTaskText }) }); setEditingTask(null); setEditTaskText(''); load(); } catch (e) { alert(e.message); }
  }
  async function toggleAssignee(taskId, userId) {
    try {
      const current = assigneeMap[taskId] || [];
      const isAssigned = current.some(a => (a.id === userId) || (a.user_id === userId));
      let result;
      if (isAssigned) { result = await api('/task-assignees/' + taskId + '/' + userId, { method: 'DELETE' }); }
      else { result = await api('/task-assignees/' + taskId + '/add', { method: 'POST', body: JSON.stringify({ user_id: userId }) }); }
      setAssigneeMap(p => ({ ...p, [taskId]: result }));
      load();
    } catch (e) { alert(e.message); }
  }
  async function loadAssignees(taskId) {
    try { const a = await api('/task-assignees/' + taskId); setAssigneeMap(p => ({ ...p, [taskId]: a })); } catch { }
  }
  async function toggleAssignee(taskId, userId) {
    try {
      const current = assigneeMap[taskId] || [];
      const isAssigned = current.some(a => a.id === userId || a.user_id === userId);
      let result;
      if (isAssigned) {
        result = await api('/task-assignees/' + taskId + '/' + userId, { method: 'DELETE' });
      } else {
        result = await api('/task-assignees/' + taskId + '/add', { method: 'POST', body: JSON.stringify({ user_id: userId }) });
      }
      setAssigneeMap(p => ({ ...p, [taskId]: result }));
      load();
    } catch (e) { alert(e.message); }
  }
  async function loadAssignees(taskId) {
    try { const a = await api('/task-assignees/' + taskId); setAssigneeMap(p => ({ ...p, [taskId]: a })); } catch { }
  }
  async function reassignCompletion(taskId, userId) {
    try { await api('/projects/tasks/' + taskId + '/reassign-completion', { method: 'PATCH', body: JSON.stringify({ user_id: userId }) }); setShowReassign(null); load(); } catch (e) { alert(e.message); }
  }
  async function addNote() {
    if (!newNote.trim()) return;
    try { await api('/projects/' + id + '/notes', { method: 'POST', body: JSON.stringify({ text: newNote }) }); setNewNote(''); load(); } catch (e) { console.error(e); }
  }
  async function submitCO() {
    if (!coText.trim()) return;
    try { await api('/change-orders', { method: 'POST', body: JSON.stringify({ project_id: id, text: coText, cost: Number(coCost) || 0 }) }); setCOText(''); setCOCost(''); setShowCO(false); load(); } catch (e) { alert(e.message); }
  }
  async function changeStatus(status) {
    try { await api('/projects/' + id, { method: 'PATCH', body: JSON.stringify({ status }) }); setShowStatus(false); load(); } catch (e) { alert(e.message); }
  }
  async function deleteCO(coId) {
    if (!confirm('Delete this change order?')) return;
    try { await api('/change-orders/' + coId, { method: 'DELETE' }); load(); } catch (e) { alert(e.message); }
  }
  async function scheduleVisit() {
    if (!schedForm.user_id || !schedForm.date) { alert('Select a tech and date'); return; }
    try { await api('/schedule', { method: 'POST', body: JSON.stringify({ ...schedForm, project_id: id, event_type: 'install' }) }); setShowSchedule(false); setSchedForm({ user_id: '', date: '', start_time: '', end_time: '', description: '' }); load(); }
    catch (e) { alert(e.message); }
  }
  async function saveSchedEdit() {
    if (!editSched) return;
    try { await api('/schedule/' + editSched.id, { method: 'PATCH', body: JSON.stringify({ date: editSched.date, start_time: editSched.start_time, end_time: editSched.end_time, user_id: editSched.user_id, description: editSched.description }) }); setEditSched(null); load(); }
    catch (e) { alert(e.message); }
  }
  async function deleteSchedEvent(evId) {
    if (!confirm('Delete this visit?')) return;
    try { await api('/schedule/' + evId, { method: 'DELETE' }); load(); } catch (e) { alert(e.message); }
  }

  function generateCertificate() {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Completion Certificate</title><style>
      body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:40px;color:#1a1a1a}
      .header{text-align:center;border-bottom:3px solid #CBA135;padding-bottom:20px;margin-bottom:30px}
      .logo{font-size:28px;font-weight:700;color:#CBA135;margin-bottom:4px}
      .cert-title{font-size:22px;font-weight:600;margin-top:10px}
      .details{margin:20px 0;line-height:2}
      .detail-row{display:flex;gap:10px}.detail-label{font-weight:600;min-width:140px;color:#555}
      .tasks{margin:20px 0}.task{padding:6px 0;border-bottom:1px solid #eee;display:flex;gap:8px}
      .check{color:#22c55e;font-weight:700}
      .sig{margin-top:60px;display:flex;justify-content:space-between}
      .sig-line{border-top:1px solid #999;width:200px;padding-top:8px;font-size:13px;color:#666}
      @media print{body{margin:0;padding:20px}}
    </style></head><body>
      <div class="header">
        <div class="logo">Elite Technologies of Texas</div>
        <div style="color:#666;font-size:13px">Home Technology Solutions</div>
        <div class="cert-title">Certificate of Completion</div>
      </div>
      <div class="details">
        <div class="detail-row"><span class="detail-label">Project Address:</span><span>${project.address}</span></div>
        <div class="detail-row"><span class="detail-label">Client:</span><span>${project.client_name || 'N/A'}${project.client_phone ? ' · ' + project.client_phone : ''}</span></div>
        <div class="detail-row"><span class="detail-label">Status:</span><span>${project.status}</span></div>
        <div class="detail-row"><span class="detail-label">Completion:</span><span>${pct}% (${done}/${total} tasks)</span></div>
        <div class="detail-row"><span class="detail-label">Date:</span><span>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
        ${project.labor_budget ? '<div class="detail-row"><span class="detail-label">Labor Budget:</span><span>$' + Number(project.labor_budget).toLocaleString() + '</span></div>' : ''}
      </div>
      ${project.installer_summary ? '<div style="margin:20px 0;padding:15px;background:#f9f9f9;border-radius:8px;font-size:14px;line-height:1.6"><strong>Scope of Work:</strong><br>' + project.installer_summary + '</div>' : ''}
      <div class="tasks"><h3 style="margin-bottom:10px">Task Summary</h3>
        ${(project.areas || []).map(a => '<div style="margin-bottom:15px"><div style="font-weight:600;color:#555;margin-bottom:5px">' + a.name + '</div>' + (a.tasks || []).map(t => '<div class="task"><span class="check">' + (t.done ? '✓' : '○') + '</span><span>' + t.text + '</span>' + (t.completed_by_name ? '<span style="color:#888;font-size:12px;margin-left:auto">' + t.completed_by_name + '</span>' : '') + '</div>').join('') + '</div>').join('')}
      </div>
      <div class="sig">
        <div class="sig-line">Client Signature / Date</div>
        <div class="sig-line">Company Representative / Date</div>
      </div>
      <script>setTimeout(()=>window.print(),500)<\/script>
    </body></html>`);
    w.document.close();
  }

  if (loading) return <Spinner />;
  if (!project) return <div className="text-center py-16 text-zinc-500">Project not found</div>;
  const total = project.areas?.reduce((s, a) => s + (a.tasks?.length || 0), 0) || 0;
  const done = project.areas?.reduce((s, a) => s + (a.tasks?.filter(t => t.done).length || 0), 0) || 0;
  const pct = total ? Math.round(done / total * 100) : 0;
  const coApproved = (project.change_orders || []).filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.cost || 0), 0);
  const totalExpenses = (project.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const timeByUser = {}; (project.time_entries || []).forEach(e => { if (!timeByUser[e.user_name]) timeByUser[e.user_name] = { color: e.user_color, hours: 0, entries: [] }; timeByUser[e.user_name].hours += Number(e.hours || 0); timeByUser[e.user_name].entries.push(e); });

  return (
    <div>
      <button onClick={() => nav('/projects')} className="text-sm text-zinc-400 hover:text-brand-400 mb-4 flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Projects</button>
      <Card className="p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div><h1 className="text-xl font-bold">{project.address}</h1><p className="text-sm text-zinc-500 mt-0.5">{project.client_name}{project.client_phone && ' · ' + project.client_phone}</p></div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={generateCertificate} className="text-xs py-1.5 px-3"><Award className="w-3.5 h-3.5" /> Certificate</Button>
            <Badge variant={project.status}>{project.status}</Badge>
            {isAdmin() && <button onClick={() => setShowStatus(true)} className="text-zinc-600 hover:text-zinc-400"><Edit className="w-4 h-4" /></button>}
          </div>
        </div>
        {project.installer_summary && <p className="text-sm text-zinc-400 leading-relaxed mb-3">{project.installer_summary}</p>}
        <div className="flex items-center gap-3 mb-3"><div className="flex-1 bg-zinc-800 rounded-full h-2"><div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: pct + '%' }} /></div><span className="text-sm font-semibold tabular-nums">{pct}%</span></div>
        <div className="flex gap-4 text-sm text-zinc-500 flex-wrap"><span>Tasks: {done}/{total}</span>{project.labor_budget && <span>Budget: {fmtMoney(project.labor_budget)}</span>}{totalExpenses > 0 && <span>Expenses: {fmtMoney(totalExpenses)}</span>}{coApproved > 0 && <span>COs: +{fmtMoney(coApproved)}</span>}</div>
      </Card>

      <Tabs items={[
        {id:'tasks', label:'Tasks'}, {id:'schedule', label:'Schedule (' + (schedEvents?.length || 0) + ')'},
        {id:'notes', label:'Notes (' + (project.notes?.length || 0) + ')'}, {id:'files', label:'Files (' + (project.files?.length || 0) + ')'},
        {id:'time', label:'Time'}, {id:'expenses', label:'Expenses (' + (project.expenses?.length || 0) + ')'},
        {id:'cos', label:'Change Orders'}, {id:'service', label:'Service Calls'},
      ]} active={tab} onChange={setTab} />

      {/* TASKS with photo upload + tech panel */}
      {tab === 'tasks' && (() => {
        // Build tech assignment summary
        const allTasks = (project.areas || []).flatMap(a => (a.tasks || []).map(t => ({ ...t, area: a.name })));
        const techMap = {};
        allTasks.forEach(t => {
          if (t.assignee_name) {
            if (!techMap[t.assignee_name]) techMap[t.assignee_name] = { color: t.assignee_color, tasks: [], done: 0 };
            techMap[t.assignee_name].tasks.push(t);
            if (t.done) techMap[t.assignee_name].done++;
          }
        });
        const unassignedTasks = allTasks.filter(t => !t.assignee_name);

        return <div className="flex gap-4">
          {/* Left: Task List */}
          <div className="flex-1 min-w-0">
            {isAdmin() && <div className="flex justify-end mb-3"><Button variant="secondary" onClick={() => setShowAddArea(true)}><Plus className="w-4 h-4" /> Add Area</Button></div>}
            {(project.areas || []).map(area => <div key={area.id} className="mb-6"><h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-1">{area.name}</h3><div className="space-y-1">{(area.tasks || []).map(task => (
              <div key={task.id} className={cn('rounded-xl text-sm bg-[#0a0a0c] border border-white/[0.04]', task.done && 'opacity-70')}>
                {editingTask === task.id ? (
                  <div className="flex items-center gap-2 px-4 py-2.5">
                    <input value={editTaskText} onChange={e => setEditTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && editTask(task.id)} className="flex-1 bg-white/[0.025] border border-brand-400/50 rounded-lg px-3 py-1.5 text-sm text-zinc-100 outline-none" autoFocus />
                    <Button onClick={() => editTask(task.id)} className="text-xs py-1.5 px-3">Save</Button>
                    <button onClick={() => { setEditingTask(null); setEditTaskText(''); }} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => toggleTask(task.id)} disabled={toggling === task.id} className={cn('w-full text-left flex items-center gap-3 px-4 py-2.5', task.done ? 'text-zinc-600 line-through' : 'text-zinc-200')}>
                    <div className={cn('w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center', task.done ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-600')}>{task.done && <Check className="w-3 h-3 text-white" />}</div>
                    <span className="flex-1">{task.text}</span>
                    {task.assignee_name && <div onClick={e => e.stopPropagation()} className="flex -space-x-1.5">{(() => { const extras = (assigneeMap[task.id] || []).filter(a => a.name !== task.assignee_name); return [<Avatar key="primary" name={task.assignee_name} color={task.assignee_color} size="sm" />, ...extras.map(a => <Avatar key={a.id || a.user_id} name={a.name} color={a.color} size="sm" />)]; })()}</div>}
                    {task.due_date && <span className="text-xs text-zinc-600">{fmtDate(task.due_date)}</span>}
                  </button>
                )}
                <div className="px-4 pb-2 pt-1 flex items-center gap-3 flex-wrap border-t border-white/[0.04] mt-1">
                  {task.done && task.completed_by_name && <span className="text-[11px] text-zinc-600">Completed by {task.completed_by_name}{task.completed_at && ' · ' + new Date(task.completed_at).toLocaleString()}{isAdmin() && <button onClick={() => setShowReassign(task)} className="ml-1 text-brand-400 hover:underline">change</button>}</span>}
                  {isAdmin() && !task.done && <button onClick={() => { setShowAssign(task); loadAssignees(task.id); }} className="text-[11px] text-zinc-600 hover:text-brand-400">{task.assignee_name ? 'Edit Team' : 'Assign'}</button>}
                  <button onClick={(e) => { e.stopPropagation(); setEditingTask(task.id); setEditTaskText(task.text); }} className="text-[11px] text-zinc-400 hover:text-brand-400 flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                  <button onClick={() => { setShowPhotoUpload(task.id); loadTaskPhotos(task.id); }} className="text-[11px] text-zinc-400 hover:text-brand-400 flex items-center gap-1"><Camera className="w-3 h-3" /> Photo</button>
                  {isAdmin() && <button onClick={async () => { if (confirm('Delete this task?')) { try { await api('/projects/tasks/' + task.id, { method: 'DELETE' }); load(); } catch (e) { alert(e.message); } } }} className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>}
                  {taskPhotos[task.id]?.length > 0 && <span className="text-[11px] text-emerald-500 flex items-center gap-1"><Image className="w-3 h-3" /> {taskPhotos[task.id].length}</span>}
                </div>
              </div>
            ))}</div></div>)}
            {!project.areas?.length && <EmptyState title="No areas or tasks yet" />}
          </div>

          {/* Right: Tech Assignment Panel */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <Card className="p-4 sticky top-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Team Assignments</h3>
              {Object.keys(techMap).length === 0 && unassignedTasks.length === allTasks.length && <p className="text-xs text-zinc-600">No techs assigned yet</p>}
              {Object.entries(techMap).map(([name, data]) => (
                <div key={name} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={name} color={data.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-[10px] text-zinc-500">{data.done}/{data.tasks.length} done</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs font-bold font-mono text-brand-400">{data.tasks.length}</div>
                  </div>
                  <div className="space-y-0.5 pl-8">
                    {data.tasks.map(t => (
                      <div key={t.id} className={cn("text-[11px] flex items-center gap-1.5 py-0.5", t.done ? "text-zinc-600 line-through" : "text-zinc-400")}>
                        <div className={cn("w-2.5 h-2.5 rounded-sm flex-shrink-0", t.done ? "bg-emerald-600" : "border border-zinc-600")} />
                        <span className="truncate">{t.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {unassignedTasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-2">Unassigned ({unassignedTasks.length})</p>
                  <div className="space-y-0.5">
                    {unassignedTasks.map(t => (
                      <div key={t.id} className="text-[11px] text-zinc-500 flex items-center gap-1.5 py-0.5">
                        <div className="w-2.5 h-2.5 rounded-sm border border-zinc-700 flex-shrink-0" />
                        <span className="truncate">{t.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>;
      })()}

      {/* SCHEDULE TAB */}
      {tab === 'schedule' && <div>
        {isAdmin() && <div className="flex justify-end mb-3"><Button onClick={() => setShowSchedule(true)}><Calendar className="w-4 h-4" /> Schedule Visit</Button></div>}
        {(schedEvents || []).length ? schedEvents.map(ev => (
          <Card key={ev.id} onClick={() => isAdmin() ? setEditSched({ ...ev, date: ev.date?.split('T')[0] || ev.date }) : null} className="p-4 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Avatar name={ev.user_name} color={ev.user_color} size="sm" /><div><p className="text-sm font-medium">{ev.user_name}</p><p className="text-xs text-zinc-500">{fmtDate(ev.date)}{ev.start_time && ' · ' + ev.start_time}{ev.end_time && ' - ' + ev.end_time}</p>{ev.description && <p className="text-xs text-zinc-500">{ev.description}</p>}</div></div>
              <div className="flex items-center gap-2"><Badge variant={ev.completed ? "completed" : ev.event_type === "install" ? "in-progress" : "scheduled"}>{ev.completed ? "Done" : ev.event_type}</Badge>{isAdmin() && <button onClick={(e) => { e.stopPropagation(); deleteSchedEvent(ev.id); }} className="text-zinc-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}</div>
            </div>
          </Card>
        )) : <EmptyState icon={Calendar} title="No visits scheduled" sub={isAdmin() ? "Schedule a visit above" : ""} />}
      </div>}

      {/* NOTES */}
      {tab === 'notes' && <div>
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-2 mb-2"><Avatar name={me?.name} color={me?.color} size="sm" /><span className="text-sm font-medium text-zinc-300">{me?.name}</span></div>
          <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Write a note... Use • or - at the start of a line for bullet points" rows={5}
            className="w-full bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600 resize-y min-h-[120px] leading-relaxed" />
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1">
              <button onClick={() => setNewNote(newNote + (newNote && !newNote.endsWith('\n') ? '\n' : '') + '• ')} className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] text-zinc-500 hover:text-zinc-300 border border-white/[0.06]">• Bullet</button>
              <button onClick={() => setNewNote(newNote + (newNote && !newNote.endsWith('\n') ? '\n' : '') + '— ')} className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] text-zinc-500 hover:text-zinc-300 border border-white/[0.06]">— Dash</button>
              <button onClick={() => { const lines = newNote.split('\n'); const numbered = lines.map((l, i) => l.trim() ? (i + 1) + '. ' + l.replace(/^\d+\.\s*/, '') : l).join('\n'); setNewNote(numbered); }} className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] text-zinc-500 hover:text-zinc-300 border border-white/[0.06]">1. Number</button>
            </div>
            <Button onClick={addNote} disabled={!newNote.trim()} className="text-sm"><Send className="w-4 h-4" /> Post Note</Button>
          </div>
        </Card>
        {(project.notes || []).map(n => <Card key={n.id} className="p-4 mb-2"><div className="flex items-center gap-2 mb-2"><Avatar name={n.user_name} color={n.user_color} size="sm" /><span className="text-sm font-medium">{n.user_name}</span><span className="text-[11px] text-zinc-600">{new Date(n.created_at).toLocaleString()}</span></div><div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{n.text}</div></Card>)}
        {!project.notes?.length && <EmptyState title="No notes yet" sub="Write a note above" />}
      </div>}

      {/* FILES */}
      {tab === 'files' && <div>
        <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center mb-4"><Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" /><p className="text-xs text-zinc-500">Upload files</p><input type="file" className="mt-2 text-sm text-zinc-400" /></div>
        {(project.files || []).map(f => <Card key={f.id} className="p-3 mb-2 flex items-center gap-3"><FileText className="w-5 h-5 text-blue-400" /><div><p className="text-sm font-medium">{f.original_name || f.filename}</p><p className="text-xs text-zinc-600">{new Date(f.created_at).toLocaleDateString()}</p></div></Card>)}
        {!project.files?.length && <EmptyState title="No files yet" />}
      </div>}

      {/* TIME */}
      {tab === 'time' && <div>{Object.keys(timeByUser).length ? Object.entries(timeByUser).map(([name, data]) => <Card key={name} className="p-4 mb-3"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Avatar name={name} color={data.color} size="sm" /><span className="text-sm font-semibold">{name}</span></div><span className="text-sm font-bold text-brand-400">{data.hours.toFixed(1)}h</span></div>{data.entries.map(e => <div key={e.id} className="flex justify-between text-xs text-zinc-500 py-1 border-t border-zinc-800/30"><span>{fmtDate(e.date)}{e.notes && ' — ' + e.notes}</span><span>{Number(e.hours || 0).toFixed(1)}h</span></div>)}</Card>) : <EmptyState icon={Clock} title="No time logged" />}</div>}

      {/* EXPENSES */}
      {tab === 'expenses' && <div>
        {(project.expenses || []).map(e => <Card key={e.id} className="p-4 mb-2 flex items-start gap-3"><DollarSign className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" /><div className="flex-1 min-w-0"><p className="text-sm font-medium">{e.title}</p>{e.description && <p className="text-xs text-zinc-500">{e.description}</p>}<p className="text-xs text-zinc-600 mt-1">{e.user_name} · {fmtDate(e.date)} · {e.category}</p></div><span className="text-sm font-bold">{fmtMoney(e.amount)}</span></Card>)}
        {!project.expenses?.length && <EmptyState icon={DollarSign} title="No expenses" />}
        {(project.expenses || []).length > 0 && <div className="text-right mt-2 text-sm text-zinc-400">Total: <span className="font-bold text-zinc-200">{fmtMoney(totalExpenses)}</span></div>}
      </div>}

      {/* CHANGE ORDERS */}
      {tab === 'cos' && <div>
        <div className="flex justify-end mb-3"><Button variant="secondary" onClick={() => setShowCO(true)}><Plus className="w-4 h-4" /> Submit CO</Button></div>
        {(project.change_orders || []).map(co => <Card key={co.id} className="p-4 mb-2"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-zinc-200">{co.text}</p><p className="text-xs text-zinc-500 mt-1">{fmtMoney(co.cost)} · {co.submitted_by_name} · {new Date(co.created_at).toLocaleDateString()}</p></div><div className="flex items-center gap-2"><Badge variant={co.status}>{co.status}</Badge>{isAdmin() && <button onClick={() => deleteCO(co.id)} className="text-zinc-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}</div></div></Card>)}
        {!project.change_orders?.length && <EmptyState title="No change orders" />}
      </div>}

      {/* SERVICE CALLS */}
      {tab === 'service' && <div>
        {(project.service_calls || []).map(sc => <Card key={sc.id} className="p-4 mb-2"><div className="flex gap-2 mb-1"><Badge variant={sc.priority}>{sc.priority}</Badge><Badge variant={sc.status}>{sc.status}</Badge></div><p className="text-sm text-zinc-200">{sc.description}</p><p className="text-xs text-zinc-500 mt-1">{sc.scheduled_date && fmtDate(sc.scheduled_date)}{sc.scheduled_time && ' · ' + sc.scheduled_time}</p></Card>)}
        {!project.service_calls?.length && <EmptyState title="No service calls" />}
      </div>}

      {/* MODALS */}
      <Modal open={showStatus} onClose={() => setShowStatus(false)} title="Change Status"><div className="space-y-2">{['not-started','in-progress','completed'].map(s => <button key={s} onClick={() => changeStatus(s)} className={cn('w-full text-left px-4 py-3 rounded-lg text-sm capitalize', project.status === s ? 'bg-brand-400/10 border-2 border-brand-400 text-brand-400' : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-300')}>{s}</button>)}</div></Modal>
      <Modal open={showAddArea} onClose={() => setShowAddArea(false)} title="Add Area"><div className="space-y-3"><Input label="Area Name" placeholder="e.g. Outdoor Patio" /><Input label="Task 1" /><Input label="Task 2" /><Button onClick={() => setShowAddArea(false)}>Add Area</Button></div></Modal>
      <Modal open={showCO} onClose={() => setShowCO(false)} title="Submit Change Order"><div className="space-y-3"><Textarea label="Description *" rows={3} value={coText} onChange={e => setCOText(e.target.value)} /><Input label="Cost ($)" type="number" value={coCost} onChange={e => setCOCost(e.target.value)} /><Button onClick={submitCO}>Submit</Button></div></Modal>
      <Modal open={!!showAssign} onClose={() => setShowAssign(null)} title="Assign Task">{showAssign && <div className="space-y-2">
        <p className="text-sm text-zinc-300 mb-1">{showAssign.text}</p>
        <p className="text-[10px] text-zinc-600 mb-3">Toggle techs on/off. Multiple techs can be assigned. Close when done.</p>
        {(users || []).map(u => {
          const currentAssignees = assigneeMap[showAssign.id] || [];
          const isAssigned = currentAssignees.some(a => (a.id === u.id) || (a.user_id === u.id));
          return <button key={u.id} onClick={() => toggleAssignee(showAssign.id, u.id)}
            className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left transition-all", isAssigned ? "bg-brand-400/10 border border-brand-400/30 text-brand-400" : "text-zinc-200 hover:bg-zinc-800/50 border border-transparent")}>
            <Avatar name={u.name} color={u.color} size="sm" />
            <span className="flex-1">{u.name}</span>
            {isAssigned && <Check className="w-4 h-4" />}
          </button>;
        })}
        {(assigneeMap[showAssign.id] || []).length > 0 && <p className="text-[10px] text-zinc-500 pt-1">{(assigneeMap[showAssign.id] || []).length} tech{(assigneeMap[showAssign.id] || []).length !== 1 ? 's' : ''} assigned</p>}
      </div>}</Modal>
      <Modal open={!!showReassign} onClose={() => setShowReassign(null)} title="Reassign Completion">{showReassign && <div className="space-y-2"><p className="text-sm text-zinc-400 mb-3">Who completed: {showReassign.text}?</p>{(users || []).map(u => <button key={u.id} onClick={() => reassignCompletion(showReassign.id, u.id)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-zinc-200 hover:bg-zinc-800/50 text-left"><Avatar name={u.name} color={u.color} size="sm" />{u.name}</button>)}</div>}</Modal>

      {/* Photo Upload Modal */}
      <Modal open={!!showPhotoUpload} onClose={() => { setShowPhotoUpload(null); setPhotoFile(null); setPhotoNote(''); }} title="Task Photo">
        <div className="space-y-3">
          {/* Show existing photos */}
          {taskPhotos[showPhotoUpload]?.length > 0 && <div className="space-y-2 mb-3">
            {taskPhotos[showPhotoUpload].map(p => <Card key={p.id} className="p-3">
              <div className="flex items-center gap-2 mb-1"><Avatar name={p.user_name} color={p.user_color} size="sm" /><span className="text-xs text-zinc-400">{p.user_name} · {new Date(p.created_at).toLocaleString()}</span></div>
              {p.note && <p className="text-sm text-zinc-300 mb-1">{p.note}</p>}
              <p className="text-xs text-zinc-500">{p.original_name}</p>
            </Card>)}
          </div>}
          <div className="border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center">
            <Camera className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
            <p className="text-xs text-zinc-500 mb-2">{photoFile ? photoFile.name : 'Select a photo'}</p>
            <input type="file" accept="image/*" capture="environment" onChange={e => setPhotoFile(e.target.files[0])} className="text-xs text-zinc-500" />
          </div>
          <Textarea label="Note (optional)" rows={2} value={photoNote} onChange={e => setPhotoNote(e.target.value)} placeholder="Describe what's in the photo..." />
          <Button onClick={uploadTaskPhoto} disabled={photoBusy || !photoFile}>{photoBusy ? 'Uploading...' : 'Upload Photo'}</Button>
        </div>
      </Modal>

      {/* Schedule Visit Modal */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Visit"><div className="space-y-3">
        <Select label="Assign Tech *" value={schedForm.user_id} onChange={e => setSchedForm({...schedForm, user_id: e.target.value})}><option value="">Select...</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <Input label="Date *" type="date" value={schedForm.date} onChange={e => setSchedForm({...schedForm, date: e.target.value})} />
        <div className="grid grid-cols-2 gap-3"><Input label="Start Time" value={schedForm.start_time} onChange={e => setSchedForm({...schedForm, start_time: e.target.value})} placeholder="8:00 AM" /><Input label="End Time" value={schedForm.end_time} onChange={e => setSchedForm({...schedForm, end_time: e.target.value})} placeholder="5:00 PM" /></div>
        <Input label="Description" value={schedForm.description} onChange={e => setSchedForm({...schedForm, description: e.target.value})} placeholder="What work is being done..." />
        <Button onClick={scheduleVisit}>Schedule Visit</Button>
      </div></Modal>

      {/* Edit Schedule Event Modal */}
      <Modal open={!!editSched} onClose={() => setEditSched(null)} title="Edit Visit">{editSched && <div className="space-y-3">
        <Select label="Assigned Tech" value={editSched.user_id || ""} onChange={e => setEditSched({...editSched, user_id: e.target.value})}><option value="">Select...</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <Input label="Date" type="date" value={editSched.date?.split('T')[0] || ""} onChange={e => setEditSched({...editSched, date: e.target.value})} />
        <div className="grid grid-cols-2 gap-3"><Input label="Start Time" value={editSched.start_time || ""} onChange={e => setEditSched({...editSched, start_time: e.target.value})} /><Input label="End Time" value={editSched.end_time || ""} onChange={e => setEditSched({...editSched, end_time: e.target.value})} /></div>
        <Input label="Description" value={editSched.description || ""} onChange={e => setEditSched({...editSched, description: e.target.value})} />
        <Button onClick={saveSchedEdit}>Save Changes</Button>
      </div>}</Modal>
    </div>
  );
}
