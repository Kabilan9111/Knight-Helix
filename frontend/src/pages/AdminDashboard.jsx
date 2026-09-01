import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import KpiCard from '../components/dashboard/KpiCard';
import TaskKanbanBoard from '../components/dashboard/TaskKanbanBoard';
import AssignTaskPanel from '../components/dashboard/AssignTaskPanel';
import AIPlannerModal from '../components/ai-planner/AIPlannerModal';
import { 
  LiveProjectExecution, PlanVsReality, AiDecisionSupport, RecentActivityFeed 
} from '../components/dashboard/BottomCards';
import { useSocket } from '../context/SocketContext';
import { FolderOpen, CheckSquare, Clock, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [aiPlannerOpen, setAiPlannerOpen] = useState(false);
  const [aiPlannerContext, setAiPlannerContext] = useState({});
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const socket = useSocket();
  const token = localStorage.getItem('sanchalan_token');

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [tasksRes, projRes, workRes] = await Promise.all([
        fetch(`${''}/api/tasks`, { headers }),
        fetch(`${''}/api/projects`, { headers }),
        fetch(`${''}/api/workers`, { headers })
      ]);
      
      if (tasksRes.status === 401 || tasksRes.status === 403) {
        navigate('/login');
        return;
      }
      
      const [tasksData, projData, workData] = await Promise.all([
        tasksRes.json(), projRes.json(), workRes.json()
      ]);

      // Seed dummy tasks if none exist (for demonstration of the Kanban UI)
      if (tasksData.length === 0) {
        const dummyTasks = [
          { taskId: 'EQT-102', title: 'Equipment Installation', status: 'Pending', priority: 'Medium', projectName: 'Project Charlie', workerName: 'Team Alpha', startDate: '25 Aug 2026', dueDate: '28 Aug 2026' },
          { taskId: 'ELE-205', title: 'Electrical Cable Laying', status: 'Pending', priority: 'Medium', projectName: 'Project Beta', workerName: 'Team Delta', startDate: '26 Aug 2026', dueDate: '30 Aug 2026' },
          { taskId: 'CIV-309', title: 'Concrete Blinding', status: 'Pending', priority: 'Low', projectName: 'Project Gamma', workerName: 'Team Echo', startDate: '26 Aug 2026', dueDate: '29 Aug 2026' },
          
          { taskId: 'CIV-101', title: 'Pump Foundation Excavation', status: 'In Progress', progress: 65, priority: 'High', projectName: 'Project Alpha', workerName: 'Team Alpha', startDate: '23 Aug 2026', dueDate: '28 Aug 2026' },
          { taskId: 'PIP-204', title: 'Piping Section P-204', status: 'In Progress', progress: 30, priority: 'High', projectName: 'Project Alpha', workerName: 'Team Bravo', startDate: '24 Aug 2026', dueDate: '29 Aug 2026' },
          { taskId: 'STR-110', title: 'Steel Structure Erection', status: 'In Progress', progress: 80, priority: 'Medium', projectName: 'Project Beta', workerName: 'Team Foxtrot', startDate: '22 Aug 2026', dueDate: '27 Aug 2026' },
          
          { taskId: 'CIV-115', title: 'Trench Backfilling', status: 'Pending Verification', priority: 'High', projectName: 'Project Alpha', workerName: 'Team Alpha', startDate: '25 Aug 2026', dueDate: 'Waiting' },
          { taskId: 'CIV-310', title: 'Concrete Pouring', status: 'Pending Verification', priority: 'Medium', projectName: 'Project Gamma', workerName: 'Team Echo', startDate: '25 Aug 2026', dueDate: 'Waiting' },
          { taskId: 'PIP-208', title: 'Joint Welding', status: 'Pending Verification', priority: 'Medium', projectName: 'Project Beta', workerName: 'Team Bravo', startDate: '25 Aug 2026', dueDate: 'Waiting' },
          
          { taskId: 'GEN-001', title: 'Site Mobilization', status: 'Completed', priority: 'Medium', projectName: 'Project Alpha', workerName: 'Team Alpha', startDate: '24 Aug 2026', dueDate: 'Verified' },
          { taskId: 'GEN-002', title: 'Temporary Fencing', status: 'Completed', priority: 'Medium', projectName: 'Project Alpha', workerName: 'Team Alpha', startDate: '24 Aug 2026', dueDate: 'Verified' },
          { taskId: 'CIV-003', title: 'Survey & Marking', status: 'Completed', priority: 'Medium', projectName: 'Project Alpha', workerName: 'Team Alpha', startDate: '23 Aug 2026', dueDate: 'Verified' },
        ];
        setTasks(dummyTasks);
      } else {
        setTasks(tasksData);
      }
      
      setProjects(projData);
      setWorkers(workData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('task_created', fetchData);
      socket.on('task_updated', fetchData);
      return () => {
        socket.off('task_created', fetchData);
        socket.off('task_updated', fetchData);
      };
    }
  }, [socket]);

  const handleAssignTask = async (taskData) => {
    try {
      await fetch(`${''}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      fetchData(); // Refresh tasks
    } catch (err) {
      console.error('Failed to assign task:', err);
    }
  };

  const handleAssignWithAI = (contextData) => {
    // Enrich contextData with full names
    const enrichedContext = { ...contextData };
    if (contextData.projectId) {
      const p = projects.find(x => x.projectId === contextData.projectId);
      if (p) enrichedContext.projectName = p.name;
    }
    if (contextData.assignedWorkerId) {
      const w = workers.find(x => x.workerId === contextData.assignedWorkerId);
      if (w) enrichedContext.workerName = w.name;
    }
    setAiPlannerContext(enrichedContext);
    setAiPlannerOpen(true);
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center h-full">Loading Dashboard...</div>;
  }

  // Calculate KPIs
  const activeProjects = projects.length || 8;
  const assignedTasks = tasks.filter(t => t.status === 'ASSIGNED' || t.status === 'Pending').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'In Progress').length;
  const pendingVerification = tasks.filter(t => t.status === 'VERIFICATION_PENDING' || t.status === 'SUBMITTED' || t.status === 'Pending Verification' || t.status === 'At Risk').length;
  const atRiskTasks = 11; // Dummy static
  const evidenceConfidence = "94.2%"; // Dummy static

  // Apply sidebar filter
  const filteredTasks = tasks.filter(t => {
    if (filter === 'assigned') return t.status === 'ASSIGNED' || t.status === 'Pending';
    if (filter === 'in-progress') return t.status === 'IN_PROGRESS' || t.status === 'In Progress';
    if (filter === 'pending-verification') return t.status === 'VERIFICATION_PENDING' || t.status === 'SUBMITTED' || t.status === 'Pending Verification' || t.status === 'At Risk';
    if (filter === 'completed') return t.status === 'COMPLETED' || t.status === 'Completed';
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopHeader />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-surface-2)] p-6 flex flex-col gap-6">
        
        {/* Dashboard Title Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Real-time overview of project execution</p>
          </div>
        </div>

        {/* 1. KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard 
            title="Active Projects" value={activeProjects < 10 ? `0${activeProjects}` : activeProjects} trend="2" trendLabel="this month" isPositive={true}
            icon={FolderOpen} colorClass="text-purple-600" bgColorClass="bg-purple-100" 
          />
          <KpiCard 
            title="Assigned Tasks" value={assignedTasks} trend="8" trendLabel="today" isPositive={true}
            icon={CheckSquare} colorClass="text-blue-600" bgColorClass="bg-blue-100" 
          />
          <KpiCard 
            title="In Progress" value={inProgress} trend="3" trendLabel="today" isPositive={true}
            icon={Clock} colorClass="text-blue-600" bgColorClass="bg-blue-100" 
          />
          <KpiCard 
            title="Pending Verification" value={pendingVerification} trend="2" trendLabel="today" isPositive={false}
            icon={AlertTriangle} colorClass="text-orange-500" bgColorClass="bg-orange-100" 
          />
          <KpiCard 
            title="At Risk Tasks" value={atRiskTasks} trend="4" trendLabel="today" isPositive={false}
            icon={ShieldCheck} colorClass="text-red-500" bgColorClass="bg-red-100" 
          />
          <KpiCard 
            title="Evidence Confidence" value={evidenceConfidence} trend="3.6%" trendLabel="this week" isPositive={true}
            icon={CheckCircle2} colorClass="text-emerald-500" bgColorClass="bg-emerald-100" 
          />
        </div>

        {/* 2 & 3. Task Kanban Board & Assign Task Panel */}
        <div className="flex flex-col xl:flex-row gap-6 h-[720px]">
          <TaskKanbanBoard tasks={filteredTasks} />
          <AssignTaskPanel 
            projects={projects} 
            workers={workers} 
            onAssign={handleAssignTask} 
            onAssignWithAI={handleAssignWithAI}
          />
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <LiveProjectExecution />
          <PlanVsReality />
          <AiDecisionSupport />
          <RecentActivityFeed />
        </div>

      </div>

      {aiPlannerOpen && (
        <AIPlannerModal 
          onClose={() => setAiPlannerOpen(false)} 
          contextData={aiPlannerContext}
          onTaskCreated={() => {
            fetchData();
          }}
        />
      )}

    </div>
  );
}
