import { useState, useEffect, useRef, useCallback } from "react";
import { api, getUser, cn } from "../utils/api";
import { Card, Avatar, Spinner, Button, EmptyState } from "../components/UI";
import { MessageSquare, Send, Plus, ArrowLeft } from "lucide-react";

export default function Messages() {
  const me = getUser();
  const [convos, setConvos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selUser, setSelUser] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Load conversations
  const loadConvos = useCallback(async () => {
    try {
      const data = await api("/dm/conversations");
      setConvos(data || []);
    } catch (e) { console.error("Load convos:", e); }
  }, []);

  // Load users
  useEffect(() => {
    Promise.all([api("/dm/conversations"), api("/users")])
      .then(([c, u]) => { setConvos(c || []); setUsers(u || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load messages for a user
  async function loadMsgs(userId) {
    setMsgsLoading(true);
    try {
      const data = await api("/dm/" + userId);
      setMsgs(data || []);
    } catch (e) { console.error("Load msgs:", e); setMsgs([]); }
    setMsgsLoading(false);
  }

  // Select a conversation
  function selectUser(userId, name, color) {
    setSelUser({ id: userId, name, color });
    setShowNew(false);
    loadMsgs(userId);
  }

  // Poll for new messages
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selUser) {
      pollRef.current = setInterval(() => {
        api("/dm/" + selUser.id).then(d => setMsgs(d || [])).catch(() => {});
        loadConvos();
      }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selUser, loadConvos]);

  // Scroll to bottom
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [msgs]);

  // Send message
  async function send() {
    if (!text.trim() || !selUser) return;
    setSending(true);
    try {
      await api("/dm/" + selUser.id, { method: "POST", body: JSON.stringify({ text: text.trim() }) });
      setText("");
      // Immediately reload messages and conversations
      const [newMsgs] = await Promise.all([
        api("/dm/" + selUser.id),
        loadConvos(),
      ]);
      setMsgs(newMsgs || []);
    } catch (e) { alert("Failed to send: " + e.message); }
    setSending(false);
  }

  if (loading) return <Spinner />;

  const otherUsers = users.filter(u => u.id !== me?.id);

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Left: Conversation List */}
      <div className={cn("w-72 flex-shrink-0 flex flex-col", selUser ? "hidden lg:flex" : "flex")}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-zinc-100">Messages</h1>
          <button onClick={() => setShowNew(!showNew)} className="p-2 rounded-lg bg-brand-400/10 text-brand-400 hover:bg-brand-400/20">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* New chat picker */}
        {showNew && (
          <div className="mb-3 space-y-1 max-h-48 overflow-y-auto bg-zinc-900/50 rounded-xl p-2">
            <p className="text-[10px] text-zinc-600 px-2 mb-1">Start new conversation:</p>
            {otherUsers.map(u => (
              <button key={u.id} onClick={() => selectUser(u.id, u.name, u.color)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/50 text-left">
                <Avatar name={u.name} color={u.color} size="sm" />{u.name}
              </button>
            ))}
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {convos.length === 0 && !showNew ? (
            <EmptyState icon={MessageSquare} title="No conversations" sub="Press + to start one" />
          ) : convos.map(c => (
            <button key={c.partner_id} onClick={() => selectUser(c.partner_id, c.partner_name, c.partner_color)}
              className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors",
                selUser?.id === c.partner_id ? "bg-brand-400/10" : "hover:bg-zinc-800/50")}>
              <Avatar name={c.partner_name} color={c.partner_color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className={cn("text-sm font-medium truncate", selUser?.id === c.partner_id ? "text-brand-400" : "text-zinc-200")}>{c.partner_name}</p>
                  {parseInt(c.unread_count) > 0 && (
                    <span className="bg-brand-400 text-zinc-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{c.unread_count}</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {c.last_sender_id === me?.id ? "You: " : ""}{c.last_message}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Chat View */}
      <div className={cn("flex-1 flex flex-col", !selUser ? "hidden lg:flex" : "flex")}>
        {selUser ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/50 mb-3">
              <button onClick={() => { setSelUser(null); loadConvos(); }} className="lg:hidden p-1 text-zinc-400 hover:text-zinc-200">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar name={selUser.name} color={selUser.color} />
              <p className="font-semibold text-zinc-100">{selUser.name}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {msgsLoading ? <Spinner /> : msgs.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 text-sm">No messages yet. Say hello!</div>
              ) : msgs.map(m => (
                <div key={m.id} className={cn("flex", m.sender_id === me?.id ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] px-3.5 py-2 rounded-2xl text-sm",
                    m.sender_id === me?.id
                      ? "bg-brand-400 text-zinc-900 rounded-br-sm"
                      : "bg-zinc-800 text-zinc-200 rounded-bl-sm")}>
                    <p>{m.text}</p>
                    <p className={cn("text-[10px] mt-1", m.sender_id === me?.id ? "text-zinc-900/50" : "text-zinc-500")}>
                      {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 pt-2 border-t border-zinc-800/50">
              <input value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" />
              <button onClick={send} disabled={sending || !text.trim()}
                className="px-4 py-2.5 bg-brand-400 hover:bg-brand-500 rounded-xl transition-colors disabled:opacity-40">
                <Send className="w-4 h-4 text-zinc-900" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center"><MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500">Select a conversation or start a new one</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
