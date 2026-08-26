const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { generateResponse } = require('../services/aiProvider');
const { executeApprovedPlan } = require('../services/automationEngine');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware for authentication
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Start or continue a planning session
router.post('/chat', authenticateAdmin, async (req, res) => {
  try {
    const { history, contextData, sessionId } = req.body;
    
    // Save/Update session (Simplified for demo)
    const currentSessionId = sessionId || `SESSION-${Date.now()}`;
    db.prepare(`
      INSERT INTO ai_planning_sessions (sessionId, adminId, contextData, status)
      VALUES (?, ?, ?, 'ACTIVE')
      ON CONFLICT(sessionId) DO UPDATE SET contextData = excluded.contextData
    `).run(currentSessionId, req.user.id, JSON.stringify(contextData));

    const io = req.app.get('io');
    const aiResponseText = await generateResponse(history, contextData, io, currentSessionId);

    // Check if the response is JSON (a plan) or a string (a chat)
    let parsedPlan = null;
    let message = aiResponseText;

    try {
      const obj = JSON.parse(aiResponseText);
      if (obj.type === 'plan' && obj.plan) {
        parsedPlan = obj.plan;
        message = "Here is the proposed execution plan. Please review and edit it if necessary.";
      }
    } catch(e) {
      // It's a text response, that's fine.
    }

    res.json({
      sessionId: currentSessionId,
      message,
      plan: parsedPlan
    });

  } catch (err) {
    console.error("Chat route error:", err);
    res.status(500).json({ error: err.message || 'Failed to process AI request' });
  }
});

// Approve a finalized plan
router.post('/approve', authenticateAdmin, (req, res) => {
  try {
    const { plan, sessionId } = req.body;
    
    // Execute via Automation Engine
    // Note: req.app.get('io') assumes server.js attaches io to app
    const io = req.app.get('io');
    const result = executeApprovedPlan({ ...plan, sessionId }, req.user.id, io);

    if (result.success) {
      db.prepare(`UPDATE ai_planning_sessions SET status = 'APPROVED' WHERE sessionId = ?`).run(sessionId);
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
