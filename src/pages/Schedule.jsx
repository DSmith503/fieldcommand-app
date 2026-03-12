import { useApi } from "../hooks/useApi";
import { cn, fmtDate } from "../utils/api";
import { Card, Badge, Avatar, Spinner, PageHeader, EmptyState } from "../components/UI";
import { Calendar, Wrench } from "lucide-react";

export default function Schedule() {
  const { data: events, loading: eventsLoading } = useApi("/schedule");
  const { data: serviceCalls, loading: scLoading } = useApi("/service-calls");

  if (eventsLoading || scLoading) return <Spinner />;

  // Merge scheduled events and service calls into one calendar
  const items = [];

  (events || []).forEach(e => {
    items.push({
      id: "evt-" + e.id,
      type: "event",
      date: e.date,
      time: e.start_time,
      eventType: e.event_type,
      userName: e.user_name,
      userColor: e.user_color,
      description: e.description,
      shift: e.shift,
      project: e.project,
      completed: e.completed,
    });
  });

  (serviceCalls || []).forEach(sc => {
    if (sc.scheduled_date) {
      items.push({
        id: "sc-" + sc.id,
        type: "service_call",
        date: sc.scheduled_date,
        time: sc.scheduled_time,
        priority: sc.priority,
        status: sc.status,
        userName: sc.assigned_name,
        userColor: sc.assigned_color,
        description: sc.description,
        address: sc.address || sc.project_address,
        clientName: sc.client_name,
      });
    }
  });

  if (!items.length) return <><PageHeader title="Schedule" /><EmptyState icon={Calendar} title="No scheduled events or service calls" /></>;

  // Group by date
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });
  const dates = Object.keys(grouped).sort();

  return (
    <div>
      <PageHeader title="Schedule" subtitle={items.length + " items"} />
      {dates.map(date => (
        <div key={date} className="mb-6">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <div className="space-y-2">
            {grouped[date].map(item => (
              item.type === "event" ? (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={item.userName} color={item.userColor} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-100">{item.userName}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full uppercase font-semibold",
                            item.eventType === "install" ? "bg-blue-950/60 text-blue-400" :
                            item.eventType === "meeting" ? "bg-purple-950/60 text-purple-400" :
                            "bg-zinc-800 text-zinc-400")}>{item.eventType}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{item.shift || item.time}</p>
                        {item.description && <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>}
                        {item.project && <p className="text-xs text-zinc-600 mt-0.5">{item.project.address}</p>}
                      </div>
                    </div>
                    {item.completed && <span className="text-xs text-emerald-400">Done</span>}
                  </div>
                </Card>
              ) : (
                <Card key={item.id} className="p-4 border-l-2 border-l-orange-500/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-950/40 flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full uppercase font-semibold bg-orange-950/60 text-orange-400">Service Call</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full uppercase font-semibold",
                            item.priority === "urgent" ? "bg-red-950/60 text-red-400" :
                            item.priority === "low" ? "bg-zinc-800 text-zinc-400" :
                            "bg-amber-950/60 text-amber-400")}>{item.priority}</span>
                        </div>
                        <p className="text-sm text-zinc-200 mt-1">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-600">
                          {item.userName && <span>{item.userName}</span>}
                          {item.time && <span>{item.time}</span>}
                          {item.address && <span>{item.address}</span>}
                          {item.clientName && <span>{item.clientName}</span>}
                        </div>
                      </div>
                    </div>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full uppercase font-semibold",
                      item.status === "resolved" ? "bg-emerald-950/60 text-emerald-400" :
                      item.status === "in-progress" ? "bg-amber-950/60 text-amber-400" :
                      "bg-zinc-800 text-zinc-400")}>{item.status}</span>
                  </div>
                </Card>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
