/**
 * scheduleValidator.js
 * 
 * Strict deterministic validation for AI-generated candidate schedules.
 */

const { parseISO, isAfter, isBefore } = require('date-fns');

/**
 * Validates a candidate plan strictly against hard constraints.
 * 
 * @param {Object} plan - The candidate plan
 * @param {Object} constraints - The hard constraints { startDate, endDate }
 * @returns {Object} { valid: boolean, violations: Array, conflicts: Array }
 */
function validateSchedule(plan, constraints = {}) {
  const violations = [];
  const conflicts = [];
  
  if (!plan || !Array.isArray(plan.activities)) {
    return { valid: false, violations: ['Invalid plan structure: activities must be an array'], conflicts };
  }

  const { startDate: constraintStart, endDate: constraintEnd } = constraints;
  const hardStart = constraintStart ? parseISO(constraintStart) : null;
  const hardEnd = constraintEnd ? parseISO(constraintEnd) : null;

  const activityMap = new Map();
  plan.activities.forEach(act => activityMap.set(act.id, act));

  // 1. Validate Date Boundaries & Execution Window Constraints
  plan.activities.forEach(act => {
    if (!act.startDate || !act.endDate) {
      violations.push(`Task ${act.id} (${act.title}) is missing start or end dates.`);
      return;
    }
    
    const start = parseISO(act.startDate);
    const end = parseISO(act.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      violations.push(`Task ${act.id} has invalid date formats.`);
      return;
    }
    
    if (isAfter(start, end)) {
      violations.push(`Task ${act.id} has a start date after its end date.`);
    }

    // Enforce hard execution window constraint
    if (hardStart && isBefore(start, hardStart)) {
      violations.push(`Task ${act.id} starts on ${act.startDate}, which is before the requested execution window start (${constraintStart}).`);
    }

    if (hardEnd && isAfter(end, hardEnd)) {
      violations.push(`Task ${act.id} ends on ${act.endDate}, which is after the requested execution window deadline (${constraintEnd}).`);
    }
  });

  // 2. Validate Dependencies (Finish-to-Start)
  plan.activities.forEach(act => {
    if (Array.isArray(act.dependencies)) {
      act.dependencies.forEach(depId => {
        const predecessor = activityMap.get(depId);
        if (!predecessor) {
          violations.push(`Task ${act.id} depends on unknown task ${depId}`);
          return;
        }
        
        const predEnd = parseISO(predecessor.endDate);
        const succStart = parseISO(act.startDate);
        
        if (!isNaN(predEnd.getTime()) && !isNaN(succStart.getTime())) {
          if (isAfter(predEnd, succStart)) {
            violations.push(`Dependency violation: ${predecessor.title} finishes on ${predecessor.endDate}, but dependent task ${act.title} starts on ${act.startDate}.`);
          }
        }
      });
    }
  });

  // 3. Detect Resource Overlaps (Conflicts)
  const workerAssignments = {};
  plan.activities.forEach(act => {
    if (act.assignedWorkerId) {
      if (!workerAssignments[act.assignedWorkerId]) {
        workerAssignments[act.assignedWorkerId] = [];
      }
      workerAssignments[act.assignedWorkerId].push(act);
    }
  });

  for (const [workerId, tasks] of Object.entries(workerAssignments)) {
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const t1 = tasks[i];
        const t2 = tasks[j];
        
        const t1Start = parseISO(t1.startDate);
        const t1End = parseISO(t1.endDate);
        const t2Start = parseISO(t2.startDate);
        const t2End = parseISO(t2.endDate);
        
        // Overlap condition
        if (isBefore(t1Start, t2End) && isAfter(t1End, t2Start)) {
          conflicts.push(`Resource Conflict: Worker ${workerId} is double-booked on "${t1.title}" and "${t2.title}".`);
        }
      }
    }
  }

  return {
    valid: violations.length === 0 && conflicts.length === 0,
    violations,
    conflicts
  };
}

module.exports = {
  validateSchedule
};
