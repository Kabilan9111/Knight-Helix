import React, { useState } from 'react';
import { Calendar, MoreVertical, CheckCircle2, AlertCircle, Clock, CheckSquare, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TaskKanbanBoard({ tasks }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Tasks');
  const tabs = ['My View', 'All Tasks', 'Today', 'This Week', 'Overdue'];

  const displayTasks = tasks.filter(t => {
    if (activeTab === 'My View') return t.workerName === 'Team Alpha' || t.workerName === 'Team Bravo';
    if (activeTab === 'Today') return t.startDate?.includes('26 Aug') || t.startDate?.includes('25 Aug');
    if (activeTab === 'This Week') return true;
    if (activeTab === 'Overdue') return t.dueDate === 'Waiting' || t.dueDate?.includes('22 Aug');
    return true; // 'All Tasks'
  });

  const columns = [
    { id: 'ASSIGNED', label: 'ASSIGNED', color: 'text-blue-500', count: displayTasks.filter(t => t.status === 'ASSIGNED' || t.status === 'Pending').length },
    { id: 'IN_PROGRESS', label: 'IN PROGRESS', color: 'text-blue-600', count: displayTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'In Progress').length },
    { id: 'SUBMITTED', label: 'PENDING VERIFICATION', color: 'text-orange-500', count: displayTasks.filter(t => t.status === 'SUBMITTED' || t.status === 'Pending Verification' || t.status === 'At Risk').length },
    { id: 'Completed', label: 'COMPLETED', color: 'text-emerald-500', count: displayTasks.filter(t => t.status === 'Completed').length }
  ];

  const getPriorityColor = (p) => {
    if (p === 'High') return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (p === 'Medium') return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] overflow-hidden">
      
      {/* Header Tabs */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Task Execution Board</h2>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {tabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 -mb-4 transition-colors ${activeTab === tab ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border-medium)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filters
          </button>
          <select className="px-3 py-1.5 text-sm font-medium border border-[var(--border-medium)] rounded-md text-[var(--text-secondary)] bg-transparent outline-none">
            <option>All Projects</option>
            <option>Project Alpha</option>
          </select>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 flex overflow-x-auto p-4 gap-4 bg-[var(--bg-surface-2)]">
        {columns.map(col => (
          <div key={col.id} className="w-[300px] flex-shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className={`text-[11px] font-bold tracking-wider ${col.color}`}>{col.label}</span>
              <span className={`text-xs font-bold ${col.color} bg-white px-2 py-0.5 rounded-full shadow-sm`}>{col.count}</span>
            </div>
            
            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar h-[600px] pb-4">
              {displayTasks.filter(t => {
                if (col.id === 'SUBMITTED') return t.status === 'SUBMITTED' || t.status === 'Pending Verification' || t.status === 'At Risk';
                if (col.id === 'ASSIGNED') return t.status === 'ASSIGNED' || t.status === 'Pending';
                if (col.id === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'In Progress';
                return t.status === col.id;
              }).map(task => (
                <div 
                  key={task.taskId} 
                  onClick={() => navigate(`/admin/tasks/${task.taskId}`)}
                  className="bg-white border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-1 relative z-10">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{task.title}</h4>
                    <button className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)] font-medium mb-2">{task.taskId}</div>
                  
                  <div className="text-xs text-[var(--text-secondary)] mb-3">{task.projectName || 'Project Alpha'}</div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)] border border-[var(--border-medium)]">
                      {task.workerName ? task.workerName.charAt(0) : 'T'}
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{task.workerName || 'Team Alpha'}</span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-1.5 rounded">+1</span>
                  </div>

                  {col.id === 'In Progress' && task.progress > 0 && (
                    <div className="mb-4 relative z-10">
                      <div className="flex justify-between mb-1 items-center">
                        <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                          <ShieldCheck size={12}/> AI VERIFIED
                        </span>
                        <span className="text-xs font-bold text-indigo-800">{task.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${task.progress}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 mb-4 relative z-10">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] font-medium">
                      <Calendar size={12} className="text-[var(--text-tertiary)]" /> 
                      {col.id === 'Completed' ? 'Completed: ' : 'Started: '}{task.startDate || '25 Aug 2026'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] font-medium">
                      <Clock size={12} className="text-[var(--text-tertiary)]" /> 
                      {col.id === 'Completed' ? <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> Verified</span> : `Due: ${task.dueDate || '28 Aug 2026'}`}
                    </div>
                  </div>

                  {col.id !== 'Completed' && (
                    <div className="flex justify-end">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority || 'Medium'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {col.id === 'SUBMITTED' && (
                <button className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors mt-2">
                  View All ({col.count})
                </button>
              )}
              {col.id === 'Completed' && (
                <button className="text-sm font-bold text-emerald-500 hover:text-emerald-600 transition-colors mt-2">
                  View All ({col.count})
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
