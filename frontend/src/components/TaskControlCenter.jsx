import React, { useState } from 'react';
import { format } from 'date-fns';
import { Filter, ChevronDown, MoreHorizontal, FileText } from 'lucide-react';

export default function TaskControlCenter({ tasks }) {
  const [filter, setFilter] = useState('All');

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'High': return <div className="badge badge-danger"><div className="badge-dot"></div>HIGH</div>;
      case 'Medium': return <div className="badge badge-warning"><div className="badge-dot"></div>MED</div>;
      default: return <div className="badge badge-info"><div className="badge-dot"></div>LOW</div>;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed': return <div className="badge badge-success"><div className="badge-dot"></div>COMPLETED</div>;
      case 'In Progress': return <div className="badge badge-info"><div className="badge-dot"></div>IN PROGRESS</div>;
      case 'At Risk': return <div className="badge badge-warning"><div className="badge-dot"></div>AT RISK</div>;
      case 'Overdue': return <div className="badge badge-danger"><div className="badge-dot"></div>OVERDUE</div>;
      default: return <div className="badge badge-neutral"><div className="badge-dot"></div>{status ? status.toUpperCase() : 'PENDING'}</div>;
    }
  };

  const filteredTasks = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="card flex-1 flex flex-col overflow-hidden">
      
      <div className="px-6 py-4 flex justify-between items-end border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-h3">Task Control Center</h3>
          <p className="text-body-small mt-0.5">Monitor and manage field execution.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="btn btn-secondary py-1.5 px-3 text-xs">
            <Filter size={14} /> Filter
          </button>
          <div className="relative">
            <select 
              className="appearance-none bg-[var(--bg-surface-1)] border border-[var(--border-medium)] rounded text-xs px-3 py-1.5 pr-8 text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] transition-colors cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="At Risk">At Risk</option>
              <option value="Overdue">Overdue</option>
              <option value="Completed">Completed</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[var(--bg-surface-1)] shadow-sm z-10">
            <tr>
              <th className="px-6 py-3 border-b border-[var(--border-subtle)] text-caption">Task</th>
              <th className="px-6 py-3 border-b border-[var(--border-subtle)] text-caption">Project / Site</th>
              <th className="px-6 py-3 border-b border-[var(--border-subtle)] text-caption">Worker</th>
              <th className="px-6 py-3 border-b border-[var(--border-subtle)] text-caption">Priority</th>
              <th className="px-6 py-3 border-b border-[var(--border-subtle)] text-caption">Status</th>
              <th className="px-6 py-3 border-b border-[var(--border-subtle)] text-caption">Progress</th>
              <th className="px-6 py-3 border-b border-[var(--border-subtle)] text-caption">Due Date</th>
              <th className="px-6 py-3 border-b border-[var(--border-subtle)] text-caption text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-20 text-center text-[var(--text-tertiary)]">
                  <FileText size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No tasks found matching criteria.</p>
                </td>
              </tr>
            ) : filteredTasks.map(task => (
              <tr key={task.taskId} className="hover:bg-[var(--bg-surface-3)] transition-colors duration-150 group cursor-pointer">
                
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{task.title}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">{task.taskId}</div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-[var(--text-primary)]">{task.projectName || 'N/A'}</div>
                  <div className="text-body-small">{task.site || 'N/A'}</div>
                </td>
                
                <td className="px-6 py-4">
                  {task.workerName ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-surface-3)] border border-[var(--border-medium)] flex items-center justify-center text-[9px] font-bold text-[var(--text-secondary)]">
                        {task.workerName.charAt(0)}
                      </div>
                      <span className="text-sm text-[var(--text-secondary)] font-medium group-hover:text-[var(--text-primary)] transition-colors">{task.workerName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--text-tertiary)] italic">Unassigned</span>
                  )}
                </td>
                
                <td className="px-6 py-4">{getPriorityBadge(task.priority)}</td>
                <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-metric text-xs w-8 text-[var(--text-secondary)]">{task.progress}%</span>
                    <div className="progress-bg w-20 h-1.5 shadow-inner">
                      <div className="progress-fill shadow-[0_0_8px_var(--accent-primary-subtle)]" style={{ width: `${task.progress}%` }}></div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <span className="text-sm text-[var(--text-secondary)] font-medium">
                    {task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy') : 'N/A'}
                  </span>
                </td>
                
                <td className="px-6 py-4 text-right">
                  <button className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
