const { parseISO, format, addDays, isWeekend, isAfter, isBefore, isEqual, differenceInDays } = require('date-fns');

/**
 * Deterministic Scheduling Engine
 * Calculates exact dates for a sequence of activities based on dependencies and constraints.
 */

function generateExecutionSchedule({ 
  activities, 
  startDate, 
  endDate, 
  constraints, 
  workingDays = [1, 2, 3, 4, 5, 6] // 0=Sun, 1=Mon... Default: Mon-Sat
}) {
  const planStart = parseISO(startDate);
  const planEnd = parseISO(endDate);
  
  if (isNaN(planStart.getTime()) || isNaN(planEnd.getTime())) {
    throw new Error("Invalid start or end date strings.");
  }

  // Helper to get next working day
  const getNextWorkingDay = (date, forward = true) => {
    let current = new Date(date);
    let attempts = 0;
    while (!workingDays.includes(current.getDay()) && attempts < 14) {
      current = addDays(current, forward ? 1 : -1);
      attempts++;
    }
    return current;
  };

  // Helper to add working days
  const addWorkingDays = (startDate, daysToAdd) => {
    let current = new Date(startDate);
    let daysAdded = 0;
    
    // If duration is 1 day, and start is working day, end is the same day.
    // If duration is > 1 day, we add (duration - 1) working days.
    const targetDays = Math.max(0, daysToAdd - 1);

    while (daysAdded < targetDays) {
      current = addDays(current, 1);
      if (workingDays.includes(current.getDay())) {
        daysAdded++;
      }
    }
    return current;
  };

  // Build a map for easy lookup
  const activityMap = new Map();
  activities.forEach(act => {
    activityMap.set(act.id, {
      ...act,
      plannedStart: null,
      plannedEnd: null
    });
  });

  let scheduleValid = true;
  const conflicts = [];

  // Iterate over activities (we assume they are roughly sorted by LLM, but we enforce dependencies strictly)
  // To handle dependencies, we will compute start dates iteratively until no changes occur (or max iterations).
  let changed = true;
  let iterations = 0;
  const maxIterations = activities.length * 2;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const [id, act] of activityMap.entries()) {
      let earliestStart = new Date(planStart); // Cannot start before plan start

      // Check dependencies (Finish-to-Start)
      if (act.dependencies && act.dependencies.length > 0) {
        for (const depId of act.dependencies) {
          const depAct = activityMap.get(depId);
          if (depAct && depAct.plannedEnd) {
            // Next activity starts the NEXT working day after dependency finishes
            const earliestAfterDep = getNextWorkingDay(addDays(depAct.plannedEnd, 1));
            if (isAfter(earliestAfterDep, earliestStart)) {
              earliestStart = earliestAfterDep;
            }
          }
        }
      }

      // Ensure start is a working day
      earliestStart = getNextWorkingDay(earliestStart);
      
      const prevStartStr = act.plannedStart ? format(act.plannedStart, 'yyyy-MM-dd') : null;
      const newStartStr = format(earliestStart, 'yyyy-MM-dd');

      if (prevStartStr !== newStartStr) {
        act.plannedStart = earliestStart;
        act.plannedEnd = addWorkingDays(earliestStart, act.duration || 1);
        changed = true;
      }
    }
  }

  if (iterations >= maxIterations) {
    conflicts.push("Circular dependency or unresolvable scheduling loop detected.");
    scheduleValid = false;
  }

  // Format dates and check global deadline constraint
  const finalizedActivities = [];
  let exceedsDeadline = false;

  for (const [id, act] of activityMap.entries()) {
    if (!act.plannedStart || !act.plannedEnd) {
      conflicts.push(`Task ${act.title} could not be scheduled.`);
      scheduleValid = false;
      continue;
    }

    if (isAfter(act.plannedEnd, planEnd)) {
      exceedsDeadline = true;
      conflicts.push(`Task ${act.title} finishes on ${format(act.plannedEnd, 'yyyy-MM-dd')}, which is after the requested deadline of ${format(planEnd, 'yyyy-MM-dd')}.`);
    }

    finalizedActivities.push({
      ...act,
      startDate: format(act.plannedStart, 'yyyy-MM-dd'),
      endDate: format(act.plannedEnd, 'yyyy-MM-dd'),
    });
  }

  if (exceedsDeadline) {
    scheduleValid = false;
  }

  // TODO: Add simple resource capacity checking here if needed, 
  // but for now scheduleValidator catches overlapping assignments.

  return {
    valid: scheduleValid,
    conflicts,
    activities: finalizedActivities
  };
}

module.exports = {
  generateExecutionSchedule
};
