import { useState } from 'react';
import { api } from '../utils/api';
import { Card, PageHeader, Button, Spinner } from '../components/UI';
import { Sparkles, Send } from 'lucide-react';

export default function AskAI() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true); setAnswer('');
    try { const res = await api('/ai/ask', { method: 'POST', body: JSON.stringify({ question }) }); setAnswer(res.answer); }
    catch (e) { setAnswer('Error: ' + e.message); }
    setLoading(false);
  }

  return (
    <div>
      <PageHeader title="Just Ask AI" subtitle="Ask about projects, technical questions, or get AI insights" />
      <Card className="p-5 mb-6"><div className="flex gap-3"><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && !loading && ask()} placeholder="How do I configure a Lutron RadioRA3?" className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400/50 placeholder-zinc-600" /><Button onClick={ask} disabled={loading}><Send className="w-4 h-4" /></Button></div></Card>
      {loading && <Spinner />}
      {answer && <Card className="p-5"><div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-brand-400" /><span className="text-sm font-semibold text-brand-400">AI Response</span></div><div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{answer}</div></Card>}
    </div>
  );
}
