import React from 'react';
import { ArrowRight, Activity, GitCommit, FileCheck, ShieldAlert, Cpu, CheckSquare } from 'lucide-react';

export function LiveProjectExecution() {
  const projects = [
    { name: 'Project Alpha', sub: 'Refinery Expansion', progress: 78, status: 'At Risk', statusColor: 'text-orange-500', barColor: 'bg-emerald-500', bgBar: 'bg-emerald-50' },
    { name: 'Project Beta', sub: 'Pipeline Installation', progress: 64, status: 'On Track', statusColor: 'text-emerald-500', barColor: 'bg-blue-500', bgBar: 'bg-blue-50' },
    { name: 'Project Gamma', sub: 'Plant Modernization', progress: 41, status: 'At Risk', statusColor: 'text-orange-500', barColor: 'bg-orange-500', bgBar: 'bg-orange-50' },
    { name: 'Project Delta', sub: 'Utility Upgrade', progress: 88, status: 'On Track', statusColor: 'text-emerald-500', barColor: 'bg-emerald-500', bgBar: 'bg-emerald-50' },
  ];

  return (
    <div className="card p-5 flex flex-col h-full bg-white">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-[var(--text-primary)]">Live Project Execution</h3>
        <a href="#" className="text-xs font-bold text-blue-600 hover:underline">View All Projects</a>
      </div>
      <div className="flex flex-col gap-6">
        {projects.map((p, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-[140px]">
              <div className="text-sm font-bold text-[var(--text-primary)] leading-tight">{p.name}</div>
              <div className="text-[11px] text-[var(--text-secondary)]">{p.sub}</div>
            </div>
            <div className="flex-1 flex items-center gap-3">
              <div className={`flex-1 h-2 rounded-full ${p.bgBar}`}>
                <div className={`h-full rounded-full ${p.barColor}`} style={{ width: `${p.progress}%` }}></div>
              </div>
              <div className="w-8 text-xs font-bold text-[var(--text-primary)]">{p.progress}%</div>
            </div>
            <div className={`w-16 text-right text-[11px] font-bold ${p.statusColor}`}>{p.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanVsReality() {
  return (
    <div className="card p-5 flex flex-col h-full bg-white">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-[var(--text-primary)]">Plan vs Reality Snapshot</h3>
        <a href="#" className="text-xs font-bold text-blue-600 hover:underline">View Details</a>
      </div>
      
      <div className="flex justify-between mb-8">
        <div>
          <div className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Conflicts Detected</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">5</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Schedule Deviations</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">3</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Activities Impacted</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">12</div>
        </div>
      </div>

      <div className="relative mb-8">
        <div className="absolute top-[28px] left-6 right-6 h-[2px] bg-slate-200 z-0"></div>
        <div className="flex justify-between relative z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-bold text-blue-600">BASELINE PLAN</div>
            <div className="w-4 h-4 rounded-full border-[3px] border-emerald-500 bg-white"></div>
            <div className="text-[10px] font-medium text-[var(--text-secondary)]">Foundation</div>
          </div>
          <div className="flex flex-col items-center gap-2 mt-[18px]">
            <div className="w-4 h-4 rounded-full border-[3px] border-emerald-500 bg-white"></div>
            <div className="text-[10px] font-medium text-[var(--text-secondary)]">Equipment</div>
          </div>
          <div className="flex flex-col items-center gap-2 mt-[18px]">
            <div className="w-4 h-4 rounded-full border-[3px] border-orange-500 bg-white"></div>
            <div className="text-[10px] font-medium text-[var(--text-secondary)]">Piping</div>
          </div>
          <div className="flex flex-col items-center gap-2 mt-[18px]">
            <div className="w-4 h-4 rounded-full border-[3px] border-red-500 bg-white"></div>
            <div className="text-[10px] font-medium text-[var(--text-secondary)]">Electrical</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-bold text-purple-600">OBSERVED REALITY</div>
            <div className="w-4 h-4 rounded-full border-[3px] border-slate-300 bg-white"></div>
            <div className="text-[10px] font-medium text-[var(--text-secondary)]">Commissioning</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 text-[10px] font-bold text-[var(--text-secondary)] mt-auto">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> On Track</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div> At Risk</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Delayed</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Not Started</div>
      </div>
    </div>
  );
}

export function AiDecisionSupport() {
  return (
    <div className="card p-5 flex flex-col h-full bg-white">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-[var(--text-primary)]">AI Decision Support</h3>
        <a href="#" className="text-xs font-bold text-blue-600 hover:underline">View All (3)</a>
      </div>
      
      <div className="flex flex-col gap-4">
        
        <div className="pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Foundation Activity Delay</h4>
            </div>
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">Delay Detected</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mb-2">Delay may impact 4 dependent activities.</p>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-600">Est. Recovery: 2-3 days</span>
            <button className="text-xs font-bold px-3 py-1 bg-white border border-[var(--border-medium)] rounded shadow-sm hover:bg-slate-50">Review</button>
          </div>
        </div>

        <div className="pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Piping Activity P-204</h4>
            </div>
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Historical Pattern</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mb-2">Similar projects faced delays due to material.</p>
          <div className="flex justify-end">
            <button className="text-xs font-bold px-3 py-1 bg-white border border-[var(--border-medium)] rounded shadow-sm hover:bg-slate-50">View Pattern</button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Equipment Installation</h4>
            </div>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Resource Suggestion</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mb-2">Idle resources available from Team Delta.</p>
          <div className="flex justify-end">
            <button className="text-xs font-bold px-3 py-1 bg-white border border-[var(--border-medium)] rounded shadow-sm hover:bg-slate-50">Review</button>
          </div>
        </div>

      </div>
    </div>
  );
}

export function RecentActivityFeed() {
  return (
    <div className="card p-5 flex flex-col h-full bg-white">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-[var(--text-primary)]">Recent Activity Feed</h3>
        <a href="#" className="text-xs font-bold text-blue-600 hover:underline">View All</a>
      </div>
      
      <div className="flex flex-col gap-5 relative">
        <div className="absolute left-3 top-4 bottom-4 w-px bg-slate-200 z-0"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckSquare size={12} strokeWidth={3} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-blue-600">14:32</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">Task assigned</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Pump Foundation Excavation → Team Alpha</div>
            <div className="text-[10px] text-[var(--text-tertiary)] font-medium">Project Alpha</div>
          </div>
        </div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileCheck size={12} strokeWidth={3} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-blue-600">14:28</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">Report submitted</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Trench Backfilling by Worker W102</div>
            <div className="text-[10px] text-[var(--text-tertiary)] font-medium">Project Alpha</div>
          </div>
        </div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckSquare size={12} strokeWidth={3} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-blue-600">14:21</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">Evidence verified</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Report of Worker W102 verified</div>
            <div className="text-[10px] text-[var(--text-tertiary)] font-medium">Project Alpha</div>
          </div>
        </div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldAlert size={12} strokeWidth={3} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-blue-600">14:12</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">Risk detected</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Piping Activity P-204 is at risk</div>
            <div className="text-[10px] text-[var(--text-tertiary)] font-medium">Project Alpha</div>
          </div>
        </div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cpu size={12} strokeWidth={3} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-blue-600">14:05</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">AI recommendation generated</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Foundation Activity Delay</div>
            <div className="text-[10px] text-[var(--text-tertiary)] font-medium">Project Alpha</div>
          </div>
        </div>

      </div>
    </div>
  );
}
