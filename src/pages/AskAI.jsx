import { useState, useEffect, useRef } from 'react';
import { api, getUser } from '../utils/api';
import { Card, Avatar, Spinner } from '../components/UI';
import { Sparkles, Send, Bot } from 'lucide-react';

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
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey there! I'm your AI assistant. Ask me anything about installations, products, troubleshooting, code compliance, wiring, or anything else. I'm here to help!" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  async function send(text) {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages(p => [...p, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await api('/ai/ask', { method: 'POST', body: JSON.stringify({ question: q }) });
      setMessages(p => [...p, { role: 'assistant', text: res.answer }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', text: "I'm having trouble connecting. Make sure your Anthropic API key is configured in Railway environment variables." }]);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Just Ask</h1>
          <p className="text-xs text-zinc-500">AI-powered assistant for installation, troubleshooting & product questions</p>
        </div>
      </div>

      <Card className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: 450 }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' ? (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              ) : (
                <Avatar name={me?.name} color={me?.color} size="sm" />
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-400 text-white rounded-br-sm'
                  : 'bg-white/[0.04] text-zinc-200 rounded-bl-sm border border-white/[0.06]'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" /><div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: '.2s' }} /><div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: '.4s' }} /></div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-[10px] text-zinc-600 mb-2 uppercase tracking-wider font-semibold">Quick Prompts</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK.map((q, i) => (
                <button key={i} onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-brand-400 hover:border-brand-400/30 transition-colors">{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything..."
              className="flex-1 bg-white/[0.025] border border-white/[0.06] rounded-2xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-gradient-to-br from-brand-400 to-[#D4AF37] rounded-2xl transition-all disabled:opacity-40 shadow-lg shadow-brand-400/20">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
