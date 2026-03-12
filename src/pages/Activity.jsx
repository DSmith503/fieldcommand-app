import { useApi } from '../hooks/useApi';
import { Card, Spinner, PageHeader, EmptyState } from '../components/UI';
import { Activity as ActivityIcon } from 'lucide-react';

export default function Activity() {
  const { data: logs, loading } = useApi('/activity');
  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Activity Log" />
      {!logs?.length ? <EmptyState icon={ActivityIcon} title="No activity yet" /> : logs.map(l => (
        <Card key={l.id} className="px-4 py-3 mb-1.5"><p className="text-sm text-zinc-300">{l.description}</p><div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-600">{l.user_name && <><span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: l.user_color }} /><span>{l.user_name}</span><span>&middot;</span></>}<span>{new Date(l.created_at).toLocaleString()}</span></div></Card>
      ))}
    </div>
  );
}
