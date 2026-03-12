import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, fmtMoney, isAdmin, getUser, cn } from '../utils/api';
import { Card, Badge, Avatar, Spinner, PageHeader, Button, Modal, Input, Select, Textarea, Tabs } from '../components/UI';
import { ArrowLeft, Check, Plus, Upload, FileText, Send, Edit } from 'lucide-react';
import { useApi } from '../hooks/useApi';

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const me = getUser();
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
  const { data: users } = useApi('/users');

  const load = useCallback(() => {
    api('/projects/' + id).then(setProject).catch(console.error).finally(() => setLoading(false));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function toggleTask(taskId) {
    setToggling(taskId);
    try { await api('/projects/tasks/' + taskId + '/toggle', { method: 'PATCH' }); load(); } catch (e) { console.error(e); }
    setToggling(null);
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

  if (loading) return <Spinner />;
  if (!project) return <div className="text-center py-16 text-zinc-500">Project not found</div>;

  const total = project.areas?.reduce((s, a) => s + (a.tasks?.length || 0), 0) || 0;
  const done = project.areas?.reduce((s, a) => s + (a.tasks?.filter(t => t.done).length || 0), 0) || 0;
  const pct = total ? Math.round(done / total * 100) : 0;

  return (
    <div>
      <button onClick={() => nav('/projects')} className="text-sm text-zinc-400 hover:text-brand-400 mb-4 flex items-center gap-1.5 transition-colors"><ArrowLeft className="w-4 h-4" /> Projects</button>
      <Card className="p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3"><div><h1 className="text-xl font-bold text-zinc-100">{project.address}</h1><p className="text-sm text-zinc-500 mt-0.5">{project.client_name}{project.client_phone && ' \u00B7 ' + project.client_phone}</p></div><div className="flex items-center gap-2"><Badge variant={project.status}>{project.status}</Badge>{isAdmin() && <button onClick={() => setShowStatus(true)} className="text-zinc-600 hover:text-zinc-400"><Edit className="w-4 h-4" /></button>}</div></div>
        {project.installer_summary && <p className="text-sm text-zinc-400 leading-relaxed mb-3">{project.installer_summary}</p>}
        <div className="flex items-center gap-3 mb-3"><div className="flex-1 bg-zinc-800 rounded-full h-2"><div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: pct + '%' }} /></div><span className="text-sm font-semibold text-zinc-300 tabular-nums">{pct}%</span></div>
        <p className="text-sm text-zinc-500">Tasks: {done}/{total}{project.labor_budget && ' \u00B7 Budget: ' + fmtMoney(project.labor_budget)}</p>
      </Card>

      <Tabs items={[{id:'tasks',label:'Tasks'},{id:'notes',label:'Notes (' + (project.notes?.length || 0) + ')'},{id:'files',label:'Files (' + (project.files?.length || 0) + ')'},{id:'cos',label:'Change Orders'},{id:'service',label:'Service History'}]} active={tab} onChange={setTab} />

      {tab === 'tasks' && <div>
        {isAdmin() && <div className="flex justify-end mb-3"><Button variant="secondary" onClick={() => setShowAddArea(true)}><Plus className="w-4 h-4" /> Add Area</Button></div>}
        {(project.areas || []).map(area => <div key={area.id} className="mb-6"><h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-1">{area.name}</h3><div className="space-y-1">{(area.tasks || []).map(task => <button key={task.id} onClick={() => toggleTask(task.id)} disabled={toggling === task.id} className={cn('w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all', task.done ? 'bg-zinc-900/30 text-zinc-600 line-through' : 'bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800/60')}><div className={cn('w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-colors', task.done ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-600 hover:border-zinc-400')}>{task.done && <Check className="w-3 h-3 text-white" />}</div><span className="flex-1">{task.text}</span></button>)}</div></div>)}
      </div>}

      {tab === 'notes' && <div>
        <div className="flex gap-2 mb-4"><input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Add a note..." className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" /><Button onClick={addNote}><Send className="w-4 h-4" /></Button></div>
        {(project.notes || []).map(n => <Card key={n.id} className="p-4 mb-2"><div className="flex items-center gap-2 mb-1.5"><Avatar name={n.user_name} color={n.user_color} size="sm" /><span className="text-sm font-medium">{n.user_name}</span></div><p className="text-sm text-zinc-300">{n.text}</p></Card>)}
      </div>}

      {tab === 'files' && <div>
        <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center mb-4"><Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" /><p className="text-xs text-zinc-500">Upload files</p><input type="file" className="mt-2 text-sm text-zinc-400" /></div>
        {(project.files || []).map(f => <Card key={f.id} className="p-3 mb-2 flex items-center gap-3"><FileText className="w-5 h-5 text-blue-400" /><div><p className="text-sm font-medium">{f.original_name || f.filename}</p></div></Card>)}
      </div>}

      {tab === 'cos' && <div>
        <div className="flex justify-end mb-3"><Button variant="secondary" onClick={() => setShowCO(true)}><Plus className="w-4 h-4" /> Submit CO</Button></div>
        {/* COs would be loaded from the API - for now showing from project data */}
        <p className="text-zinc-500 text-sm text-center py-8">Change orders for this project appear here</p>
      </div>}

      {tab === 'service' && <p className="text-zinc-500 text-sm text-center py-8">Service call history appears here</p>}

      <Modal open={showStatus} onClose={() => setShowStatus(false)} title="Change Status"><div className="space-y-2">{['not-started','in-progress','completed'].map(s => <button key={s} onClick={() => changeStatus(s)} className={cn('w-full text-left px-4 py-3 rounded-lg text-sm capitalize', project.status === s ? 'bg-brand-400/10 border-2 border-brand-400 text-brand-400' : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-300')}>{s}</button>)}</div></Modal>
      <Modal open={showAddArea} onClose={() => setShowAddArea(false)} title="Add Area"><div className="space-y-3"><Input label="Area Name" placeholder="e.g. Outdoor Patio" /><Input label="Task 1" /><Input label="Task 2" /><Button onClick={() => setShowAddArea(false)}>Add Area</Button></div></Modal>
      <Modal open={showCO} onClose={() => setShowCO(false)} title="Submit Change Order"><div className="space-y-3"><Textarea label="Description *" rows={3} value={coText} onChange={e => setCOText(e.target.value)} placeholder="Describe the change..." /><Input label="Cost Impact ($)" type="number" value={coCost} onChange={e => setCOCost(e.target.value)} /><Button onClick={submitCO}>Submit</Button></div></Modal>
    </div>
  );
}
