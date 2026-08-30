const db = require('../db');
const { parse, isValid, differenceInDays, addDays, format } = require('date-fns');

function parseDateString(dateStr) {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (!isNaN(d)) return d;
  try {
    d = parse(dateStr, 'dd MMM yyyy', new Date());
    if (isValid(d)) return d;
    d = parse(dateStr, 'dd MMMM yyyy', new Date());
    if (isValid(d)) return d;
  } catch (e) {}
  return null;
}

function calculateProjectRisk(projectId, simulateActivityId = null, simulateDelayDays = 0) {
  // 1. Fetch Data
  const project = db.prepare('SELECT * FROM projects WHERE projectId = ?').get(projectId);
  if (!project) return null;

  const tasks = db.prepare('SELECT * FROM tasks WHERE projectId = ?').all(projectId);

  // Fetch only workers assigned to these tasks
  const workers = db.prepare(`
    SELECT DISTINCT w.* 
    FROM workers w
    JOIN tasks t ON w.workerId = t.assignedWorkerId
    WHERE t.projectId = ?
  `).all(projectId);

  const activities = db.prepare(`
    SELECT a.*, t.assignedWorkerId
    FROM task_activities a
    JOIN tasks t ON a.taskId = t.taskId
    WHERE t.projectId = ?
  `).all(projectId);

  const dependencies = db.prepare('SELECT * FROM activity_dependencies WHERE projectId = ?').all(projectId);

  const verifications = db.prepare(`
    SELECT v.* 
    FROM ai_evidence_verifications v
    JOIN tasks t ON v.taskId = t.taskId
    WHERE t.projectId = ?
  `).all(projectId);

  // 2. Process Activities and Build DAG
  const activityMap = new Map();
  const graph = new Map(); 
  
  activities.forEach(act => {
    const verif = verifications.find(v => v.matchedActivityId === act.activityId || v.activityId === act.activityId);
    activityMap.set(act.activityId, {
      ...act,
      parsedStartDate: parseDateString(act.startDate),
      parsedEndDate: parseDateString(act.endDate),
      verification: verif,
      successors: [],
      predecessors: [],
      projectedEndDate: parseDateString(act.endDate),
      currentDelay: 0,
      riskLevel: 'LOW',
      riskFactors: [],
      isCriticalRipple: false,
      downstreamImpactCount: 0
    });
    graph.set(act.activityId, []);
  });

  dependencies.forEach(dep => {
    if (activityMap.has(dep.predecessorActivityId) && activityMap.has(dep.successorActivityId)) {
      graph.get(dep.predecessorActivityId).push(dep);
      activityMap.get(dep.predecessorActivityId).successors.push(dep);
      activityMap.get(dep.successorActivityId).predecessors.push(dep);
    }
  });

  // 3. Initial Deterministic Risk Assessment
  const now = new Date();
  for (const [id, node] of activityMap.entries()) {
    let delayDays = 0;
    if (node.status === 'COMPLETED' || node.status === 'VERIFIED') {
      node.riskLevel = 'LOW';
      node.riskFactors.push({ factor: 'Status', value: 'Completed' });
      continue;
    }
    if (node.status === 'MISSED' || node.missedAt) {
      delayDays = node.parsedEndDate ? differenceInDays(now, node.parsedEndDate) : 1;
      if (delayDays < 1) delayDays = 1;
      node.riskFactors.push({ factor: 'Missed Deadline', value: 'YES' });
    } else {
      node.riskFactors.push({ factor: 'Missed Deadline', value: 'NO' });
    }
    if (node.parsedEndDate && node.status !== 'COMPLETED' && node.status !== 'VERIFIED') {
      const daysUntilEnd = differenceInDays(node.parsedEndDate, now);
      if (daysUntilEnd < 0) {
        const daysLate = Math.abs(daysUntilEnd);
        delayDays = Math.max(delayDays, daysLate);
        node.riskFactors.push({ factor: 'Schedule Variance', value: `Late by ${daysLate} days` });
      } else {
        node.riskFactors.push({ factor: 'Schedule Variance', value: 'On Track' });
      }
    }
    if (node.parsedStartDate && node.parsedEndDate && node.status === 'IN_PROGRESS') {
      const totalDuration = differenceInDays(node.parsedEndDate, node.parsedStartDate) || 1;
      const elapsed = differenceInDays(now, node.parsedStartDate);
      const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      const progressDiff = node.progress - expectedProgress;
      node.riskFactors.push({ factor: 'Progress Variance', value: `${progressDiff > 0 ? '+' : ''}${Math.round(progressDiff)}%` });
      if (progressDiff < -20 && delayDays === 0) delayDays = 1;
    } else {
       node.riskFactors.push({ factor: 'Progress Variance', value: 'Not available' });
    }
    node.currentDelay = delayDays;
  }

  // 4. Simulate
  if (simulateActivityId && simulateDelayDays > 0 && activityMap.has(simulateActivityId)) {
    const node = activityMap.get(simulateActivityId);
    node.currentDelay = simulateDelayDays;
    node.riskFactors.push({ factor: 'SIMULATION OVERRIDE', value: `+${simulateDelayDays} days` });
  }

  // 5. Ripple Propagation
  const inDegree = new Map();
  for (const id of activityMap.keys()) inDegree.set(id, 0);
  for (const [u, deps] of graph.entries()) {
    for (const dep of deps) inDegree.set(dep.successorActivityId, inDegree.get(dep.successorActivityId) + 1);
  }
  const queue = [];
  for (const [id, deg] of inDegree.entries()) if (deg === 0) queue.push(id);
  const sortedNodes = [];
  while (queue.length > 0) {
    const u = queue.shift();
    sortedNodes.push(u);
    for (const dep of graph.get(u)) {
      const v = dep.successorActivityId;
      inDegree.set(v, inDegree.get(v) - 1);
      if (inDegree.get(v) === 0) queue.push(v);
    }
  }
  const processingOrder = sortedNodes.length === activityMap.size ? sortedNodes : Array.from(activityMap.keys());

  for (const id of processingOrder) {
    const node = activityMap.get(id);
    if (!node.parsedEndDate) continue;
    if (node.currentDelay > 0) {
      node.projectedEndDate = addDays(node.parsedEndDate, node.currentDelay);
    }
    for (const dep of node.successors) {
      const succ = activityMap.get(dep.successorActivityId);
      if (!succ.parsedStartDate || succ.status === 'COMPLETED' || succ.status === 'VERIFIED') continue;
      if (dep.dependencyType === 'FS' || !dep.dependencyType) {
        const earliestStart = addDays(node.projectedEndDate, dep.lagDays || 0);
        if (succ.parsedStartDate < earliestStart) {
          const pushDays = differenceInDays(earliestStart, succ.parsedStartDate);
          if (pushDays > succ.currentDelay) {
             succ.currentDelay = pushDays;
             succ.riskFactors = succ.riskFactors.filter(f => f.factor !== 'Upstream Delay Impact');
             succ.riskFactors.push({ factor: 'Upstream Delay Impact', value: `Pushed by ${pushDays} days` });
             node.isCriticalRipple = true;
          }
        }
      }
    }
  }

  // 6. Summarize Activities
  for (const [id, node] of activityMap.entries()) {
    let downstreamCount = 0;
    const countQueue = [id];
    const visited = new Set();
    while (countQueue.length > 0) {
      const curr = countQueue.shift();
      if (!visited.has(curr)) {
        visited.add(curr);
        for (const dep of graph.get(curr) || []) {
          if (!visited.has(dep.successorActivityId)) {
             countQueue.push(dep.successorActivityId);
             downstreamCount++;
          }
        }
      }
    }
    node.downstreamImpactCount = downstreamCount;
    node.riskFactors.push({ factor: 'Downstream Dependencies', value: downstreamCount.toString() });

    if (node.status === 'COMPLETED' || node.status === 'VERIFIED') {
      node.riskLevel = 'LOW';
    } else if (node.currentDelay > 3) {
      node.riskLevel = downstreamCount > 0 ? 'CRITICAL' : 'HIGH';
    } else if (node.currentDelay > 0) {
      node.riskLevel = downstreamCount > 0 ? 'HIGH' : 'MEDIUM';
    } else if (node.isCriticalRipple) {
      node.riskLevel = 'HIGH';
    } else {
      const progRisk = node.riskFactors.find(f => f.factor === 'Progress Variance');
      if (progRisk && progRisk.value.startsWith('-') && parseInt(progRisk.value) < -10) {
        node.riskLevel = 'MEDIUM';
      }
    }
  }

  // 7. Aggregate Task Data
  const tasksArray = tasks.map(t => {
    const taskActs = Array.from(activityMap.values()).filter(a => a.taskId === t.taskId);
    const delay = taskActs.reduce((max, a) => Math.max(max, a.currentDelay), 0);
    const riskLevels = taskActs.map(a => a.riskLevel);
    const riskLevel = riskLevels.includes('CRITICAL') ? 'CRITICAL' : riskLevels.includes('HIGH') ? 'HIGH' : riskLevels.includes('MEDIUM') ? 'MEDIUM' : 'LOW';
    
    // Check if task has pending verification based on its own state or evidence table
    const taskVerif = verifications.filter(v => v.taskId === t.taskId);
    let derivedStatus = t.status;
    if (taskVerif.length > 0 && taskVerif.some(v => v.status === 'PENDING')) {
      derivedStatus = 'Verification Pending';
    }

    return {
      ...t,
      derivedStatus,
      calculatedDelay: delay,
      calculatedRisk: riskLevel
    };
  });

  // 8. Aggregate Worker Data
  const workersArray = workers.map(w => {
    const wTasks = tasksArray.filter(t => t.assignedWorkerId === w.workerId);
    const assignedCount = wTasks.length;
    const inProgressCount = wTasks.filter(t => t.derivedStatus === 'In Progress' || t.derivedStatus === 'At Risk').length;
    const verificationPendingCount = wTasks.filter(t => t.derivedStatus === 'Verification Pending').length;
    const completedCount = wTasks.filter(t => t.derivedStatus === 'Completed').length;
    const missedCount = wTasks.filter(t => t.derivedStatus === 'Overdue' || t.missedAt).length;
    const delayedCount = wTasks.filter(t => t.calculatedDelay > 0).length;
    
    const overallProgress = assignedCount > 0 ? Math.round(wTasks.reduce((sum, t) => sum + t.progress, 0) / assignedCount) : 0;
    
    const wRisks = wTasks.map(t => t.calculatedRisk);
    const riskLevel = wRisks.includes('CRITICAL') ? 'CRITICAL' : wRisks.includes('HIGH') ? 'HIGH' : wRisks.includes('MEDIUM') ? 'MEDIUM' : 'LOW';

    return {
      ...w,
      metrics: {
        assignedCount,
        inProgressCount,
        verificationPendingCount,
        completedCount,
        missedCount,
        delayedCount,
        overallProgress,
        riskLevel
      }
    };
  });

  // 9. Aggregate Project Summary
  const projectSummary = {
    totalTasks: tasksArray.length,
    assigned: tasksArray.filter(t => t.assignedWorkerId).length,
    inProgress: tasksArray.filter(t => t.derivedStatus === 'In Progress' || t.derivedStatus === 'At Risk').length,
    verificationPending: tasksArray.filter(t => t.derivedStatus === 'Verification Pending').length,
    completed: tasksArray.filter(t => t.derivedStatus === 'Completed').length,
    missed: tasksArray.filter(t => t.derivedStatus === 'Overdue' || t.missedAt).length,
    delayed: tasksArray.filter(t => t.calculatedDelay > 0).length,
    overallProgress: tasksArray.length > 0 ? Math.round(tasksArray.reduce((sum, t) => sum + t.progress, 0) / tasksArray.length) : 0,
    overallRisk: tasksArray.map(t => t.calculatedRisk).includes('CRITICAL') ? 'CRITICAL' : tasksArray.map(t => t.calculatedRisk).includes('HIGH') ? 'HIGH' : tasksArray.map(t => t.calculatedRisk).includes('MEDIUM') ? 'MEDIUM' : 'LOW'
  };

  const nodesArray = Array.from(activityMap.values()).map(n => ({
    ...n,
    parsedStartDate: n.parsedStartDate ? format(n.parsedStartDate, 'yyyy-MM-dd') : null,
    parsedEndDate: n.parsedEndDate ? format(n.parsedEndDate, 'yyyy-MM-dd') : null,
    projectedEndDate: n.projectedEndDate ? format(n.projectedEndDate, 'yyyy-MM-dd') : null
  }));

  return {
    project,
    workers: workersArray,
    tasks: tasksArray,
    activities: nodesArray,
    dependencies,
    summary: projectSummary
  };
}

module.exports = { calculateProjectRisk };
