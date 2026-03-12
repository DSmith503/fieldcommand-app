import { useState, useEffect, useRef } from "react";
import { useApi } from "../hooks/useApi";
import { api, getUser, cn, initials } from "../utils/api";
import { Card, Avatar, Spinner, PageHeader, EmptyState, Button } from "../components/UI";
import { MessageSquare, Send, Plus, ArrowLeft, Search } from "lucide-react";

export default function Messages() {
  const me = getUser();
  const { data: convos, loading: convosLoading, reload: reloadConvos } = useApi("/dm/conversations");
  const { data: users } = useApi("/users");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Load messages for selected conversation
  async function loadMessages(userId) {
    setMsgsLoading(true);
    try {
      const msgs = await api("/dm/" + userId);
      setMessages(msgs);
    } catch (e) { console.error(e); }
    setMsgsLoading(false);
  }

  function selectConvo(userId, userName, userColor) {
    setSelectedUser({ id: userId, name: userName, color: userColor });
    setShowNewChat(false);
    loadMessages(userId);
  }

  // Poll for new messages every 5 seconds when in a conversation
  useEffect(() => {
    if (selectedUser) {
      pollRef.current = setInterval(() => {
        api("/dm/" + selectedUser.id).then(setMessages).catch(() => {});
        reloadConvos();
      }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim() || !selectedUser) return;
    setSending(true);
    try {
      await api("/dm/" + selectedUser.id, { method: "POST", body: JSON.stringify({ text }) });
      setText("");
      await loadMessages(selectedUser.id);
      reloadConvos();
    } catch (e) { alert(e.message); }
    setSending(false);
  }

  function startNewChat(user) {
    selectConvo(user.id, user.name, user.color);
  }

  if (convosLoading) return <Spinner />;

  const otherUsers = (users || []).filter(u => u.id !== me?.id);
  const filteredUsers = otherUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  // Mobile: show either list or chat
  // Desktop: show both side by side
  return (
    <div>
      <div className="lg:hidden">
        {selectedUser ? (
          <ChatView
            me={me}
            selectedUser={selectedUser}
            messages={messages}
            msgsLoading={msgsLoading}
            text={text}
            setText={setText}
            sending={sending}
            sendMessage={sendMessage}
            bottomRef={bottomRef}
            onBack={() => { setSelectedUser(null); reloadConvos(); }}
          />
        ) : (
          <ConvoList
            convos={convos}
            me={me}
            showNewChat={showNewChat}
            setShowNewChat={setShowNewChat}
            filteredUsers={filteredUsers}
            search={search}
            setSearch={setSearch}
            selectConvo={selectConvo}
            startNewChat={startNewChat}
          />
        )}
      </div>

      <div className="hidden lg:flex gap-4 h-[calc(100vh-8rem)]">
        <div className="w-80 flex-shrink-0 flex flex-col">
          <ConvoList
            convos={convos}
            me={me}
            showNewChat={showNewChat}
            setShowNewChat={setShowNewChat}
            filteredUsers={filteredUsers}
            search={search}
            setSearch={setSearch}
            selectConvo={selectConvo}
            startNewChat={startNewChat}
            selectedId={selectedUser?.id}
          />
        </div>
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <ChatView
              me={me}
              selectedUser={selectedUser}
              messages={messages}
              msgsLoading={msgsLoading}
              text={text}
              setText={setText}
              sending={sending}
              sendMessage={sendMessage}
              bottomRef={bottomRef}
              desktop
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Select a conversation or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConvoList({ convos, me, showNewChat, setShowNewChat, filteredUsers, search, setSearch, selectConvo, startNewChat, selectedId }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-zinc-100">Messages</h1>
        <button onClick={() => setShowNewChat(!showNewChat)}
          className="p-2 rounded-lg bg-brand-400/10 text-brand-400 hover:bg-brand-400/20 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showNewChat && (
        <div className="mb-3">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team..."
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg pl-9 pr-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" autoFocus />
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {filteredUsers.map(u => (
              <button key={u.id} onClick={() => startNewChat(u)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors text-left">
                <Avatar name={u.name} color={u.color} size="sm" />
                {u.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1">
        {!convos?.length && !showNewChat ? (
          <EmptyState icon={MessageSquare} title="No conversations yet" sub="Start a new chat with the + button" />
        ) : (
          (convos || []).map(c => (
            <button key={c.partner_id} onClick={() => selectConvo(c.partner_id, c.partner_name, c.partner_color)}
              className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left",
                selectedId === c.partner_id ? "bg-brand-400/10" : "hover:bg-zinc-800/50")}>
              <Avatar name={c.partner_name} color={c.partner_color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className={cn("text-sm font-medium truncate", selectedId === c.partner_id ? "text-brand-400" : "text-zinc-200")}>{c.partner_name}</p>
                  {c.unread_count > 0 && (
                    <span className="bg-brand-400 text-zinc-900 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{c.unread_count}</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {c.last_sender_id === me?.id ? "You: " : ""}{c.last_message}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ChatView({ me, selectedUser, messages, msgsLoading, text, setText, sending, sendMessage, bottomRef, onBack, desktop }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/50 mb-3">
        {onBack && (
          <button onClick={onBack} className="p-1 text-zinc-400 hover:text-zinc-200"><ArrowLeft className="w-5 h-5" /></button>
        )}
        <Avatar name={selectedUser.name} color={selectedUser.color} />
        <p className="font-semibold text-zinc-100">{selectedUser.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-2">
        {msgsLoading ? <Spinner /> : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.sender_id === me?.id;
            return (
              <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[75%] px-3.5 py-2 rounded-2xl text-sm",
                  isMe ? "bg-brand-400 text-zinc-900 rounded-br-md" : "bg-zinc-800 text-zinc-200 rounded-bl-md")}>
                  <p>{m.text}</p>
                  <p className={cn("text-[10px] mt-1", isMe ? "text-zinc-700" : "text-zinc-600")}>
                    {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 pt-3 border-t border-zinc-800/50">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !sending && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" autoFocus />
        <button onClick={sendMessage} disabled={sending || !text.trim()}
          className="px-4 py-2.5 bg-brand-400 hover:bg-brand-500 text-zinc-900 rounded-xl transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
