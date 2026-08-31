import React, { useState } from 'react';
import { useMobileAuth } from '../context/MobileAuthContext';
import { 
  Sparkles, AlertTriangle, CheckCircle2, XCircle, ArrowRight, 
  BrainCircuit, ShieldCheck, Clock, Layers, ChevronRight
} from 'lucide-react';

export default function MobileAIRecommendations() {
  const { user } = useMobileAuth();

  const [recommendations, setRecommendations] = useState([
    {
      id: 'REC-001',
      problem: 'Foundation Rebar Execution Bottleneck',
      reason: 'Progress velocity on Section A is 22% below the baseline required to complete before the Aug 30 deadline.',
      supportingEvidence: 'Multimodal image verification from Aug 28 demonstrates 70% rebar binding, leaving 30% unverified.',
      suggestedAction: 'Reassign 2 additional certified ironworkers from Team Gamma (currently on non-critical backfilling).',
      expectedImpact: 'Prevents a 3-day critical path delay ripple on downstream Formwork and Concrete Casting.',
      confidence: 94,
      status: 'PENDING_APPROVAL'
    },
    {
      id: 'REC-002',
      problem: 'Weather Risk Impact on Piping Alignment',
      reason: 'Regional meteorological forecast predicts 60% chance of heavy precipitation on Aug 28 at Site B.',
      supportingEvidence: 'Open trenching near P-204 is vulnerable to water accumulation before hydro testing.',
      suggestedAction: 'Expedite trench drainage pumps deployment and reschedule final alignment inspection 1 day earlier.',
      expectedImpact: 'Mitigates potential 2-day hydro testing hold.',
      confidence: 89,
      status: 'PENDING_APPROVAL'
    },
    {
      id: 'REC-003',
      problem: 'Sequential Lag Optimization on Cable Laying',
      reason: 'Electrical cable tray installation reached 100% completion 1 day ahead of schedule.',
      suggestedAction: 'Advance Cable Pulling start date to today instead of waiting for the contractual lag buffer.',
      expectedImpact: 'Compresses overall substation commissioning timeline by 1 day.',
      confidence: 96,
      status: 'APPROVED'
    }
  ]);

  const handleAction = (id, action) => {
    setRecommendations(prev => prev.map(rec => {
      if (rec.id === id) {
        return { ...rec, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' };
      }
      return rec;
    }));
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md space-y-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
          <Sparkles size={16} />
          <span>AI Decision Support Engine</span>
        </div>
        <h2 className="text-base font-black text-white leading-tight">
          Strategic Execution Recommendations
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          AI continuously correlates field evidence, schedule dependencies, and weather risks to recommend corrective interventions with human sign-off.
        </p>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-4">
        {recommendations.map(rec => (
          <div 
            key={rec.id}
            className={`bg-slate-900 border rounded-2xl p-4 shadow-xl space-y-3 transition-all ${
              rec.status === 'APPROVED' ? 'border-emerald-500/50 bg-emerald-950/10' :
              rec.status === 'REJECTED' ? 'border-red-500/50 opacity-60' :
              'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded">
                {rec.id}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                rec.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                rec.status === 'REJECTED' ? 'bg-red-950 text-red-300 border border-red-500/40' :
                'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}>
                {rec.status === 'PENDING_APPROVAL' ? 'Action Required' : rec.status}
              </span>
            </div>

            {/* Problem Title */}
            <div>
              <h3 className="text-sm font-black text-white leading-tight mb-1">
                {rec.problem}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {rec.reason}
              </p>
            </div>

            {/* Supporting Context Box */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Supporting Evidence:</span>
                <p className="text-slate-200 mt-0.5">{rec.supportingEvidence}</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Suggested Strategic Action:</span>
                <p className="text-emerald-200 mt-0.5 font-medium">{rec.suggestedAction}</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-blue-400 uppercase">Expected Impact:</span>
                <p className="text-slate-200 mt-0.5">{rec.expectedImpact}</p>
              </div>
            </div>

            {/* Confidence & Human Action Buttons */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                <ShieldCheck size={14} /> Confidence: {rec.confidence}%
              </div>

              {rec.status === 'PENDING_APPROVAL' && (user?.role === 'ADMIN' || user?.role === 'SITE_ENGINEER') ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(rec.id, 'REJECT')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-xs"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(rec.id, 'APPROVE')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg font-black text-xs shadow-md"
                  >
                    Approve Action
                  </button>
                </div>
              ) : rec.status === 'APPROVED' ? (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Action Approved & Applied
                </span>
              ) : null}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
