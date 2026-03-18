import { useState, useEffect, useRef } from 'react';
import { api, getUser, cn } from '../utils/api';
import { Card, Avatar, Spinner, Button } from '../components/UI';
import { Bot, Send, Plus, MessageSquare, Trash2 } from 'lucide-react';

const QUICK = [
  "How do I reset a Control4 controller?",
  "Lutron RadioRA3 wiring guide",
  "Best practices for running Cat6",
  "Troubleshoot Sonos drop-offs",
  "Savant vs Control4 comparison",
  "NEC code for low voltage wiring",
];

export default function AskAI() {
  const me = getUser();
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([{ role: 'assistant', text: "Hey there! I'm your AI assistant. Ask me anything about installations, products, troubleshooting, code compliance, wiring, or anything else." }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  async function loadHistory() {
    try { const c = await api('/ai/conversations'); setConvos(c || []); } catch { }
    setHistoryLoading(false);
  }

  async function loadConvo(id) {
    try {
      const c = await api('/ai/conversations/' + id);
      setActiveId(c.id);
      const msgs = typeof c.messages === 'string' ? JSON.parse(c.messages) : c.messages;
      setMessages(msgs?.length ? msgs : [{ role: 'assistant', text: "Conversation loaded." }]);
    } catch { }
  }

  async function saveConvo(msgs) {
    try {
      const title = msgs.find(m => m.role === 'user')?.text?.substring(0, 50) || 'New conversation';
      const res = await api('/ai/conversations', { method: 'POST', body: JSON.stringify({ id: activeId, title, messages: msgs }) });
      if (!activeId) setActiveId(res.id);
      loadHistory();
    } catch { }
  }

  function newChat() {
    setActiveId(null);
    setMessages([{ role: 'assistant', text: "Hey there! What can I help you with?" }]);
  }

  async function deleteConvo(id) {
    try { await api('/ai/conversations/' + id, { method: 'DELETE' }); if (activeId === id) newChat(); loadHistory(); } catch { }
  }

  async function send(text) {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    const newMsgs = [...messages, { role: 'user', text: q }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await api('/ai/ask', { method: 'POST', body: JSON.stringify({ question: q }) });
      const finalMsgs = [...newMsgs, { role: 'assistant', text: res.answer }];
      setMessages(finalMsgs);
      saveConvo(finalMsgs);
    } catch {
      const finalMsgs = [...newMsgs, { role: 'assistant', text: "I'm having trouble connecting. Check your Anthropic API key in Railway." }];
      setMessages(finalMsgs);
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 8rem)" }}>
      {/* History Sidebar */}
      <div className="w-64 flex-shrink-0 hidden lg:flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-400">Chat History</h2>
          <button onClick={newChat} className="p-1.5 rounded-lg bg-brand-400/10 text-brand-400 hover:bg-brand-400/20"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {historyLoading ? <Spinner /> : convos.length === 0 ? <p className="text-xs text-zinc-600 text-center py-4">No previous chats</p> :
          convos.map(c => (
            <div key={c.id} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer group transition-colors", activeId === c.id ? "bg-brand-400/10" : "hover:bg-white/[0.04]")}>
              <button onClick={() => loadConvo(c.id)} className="flex-1 text-left min-w-0">
                <p className={cn("text-sm truncate", activeId === c.id ? "text-brand-400" : "text-zinc-300")}>{c.title || "Untitled"}</p>
                <p className="text-[10px] text-zinc-600">{new Date(c.updated_at).toLocaleDateString()}</p>
              </button>
              <button onClick={() => deleteConvo(c.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-lg font-bold">Just Ask</h1><p className="text-xs text-zinc-500">AI-powered assistant</p></div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' ? <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-white" /></div>
                : <Avatar name={me?.name} color={me?.color} size="sm" />}
                <div className={cn("max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed", msg.role === 'user' ? "bg-brand-400 text-white rounded-br-sm" : "bg-white/[0.04] text-zinc-200 rounded-bl-sm border border-white/[0.06]")}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
            {loading && <div className="flex gap-3"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-white" /></div><div className="px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-sm"><div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" /><div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: '.2s' }} /><div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: '.4s' }} /></div></div></div>}
            <div ref={endRef} />
          </div>
          {messages.length <= 1 && <div className="px-4 pb-2"><p className="text-[10px] text-zinc-600 mb-2 uppercase tracking-wider font-semibold">Quick Prompts</p><div className="flex flex-wrap gap-1.5">{QUICK.map((q, i) => <button key={i} onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-brand-400 hover:border-brand-400/30 transition-colors">{q}</button>)}</div></div>}
          <div className="p-3 border-t border-white/[0.06]"><div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask anything..." className="flex-1 bg-white/[0.025] border border-white/[0.06] rounded-2xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" />
            <button onClick={() => send()} disabled={loading || !input.trim()} className="px-4 py-2.5 bg-gradient-to-br from-brand-400 to-[#D4AF37] rounded-2xl disabled:opacity-40 shadow-lg shadow-brand-400/20"><Send className="w-4 h-4 text-white" /></button>
          </div></div>
        </Card>
      </div>
    </div>
  );
}
