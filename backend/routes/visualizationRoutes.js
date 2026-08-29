const express = require('express');
const router = express.Router();
const { getTeamVisualizationData } = require('../services/executionPredictionService');

// In a real implementation, we would add authentication and role checks here
// For example:
// const authenticateToken = require('../middleware/auth');
// const requireRole = require('../middleware/roles');
// router.use(authenticateToken);
// router.use(requireRole('ADMIN', 'OWNER'));

router.get('/team/:teamId', (req, res) => {
  const { teamId } = req.params;
  
  try {
    const data = getTeamVisualizationData(teamId);
    res.json(data);
  } catch (error) {
    console.error('Visualization route error:', error);
    res.status(500).json({ error: 'Failed to generate visualization data' });
  }
});

module.exports = router;
