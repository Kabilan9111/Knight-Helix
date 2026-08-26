import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, CheckCircle2 } from 'lucide-react';

export default function AIConversation({ history, onSendMessage, loading, traces = [] }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface-2)]">
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {history.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-white' : 'bg-white border border-[var(--border-medium)] text-[var(--accent-primary)]'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`px-4 py-3 rounded-2xl max-w-[80%] shadow-sm ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-white rounded-tr-sm' : 'bg-white border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-sm'}`}>
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {traces.length > 0 && (
          <div className="flex flex-col gap-2 pl-12 pr-4">
            {traces.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px] font-medium text-emerald-600 animate-in fade-in slide-in-from-left-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {t.replace('✓ ', '')}
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white border border-[var(--border-medium)] text-[var(--accent-primary)]">
              <Bot size={16} />
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-tl-sm flex items-center gap-3 shadow-sm">
              <Loader2 size={16} className="animate-spin text-[var(--accent-primary)]" />
              <span className="text-[14px] font-medium animate-pulse">Understanding request...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-white border-t border-[var(--border-subtle)]">
        <form onSubmit={handleSubmit} className="flex items-end gap-3 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you want to accomplish..."
            className="flex-1 bg-[var(--bg-surface-2)] border border-[var(--border-medium)] rounded-xl px-4 py-3 text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary-subtle)] resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-xl bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-md hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>

    </div>
  );
}
