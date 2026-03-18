import { useState, useEffect, useRef, useCallback } from "react";
import { api, getUser, cn } from "../utils/api";
import { useApi } from "../hooks/useApi";
import { Card, Avatar, Spinner, EmptyState, Badge, Modal, Input, Button, useToast } from "../components/UI";
import { MessageSquare, Send, Plus, ArrowLeft, Users, User, Hash } from "lucide-react";

export default function Messages() {
  const me = getUser();
  const toast = useToast();
  const { data: users } = useApi("/users");
  const { data: projects } = useApi("/projects");
  const [mode, setMode] = useState("dm");
  const [convos, setConvos] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null); // { type: 'dm'|'project'|'group', id, name, color }
  const [msgs, setMsgs] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const endRef = useRef(null);
  const pollRef = useRef(null);

  const loadConvos = useCallback(async () => {
    try { const [c, g] = await Promise.all([api("/dm/conversations"), api("/group-chats")]); setConvos(c || []); setGroups(g || []); } catch { }
  }, []);
  useEffect(() => { loadConvos().finally(() => setLoading(false)); }, [loadConvos]);

  async function loadMsgs() {
    if (!sel) return; setMsgsLoading(true);
    try {
      if (sel.type === "dm") setMsgs(await api("/dm/" + sel.id) || []);
      else if (sel.type === "project") setMsgs(await api("/messages/" + sel.id) || []);
      else if (sel.type === "group") setMsgs(await api("/group-chats/" + sel.id + "/messages") || []);
    } catch { setMsgs([]); }
    setMsgsLoading(false);
  }
  useEffect(() => { if (sel) loadMsgs(); }, [sel?.id, sel?.type]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (sel) { pollRef.current = setInterval(() => { loadMsgs(); loadConvos(); }, 5000); }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sel?.id, sel?.type]);
  useEffect(() => { setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }, [msgs]);

  async function send() {
    if (!text.trim() || !sel) return; setSending(true);
    try {
      if (sel.type === "dm") await api("/dm/" + sel.id, { method: "POST", body: JSON.stringify({ text: text.trim() }) });
      else if (sel.type === "project") await api("/messages", { method: "POST", body: JSON.stringify({ project_id: sel.id, text: text.trim() }) });
      else if (sel.type === "group") await api("/group-chats/" + sel.id + "/messages", { method: "POST", body: JSON.stringify({ text: text.trim() }) });
      setText(""); loadMsgs(); loadConvos();
    } catch (e) { alert(e.message); }
    setSending(false);
  }

  async function createGroup() {
    if (!groupName.trim() || groupMembers.length === 0) { toast("Name and at least one member required", "error"); return; }
    try {
      await api("/group-chats", { method: "POST", body: JSON.stringify({ name: groupName, member_ids: groupMembers }) });
      setShowCreateGroup(false); setGroupName(""); setGroupMembers([]); loadConvos(); toast("Group created!");
    } catch (e) { toast(e.message, "error"); }
  }

  if (loading) return <Spinner />;
  const otherUsers = (users || []).filter(u => u.id !== me?.id);

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Left Panel */}
      <div className={cn("w-72 flex-shrink-0 flex flex-col", sel ? "hidden lg:flex" : "flex")}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Messenger</h1>
          <button onClick={() => setShowNew(!showNew)} className="p-2 rounded-xl bg-brand-400/10 text-brand-400 hover:bg-brand-400/20"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-1 mb-3 bg-white/[0.025] rounded-xl p-0.5">
          {[{id:"dm",icon:User,label:"Direct"},{id:"group",icon:Hash,label:"Groups"},{id:"project",icon:Users,label:"Projects"}].map(m =>
            <button key={m.id} onClick={() => setMode(m.id)} className={cn("flex-1 text-xs py-1.5 rounded-lg font-medium flex items-center justify-center gap-1", mode === m.id ? "bg-brand-400/10 text-brand-400" : "text-zinc-500")}><m.icon className="w-3.5 h-3.5" />{m.label}</button>
          )}
        </div>

        {showNew && mode === "dm" && <div className="mb-3 space-y-1 max-h-48 overflow-y-auto bg-white/[0.025] rounded-2xl p-2">
          {otherUsers.map(u => <button key={u.id} onClick={() => { setSel({ type: "dm", id: u.id, name: u.name, color: u.color }); setShowNew(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.04] text-left"><Avatar name={u.name} color={u.color} size="sm" />{u.name}</button>)}
        </div>}
        {showNew && mode === "group" && <div className="mb-3"><Button onClick={() => { setShowCreateGroup(true); setShowNew(false); }} className="w-full text-sm">Create New Group</Button></div>}

        <div className="flex-1 overflow-y-auto space-y-1">
          {mode === "dm" && (convos.length ? convos.map(c => <button key={c.partner_id} onClick={() => setSel({ type: "dm", id: c.partner_id, name: c.partner_name, color: c.partner_color })} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors", sel?.type === "dm" && sel?.id === c.partner_id ? "bg-brand-400/10" : "hover:bg-white/[0.04]")}>
            <Avatar name={c.partner_name} color={c.partner_color} /><div className="min-w-0 flex-1"><p className={cn("text-sm font-medium truncate", sel?.type === "dm" && sel?.id === c.partner_id ? "text-brand-400" : "text-zinc-200")}>{c.partner_name}</p><p className="text-xs text-zinc-500 truncate">{c.last_sender_id === me?.id ? "You: " : ""}{c.last_message}</p></div>
            {parseInt(c.unread_count) > 0 && <span className="bg-brand-400 text-zinc-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{c.unread_count}</span>}
          </button>) : <EmptyState icon={MessageSquare} title="No conversations" sub="Press + to start" />)}

          {mode === "group" && (groups.length ? groups.map(g => <button key={g.id} onClick={() => setSel({ type: "group", id: g.id, name: g.name, members: g.members })} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors", sel?.type === "group" && sel?.id === g.id ? "bg-brand-400/10" : "hover:bg-white/[0.04]")}>
            <div className="w-8 h-8 rounded-xl bg-brand-400/20 flex items-center justify-center"><Hash className="w-4 h-4 text-brand-400" /></div>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{g.name}</p><p className="text-xs text-zinc-500 truncate">{g.members?.map(m => m.name.split(" ")[0]).join(", ")}</p></div>
          </button>) : <EmptyState icon={Hash} title="No groups" sub="Create one with +" />)}

          {mode === "project" && ((projects || []).map(p => <button key={p.id} onClick={() => setSel({ type: "project", id: p.id, name: p.address })} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors", sel?.type === "project" && sel?.id === p.id ? "bg-brand-400/10" : "hover:bg-white/[0.04]")}>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center"><Users className="w-4 h-4 text-purple-400" /></div>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{p.address}</p><p className="text-xs text-zinc-500">{p.client_name || ""}</p></div>
          </button>))}
        </div>
      </div>

      {/* Chat View */}
      <div className={cn("flex-1 flex flex-col", !sel ? "hidden lg:flex" : "flex")}>
        {sel ? <>
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06] mb-3">
            <button onClick={() => setSel(null)} className="lg:hidden p-1 text-zinc-400"><ArrowLeft className="w-5 h-5" /></button>
            {sel.type === "dm" ? <Avatar name={sel.name} color={sel.color} /> : <div className="w-8 h-8 rounded-xl bg-brand-400/20 flex items-center justify-center">{sel.type === "group" ? <Hash className="w-4 h-4 text-brand-400" /> : <Users className="w-4 h-4 text-purple-400" />}</div>}
            <div><p className="font-semibold">{sel.name}</p>{sel.members && <p className="text-xs text-zinc-500">{sel.members.map(m => m.name.split(" ")[0]).join(", ")}</p>}</div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {msgsLoading ? <Spinner /> : msgs.length === 0 ? <div className="text-center py-12 text-zinc-600 text-sm">No messages yet</div> :
            msgs.map(m => {
              const isMe = (m.sender_id || m.user_id) === me?.id;
              return <div key={m.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "")}>
                {!isMe && <Avatar name={m.sender_name || m.user_name || "?"} color={m.sender_color || m.user_color} size="sm" />}
                <div className={cn("max-w-[75%] px-3.5 py-2 rounded-2xl text-sm", isMe ? "bg-brand-400 text-white rounded-br-sm" : "bg-white/[0.04] text-zinc-200 rounded-bl-sm border border-white/[0.06]")}>
                  {!isMe && sel.type !== "dm" && <p className="text-[10px] font-semibold mb-0.5" style={{ color: m.sender_color || m.user_color || "#CBA135" }}>{m.sender_name || m.user_name}</p>}
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
        </> : <div className="flex-1 flex items-center justify-center"><div className="text-center"><MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500">Select a conversation</p></div></div>}
      </div>

      {/* Create Group Modal */}
      <Modal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} title="Create Group Chat">
        <div className="space-y-3">
          <Input label="Group Name *" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Installers, Morning Crew" />
          <div><label className="text-xs font-medium text-zinc-400 mb-2 block">Members</label>
            <div className="flex flex-wrap gap-2">{otherUsers.map(u => {
              const active = groupMembers.includes(u.id);
              return <button key={u.id} type="button" onClick={() => setGroupMembers(active ? groupMembers.filter(x => x !== u.id) : [...groupMembers, u.id])} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs border transition-colors", active ? "border-brand-400 bg-brand-400/10 text-brand-400" : "border-white/[0.06] text-zinc-400")}>
                <Avatar name={u.name} color={u.color} size="sm" />{u.name.split(" ")[0]}
              </button>;
            })}</div>
          </div>
          <Button onClick={createGroup}>Create Group</Button>
        </div>
      </Modal>
    </div>
  );
}
