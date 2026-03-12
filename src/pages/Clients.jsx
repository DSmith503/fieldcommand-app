import { useState, useEffect, useCallback } from "react";
import { api, isAdmin } from "../utils/api";
import { Card, Spinner, PageHeader, Button, Modal, Input, Textarea, EmptyState } from "../components/UI";
import { Users, Plus, Search } from "lucide-react";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", billing_address: "", job_address: "", notes: "", source: "" });
  const [busy, setBusy] = useState(false);

  const up = (k, v) => setForm({ ...form, [k]: v });

  const load = useCallback(() => {
    setLoading(true);
    api("/clients" + (search ? "?search=" + encodeURIComponent(search) : ""))
      .then(setClients)
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function submit() {
    setBusy(true);
    try {
      await api("/clients", { method: "POST", body: JSON.stringify(form) });
      setShowNew(false);
      setForm({ name: "", phone: "", email: "", billing_address: "", job_address: "", notes: "", source: "" });
      load();
    } catch (e) { alert(e.message); }
    setBusy(false);
  }

  return (
    <div>
      <PageHeader title="Clients" subtitle={(clients?.length || 0) + " total"}
        action={isAdmin() && <Button onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Client</Button>} />

      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" />
      </div>

      {loading ? <Spinner /> : !clients?.length ? <EmptyState icon={Users} title="No clients found" /> : (
        <div className="space-y-2">
          {clients.map(c => (
            <Card key={c.id} className="p-4">
              <p className="text-sm font-semibold text-zinc-100">{c.name}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-zinc-500">
                {c.phone && <span>{c.phone}</span>}
                {c.email && <span>{c.email}</span>}
                {c.job_address && <span>{c.job_address}</span>}
                {c.source && <span className="text-zinc-600">Source: {c.source}</span>}
              </div>
              {c.notes && <p className="text-xs text-zinc-600 mt-1">{c.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Client">
        <div className="space-y-3">
          <Input label="Name *" value={form.name} onChange={e => up("name", e.target.value)} placeholder="Client name" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" value={form.phone} onChange={e => up("phone", e.target.value)} placeholder="(555) 123-4567" />
            <Input label="Email" value={form.email} onChange={e => up("email", e.target.value)} placeholder="client@email.com" />
          </div>
          <Input label="Job Address" value={form.job_address} onChange={e => up("job_address", e.target.value)} placeholder="123 Main St" />
          <Input label="Billing Address" value={form.billing_address} onChange={e => up("billing_address", e.target.value)} placeholder="Same as above if different" />
          <Input label="Source" value={form.source} onChange={e => up("source", e.target.value)} placeholder="referral, website, repeat..." />
          <Textarea label="Notes" rows={3} value={form.notes} onChange={e => up("notes", e.target.value)} placeholder="Any notes..." />
          <Button onClick={submit} disabled={busy || !form.name}>{busy ? "Saving..." : "Add Client"}</Button>
        </div>
      </Modal>
    </div>
  );
}
