import React, { useState, useEffect } from 'react';
import { useMobileAuth } from '../context/MobileAuthContext';
import { 
  TrendingUp, TrendingDown, BrainCircuit, Activity, 
  CheckCircle2, AlertTriangle, ChevronRight, Sliders, Users, Sparkles
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MobilePrediction() {
  const { token, isOnline } = useMobileAuth();
  const [selectedTeam, setSelectedTeam] = useState('civil-a');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState('baseline'); // 'baseline', 'slow', 'fast'

  const fetchPrediction = async (teamId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/visualization/team/${teamId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Prediction error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction(selectedTeam);
  }, [selectedTeam, token]);

  const teamList = [
    { id: 'civil-a', name: 'Civil Team A' },
    { id: 'mechanical-b', name: 'Mechanical Team B' },
    { id: 'electrical-c', name: 'Electrical Team C' },
    { id: 'piping-d', name: 'Piping Team D' }
  ];

  const tasks = data?.tasks || [];
  const insights = data?.insights || [];
  const recommendations = data?.recommendations || [];

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Header & Team Selector */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400">
            <BrainCircuit size={16} />
            <span>AI Execution Prediction</span>
          </div>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-bold text-white px-2.5 py-1 rounded-xl outline-none"
          >
            {teamList.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Productivity Rate KPI */}
        <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-800">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[9px] uppercase font-bold text-slate-400">Current Productivity</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {data?.productivity || 92}%
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[9px] uppercase font-bold text-slate-400">Historical Benchmark</div>
            <div className="text-lg font-black text-blue-400 mt-0.5">
              {data?.historicalProductivity || 89}%
            </div>
          </div>
        </div>
      </div>

      {/* 3-Scenario Forecast Switcher */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-400">Completion Forecast Scenarios</span>
          <span className="text-[10px] text-blue-400 font-bold">Predictive Engine</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveScenario('slow')}
            className={`py-2 rounded-lg text-xs font-black transition-all ${
              activeScenario === 'slow' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            -15% Slow
          </button>
          <button
            onClick={() => setActiveScenario('baseline')}
            className={`py-2 rounded-lg text-xs font-black transition-all ${
              activeScenario === 'baseline' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            Baseline
          </button>
          <button
            onClick={() => setActiveScenario('fast')}
            className={`py-2 rounded-lg text-xs font-black transition-all ${
              activeScenario === 'fast' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            +15% Fast
          </button>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-medium">
          {activeScenario === 'slow' && "⚠️ Simulating reduced execution velocity. Completion dates slip by 3–5 days across remaining formwork and casting phases."}
          {activeScenario === 'baseline' && "✓ Maintaining baseline speed. All tasks remain within schedule tolerance with on-time milestone delivery."}
          {activeScenario === 'fast' && "⚡ Fast-track execution. Critical path completes approximately 2.5 days ahead of contractual target."}
        </div>
      </div>

      {/* Task Forecast Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Activity Progress & Bottlenecks ({tasks.length})
        </h3>

        {tasks.map((t, idx) => (
          <div 
            key={t.id || idx}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                {t.id}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                t.currentProgress === 100 ? 'bg-emerald-950 text-emerald-300' :
                t.currentProgress > 0 ? 'bg-blue-950 text-blue-300' :
                'bg-slate-800 text-slate-400'
              }`}>
                {t.currentProgress === 100 ? 'Completed' : t.currentProgress > 0 ? 'In Progress' : 'Pending'}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <h4 className="text-sm font-black text-white">{t.name}</h4>
              <span className="text-xs font-black text-blue-400">{t.currentProgress}%</span>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${t.currentProgress}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 pt-1">
              <span>Target Finish: {t.plannedFinishDate}</span>
              <span>Baseline Forecast</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl shadow-xl space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase">
            <Sparkles size={14} /> Recommended Optimizations
          </div>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
