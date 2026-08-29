import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, Play, CheckCircle2, AlertTriangle, ArrowRight, GitMerge, Users, Network, Calendar as CalendarIcon, ShieldAlert, Send, Bot, User, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, isValid, isBefore, isAfter, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, differenceInDays } from 'date-fns';

/**
 * A custom, premium Date Range Picker matching SANCHALAN aesthetics.
 */
function DateRangePicker({ startDate, endDate, onChange }) {
  const [currentMonth, setCurrentMonth] = useState(startDate ? parseISO(startDate) : new Date(2026, 7)); // Default to Aug 2026 for demo context
  const [selecting, setSelecting] = useState('start'); // 'start' or 'end'
  const [error, setError] = useState('');
  
  // Local string inputs for manual typing
  const [startInput, setStartInput] = useState(startDate ? format(parseISO(startDate), 'dd MMM yyyy') : '');
  const [endInput, setEndInput] = useState(endDate ? format(parseISO(endDate), 'dd MMM yyyy') : '');

  // Keep inputs synced if props change externally
  useEffect(() => {
    if (startDate) setStartInput(format(parseISO(startDate), 'dd MMM yyyy'));
    if (endDate) setEndInput(format(parseISO(endDate), 'dd MMM yyyy'));
  }, [startDate, endDate]);

  const handleDateClick = (day) => {
    setError('');
    const isoDate = format(day, 'yyyy-MM-dd');
    
    if (selecting === 'start') {
      if (endDate && isAfter(day, parseISO(endDate))) {
        // If they pick a start date after the end date, reset end date
        onChange({ startDate: isoDate, endDate: null });
        setSelecting('end');
      } else {
        onChange({ startDate: isoDate, endDate });
        setSelecting('end');
      }
    } else {
      if (startDate && isBefore(day, parseISO(startDate))) {
        setError('End date must be on or after the start date.');
      } else {
        onChange({ startDate, endDate: isoDate });
        setSelecting('start'); // or close picker
      }
    }
  };

  const handleInputBlur = (type, val) => {
    setError('');
    try {
      // Very basic manual parsing attempt for 'dd MMM yyyy' or 'yyyy-MM-dd' or 'dd/MM/yyyy'
      let parsed = new Date(val);
      if (!isValid(parsed)) {
        // Try parsing DD/MM/YYYY manually
        const parts = val.split(/[\/\-\s]/);
        if (parts.length === 3) {
          if (parts[0].length === 2 && parts[2].length === 4) {
            // Assume DD/MM/YYYY
            parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
      }

      if (isValid(parsed)) {
        const isoDate = format(parsed, 'yyyy-MM-dd');
        
        if (type === 'start') {
          if (endDate && isAfter(parsed, parseISO(endDate))) {
            setError('Start date must be on or before the end date.');
            setStartInput(startDate ? format(parseISO(startDate), 'dd MMM yyyy') : '');
            return;
          }
          onChange({ startDate: isoDate, endDate });
          setCurrentMonth(parsed);
        } else {
          if (startDate && isBefore(parsed, parseISO(startDate))) {
            setError('End date must be on or after the start date.');
            setEndInput(endDate ? format(parseISO(endDate), 'dd MMM yyyy') : '');
            return;
          }
          onChange({ startDate, endDate: isoDate });
          setCurrentMonth(parsed);
        }
      } else {
        setError('Enter a valid date.');
        if (type === 'start') setStartInput(startDate ? format(parseISO(startDate), 'dd MMM yyyy') : '');
        if (type === 'end') setEndInput(endDate ? format(parseISO(endDate), 'dd MMM yyyy') : '');
      }
    } catch (e) {
      setError('Enter a valid date.');
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-sm font-bold text-white tracking-wider">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = "eee";
    let startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest py-2" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateView = startOfWeek(monthStart);
    const endDateView = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDateView;
    let formattedDate = "";

    while (day <= endDateView) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        const isCurrentMonth = format(day, 'M') === format(monthStart, 'M');
        const isStart = startDate && isSameDay(day, parseISO(startDate));
        const isEnd = endDate && isSameDay(day, parseISO(endDate));
        const isBetween = startDate && endDate && isAfter(day, parseISO(startDate)) && isBefore(day, parseISO(endDate));

        let dayClass = "w-10 h-10 flex items-center justify-center text-sm rounded-full cursor-pointer transition-all mx-auto ";
        
        if (!isCurrentMonth) {
          dayClass += "text-gray-700 hover:text-gray-400 ";
        } else if (isStart || isEnd) {
          dayClass += "bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.5)] ";
        } else if (isBetween) {
          dayClass += "bg-purple-900/30 text-purple-200 rounded-none w-full ";
        } else {
          dayClass += "text-gray-300 hover:bg-white/10 ";
        }

        days.push(
          <div key={day.toString()} className="w-full">
            <div 
              className={dayClass}
              onClick={() => handleDateClick(cloneDay)}
            >
              {formattedDate}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-y-2 place-items-center" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="bg-[#121a2f] border border-white/10 rounded-2xl p-6 shadow-xl w-full max-w-md mx-auto">
      
      {/* Date Inputs */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 font-bold">Planned Start</label>
          <div className={`relative border rounded-xl overflow-hidden transition-colors ${selecting === 'start' ? 'border-purple-500 bg-purple-900/20' : 'border-white/10 bg-[#0a0f1c]'}`}>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <CalendarIcon size={14} className={selecting === 'start' ? 'text-purple-400' : 'text-gray-500'} />
            </div>
            <input 
              type="text"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              onBlur={(e) => handleInputBlur('start', e.target.value)}
              onFocus={() => setSelecting('start')}
              placeholder="DD MMM YYYY"
              className="w-full bg-transparent pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-center pt-5 text-gray-500">
          <ArrowRight size={16} />
        </div>

        <div className="flex-1">
          <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 font-bold">Due Date</label>
          <div className={`relative border rounded-xl overflow-hidden transition-colors ${selecting === 'end' ? 'border-purple-500 bg-purple-900/20' : 'border-white/10 bg-[#0a0f1c]'}`}>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <CalendarIcon size={14} className={selecting === 'end' ? 'text-purple-400' : 'text-gray-500'} />
            </div>
            <input 
              type="text"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              onBlur={(e) => handleInputBlur('end', e.target.value)}
              onFocus={() => setSelecting('end')}
              placeholder="DD MMM YYYY"
              className="w-full bg-transparent pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-xs text-red-400 flex items-center gap-1.5 bg-red-900/20 p-2 rounded border border-red-500/20">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {/* Visual Range Indicator */}
      {(startDate && endDate && !error) && (
        <div className="mb-6 flex items-center text-xs text-purple-300 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-500/20">
          <span className="font-bold">{format(parseISO(startDate), 'dd MMM')}</span>
          <div className="flex-1 mx-3 border-t border-dashed border-purple-500/50 relative">
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"></div>
          </div>
          <span className="font-bold">{format(parseISO(endDate), 'dd MMM')}</span>
          <span className="ml-3 text-purple-400 opacity-70">({differenceInDays(parseISO(endDate), parseISO(startDate))} days)</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-[#0a0f1c] rounded-xl p-4 border border-white/5">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

    </div>
  );
}

export default function AIPlannerModal({ onClose, projectId = "PROJ-1", contextData }) {
  const [sessionId, setSessionId] = useState(`SESSION-${Date.now()}`);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  
  // New phase: 'setup' -> 'chat' -> 'planning' -> 'results' -> 'approved'
  const [phase, setPhase] = useState('setup'); 
  
  // Strict ISO Dates State
  const [executionWindow, setExecutionWindow] = useState({
    startDate: '', // e.g. 2026-08-29
    endDate: ''
  });

  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, currentQuestion, showCustomInput, phase]);

  const loadingSequence = [
    { text: "INITIALIZING STRATEGIC ORCHESTRATOR", icon: BrainCircuit },
    { text: "RETRIEVING PROJECT CONTEXT", icon: CalendarIcon },
    { text: "ANALYZING TASK DEPENDENCIES", icon: Network },
    { text: "EVALUATING RESOURCE AVAILABILITY", icon: Users },
    { text: "GENERATING STRATEGIC SEQUENCE", icon: GitMerge },
    { text: "DETERMINISTIC SCHEDULING", icon: CheckCircle2 },
    { text: "STRICT CONSTRAINT VALIDATION", icon: ShieldAlert },
    { text: "PLAN FINALIZED", icon: CheckCircle2 }
  ];

  const handleStartPlanning = async () => {
    if (!executionWindow.startDate || !executionWindow.endDate) {
      setError("Please select a complete start and end date range.");
      return;
    }
    
    // Validate end >= start directly before sending
    if (isBefore(parseISO(executionWindow.endDate), parseISO(executionWindow.startDate))) {
      setError("End date must be on or after the start date.");
      return;
    }

    setError(null);
    setPhase('chat');
    
    // Initialize session with the first message explicitly embedding the date range request
    // although the backend will also grab the executionWindow from the payload.
    const startDisplay = format(parseISO(executionWindow.startDate), 'dd MMM yyyy');
    const endDisplay = format(parseISO(executionWindow.endDate), 'dd MMM yyyy');
    
    setMessages([{
      id: 'greet',
      role: 'ai',
      text: `I've locked your execution window to **${startDisplay} → ${endDisplay}**. What would you like to schedule? (e.g. "Assign excavation to Ramesh")`
    }]);
  };

  const sendMessageToAI = async (messageText) => {
    setIsTyping(true);
    setError(null);
    setCurrentQuestion(null);
    setShowCustomInput(false);

    try {
      const token = localStorage.getItem('sanchalan_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ai/plan/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          projectId,
          userMessage: messageText,
          executionWindow // Strictly sent with every request
        })
      });

      if (!res.ok) throw new Error('Failed to communicate with AI orchestrator');
      
      const data = await res.json();
      
      if (data.question) {
        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: data.question.question }]);
        setCurrentQuestion(data.question);
      } else if (data.plan) {
        // Plan generated
        setPhase('planning');
        for (let i = 0; i < loadingSequence.length; i++) {
          setLoadingStep(i);
          await new Promise(r => setTimeout(r, 600));
        }
        setPlanResult({ plan: data.plan, validation: data.validation });
        setPhase('results');
      }

    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: 'Sorry, I encountered an error. Please try again.', isError: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendPrompt = (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: msg }]);
    sendMessageToAI(msg);
  };

  const handleOptionSelect = (option) => {
    if (option.requiresInput) {
      setShowCustomInput(true);
    } else {
      setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: option.label }]);
      sendMessageToAI(option.label);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSendPrompt(e);
  };

  const handleApprove = async () => {
    const token = localStorage.getItem('sanchalan_token');
    try {
      const payload = {
        sessionId,
        planVersionId: sessionId,
        projectId,
        supervisorId: contextData?.assignedWorkerId,
        activities: planResult?.plan?.activities || []
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ai/plan/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to approve plan");
      }
      setPhase('approved');
      setTimeout(() => onClose(), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f172a] rounded-2xl shadow-[0_0_50px_rgba(147,51,234,0.1)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-purple-500/30">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#121a2f]">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-purple-400" size={24} />
            <div>
              <h2 className="text-lg font-bold text-white tracking-widest">SANCHALAN AI PLANNER</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">AI EXECUTION ORCHESTRATOR</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full transition-colors bg-white/5 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-[#0a0f1c]">
          <AnimatePresence mode="wait">
            
            {phase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col h-full overflow-y-auto custom-scrollbar items-center justify-center p-8"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-3">Define Execution Window</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    Select the strict start and end dates for your planning session. The deterministic engine guarantees no tasks will be scheduled outside this window.
                  </p>
                </div>
                
                <DateRangePicker 
                  startDate={executionWindow.startDate}
                  endDate={executionWindow.endDate}
                  onChange={setExecutionWindow}
                />

                {error && (
                  <div className="mt-6 text-sm text-red-400 flex items-center gap-2 bg-red-900/20 p-3 rounded-xl border border-red-500/20 w-full max-w-md">
                    <AlertTriangle size={16} /> {error}
                  </div>
                )}

                <button 
                  onClick={handleStartPlanning}
                  disabled={!executionWindow.startDate || !executionWindow.endDate}
                  className="mt-8 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 rounded-xl font-bold tracking-widest text-sm text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:grayscale transition-all"
                >
                  START PLANNING <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {phase === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full relative"
              >
                {/* Sticky Header for Dates */}
                <div className="absolute top-0 inset-x-0 bg-[#121a2f]/90 backdrop-blur-md border-b border-white/5 py-2 px-6 flex justify-between items-center z-10">
                  <div className="text-xs font-bold tracking-widest text-gray-400 flex items-center gap-2">
                    <CalendarIcon size={14} className="text-purple-400" />
                    EXECUTION WINDOW: 
                    <span className="text-purple-300 ml-1">{format(parseISO(executionWindow.startDate), 'dd MMM yyyy')}</span>
                    <span className="text-gray-600 mx-1">→</span>
                    <span className="text-purple-300">{format(parseISO(executionWindow.endDate), 'dd MMM yyyy')}</span>
                  </div>
                  <button onClick={() => setPhase('setup')} className="text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors">
                    Edit Window
                  </button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 pt-16 space-y-6 custom-scrollbar">
                  {messages.map((msg, i) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-[#121a2f] border border-purple-500/30 text-purple-400'}`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      
                      <div className={`px-5 py-3.5 rounded-2xl max-w-[80%] shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-purple-600 text-white rounded-tr-sm' 
                          : msg.isError
                            ? 'bg-red-900/20 border border-red-500/30 text-red-300 rounded-tl-sm'
                            : 'bg-[#121a2f] border border-white/10 text-gray-200 rounded-tl-sm'
                      }`}>
                        {/* Use Markdown-like bolding for dates */}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: msg.text.replace(/\*\*(.*?)\*\*/g, '<span class="text-purple-300 font-bold">$1</span>')}} />
                      </div>
                    </div>
                  ))}

                  {currentQuestion && !showCustomInput && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-3 pl-12 pr-12 max-w-[80%]"
                    >
                      {currentQuestion.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleOptionSelect(opt)}
                          className="px-5 py-3 bg-[#121a2f] hover:bg-purple-900/40 border border-white/10 hover:border-purple-500/50 rounded-xl text-left text-sm text-gray-300 hover:text-white transition-all w-full shadow-sm"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {isTyping && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#121a2f] border border-purple-500/30 text-purple-400">
                        <Bot size={16} />
                      </div>
                      <div className="px-5 py-3 rounded-2xl bg-[#121a2f] border border-white/10 text-gray-400 rounded-tl-sm flex items-center gap-3">
                        <Loader2 size={16} className="animate-spin text-purple-400" />
                        <span className="text-sm font-medium animate-pulse">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#121a2f] border-t border-white/10 z-10">
                  <form onSubmit={currentQuestion && showCustomInput ? handleCustomSubmit : handleSendPrompt} className="flex items-center gap-3 relative max-w-4xl mx-auto">
                    {currentQuestion && !showCustomInput ? (
                      <div className="flex-1 px-4 py-3 text-sm text-gray-500 italic text-center">
                        Please select an option above.
                      </div>
                    ) : (
                      <>
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={showCustomInput ? "Type your custom response..." : "Describe what you want to schedule..."}
                          className="flex-1 bg-[#0a0f1c] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                          disabled={isTyping}
                          autoFocus={showCustomInput}
                        />
                        {showCustomInput && (
                          <button 
                            type="button"
                            onClick={() => setShowCustomInput(false)}
                            className="px-4 py-3.5 text-xs font-bold text-gray-400 hover:text-white"
                          >
                            CANCEL
                          </button>
                        )}
                        <button 
                          type="submit" 
                          disabled={!input.trim() || isTyping}
                          className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send size={18} />
                        </button>
                      </>
                    )}
                  </form>
                </div>
              </motion.div>
            )}

            {phase === 'planning' && (
              <motion.div
                key="planning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full absolute inset-0 bg-[#0a0f1c] z-10"
              >
                <BrainCircuit size={64} className="text-purple-500 mb-10 animate-pulse" />
                
                <div className="w-full max-w-lg space-y-5">
                  {loadingSequence.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx === loadingStep;
                    const isDone = idx < loadingStep;
                    
                    return (
                      <div key={idx} className={`flex items-center gap-4 transition-all duration-300 ${isActive ? 'opacity-100 scale-105 translate-x-2' : isDone ? 'opacity-50' : 'opacity-20'}`}>
                        <div className={`p-2.5 rounded-full ${isActive ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                          {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                        </div>
                        <span className={`text-sm tracking-widest font-bold ${isActive ? 'text-white' : isDone ? 'text-gray-400' : 'text-gray-600'}`}>
                          {step.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {phase === 'results' && planResult && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full absolute inset-0 bg-[#0a0f1c] z-20"
              >
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  
                  {/* Execution Window Confirmation */}
                  <div className="bg-[#121a2f] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 tracking-widest">REQUESTED EXECUTION WINDOW</span>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                       <span className="text-purple-400">{format(parseISO(executionWindow.startDate), 'dd MMM yyyy')}</span>
                       <span className="text-gray-500">→</span>
                       <span className="text-purple-400">{format(parseISO(executionWindow.endDate), 'dd MMM yyyy')}</span>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/10 border border-purple-500/30 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                      <BrainCircuit size={150} />
                    </div>
                    <h3 className="text-xs font-bold text-purple-400 tracking-widest mb-4 flex items-center gap-2">
                      <BrainCircuit size={16}/> STRATEGIC AI RATIONALE
                    </h3>
                    <p className="text-sm text-gray-200 leading-relaxed relative z-10">
                      {planResult.plan?.reasoning || "Based on the provided constraints and project context, the optimal path prioritizes the critical foundation tasks to ensure early completion. Resource allocation was balanced to prevent overallocation."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Risks */}
                    <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-5">
                      <h4 className="text-xs font-bold text-red-400 tracking-widest mb-4 flex items-center gap-2">
                        <ShieldAlert size={14} /> IDENTIFIED RISKS
                      </h4>
                      <ul className="space-y-2">
                        {planResult.plan?.risks?.map((r, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                            {r}
                          </li>
                        )) || <li className="text-sm text-gray-500">No major risks identified.</li>}
                      </ul>
                    </div>

                    {/* Validation */}
                    <div className={`border rounded-xl p-5 ${planResult.validation?.valid ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-orange-900/10 border-orange-500/20'}`}>
                      <h4 className={`text-xs font-bold tracking-widest mb-4 flex items-center gap-2 ${planResult.validation?.valid ? 'text-emerald-400' : 'text-orange-400'}`}>
                        <CheckCircle2 size={14} /> DETERMINISTIC VALIDATION
                      </h4>
                      {planResult.validation?.valid ? (
                        <p className="text-sm text-emerald-300">✓ Date constraints passed<br/>✓ Dependencies passed<br/>✓ Resource constraints passed</p>
                      ) : (
                        <ul className="space-y-2">
                          {planResult.validation?.violations?.map((v, i) => (
                            <li key={i} className="text-sm text-orange-300 flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span> {v}
                            </li>
                          ))}
                          {planResult.validation?.conflicts?.map((c, i) => (
                            <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">•</span> {c}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Proposed Schedule */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 tracking-widest mb-4">AI EXECUTION PLAN</h3>
                    <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 text-xs">
                          <tr>
                            <th className="p-3 font-medium">ACTIVITY</th>
                            <th className="p-3 font-medium">START</th>
                            <th className="p-3 font-medium">END</th>
                            <th className="p-3 font-medium">ASSIGNEE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-200">
                          {planResult.plan?.activities?.map((act, i) => {
                             // Format ISO back to display friendly for the final view
                             const safeStart = act.startDate ? format(parseISO(act.startDate), 'dd MMM yyyy') : '';
                             const safeEnd = act.endDate ? format(parseISO(act.endDate), 'dd MMM yyyy') : '';
                             return (
                               <tr key={i} className="hover:bg-white/5 transition-colors">
                                 <td className="p-3 font-medium">{act.title || act.id}</td>
                                 <td className="p-3 text-purple-300">{safeStart}</td>
                                 <td className="p-3 text-purple-300">{safeEnd}</td>
                                 <td className="p-3">
                                   <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs border border-blue-500/20">
                                     {act.assignedWorkerId || 'Unassigned'}
                                   </span>
                                 </td>
                               </tr>
                             );
                          }) || (
                            <tr><td colSpan="4" className="p-4 text-center text-gray-500">No activities proposed.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-white/10 flex justify-between items-center bg-[#121a2f]">
                  <button onClick={() => setPhase('chat')} className="px-6 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-colors">
                    ADJUST PLAN
                  </button>
                  <div className="flex gap-4">
                    <button onClick={() => sendMessageToAI("Regenerate the plan with different strategies")} className="px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors">
                      REGENERATE
                    </button>
                    <button 
                      onClick={handleApprove}
                      disabled={!planResult.validation?.valid}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl font-bold tracking-widest text-sm text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                      APPROVE & ASSIGN <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

            {phase === 'approved' && (
              <motion.div
                key="approved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full absolute inset-0 bg-[#0a0f1c] z-30 text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">✓ PLAN APPROVED</h3>
                <h4 className="text-xl font-bold text-emerald-300 mb-2">✓ TASKS ASSIGNED</h4>
                <p className="text-emerald-400 font-bold">✓ SUPERVISOR NOTIFIED</p>
                <p className="text-gray-400 mt-4">Task assignments have been synchronized to field supervisors.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
