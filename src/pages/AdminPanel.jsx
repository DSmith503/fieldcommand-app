import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { api, fmtMoney, fmtDate, cn } from '../utils/api';
import { Card, Badge, Avatar, Spinner, PageHeader, Button, Modal, Input, Select, Tabs, useToast } from '../components/UI';
import { UserCog, Plus, Trash2, BarChart3, Phone, Mail, MapPin, RefreshCw } from 'lucide-react';

const VENDORS = [
  {c:"Lighting",n:"Lutron",p:"(800) 523-9466",e:"support@lutron.com"},
  {c:"Automation",n:"Control4",p:"(888) 400-4070",e:"support@control4.com"},
  {c:"Automation",n:"Savant",p:"(877) 728-2685",e:"support@savant.com"},
  {c:"Automation",n:"Crestron",p:"(800) 237-2041",e:"support@crestron.com"},
  {c:"Networking",n:"Ubiquiti",p:"(408) 942-3085",e:"support via ui.com"},
  {c:"Audio",n:"Sonos",p:"(800) 680-2345",e:"support@sonos.com"},
  {c:"Audio",n:"Sonance",p:"(949) 492-7777",e:"techsupport@sonance.com"},
  {c:"Video",n:"Sony Pro",p:"(866) 769-7669",e:"prosupport@sony.com"},
];

function LiveMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS and JS
  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    js.onload = () => setLeafletLoaded(true);
    document.head.appendChild(js);
  }, []);

  async function loadLocations() {
    setLoading(true);
    try { const data = await api('/location/team'); setLocations(data || []); }
    catch { setLocations([]); }
    setLoading(false);
  }

  useEffect(() => { loadLocations(); const iv = setInterval(loadLocations, 30000); return () => clearInterval(iv); }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !window.L) return;
    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current, { zoomControl: true }).setView([32.78, -96.80], 10); // Dallas default
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '',
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    // Clear old markers
    markersRef.current.forEach(m => mapInstance.current.removeLayer(m));
    markersRef.current = [];

    if (locations.length > 0) {
      const bounds = [];
      locations.forEach(loc => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        bounds.push([lat, lng]);

        const icon = window.L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${loc.user_color || '#CBA135'};border:3px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#000;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${(loc.user_name || '?').split(' ').map(n => n[0]).join('')}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = window.L.marker([lat, lng], { icon }).addTo(mapInstance.current);
        const ago = Math.round((Date.now() - new Date(loc.updated_at || loc.created_at).getTime()) / 60000);
        marker.bindPopup(`<div style="font-family:system-ui;min-width:150px"><b style="font-size:14px">${loc.user_name}</b><br><span style="color:#888;font-size:12px">${loc.user_role}</span><br><span style="color:#666;font-size:11px">${ago < 1 ? 'Just now' : ago + ' min ago'}</span>${loc.clocked_in_at ? '<br><span style="color:#34D399;font-size:11px">Clocked in</span>' : ''}</div>`);
        markersRef.current.push(marker);
      });

      if (bounds.length > 0) {
        mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [locations, leafletLoaded]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-400" />
          <p className="font-bold">Live Team Locations</p>
          <span className="text-xs text-zinc-500">{locations.length} active</span>
        </div>
        <button onClick={loadLocations} disabled={loading} className="p-2 rounded-xl hover:bg-white/[0.04] text-zinc-400">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {locations.length === 0 && !loading && (
        <Card className="p-6 text-center mb-4">
          <MapPin className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">No active locations</p>
          <p className="text-zinc-600 text-xs mt-1">Techs share their location automatically when clocked in</p>
        </Card>
      )}

      <div ref={mapRef} style={{ height: 450, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0c' }} />

      {/* Location list */}
      {locations.length > 0 && <div className="mt-3 space-y-1.5">
        {locations.map(loc => {
          const ago = Math.round((Date.now() - new Date(loc.updated_at || loc.created_at).getTime()) / 60000);
          return <Card key={loc.id} className="p-3 flex items-center gap-3">
            <Avatar name={loc.user_name} color={loc.user_color} size="sm" />
            <div className="flex-1">
              <p className="text-sm font-medium">{loc.user_name}</p>
              <p className="text-[10px] text-zinc-500">{ago < 1 ? 'Just now' : ago + ' min ago'} · {parseFloat(loc.latitude).toFixed(4)}, {parseFloat(loc.longitude).toFixed(4)}</p>
            </div>
            {loc.clocked_in_at && <Badge variant="approved">Clocked In</Badge>}
          </Card>;
        })}
      </div>}
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const { data: users, loading: uLoad, reload: rUsers } = useApi('/users');
  const { data: projects } = useApi('/projects');
  const [activityData, setActivityData] = useState([]);
  const [actLoading, setActLoading] = useState(false);
  const [actFilters, setActFilters] = useState({ user_id: '', start_date: '', end_date: '' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'technician', hourly_rate: '', color: '#60A5FA' });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (tab === 'log') {
      setActLoading(true);
      const p = new URLSearchParams({ limit: '200' });
      if (actFilters.user_id) p.set('user_id', actFilters.user_id);
      if (actFilters.start_date) p.set('start_date', actFilters.start_date);
      if (actFilters.end_date) p.set('end_date', actFilters.end_date);
      api('/activity?' + p.toString()).then(setActivityData).catch(console.error).finally(() => setActLoading(false));
    }
  }, [tab, actFilters]);

  async function addUser() {
    if (!newUser.name || !newUser.email || !newUser.password) { toast('Fill in all required fields', 'error'); return; }
    setBusy(true);
    try {
      await api('/users', { method: 'POST', body: JSON.stringify({ ...newUser, hourly_rate: Number(newUser.hourly_rate) || 0 }) });
      setShowAddUser(false); setNewUser({ name: '', email: '', password: '', role: 'technician', hourly_rate: '', color: '#60A5FA' }); rUsers(); toast('User added!');
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  }

  async function deleteUser(id) {
    if (!confirm('Remove this user?')) return;
    try { await api('/users/' + id, { method: 'DELETE' }); rUsers(); toast('User removed'); }
    catch (e) { toast(e.message, 'error'); }
  }

  if (uLoad) return <Spinner />;
  const employees = (users || []).filter(u => u.role !== 'admin');

  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="User management, GPS tracking, activity & performance" />
      <Tabs items={[
        { id: 'users', label: '👤 Users' },
        { id: 'map', label: '📍 Live Map' },
        { id: 'log', label: '📋 Activity Log' },
        { id: 'performance', label: '📊 Performance' },
        { id: 'vendors', label: '🏢 Vendors' },
        { id: 'cloud', label: '☁️ Cloud' },
      ]} active={tab} onChange={setTab} />

      {/* Users */}
      {tab === 'users' && <div>
        <div className="flex justify-end mb-4"><Button onClick={() => setShowAddUser(true)}><Plus className="w-4 h-4" /> Add User</Button></div>
        {(users || []).map(u => (
          <Card key={u.id} className="p-4 mb-2 flex items-center gap-4">
            <Avatar name={u.name} color={u.color} size="lg" />
            <div className="flex-1 min-w-0"><p className="font-semibold">{u.name}</p><p className="text-xs text-zinc-500">{u.email}</p></div>
            <div className="text-right flex-shrink-0 flex items-center gap-3">
              <div><Badge variant={u.role}>{u.role}</Badge>{u.hourly_rate > 0 && <p className="text-xs text-zinc-500 mt-1">{fmtMoney(u.hourly_rate)}/hr</p>}</div>
              <button onClick={() => deleteUser(u.id)} className="text-zinc-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </Card>
        ))}
        <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title="Add Team Member"><div className="space-y-3">
          <Input label="Full Name *" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
          <Input label="Email *" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
          <Input label="Password *" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Role" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}><option value="installer">Installer</option><option value="technician">Technician</option><option value="programmer">Programmer</option><option value="admin">Admin</option></Select>
            <Input label="Hourly Rate" type="number" value={newUser.hourly_rate} onChange={e => setNewUser({ ...newUser, hourly_rate: e.target.value })} />
          </div>
          <Button onClick={addUser} disabled={busy}>{busy ? 'Creating...' : 'Add User'}</Button>
        </div></Modal>
      </div>}

      {/* Live Map */}
      {tab === 'map' && <LiveMap />}

      {/* Activity Log */}
      {tab === 'log' && <div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Select label="User" value={actFilters.user_id} onChange={e => setActFilters({ ...actFilters, user_id: e.target.value })}><option value="">All</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
          <Input label="From" type="date" value={actFilters.start_date} onChange={e => setActFilters({ ...actFilters, start_date: e.target.value })} />
          <Input label="To" type="date" value={actFilters.end_date} onChange={e => setActFilters({ ...actFilters, end_date: e.target.value })} />
        </div>
        {actLoading ? <Spinner /> : (activityData || []).map(l => (
          <Card key={l.id} className="px-4 py-3 mb-1.5">
            <p className="text-sm text-zinc-300">{l.description}</p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-600">
              {l.user_color && <span className="w-2 h-2 rounded-full" style={{ background: l.user_color }} />}
              <span>{l.user_name}</span><span>·</span><span>{new Date(l.created_at).toLocaleString()}</span>
            </div>
          </Card>
        ))}
        {!actLoading && !activityData?.length && <p className="text-center text-zinc-500 py-12">No activity</p>}
      </div>}

      {/* Performance */}
      {tab === 'performance' && <div>
        <Card className="p-5 mb-4">
          <div className="flex items-center gap-3 mb-4"><BarChart3 className="w-5 h-5 text-brand-400" /><p className="font-bold">Team Performance</p></div>
          {employees.length === 0 ? <p className="text-zinc-500 text-sm">No employees</p> : employees.map(u => (
            <Card key={u.id} className="p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={u.name} color={u.color} /><div className="flex-1"><p className="font-semibold">{u.name}</p><Badge variant={u.role}>{u.role}</Badge></div>
                <div className="text-right"><p className="text-lg font-bold font-mono text-brand-400">0h</p><p className="text-[10px] text-zinc-500">{fmtMoney(u.hourly_rate)}/hr</p></div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/[0.025] rounded-xl py-2"><p className="text-base font-bold font-mono">0</p><p className="text-[10px] text-zinc-500">Sessions</p></div>
                <div className="bg-white/[0.025] rounded-xl py-2"><p className="text-base font-bold font-mono">0h</p><p className="text-[10px] text-zinc-500">Avg/Day</p></div>
                <div className="bg-white/[0.025] rounded-xl py-2"><p className="text-base font-bold font-mono">$0</p><p className="text-[10px] text-zinc-500">Labor Cost</p></div>
              </div>
            </Card>
          ))}
        </Card>
      </div>}

      {/* Vendors */}
      {tab === 'vendors' && <Card className="p-5">
        <p className="font-bold mb-3">Vendor Directory ({VENDORS.length})</p>
        <div className="space-y-2">{VENDORS.map((v, i) => <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
          <div><p className="text-sm font-medium">{v.n}</p><p className="text-[11px] text-zinc-600">{v.c}</p></div>
          <div className="flex gap-3"><a href={"tel:" + v.p.replace(/[^\d]/g, '')} className="text-zinc-400 hover:text-brand-400"><Phone className="w-3.5 h-3.5" /></a><a href={"mailto:" + v.e} className="text-zinc-400 hover:text-blue-400"><Mail className="w-3.5 h-3.5" /></a></div>
        </div>)}</div>
        <p className="text-xs text-zinc-600 mt-3">Full directory on the Vendor Support page</p>
      </Card>}

      {/* Cloud */}
      {tab === 'cloud' && <div className="space-y-3">
        {[{ name: "Google Drive", icon: "📁", desc: "Sync files" }, { name: "Dropbox", icon: "📦", desc: "Cloud storage" }, { name: "Google Sheets", icon: "📊", desc: "Spreadsheets" }, { name: "QuickBooks", icon: "💰", desc: "Accounting" }].map(ci => (
          <Card key={ci.name} className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3"><span className="text-2xl">{ci.icon}</span><div><p className="font-semibold">{ci.name}</p><p className="text-xs text-zinc-500">{ci.desc}</p></div></div>
            <Button variant="secondary" onClick={() => toast && toast(ci.name + ' requires setup.', 'info')}>Connect</Button>
          </Card>
        ))}
      </div>}
    </div>
  );
}
