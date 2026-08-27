import React from 'react';
import TopHeader from '../../components/TopHeader';
import { PlanVsReality, AiDecisionSupport } from '../../components/dashboard/BottomCards';
import { Lightbulb, AlertTriangle, ShieldCheck, Database, GitMerge, LineChart } from 'lucide-react';

export default function OwnerIntelligence() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <TopHeader />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 flex flex-col gap-8">
        
        {/* Title Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Execution Intelligence</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium tracking-wide uppercase">AI-Driven Risk & Analysis</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200 shadow-sm">
            <Lightbulb size={14} />
            <span>AI ANALYSIS ACTIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Left: Executive Summary & AI Insights */}
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg"><ShieldCheck size={20} className="text-emerald-500"/> Executive Status</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Execution Status</h4>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                    "Project Alpha is currently progressing at <strong className="text-emerald-600">72%</strong> against a planned <strong className="text-slate-900">75%</strong>. Overall execution remains stable, though localized resource constraints have been identified."
                  </p>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Signal</h4>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed bg-orange-50 p-4 rounded-lg border border-orange-100">
                    "Electrical Cable Laying is showing early delay risk. The current run rate suggests a potential 2-day deficit against the baseline schedule."
                  </p>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Impact Assessment</h4>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                    "Continued delay may affect downstream commissioning activities and block the handover sequence for Sector B."
                  </p>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommendation</h4>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed bg-purple-50 p-4 rounded-lg border border-purple-100">
                    "Prioritize electrical execution during the next available execution window. Consider reallocating idle resources from Team Delta."
                  </p>
                </div>
              </div>
            </div>

            <div className="h-96">
              <PlanVsReality />
            </div>
          </div>

          {/* Top Right: Risk, Delay, and Recommendations */}
          <div className="flex flex-col gap-8">
            
            {/* Risk Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg"><AlertTriangle size={20} className="text-orange-500"/> Risk & Delay Overview</h3>
              
              <div className="flex flex-col gap-4">
                <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-4">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={18} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900">Electrical Cable Laying</h4>
                      <span className="text-[10px] font-bold text-red-600 border border-red-200 px-2 py-0.5 rounded bg-white">HIGH RISK</span>
                    </div>
                    <p className="text-xs text-slate-600">2 days behind baseline schedule.</p>
                  </div>
                </div>

                <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 flex items-start gap-4">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><LineChart size={18} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900">Piping Section P-204</h4>
                      <span className="text-[10px] font-bold text-orange-600 border border-orange-200 px-2 py-0.5 rounded bg-white">MEDIUM RISK</span>
                    </div>
                    <p className="text-xs text-slate-600">Material staging bottleneck identified.</p>
                  </div>
                </div>
                
                <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 flex items-start gap-4">
                  <div className="p-2 bg-slate-200 text-slate-600 rounded-lg"><ShieldCheck size={18} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900">Equipment Installation</h4>
                      <span className="text-[10px] font-bold text-slate-600 border border-slate-200 px-2 py-0.5 rounded bg-white">LOW RISK</span>
                    </div>
                    <p className="text-xs text-slate-600">Progressing normally, pending final verification.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[450px]">
              <AiDecisionSupport />
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
