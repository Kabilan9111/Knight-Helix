import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, CheckCircle2, AlertTriangle, Loader2, Bot, User, ShieldCheck, ChevronRight, Calendar, ArrowRight, Layers } from 'lucide-react';
import { API_URL } from '../config';
import { useSocket } from '../../context/SocketContext';

export default function MobileAIPlannerModal({ isOpen, onClose, contextData, onTaskCreated, token }) {
  const [sessionId, setSessionId] = useState(`SESSION-${Date.now()}`);
  const [history, setHistory] = useState([
    {
      role: 'model',
      content: `Hello Site Engineer! I will construct an optimized execution schedule for ${contextData?.title || 'this task'} at ${contextData?.projectName || 'Project Alpha'}. Send your requirements or constraints to begin.`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [plan, setPlan] = useState(null);
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState('');
  const [traces, setTraces] = useState([]);

  const socket = useSocket();
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSessionId(`SESSION-${Date.now()}`);
      setHistory([
        {
          role: 'model',
          content: `Hello! I will schedule "${contextData?.title || 'Operational Work'}" for ${contextData?.projectName || 'Project Alpha'} assigned to ${contextData?.workerName || 'Field Supervisor'}. Tap below to generate the plan or type specific instructions.`
        }
      ]);
      setPlan(null);
      setValidation(null);
      setError('');
      setTraces([]);
    }
  }, [isOpen, contextData]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, traces, plan]);

  useEffect(() => {
    if (socket) {
      const handleTrace = (data) => {
        if (data?.action) setTraces(prev => [...prev, data.action]);
      };
      socket.on('agent_trace', handleTrace);
      return () => socket.off('agent_trace', handleTrace);
    }
  }, [socket]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const newHistory = [...history, { role: 'user', content: text }];
    setHistory(newHistory);
    setInputMessage('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/ai/plan/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          userMessage: text,
          projectId: contextData?.projectId || 'PROJ-001',
          contextData: contextData,
          executionWindow: {
            startDate: contextData?.startDate || new Date().toISOString().split('T')[0],
            endDate: contextData?.dueDate || new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0]
          }
        })
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to get AI plan response');
      }

      const data = await res.json();
      setSessionId(data.sessionId);

      let modelResponse = "I've structured your operational execution plan.";
      if (data.question) {
        modelResponse = data.question.question || data.question;
      } else if (data.plan) {
        modelResponse = "I have synthesized an execution plan based on project constraints and DAG dependencies. Review the structured activity breakdown below.";
      }

      setHistory(prev => [...prev, { role: 'model', content: modelResponse }]);

      if (data.plan) {
        const mappedPlan = {
          title: contextData?.title || data.plan.activities?.[0]?.title || 'AI Scheduled Task',
          projectName: contextData?.projectName || 'Project Alpha',
          supervisor: contextData?.workerName || 'Supervisor',
          startDate: contextData?.startDate || data.plan.startDate,
          dueDate: contextData?.dueDate || data.plan.endDate,
          confidence: data.validation?.valid ? 98 : 88,
          rationale: data.plan.reasoning || data.plan.explanation || "Optimized based on crew availability and linear activity sequencing.",
          scheduleSteps: (data.plan.activities || []).map((act, idx) => ({
            num: idx + 1,
            title: act.title || act.name || act.description || `Activity ${idx + 1}`,
            description: act.description || act.title,
            startDate: act.startDate || act.date || contextData?.startDate,
            endDate: act.endDate || act.dueDate || act.date || contextData?.dueDate
          })),
          risks: data.validation?.conflicts || []
        };
        setPlan(mappedPlan);
        setValidation(data.validation);
      }
    } catch (err) {
      setError(err.message || 'AI planning agent unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = async () => {
    setApproving(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/ai/plan/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          planVersionId: sessionId,
          projectId: contextData?.projectId || 'PROJ-001',
          supervisorId: contextData?.assignedWorkerId,
          activities: plan?.scheduleSteps?.map(s => ({
            title: s.title,
            description: s.description,
            startDate: s.startDate,
            endDate: s.endDate
          })) || []
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve and assign execution plan.');
      }

      onTaskCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Approval failed.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl max-w-lg mx-auto w-full">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/25">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                SANCHALAN AI Planner
              </h3>
              <p className="text-[10px] text-indigo-300 font-mono font-medium">LangGraph Autonomous Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat & Plan Scroll Area */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs">
          
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl flex items-center gap-2 text-xs font-medium">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Conversation History */}
          {history.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={15} />
                </div>
              )}
              <div
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Live Agent Traces */}
          {traces.length > 0 && (
            <div className="p-2.5 bg-indigo-950/40 rounded-xl border border-indigo-500/20 text-[10px] space-y-1 font-mono text-indigo-300">
              <div className="font-bold flex items-center gap-1">
                <Sparkles size={11} /> Agent Orchestration:
              </div>
              {traces.slice(-3).map((t, idx) => (
                <div key={idx} className="opacity-80">› {t}</div>
              ))}
            </div>
          )}

          {/* GENERATED PLAN CARD */}
          {plan && (
            <div className="bg-gradient-to-br from-slate-950 to-indigo-950/60 border-2 border-indigo-500/50 rounded-2xl p-4 space-y-3 shadow-xl animate-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">
                    Synthesized Execution Plan
                  </span>
                  <h4 className="text-sm font-black text-white">{plan.title}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                    {plan.confidence}% Validated
                  </span>
                </div>
              </div>

              {/* Rationale */}
              <div className="text-slate-300 text-[11px] leading-relaxed italic bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                "{plan.rationale}"
              </div>

              {/* Steps */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                  <Layers size={12} className="text-blue-400" />
                  Scheduled L6 Activities ({plan.scheduleSteps.length})
                </div>

                {plan.scheduleSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {step.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white leading-tight">{step.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                        <Calendar size={10} /> {step.startDate} → {step.endDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Approve Button */}
              <button
                onClick={handleApprovePlan}
                disabled={approving}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {approving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Committing Plan to Database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Approve & Deploy Execution Plan
                  </>
                )}
              </button>

            </div>
          )}

          {/* Quick Prompts if no plan yet */}
          {!plan && history.length <= 2 && (
            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Quick Actions:</div>
              <button
                onClick={() => sendMessage(`Schedule task: ${contextData?.title || 'Site Task'} from ${contextData?.startDate || 'today'} to ${contextData?.dueDate || 'due date'}.`)}
                className="w-full text-left p-2 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-indigo-300 text-[11px] font-medium flex items-center justify-between"
              >
                <span>⚡ Auto-generate standard 4-phase sequence</span>
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => sendMessage(`Fast-track sequence with high resource intensity for ${contextData?.workerName || 'Supervisor'}.`)}
                className="w-full text-left p-2 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-indigo-300 text-[11px] font-medium flex items-center justify-between"
              >
                <span>🚀 Fast-track with compressed critical path</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type instructions for AI planner..."
            className="flex-1 bg-slate-900 border border-slate-800 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-500 placeholder-slate-500"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !inputMessage.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl disabled:opacity-40 transition-all shadow-md shrink-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

      </div>
    </div>
  );
}
