import React from 'react';
import { Activity, Calendar as CalendarIcon, Zap } from 'lucide-react';

export default function ProjectHealthPanel({ stats }) {
  const activities = [
    { id: 1, user: 'Arun Kumar', action: 'Uploaded field evidence for Pump Foundation', time: '8 min ago' },
    { id: 2, user: 'System', action: 'Task TASK-1029 priority elevated to HIGH', time: '21 min ago' },
    { id: 3, user: 'Ramesh Singh', action: 'Marked Pipeline Check as Complete', time: '42 min ago' },
  ];

  const total = stats.inProgress + stats.atRisk + stats.overdue || 1; 
  const onTrackPct = Math.round((stats.inProgress / total) * 100) || 100;
  const atRiskPct = Math.round((stats.atRisk / total) * 100) || 0;
  const overduePct = Math.round((stats.overdue / total) * 100) || 0;

  return (
    <aside className="w-[340px] flex-shrink-0 bg-[var(--bg-surface-1)] border-l border-[var(--border-subtle)] flex flex-col hidden xl:flex overflow-hidden">
      
      <div className="flex-1 overflow-y-auto px-6 py-8">
        
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={14} className="text-[var(--accent-primary)]" />
            <h3 className="text-caption text-[var(--text-primary)]">Project Health</h3>
          </div>
          
          <div className="card p-5">
            <div className="flex flex-col gap-4">
              
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-sm font-medium text-[var(--text-primary)]">On Track</span>
                  <span className="text-metric text-xs text-[var(--text-secondary)]">{onTrackPct}%</span>
                </div>
                <div className="progress-bg h-1.5">
                  <div className="progress-fill bg-[var(--status-success)]" style={{ width: `${onTrackPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-sm font-medium text-[var(--text-primary)]">At Risk</span>
                  <span className="text-metric text-xs text-[var(--text-secondary)]">{atRiskPct}%</span>
                </div>
                <div className="progress-bg h-1.5">
                  <div className="progress-fill bg-[var(--status-warning)]" style={{ width: `${atRiskPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Delayed</span>
                  <span className="text-metric text-xs text-[var(--text-secondary)]">{overduePct}%</span>
                </div>
                <div className="progress-bg h-1.5">
                  <div className="progress-fill bg-[var(--status-critical)]" style={{ width: `${overduePct}%` }}></div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Zap size={14} className="text-[var(--accent-secondary)]" />
            <h3 className="text-caption text-[var(--text-primary)]">Recent Activity</h3>
          </div>
          
          <div className="relative border-l border-[var(--border-medium)] ml-2.5">
            {activities.map((activity) => (
              <div key={activity.id} className="relative pl-6 pb-6 last:pb-0 group">
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--bg-surface-2)] border-[2px] border-[var(--border-strong)] group-hover:border-[var(--accent-primary)] transition-colors"></div>
                
                <div className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{activity.user}</div>
                <div className="text-body-small leading-snug mb-2">{activity.action}</div>
                <div className="text-caption text-[var(--text-tertiary)]">{activity.time}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-5">
            <CalendarIcon size={14} className="text-[var(--status-info)]" />
            <h3 className="text-caption text-[var(--text-primary)]">Upcoming Deadlines</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="surface-2 p-3 rounded-md border-l-2 border-l-[var(--status-critical)] group hover:bg-[var(--bg-surface-3)] transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Pipeline Inspection</span>
                <span className="badge badge-danger text-[9px] border-none px-1.5 py-0">Tomorrow</span>
              </div>
              <div className="text-body-small text-[var(--text-tertiary)]">Block A - Sector 4</div>
            </div>
            
            <div className="surface-2 p-3 rounded-md border-l-2 border-l-[var(--status-warning)] group hover:bg-[var(--bg-surface-3)] transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Pump Foundation</span>
                <span className="badge badge-warning text-[9px] border-none px-1.5 py-0">2 days</span>
              </div>
              <div className="text-body-small text-[var(--text-tertiary)]">Main Facility</div>
            </div>
          </div>
        </section>

      </div>
    </aside>
  );
}
