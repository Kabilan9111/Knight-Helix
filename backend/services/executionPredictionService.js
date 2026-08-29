const DUMMY_DATASETS = {
  'civil-a': {
    team: { id: 'civil-a', name: 'Civil Team A', project: 'Riverfront Infrastructure' },
    productivity: 92,
    historicalProductivity: 89,
    tasks: [
      { id: 'CIV-1', name: 'Excavation', plannedFinishDate: '2026-05-28', currentProgress: 100 },
      { id: 'CIV-2', name: 'PCC Bed', plannedFinishDate: '2026-05-29', currentProgress: 100 },
      { id: 'CIV-3', name: 'Foundation Rebar Work', plannedFinishDate: '2026-06-02', currentProgress: 70 },
      { id: 'CIV-4', name: 'Formwork', plannedFinishDate: '2026-06-04', currentProgress: 40 },
      { id: 'CIV-5', name: 'Concrete Casting', plannedFinishDate: '2026-06-06', currentProgress: 20 },
      { id: 'CIV-6', name: 'Curing', plannedFinishDate: '2026-06-08', currentProgress: 0 },
      { id: 'CIV-7', name: 'Back Filling', plannedFinishDate: '2026-06-09', currentProgress: 0 },
      { id: 'CIV-8', name: 'Finishing Work', plannedFinishDate: '2026-06-10', currentProgress: 0 },
    ],
    insights: [
      "Current productivity is above the team's historical average.",
      "Foundation Rebar Work is the current execution bottleneck.",
      "If productivity drops by 15%, projected completion moves approximately 3 days later.",
      "Maintaining current productivity results in projected completion within baseline forecast."
    ],
    recommendations: [
      "Increase manpower for Formwork and Concrete Casting.",
      "Monitor Foundation Rebar Work because it has high critical-path impact.",
      "Maintain current productivity to avoid downstream schedule slippage."
    ]
  },
  'mechanical-b': {
    team: { id: 'mechanical-b', name: 'Mechanical Team B', project: 'Riverfront Infrastructure' },
    productivity: 84,
    historicalProductivity: 82,
    tasks: [
      { id: 'MEC-1', name: 'Equipment Foundation', plannedFinishDate: '2026-06-01', currentProgress: 100 },
      { id: 'MEC-2', name: 'Pump Installation', plannedFinishDate: '2026-06-05', currentProgress: 80 },
      { id: 'MEC-3', name: 'Pipe Rack Assembly', plannedFinishDate: '2026-06-10', currentProgress: 65 },
      { id: 'MEC-4', name: 'Valve Installation', plannedFinishDate: '2026-06-12', currentProgress: 35 },
      { id: 'MEC-5', name: 'Mechanical Alignment', plannedFinishDate: '2026-06-15', currentProgress: 15 },
      { id: 'MEC-6', name: 'Pressure Testing', plannedFinishDate: '2026-06-18', currentProgress: 0 },
      { id: 'MEC-7', name: 'Equipment Commissioning', plannedFinishDate: '2026-06-20', currentProgress: 0 },
    ],
    insights: [
      "Pump Installation is slightly delayed against planned progress.",
      "Valve Installation is progressing steadily.",
      "Mechanical Alignment depends heavily on the upcoming Pipe Rack Assembly completion."
    ],
    recommendations: [
      "Fast-track Pipe Rack Assembly to avoid alignment delays.",
      "Ensure Pressure Testing equipment is calibrated and ready.",
      "Review valve specifications before final installation."
    ]
  },
  'electrical-c': {
    team: { id: 'electrical-c', name: 'Electrical Team C', project: 'Riverfront Infrastructure' },
    productivity: 88,
    historicalProductivity: 90,
    tasks: [
      { id: 'ELE-1', name: 'Cable Tray Installation', plannedFinishDate: '2026-06-03', currentProgress: 100 },
      { id: 'ELE-2', name: 'Conduit Installation', plannedFinishDate: '2026-06-05', currentProgress: 90 },
      { id: 'ELE-3', name: 'Panel Installation', plannedFinishDate: '2026-06-08', currentProgress: 60 },
      { id: 'ELE-4', name: 'Cable Pulling', plannedFinishDate: '2026-06-12', currentProgress: 40 },
      { id: 'ELE-5', name: 'Termination', plannedFinishDate: '2026-06-16', currentProgress: 0 },
      { id: 'ELE-6', name: 'Earthing', plannedFinishDate: '2026-06-18', currentProgress: 0 },
      { id: 'ELE-7', name: 'Testing', plannedFinishDate: '2026-06-22', currentProgress: 0 },
      { id: 'ELE-8', name: 'Commissioning', plannedFinishDate: '2026-06-25', currentProgress: 0 },
    ],
    insights: [
      "Productivity has dipped slightly from historical 90% to 88%.",
      "Panel Installation is moving efficiently, but Cable Pulling needs attention.",
      "No critical delays identified in current workflow."
    ],
    recommendations: [
      "Check cable availability for the upcoming Cable Pulling phases.",
      "Schedule earthing inspections well in advance."
    ]
  },
  'piping-d': {
    team: { id: 'piping-d', name: 'Piping Team D', project: 'Riverfront Infrastructure' },
    productivity: 76,
    historicalProductivity: 80,
    tasks: [
      { id: 'PIP-1', name: 'Pipe Fabrication', plannedFinishDate: '2026-05-20', currentProgress: 100 },
      { id: 'PIP-2', name: 'Pipe Support Installation', plannedFinishDate: '2026-05-25', currentProgress: 90 },
      { id: 'PIP-3', name: 'Main Line Installation', plannedFinishDate: '2026-06-05', currentProgress: 75 },
      { id: 'PIP-4', name: 'Branch Line Installation', plannedFinishDate: '2026-06-10', currentProgress: 50 },
      { id: 'PIP-5', name: 'Valve Installation', plannedFinishDate: '2026-06-15', currentProgress: 20 },
      { id: 'PIP-6', name: 'Hydro Testing', plannedFinishDate: '2026-06-20', currentProgress: 0 },
      { id: 'PIP-7', name: 'Flushing', plannedFinishDate: '2026-06-22', currentProgress: 0 },
      { id: 'PIP-8', name: 'Final Inspection', plannedFinishDate: '2026-06-25', currentProgress: 0 },
    ],
    insights: [
      "Team productivity (76%) is significantly below the 80% historical average.",
      "Main Line Installation faces a high risk of slipping past planned finish.",
      "A 15% decrease in speed will severely impact Hydro Testing timelines."
    ],
    recommendations: [
      "Investigate root cause of productivity drop.",
      "Deploy additional welders to Main Line Installation.",
      "Optimize pipe transport logistics on site."
    ]
  }
};

const getDummyTeamData = (teamId) => {
  return DUMMY_DATASETS[teamId] || DUMMY_DATASETS['civil-a'];
};

const addDays = (dateStr, daysToAdd) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
};

const formatDateDisplay = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

const getTeamVisualizationData = (teamId) => {
  const rawData = getDummyTeamData(teamId);
  
  // Calculate Task states
  const totalTasks = rawData.tasks.length;
  const completed = rawData.tasks.filter(t => t.currentProgress === 100).length;
  const inProgress = rawData.tasks.filter(t => t.currentProgress > 0 && t.currentProgress < 100).length;
  const remaining = totalTasks - completed - inProgress;

  const baselineProductivity = rawData.productivity / 100; // e.g. 0.92
  const slowProductivity = baselineProductivity * 0.85;
  const fastProductivity = baselineProductivity * 1.15;

  let totalBaselineRemainingDays = 0;
  let totalSlowRemainingDays = 0;
  let totalFastRemainingDays = 0;

  // We'll simulate a start date based on today
  const today = new Date('2026-05-15');
  let currentTaskBaselineStart = new Date(today);
  let currentTaskSlowStart = new Date(today);
  let currentTaskFastStart = new Date(today);

  const processedTasks = rawData.tasks.map((task, index) => {
    const remainingProgress = 100 - task.currentProgress;
    
    // Deterministic calculation: 
    // Let's assume each task takes exactly 5 days if productivity is 1.0 (100%)
    // The days taken = (Remaining Progress / 100) * 5 / productivity
    // Note: We use abstract '5' as base effort for dummy calculation
    const baseEffortDays = 5; 
    
    let baselineDays = 0;
    let slowScenarioDays = 0;
    let fastScenarioDays = 0;

    let baselineCompletionDate = task.plannedFinishDate;
    let slowCompletionDate = task.plannedFinishDate;
    let fastCompletionDate = task.plannedFinishDate;

    let delayRisk = "Low";
    let confidenceScore = 95;

    if (remainingProgress > 0) {
      baselineDays = Math.ceil(((remainingProgress / 100) * baseEffortDays) / baselineProductivity);
      slowScenarioDays = Math.ceil(((remainingProgress / 100) * baseEffortDays) / slowProductivity);
      fastScenarioDays = Math.ceil(((remainingProgress / 100) * baseEffortDays) / fastProductivity);

      totalBaselineRemainingDays += baselineDays;
      totalSlowRemainingDays += slowScenarioDays;
      totalFastRemainingDays += fastScenarioDays;

      currentTaskBaselineStart.setDate(currentTaskBaselineStart.getDate() + baselineDays);
      currentTaskSlowStart.setDate(currentTaskSlowStart.getDate() + slowScenarioDays);
      currentTaskFastStart.setDate(currentTaskFastStart.getDate() + fastScenarioDays);

      baselineCompletionDate = currentTaskBaselineStart.toISOString().split('T')[0];
      slowCompletionDate = currentTaskSlowStart.toISOString().split('T')[0];
      fastCompletionDate = currentTaskFastStart.toISOString().split('T')[0];

      if (slowScenarioDays > baselineDays + 2) delayRisk = "High";
      else if (slowScenarioDays > baselineDays) delayRisk = "Medium";
      
      confidenceScore = 95 - Math.floor(Math.random() * 15); // Slight deterministic random feel
    } else {
       confidenceScore = 100;
    }

    return {
      taskId: task.id,
      taskName: task.name,
      plannedFinishDate: task.plannedFinishDate,
      currentProgress: task.currentProgress,
      remainingProgress,
      baselineDays,
      slowScenarioDays,
      fastScenarioDays,
      baselineCompletionDate,
      slowCompletionDate,
      fastCompletionDate,
      confidenceScore,
      criticalPathImpact: index >= totalTasks - 3 ? "High" : "Medium",
      delayRisk
    };
  });

  const summary = {
    totalTasks,
    completed,
    inProgress,
    remaining,
    teamProductivity: rawData.productivity
  };

  const projectCompletionBaseline = addDays(today.toISOString().split('T')[0], totalBaselineRemainingDays);
  const projectCompletionSlow = addDays(today.toISOString().split('T')[0], totalSlowRemainingDays);
  const projectCompletionFast = addDays(today.toISOString().split('T')[0], totalFastRemainingDays);

  const scenarios = {
    slow: {
      id: 'slow',
      label: "IF WORK SLOWS DOWN",
      modifier: -15,
      expectedCompletionDays: totalSlowRemainingDays,
      estimatedCompletionDate: formatDateDisplay(projectCompletionSlow),
      delayRisk: "HIGH",
      criticalPathImpact: "HIGH"
    },
    baseline: {
      id: 'baseline',
      label: "CURRENT SPEED",
      modifier: 0,
      expectedCompletionDays: totalBaselineRemainingDays,
      estimatedCompletionDate: formatDateDisplay(projectCompletionBaseline),
      delayRisk: "MEDIUM",
      criticalPathImpact: "MEDIUM"
    },
    fast: {
      id: 'fast',
      label: "IF SPEED INCREASES",
      modifier: 15,
      expectedCompletionDays: totalFastRemainingDays,
      estimatedCompletionDate: formatDateDisplay(projectCompletionFast),
      delayRisk: "LOW",
      criticalPathImpact: "LOW"
    }
  };

  // Generate deterministic productivity graph history and projections
  const productivityHistory = [];
  // Last 7 days history
  let p = rawData.historicalProductivity;
  for (let i = 1; i <= 7; i++) {
    productivityHistory.push({
      day: `Day ${i}`,
      history: Math.max(50, Math.min(100, Math.round(p))),
      slow: null,
      baseline: null,
      fast: null
    });
    // Random walk slightly towards current productivity
    p += (rawData.productivity - p) * 0.3 + (Math.random() * 4 - 2); 
  }
  
  // Future 7 days projections
  const lastHistory = productivityHistory[6].history;
  for (let i = 8; i <= 14; i++) {
    productivityHistory.push({
      day: `Day ${i}`,
      history: null,
      slow: Math.max(50, Math.min(100, Math.round(lastHistory * 0.85))),
      baseline: Math.max(50, Math.min(100, Math.round(lastHistory * 1.0))),
      fast: Math.max(50, Math.min(100, Math.round(lastHistory * 1.15))),
    });
  }

  return {
    team: rawData.team,
    project: { id: 'PRJ-1', name: rawData.team.project },
    summary,
    scenarios,
    tasks: processedTasks,
    productivityHistory,
    insights: rawData.insights,
    recommendations: rawData.recommendations,
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  getTeamVisualizationData
};
