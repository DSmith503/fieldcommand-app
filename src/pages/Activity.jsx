import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useApi } from '../hooks/useApi';
import { Card, Spinner, PageHeader, Select, Input, EmptyState } from '../components/UI';
import { Activity as ActivityIcon } from 'lucide-react';

export default function Activity() {
  const { data: users } = useApi('/users');
  const { data: projects } = useApi('/projects');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ user_id: '', project_id: '', start_date: '', end_date: '' });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '200');
    if (filters.user_id) params.set('user_id', filters.user_id);
    if (filters.project_id) params.set('project_id', filters.project_id);
    if (filters.start_date) params.set('start_date', filters.start_date);
    if (filters.end_date) params.set('end_date', filters.end_date);
    api('/activity?' + params.toString()).then(setLogs).catch(console.error).finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <PageHeader title="Activity Log" subtitle={(logs?.length || 0) + " entries"} />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Select label="User" value={filters.user_id} onChange={e => setFilters({...filters, user_id: e.target.value})}>
          <option value="">All Users</option>
          {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select label="Project" value={filters.project_id} onChange={e => setFilters({...filters, project_id: e.target.value})}>
          <option value="">All Projects</option>
          {(projects || []).map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
        </Select>
        <Input label="From" type="date" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} />
        <Input label="To" type="date" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} />
      </div>

      {loading ? <Spinner /> : !logs?.length ? <EmptyState icon={ActivityIcon} title="No activity" sub="Activity matching your filters will appear here" /> : logs.map(l => (
        <Card key={l.id} className="px-4 py-3 mb-1.5">
          <p className="text-sm text-zinc-300">{l.description}</p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-600 flex-wrap">
            {l.user_name && <><span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: l.user_color }} /><span>{l.user_name}</span><span>·</span></>}
            <span>{new Date(l.created_at).toLocaleString()}</span>
            {l.project_address && <><span>·</span><span>{l.project_address}</span></>}
          </div>
        </Card>
      ))}
    </div>
  );
}
