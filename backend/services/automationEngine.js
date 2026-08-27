const db = require('../db');

/**
 * Validates and executes an approved AI-generated plan.
 * @param {Object} plan - The structured plan approved by the Admin.
 * @param {String} adminId - The Admin executing the plan.
 * @param {Object} io - Socket.IO instance for real-time events.
 * @returns {Object} result - Success or failure details.
 */
function executeApprovedPlan(plan, adminId, io) {
  try {
    // 1. Validate payload
    if (!plan.projectId || !plan.title || !plan.assignedWorkerId || !plan.dueDate) {
      throw new Error("Missing required fields in approved plan.");
    }

    // 2. Deterministic Validation (e.g. check if worker exists)
    const worker = db.prepare('SELECT * FROM workers WHERE workerId = ?').get(plan.assignedWorkerId);
    if (!worker) {
      throw new Error(`Worker ${plan.assignedWorkerId} not found.`);
    }

    const project = db.prepare('SELECT * FROM projects WHERE projectId = ?').get(plan.projectId);
    if (!project) {
      throw new Error(`Project ${plan.projectId} not found.`);
    }

    // 3. Create Task using existing infrastructure
    const taskId = `TASK-AI-${Math.floor(Math.random() * 10000)}`;
    const instructions = plan.scheduleSteps ? 
      `AI GENERATED SCHEDULE:\n` + plan.scheduleSteps.map(s => `- ${s.date}: ${s.description}`).join('\n') 
      : plan.instructions || '';

    const insert = db.prepare(`
      INSERT INTO tasks (taskId, title, description, projectId, site, assignedWorkerId, priority, startDate, dueDate, status, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', 0)
    `);

    insert.run(
      taskId, 
      plan.title, 
      instructions, 
      plan.projectId, 
      plan.location || 'Site B', 
      plan.assignedWorkerId, 
      plan.priority || 'Medium', 
      plan.startDate, 
      plan.dueDate
    );

    // Insert Task Activities if scheduleSteps exist
    if (plan.scheduleSteps && Array.isArray(plan.scheduleSteps)) {
      const insertActivity = db.prepare(`
        INSERT INTO task_activities (activityId, taskId, activityNumber, name, description, startDate, endDate, status, progress)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', 0)
      `);
      
      plan.scheduleSteps.forEach((step, index) => {
        const activityId = `ACT-${Date.now()}-${index}`;
        const name = step.description.split('.')[0] || `Activity ${index + 1}`;
        insertActivity.run(
          activityId,
          taskId,
          index + 1,
          name.substring(0, 50),
          step.description,
          step.date || plan.startDate,
          step.date || plan.dueDate
        );
      });
    }

    // 4. Emit Socket.IO Events
    if (io) {
      io.emit('task_created', { taskId, assignedWorkerId: plan.assignedWorkerId });
    }

    // 5. Create Audit Record
    const auditId = `AUDIT-${Date.now()}`;
    db.prepare(`
      INSERT INTO ai_audit_events (eventId, sessionId, eventType, details)
      VALUES (?, ?, ?, ?)
    `).run(auditId, plan.sessionId || 'MANUAL_APPROVAL', 'AUTOMATION_EXECUTED', JSON.stringify({ taskId, status: 'SUCCESS' }));

    return { success: true, taskId };
  } catch (err) {
    console.error("Automation Engine Error:", err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  executeApprovedPlan
};
