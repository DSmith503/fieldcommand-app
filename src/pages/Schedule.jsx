import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { cn } from "../utils/api";
import { Card, Badge, Avatar, Spinner, Modal } from "../components/UI";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function Schedule() {
  const { data: events, loading: el } = useApi("/schedule");
  const { data: serviceCalls, loading: sl } = useApi("/service-calls");
  const [view, setView] = useState("month");
  const [cur, setCur] = useState(new Date());
  const [sel, setSel] = useState(null);

  if (el || sl) return <Spinner />;

  const items = [];
  (events || []).forEach(e => items.push({ id: "e-" + e.id, type: "event", date: e.date, time: e.start_time || e.shift, eventType: e.event_type, userName: e.user_name, userColor: e.user_color, description: e.description, shift: e.shift, project: e.project, completed: e.completed }));
  (serviceCalls || []).forEach(sc => {
    if (sc.scheduled_date) {
      items.push({ id: "sc-" + sc.id, type: "sc", date: sc.scheduled_date, time: sc.scheduled_time, priority: sc.priority, status: sc.status, userName: sc.assigned_name, userColor: sc.assigned_color, description: sc.description, address: sc.address || sc.project_address, clientName: sc.client_name });
    }
  });

  const gr = {};
  items.forEach(i => { if (!gr[i.date]) gr[i.date] = []; gr[i.date].push(i); });

  const y = cur.getFullYear(), m = cur.getMonth();
  const fd = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];
  const mName = cur.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells = [];
  const pdm = new Date(y, m, 0).getDate();
  for (let i = fd - 1; i >= 0; i--) { const d = new Date(y, m - 1, pdm - i); cells.push({ dt: d.toISOString().split("T")[0], day: pdm - i, cur: false }); }
  for (let i = 1; i <= dim; i++) { const d = new Date(y, m, i); cells.push({ dt: d.toISOString().split("T")[0], day: i, cur: true }); }
  const rem = 42 - cells.length;
  for (let i = 1; i <= rem; i++) { const d = new Date(y, m + 1, i); cells.push({ dt: d.toISOString().split("T")[0], day: i, cur: false }); }

  const ec = (it) => it.type === "sc" ? { bg: "bg-orange-900/40", tx: "text-orange-300", bl: "border-l-orange-500" } : it.eventType === "meeting" ? { bg: "bg-purple-900/40", tx: "text-purple-300", bl: "border-l-purple-500" } : { bg: "bg-blue-900/40", tx: "text-blue-300", bl: "border-l-blue-500" };
  const listDates = Object.keys(gr).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => setCur(new Date())} className="text-xs px-3 py-1.5 rounded-lg bg-brand-400/10 text-brand-400 hover:bg-brand-400/20">Today</button>
          <button onClick={() => setCur(new Date(y, m - 1, 1))} className="p-1.5 rounded-lg hover:bg-zinc-800/50 text-zinc-400"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => setCur(new Date(y, m + 1, 1))} className="p-1.5 rounded-lg hover:bg-zinc-800/50 text-zinc-400"><ChevronRight className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold text-zinc-100">{mName}</h1>
        </div>
        <div className="flex gap-1">
          {["month", "list"].map(v => <button key={v} onClick={() => setView(v)} className={cn("text-xs px-3 py-1.5 rounded-lg capitalize", view === v ? "bg-brand-400/10 text-brand-400" : "text-zinc-500 hover:text-zinc-300")}>{v}</button>)}
        </div>
      </div>

      {view === "month" && (
        <div className="border border-zinc-800/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-zinc-800/50">
            {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => <div key={d} className="text-[10px] font-semibold text-zinc-500 text-center py-2 bg-zinc-900/30">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((c, i) => {
              const di = gr[c.dt] || [];
              const isT = c.dt === today;
              return (
                <div key={i} className={cn("min-h-[100px] border-b border-r border-zinc-800/30 p-1", !c.cur && "bg-zinc-950/50", isT && "bg-brand-400/5")}>
                  <div className="flex justify-between items-center px-1 mb-0.5">
                    <span className={cn("text-xs font-medium", isT ? "text-brand-400 font-bold" : c.cur ? "text-zinc-400" : "text-zinc-700")}>{c.day}</span>
                    {di.length > 0 && <span className="text-[9px] text-zinc-600">{di.length}</span>}
                  </div>
                  <div className="space-y-0.5">
                    {di.slice(0, 4).map(it => {
                      const cl = ec(it);
                      return <button key={it.id} onClick={() => setSel(it)} className={cn("w-full text-left text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate hover:opacity-80", cl.bg, cl.tx, cl.bl)}>
                        {it.time && <span className="font-semibold">{String(it.time).replace(/ /g, "")} </span>}
                        {it.type === "sc" ? (it.clientName || it.description?.substring(0, 25)) : (it.userName?.split(" ")[0] + " - " + (it.description || it.shift || "")).substring(0, 30)}
                      </button>;
                    })}
                    {di.length > 4 && <p className="text-[9px] text-zinc-600 px-1">+{di.length - 4} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "list" && (
        <div>
          {!listDates.length ? <div className="text-center py-16"><Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500">No scheduled items</p></div>
          : listDates.map(date => (
            <div key={date} className="mb-6">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h3>
              <div className="space-y-2">
                {gr[date].map(it => (
                  <Card key={it.id} onClick={() => setSel(it)} className={cn("p-4", it.type === "sc" && "border-l-2 border-l-orange-500/50")}>
                    {it.type === "sc" ? <div>
                      <div className="flex gap-2 mb-1"><Badge variant="urgent">Service Call</Badge><Badge variant={it.priority}>{it.priority}</Badge></div>
                      <p className="text-sm text-zinc-200">{it.description}</p>
                      <p className="text-xs text-zinc-500 mt-1">{it.userName || "Unassigned"} {it.time && ". " + it.time} {it.address && ". " + it.address}</p>
                    </div> : <div className="flex items-center gap-2.5">
                      <Avatar name={it.userName} color={it.userColor} size="sm" />
                      <div>
                        <div className="flex items-center gap-2"><span className="text-sm font-medium text-zinc-100">{it.userName}</span><Badge variant={it.eventType === "install" ? "in-progress" : "scheduled"}>{it.eventType}</Badge></div>
                        <p className="text-xs text-zinc-500 mt-0.5">{it.shift || it.time}</p>
                        {it.description && <p className="text-xs text-zinc-500">{it.description}</p>}
                      </div>
                    </div>}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.type === "sc" ? "Service Call" : "Schedule Event"}>
        {sel && sel.type === "sc" ? <div className="space-y-3">
          <div className="flex gap-2"><Badge variant={sel.priority}>{sel.priority}</Badge><Badge variant={sel.status}>{sel.status}</Badge></div>
          <p className="text-sm text-zinc-200">{sel.description}</p>
          <div className="text-xs text-zinc-500 space-y-1">{sel.address && <p>Address: {sel.address}</p>}{sel.clientName && <p>Client: {sel.clientName}</p>}{sel.userName && <p>Assigned: {sel.userName}</p>}{sel.time && <p>Time: {sel.time}</p>}</div>
        </div> : sel ? <div className="space-y-3">
          <div className="flex items-center gap-3"><Avatar name={sel.userName} color={sel.userColor} /><div><p className="font-semibold">{sel.userName}</p><Badge variant={sel.eventType === "install" ? "in-progress" : "scheduled"}>{sel.eventType}</Badge></div></div>
          <div className="text-sm text-zinc-400 space-y-1"><p>Schedule: {sel.shift || sel.time}</p>{sel.description && <p>{sel.description}</p>}{sel.project && <p>Project: {sel.project.address}</p>}</div>
        </div> : null}
      </Modal>
    </div>
  );
}
