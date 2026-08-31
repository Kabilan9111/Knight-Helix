const express = require('express');
const router = express.Router();
const { calculateProjectRisk } = require('../services/riskEngine');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden. Requires one of roles: ' + roles.join(', ') });
    }
    next();
  };
};

router.get('/projects/:projectId/risk-delay-ripple', authenticateToken, (req, res) => {
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
