const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { processPlannerTurn, planStateChannels } = require('../services/aiPlannerService');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware for authentication
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || (user.role !== 'ADMIN' && user.role !== 'SITE_ENGINEER')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    next();
  });
};

/**
 * Get or initialize planning state
 */
function getPlanningState(sessionId) {
  const session = db.prepare('SELECT contextData FROM ai_planning_sessions WHERE sessionId = ?').get(sessionId);
  if (session && session.contextData) {
    try {
      return JSON.parse(session.contextData);
    } catch(e) {}
  }
  return null;
}

function savePlanningState(sessionId, state, adminId) {
  db.prepare(`
    INSERT INTO ai_planning_sessions (sessionId, adminId, contextData, status)
    VALUES (?, ?, ?, 'ACTIVE')
    ON CONFLICT(sessionId) DO UPDATE SET contextData = excluded.contextData
  `).run(sessionId, adminId, JSON.stringify(state));
}

// POST /api/ai/plan/chat
router.post('/plan/chat', authenticateAdmin, async (req, res) => {
  try {
    const { sessionId, userMessage, projectId, executionWindow, contextData } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    let currentState = getPlanningState(sessionId);

    if (!currentState) {
      // Initialize state
      if (!projectId) return res.status(400).json({ error: 'projectId required for new session' });
      if (!executionWindow || !executionWindow.startDate || !executionWindow.endDate) {
        return res.status(400).json({ error: 'executionWindow (startDate, endDate) is required' });
      }

      currentState = {
        sessionId,
        projectId,
        contextData: contextData || {},
        userRequest: userMessage || '', // First message is the request
        extractedConstraints: {
          startDate: executionWindow.startDate,
          endDate: executionWindow.endDate
        },
        missingInformation: [],
        currentQuestion: null,
        userAnswers: [],
        candidatePlan: null,
        validationResults: null,
        iterationCount: 0
      };
    } else {
      // If we already have a state, the userMessage is an answer to a previous question.
      if (userMessage && currentState.currentQuestion) {
        currentState.userAnswers.push({
          question: currentState.currentQuestion.question,
          answer: userMessage
        });
        // Clear the current question so the graph proceeds
        currentState.currentQuestion = null;
      } else if (userMessage) {
        // If they send a message out of turn, update the request
        currentState.userRequest += " " + userMessage;
      }
    }

    // Run the LangGraph orchestration turn
    const newState = await processPlannerTurn(currentState);
    
    // Save state
    savePlanningState(sessionId, newState, req.user.id);

    // Return the response to the client
    res.json({
      sessionId,
      question: newState.currentQuestion,
      plan: newState.candidatePlan,
      validation: newState.validationResults
    });

  } catch (err) {
    console.error("Plan chat route error:", err);
    res.status(500).json({ error: err.message || 'Failed to process AI request' });
  }
});

// POST /api/ai/plan/approve
router.post('/plan/approve', authenticateAdmin, (req, res) => {
  try {
    const { sessionId, planVersionId, supervisorId, projectId, activities } = req.body;
    
    // Resolve session ID (frontend might send it as planVersionId or sessionId)
    const targetSessionId = sessionId || planVersionId;
    
    const session = db.prepare('SELECT * FROM ai_planning_sessions WHERE sessionId = ?').get(targetSessionId);
    
    if (!session) return res.status(404).json({ error: 'Execution plan is no longer available.' });
    if (session.status === 'APPROVED') return res.status(400).json({ error: 'This execution plan has already been approved.' });
    
    const state = JSON.parse(session.contextData);
    const plan = state.candidatePlan;
    
    if (!plan || plan.planningStatus !== 'VALIDATED') {
      return res.status(400).json({ error: 'Plan is not validated' });
    }
    
    // Use the explicitly selected supervisor, overriding any AI hallucination
    const finalSupervisorId = supervisorId || state.contextData?.assignedWorkerId;
    
    // Verify supervisor exists
    if (finalSupervisorId) {
      const workerExists = db.prepare('SELECT 1 FROM workers WHERE workerId = ?').get(finalSupervisorId);
      if (!workerExists) {
        return res.status(400).json({ error: 'Selected supervisor could not be resolved.' });
      }
    } else {
      return res.status(400).json({ error: 'Selected supervisor could not be resolved.' });
    }

    const io = req.app.get('io');
    
    db.transaction(() => {
      // Mark session approved
      db.prepare(`UPDATE ai_planning_sessions SET status = 'APPROVED' WHERE sessionId = ?`).run(targetSessionId);
      
      const finalActivities = activities || plan.activities;
      
      if (finalActivities && finalActivities.length > 0) {
        // Create ONE main task
        const mainTaskId = `AI-${Date.now()}-${Math.floor(Math.random()*10000)}`;
        const mainTaskTitle = state.contextData?.title || 'AI Generated Task';
        const mainStartDate = state.contextData?.startDate || plan.startDate || finalActivities[0].date || finalActivities[0].startDate;
        const mainEndDate = state.contextData?.dueDate || plan.endDate || finalActivities[finalActivities.length - 1].date || finalActivities[finalActivities.length - 1].endDate;
        const mainSite = state.contextData?.site || 'Site B';

        db.prepare(`
          INSERT INTO tasks (taskId, title, description, projectId, site, assignedWorkerId, priority, startDate, dueDate, status, progress)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', 0)
        `).run(
          mainTaskId,
          mainTaskTitle,
          state.contextData?.description || 'Task scheduled via AI planner.',
          projectId || state.projectId || 'PROJ-001',
          mainSite,
          finalSupervisorId,
          state.contextData?.priority || 'High',
          mainStartDate,
          mainEndDate
        );

        // Add each step as a sub-task (activity)
        let activityNum = 1;
        for (const act of finalActivities) {
          const actId = `ACT-${Date.now()}-${Math.floor(Math.random()*10000)}-${activityNum}`;
          const actTitle = act.title || act.description || 'Activity ' + activityNum;
          const actStartDate = act.startDate || act.date || mainStartDate;
          const actEndDate = act.endDate || act.dueDate || act.date || mainEndDate;

          db.prepare(`
            INSERT INTO task_activities (activityId, taskId, activityNumber, name, description, startDate, endDate, status, progress, aiConfidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 0, 95)
          `).run(
            actId, mainTaskId, activityNum, actTitle, act.description || actTitle, actStartDate, actEndDate
          );
          activityNum++;
        }

        if (finalSupervisorId && io) {
          try {
            io.to(`worker_${finalSupervisorId}`).emit('task_created', { taskId: mainTaskId, assignedWorkerId: finalSupervisorId });
            io.to('admin_room').emit('task_created', { taskId: mainTaskId, assignedWorkerId: finalSupervisorId });
          } catch (socketErr) {
            console.error('Socket notification failed:', socketErr);
          }
        }
      }
    })();

    res.json({ success: true, message: 'Plan approved and assigned.' });
  } catch (err) {
    console.error("Task assignment could not be completed. No changes were committed.", err);
    res.status(500).json({ error: 'Task assignment could not be completed. No changes were committed.' });
  }
});

module.exports = router;
