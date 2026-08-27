import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import AIConversation from './AIConversation';
import AIPlanEditor from './AIPlanEditor';
import { useSocket } from '../../context/SocketContext';

export default function AIPlannerModal({ onClose, contextData, onTaskCreated }) {
  const [history, setHistory] = useState([
    { role: 'system', content: 'You are an AI planner.' },
    { role: 'model', content: "Hello! I see you want to assign a new task. Tell me what you want to accomplish." }
  ]);
  const [plan, setPlan] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState(null);
  const [traces, setTraces] = useState([]);

  const socket = useSocket();
  const token = localStorage.getItem('sanchalan_token');

  useEffect(() => {
    if (socket) {
      socket.on('agent_trace', (data) => {
        setTraces(prev => [...prev, data.action]);
      });
      return () => socket.off('agent_trace');
    }
  }, [socket]);

  const sendMessage = async (text) => {
    const newHistory = [...history, { role: 'user', content: text }];
    setHistory(newHistory);
    setLoading(true);
    setError(null);
    setTraces([]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          history: newHistory,
          contextData,
          sessionId
        })
      });

      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();
      
      setSessionId(data.sessionId);
      
      setHistory(prev => [...prev, { role: 'model', content: data.message }]);
      
      if (data.plan) {
        setPlan(data.plan);
      }
      
    } catch (err) {
      console.error(err);
      setError('AI planning is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ai/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan,
          sessionId
        })
      });

      if (!res.ok) throw new Error('Failed to approve plan');
      const data = await res.json();
      
      if (data.success) {
        onTaskCreated();
        onClose();
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to automate task execution.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[rgba(8,11,18,0.85)] backdrop-blur-md" onClick={onClose} />
      
      {/* Main Modal */}
      <div className="relative w-full max-w-7xl h-[90vh] bg-[var(--bg-surface-1)] rounded-2xl shadow-2xl border border-[var(--border-strong)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">SANCHALAN AI Planner</h2>
              <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Agentic Project Execution</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-3)] hover:text-white rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Chat */}
          <div className={`${plan ? 'w-1/3 border-r border-[var(--border-subtle)]' : 'w-full'} transition-all duration-300`}>
            <AIConversation 
              history={history} 
              onSendMessage={sendMessage} 
              loading={loading}
              traces={traces}
            />
          </div>

          {/* Right: Plan Editor (Only visible if plan is generated) */}
          {plan && (
            <div className="w-2/3 animate-in slide-in-from-right-8 duration-300">
              <AIPlanEditor 
                plan={plan}
                onPlanUpdate={setPlan}
                onApprove={handleApprove}
                onCancel={onClose}
                approving={approving}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
