const express = require('express');
const router = express.Router();
const { calculateProjectRisk } = require('../services/riskEngine');
const jwt = require('jsonwebtoken');

// Reuse existing auth middleware from server (copy basic version for now)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret-key-for-jwt-signing', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden. Requires role: ' + role });
    }
    next();
  };
};

router.get('/projects/:projectId/risk-delay-ripple', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const { projectId } = req.params;
  const simulateActivityId = req.query.simulateActivityId || null;
  const simulateDelayDays = parseInt(req.query.simulateDelayDays) || 0;

  try {
    const data = calculateProjectRisk(projectId, simulateActivityId, simulateDelayDays);
    if (!data) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(data);
  } catch (err) {
    console.error('Risk Engine Error:', err);
    res.status(500).json({ error: 'Failed to calculate risk and delay ripple' });
  }
});

module.exports = router;
