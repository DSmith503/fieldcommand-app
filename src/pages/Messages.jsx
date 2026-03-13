import { useState, useEffect, useRef, useCallback } from "react";
import { api, getUser, cn } from "../utils/api";
import { useApi } from "../hooks/useApi";
import { Card, Avatar, Spinner, EmptyState, Badge } from "../components/UI";
import { MessageSquare, Send, Plus, ArrowLeft, Users, User } from "lucide-react";

export default function Messages() {
  const me = getUser();
  const { data: users } = useApi("/users");
  const { data: projects } = useApi("/projects");
  const [mode, setMode] = useState("dm"); // dm or group
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selUser, setSelUser] = useState(null);
  const [selProject, setSelProject] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const endRef = useRef(null);
  const pollRef = useRef(null);

  const loadConvos = useCallback(async () => {
    try { setConvos(await api("/dm/conversations") || []); } catch { }
  }, []);

  useEffect(() => { loadConvos().finally(() => setLoading(false)); }, [loadConvos]);

  async function loadDMs(userId) {
    setMsgsLoading(true);
    try { setMsgs(await api("/dm/" + userId) || []); } catch { setMsgs([]); }
    setMsgsLoading(false);
  }

  async function loadProjectMsgs(projectId) {
    setMsgsLoading(true);
    try { setMsgs(await api("/messages/" + projectId) || []); } catch { setMsgs([]); }
    setMsgsLoading(false);
  }

  function selectDM(userId, name, color) {
    setSelUser({ id: userId, name, color }); setSelProject(null); setShowNew(false); loadDMs(userId);
  }
  function selectGroup(project) {
    setSelProject(project); setSelUser(null); setShowNew(false); loadProjectMsgs(project.id);
  }

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selUser) {
      pollRef.current = setInterval(() => { api("/dm/" + selUser.id).then(d => setMsgs(d || [])).catch(() => {}); loadConvos(); }, 5000);
    } else if (selProject) {
      pollRef.current = setInterval(() => { api("/messages/" + selProject.id).then(d => setMsgs(d || [])).catch(() => {}); }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selUser, selProject, loadConvos]);

  useEffect(() => { setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }, [msgs]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try {
      if (selUser) {
        await api("/dm/" + selUser.id, { method: "POST", body: JSON.stringify({ text: text.trim() }) });
        const [newMsgs] = await Promise.all([api("/dm/" + selUser.id), loadConvos()]);
        setMsgs(newMsgs || []);
      } else if (selProject) {
        await api("/messages", { method: "POST", body: JSON.stringify({ project_id: selProject.id, text: text.trim() }) });
        setMsgs(await api("/messages/" + selProject.id) || []);
      }
      setText("");
    } catch (e) { alert("Failed: " + e.message); }
    setSending(false);
  }

  if (loading) return <Spinner />;
  const otherUsers = (users || []).filter(u => u.id !== me?.id);
  const active = selUser || selProject;
  const activeName = selUser?.name || selProject?.address || "";

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Left Panel */}
      <div className={cn("w-72 flex-shrink-0 flex flex-col", active ? "hidden lg:flex" : "flex")}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Messenger</h1>
          <button onClick={() => setShowNew(!showNew)} className="p-2 rounded-xl bg-brand-400/10 text-brand-400 hover:bg-brand-400/20"><Plus className="w-4 h-4" /></button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 mb-3 bg-white/[0.025] rounded-xl p-0.5">
          <button onClick={() => setMode("dm")} className={cn("flex-1 text-xs py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5", mode === "dm" ? "bg-brand-400/10 text-brand-400" : "text-zinc-500")}>
            <User className="w-3.5 h-3.5" /> Direct
          </button>
          <button onClick={() => setMode("group")} className={cn("flex-1 text-xs py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5", mode === "group" ? "bg-brand-400/10 text-brand-400" : "text-zinc-500")}>
            <Users className="w-3.5 h-3.5" /> Projects
          </button>
        </div>

        {/* New chat picker */}
        {showNew && mode === "dm" && <div className="mb-3 space-y-1 max-h-48 overflow-y-auto bg-white/[0.025] rounded-2xl p-2">
          <p className="text-[10px] text-zinc-600 px-2 mb-1">New conversation:</p>
          {otherUsers.map(u => <button key={u.id} onClick={() => selectDM(u.id, u.name, u.color)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.04] text-left"><Avatar name={u.name} color={u.color} size="sm" />{u.name}</button>)}
        </div>}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {mode === "dm" ? (
            convos.length === 0 && !showNew ? <EmptyState icon={MessageSquare} title="No conversations" sub="Press + to start one" /> :
            convos.map(c => <button key={c.partner_id} onClick={() => selectDM(c.partner_id, c.partner_name, c.partner_color)} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors", selUser?.id === c.partner_id ? "bg-brand-400/10" : "hover:bg-white/[0.04]")}>
              <Avatar name={c.partner_name} color={c.partner_color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between"><p className={cn("text-sm font-medium truncate", selUser?.id === c.partner_id ? "text-brand-400" : "text-zinc-200")}>{c.partner_name}</p>
                  {parseInt(c.unread_count) > 0 && <span className="bg-brand-400 text-zinc-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{c.unread_count}</span>}
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{c.last_sender_id === me?.id ? "You: " : ""}{c.last_message}</p>
              </div>
            </button>)
          ) : (
            (projects || []).length === 0 ? <EmptyState icon={Users} title="No projects" sub="Create a project to start group chat" /> :
            (projects || []).map(p => <button key={p.id} onClick={() => selectGroup(p)} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors", selProject?.id === p.id ? "bg-brand-400/10" : "hover:bg-white/[0.04]")}>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-purple-400" /></div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium truncate", selProject?.id === p.id ? "text-brand-400" : "text-zinc-200")}>{p.address}</p>
                <p className="text-xs text-zinc-500 truncate">{p.client_name || "No client"}</p>
                <div className="flex gap-1 mt-1">{(p.assigned_users || []).slice(0, 4).map(u => <Avatar key={u.id} name={u.name} color={u.color} size="sm" />)}</div>
              </div>
            </button>)
          )}
        </div>
      </div>

      {/* Right: Chat */}
      <div className={cn("flex-1 flex flex-col", !active ? "hidden lg:flex" : "flex")}>
        {active ? <>
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06] mb-3">
            <button onClick={() => { setSelUser(null); setSelProject(null); loadConvos(); }} className="lg:hidden p-1 text-zinc-400"><ArrowLeft className="w-5 h-5" /></button>
            {selUser ? <Avatar name={selUser.name} color={selUser.color} /> : <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center"><Users className="w-4 h-4 text-purple-400" /></div>}
            <div><p className="font-semibold">{activeName}</p>{selProject && <p className="text-xs text-zinc-500">{selProject.client_name} · Group Chat</p>}</div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {msgsLoading ? <Spinner /> : msgs.length === 0 ? <div className="text-center py-12 text-zinc-600 text-sm">No messages yet. Say hello!</div> :
            msgs.map(m => {
              const isMe = (m.sender_id || m.user_id) === me?.id;
              return <div key={m.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "")}>
                {!isMe && <Avatar name={m.sender_name || m.user_name || "?"} color={m.sender_color || m.user_color} size="sm" />}
                <div className={cn("max-w-[75%] px-3.5 py-2 rounded-2xl text-sm", isMe ? "bg-brand-400 text-white rounded-br-sm" : "bg-white/[0.04] text-zinc-200 rounded-bl-sm border border-white/[0.06]")}>
                  {!isMe && selProject && <p className="text-[10px] font-semibold mb-0.5" style={{ color: m.sender_color || m.user_color || '#CBA135' }}>{m.sender_name || m.user_name}</p>}
                  <p>{m.text}</p>
                  <p className={cn("text-[10px] mt-1", isMe ? "text-white/50" : "text-zinc-600")}>{new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                </div>
              </div>;
            })}
            <div ref={endRef} />
          </div>
          <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type a message..." className="flex-1 bg-white/[0.025] border border-white/[0.06] rounded-2xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" />
            <button onClick={send} disabled={sending || !text.trim()} className="px-4 py-2.5 bg-gradient-to-br from-brand-400 to-[#D4AF37] rounded-2xl disabled:opacity-40 shadow-lg shadow-brand-400/20"><Send className="w-4 h-4 text-white" /></button>
          </div>
        </> : <div className="flex-1 flex items-center justify-center"><div className="text-center"><MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500">Select a conversation or start a new one</p></div></div>}
      </div>
    </div>
  );
}
