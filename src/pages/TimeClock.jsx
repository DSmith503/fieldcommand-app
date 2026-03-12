import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { api, isAdmin, fmtDate, fmtTime, fmtMoney, cn } from "../utils/api";
import { Card, Avatar, Spinner, PageHeader, Button, Select, EmptyState } from "../components/UI";
import { Clock, Play, Square, Timer, ArrowRight } from "lucide-react";

export default function TimeClock() {
  const { data: dayStatus, loading: dsLoading, reload: reloadDay } = useApi("/time/day-status");
  const { data: activeEntry, reload: reloadEntry } = useApi("/time/active-entry");
  const { data: dayLogs, loading: dlLoading, reload: reloadLogs } = useApi("/time/day-logs");
  const { data: entries, reload: reloadEntries } = useApi("/time/entries");
  const { data: projects } = useApi("/projects");
  const { data: serviceCalls } = useApi("/service-calls");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [selProject, setSelProject] = useState("");
  const [selSC, setSelSC] = useState("");
  const [entryType, setEntryType] = useState("project");
  const [tab, setTab] = useState("clock");
  const [elapsed, setElapsed] = useState("");

  const isClockedIn = dayStatus?.clocked_in;
  const hasActiveEntry = activeEntry?.active;

  // Live elapsed timer
  useEffect(() => {
    let interval;
    if (isClockedIn && dayStatus?.entry?.clock_in) {
      interval = setInterval(() => {
        const diff = Date.now() - new Date(dayStatus.entry.clock_in).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setElapsed(`${h}h ${m}m ${s}s`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, dayStatus]);

  async function dayClockIn() {
    setBusy(true); setErr("");
    try { await api("/time/day-clock-in", { method: "POST" }); reloadDay(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function dayClockOut() {
    setBusy(true); setErr("");
    try { await api("/time/day-clock-out", { method: "POST" }); reloadDay(); reloadEntry(); reloadLogs(); reloadEntries(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function startEntry() {
    const pid = entryType === "project" ? selProject : null;
    const scid = entryType === "service_call" ? selSC : null;
    if (!pid && !scid) { setErr("Select a " + (entryType === "project" ? "project" : "service call")); return; }
    setBusy(true); setErr("");
    try { await api("/time/start-entry", { method: "POST", body: JSON.stringify({ project_id: pid, service_call_id: scid }) }); reloadEntry(); reloadEntries(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function stopEntry() {
    setBusy(true); setErr("");
    try { await api("/time/stop-entry", { method: "POST", body: JSON.stringify({}) }); reloadEntry(); reloadEntries(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  if (dsLoading || dlLoading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Time Clock" />

      <div className="flex gap-2 mb-4">
        {["clock", "history"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("text-xs px-3 py-1.5 rounded-lg transition-colors capitalize", tab === t ? "bg-brand-400/10 text-brand-400" : "text-zinc-500 hover:text-zinc-300")}>{t === "clock" ? "Clock In/Out" : "History"}</button>
        ))}
      </div>

      {tab === "clock" && (
        <div className="space-y-4">
          {/* Day Clock */}
          <Card className="p-5">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Day Clock</h3>
            {isClockedIn ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm text-emerald-400 font-medium">Clocked In</span>
                </div>
                <p className="text-3xl font-bold text-zinc-100 tabular-nums mb-1">{elapsed}</p>
                <p className="text-xs text-zinc-500 mb-4">Since {fmtTime(dayStatus.entry.clock_in)}</p>
                <Button onClick={dayClockOut} disabled={busy} variant="danger" className="flex items-center gap-2">
                  <Square className="w-4 h-4" /> {busy ? "Clocking out..." : "Clock Out for Day"}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-zinc-400 mb-3">You are not clocked in.</p>
                <Button onClick={dayClockIn} disabled={busy} className="flex items-center gap-2">
                  <Play className="w-4 h-4" /> {busy ? "Clocking in..." : "Clock In for Day"}
                </Button>
              </div>
            )}
            {err && <p className="text-red-400 text-xs mt-2">{err}</p>}
          </Card>

          {/* Project/SC Time Tracking */}
          {isClockedIn && (
            <Card className="p-5">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Project Time Tracking</h3>

              {hasActiveEntry ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-sm text-blue-400 font-medium">
                      Tracking: {activeEntry.entry.project_address || activeEntry.entry.service_call_description || "Unknown"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">Started {fmtTime(activeEntry.entry.start_time)}</p>
                  <div className="flex gap-2">
                    <Button onClick={stopEntry} disabled={busy} variant="secondary" className="flex items-center gap-2">
                      <Square className="w-4 h-4" /> Stop Tracking
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEntryType("project")}
                      className={cn("text-xs px-3 py-1.5 rounded-lg", entryType === "project" ? "bg-blue-950/60 text-blue-400" : "text-zinc-500 bg-zinc-800/50")}>
                      Project
                    </button>
                    <button onClick={() => setEntryType("service_call")}
                      className={cn("text-xs px-3 py-1.5 rounded-lg", entryType === "service_call" ? "bg-orange-950/60 text-orange-400" : "text-zinc-500 bg-zinc-800/50")}>
                      Service Call
                    </button>
                  </div>

                  {entryType === "project" ? (
                    <Select value={selProject} onChange={e => setSelProject(e.target.value)}>
                      <option value="">Select a project...</option>
                      {(projects || []).map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                    </Select>
                  ) : (
                    <Select value={selSC} onChange={e => setSelSC(e.target.value)}>
                      <option value="">Select a service call...</option>
                      {(serviceCalls || []).filter(s => ["open", "scheduled", "in-progress"].includes(s.status)).map(s => (
                        <option key={s.id} value={s.id}>{s.description.substring(0, 60)}{s.address ? " - " + s.address : ""}</option>
                      ))}
                    </Select>
                  )}

                  <Button onClick={startEntry} disabled={busy} variant="secondary" className="flex items-center gap-2">
                    <Timer className="w-4 h-4" /> {busy ? "Starting..." : "Start Tracking"}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Today's Entries */}
          {(entries || []).filter(e => e.date === new Date().toISOString().split("T")[0]).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Today's Time Entries</h3>
              <div className="space-y-1.5">
                {(entries || []).filter(e => e.date === new Date().toISOString().split("T")[0]).map(e => (
                  <Card key={e.id} className="px-4 py-3 flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", e.entry_type === "service_call" ? "bg-orange-400" : "bg-blue-400")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-200">{e.project_address || e.service_call_description || "Unknown"}</p>
                      <p className="text-[11px] text-zinc-600">{fmtTime(e.start_time)}{e.end_time ? " - " + fmtTime(e.end_time) : " - ongoing"}</p>
                    </div>
                    <span className="text-sm font-semibold text-zinc-300 tabular-nums">{e.hours ? e.hours + "h" : "..."}</span>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Day Clock History</h3>
            {!dayLogs?.length ? <EmptyState icon={Clock} title="No day clock history" /> : (
              <div className="space-y-1.5">
                {dayLogs.map(l => (
                  <Card key={l.id} className="px-4 py-3 flex items-center gap-3">
                    <Avatar name={l.user_name} color={l.user_color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200">{l.user_name}</p>
                      <p className="text-[11px] text-zinc-500">{fmtDate(l.date)} &middot; {fmtTime(l.clock_in)}{l.clock_out ? " - " + fmtTime(l.clock_out) : " - active"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-zinc-100 tabular-nums">{l.total_hours ? l.total_hours + "h" : "..."}</p>
                      <p className="text-xs text-zinc-500 tabular-nums">{fmtMoney(Number(l.total_hours || 0) * Number(l.hourly_rate || 0))}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Project Time Entries</h3>
            {!entries?.length ? <EmptyState icon={Timer} title="No time entries" /> : (
              <div className="space-y-1.5">
                {entries.map(e => (
                  <Card key={e.id} className="px-4 py-3 flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", e.entry_type === "service_call" ? "bg-orange-400" : "bg-blue-400")} />
                    <Avatar name={e.user_name} color={e.user_color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-200">{e.project_address || e.service_call_description || "Unknown"}</p>
                      <p className="text-[11px] text-zinc-500">{e.user_name} &middot; {fmtDate(e.date)} &middot; {fmtTime(e.start_time)}{e.end_time ? " - " + fmtTime(e.end_time) : ""}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-zinc-100 tabular-nums">{e.hours ? e.hours + "h" : "..."}</p>
                      <p className="text-xs text-zinc-500 tabular-nums">{fmtMoney(Number(e.hours || 0) * Number(e.hourly_rate || 0))}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
