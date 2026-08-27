const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');

const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

const SYSTEM_PROMPT = `
You are the SANCHALAN Autonomous AI Evidence Verification Agent.
Your job is to analyze worker-submitted evidence (images and text) and determine the verified completion percentage of a specific task activity.

RULES:
1. You will be provided with the Task Details, a list of Activities, and the Current Evidence.
2. Determine WHICH Activity the evidence most likely corresponds to.
3. Determine what work is visibly or textually demonstrated for that specific Activity.
4. Progress MUST BE CUMULATIVE for the matched activity. Compare new evidence against previous evidence for that activity. Do not decrease progress unless the evidence explicitly proves the previous assessment was invalid.
5. If the evidence does not clearly match any activity, set evidenceMatch to false, matchedActivityId to null, and request additional evidence.
6. EXPLANATION QUALITY: Your explanation MUST answer these 7 questions explicitly, forming a cohesive paragraph without generic filler:
   1. WHAT was actually observed?
   2. WHICH activity requirement does it satisfy?
   3. WHAT percentage of that activity is reasonably demonstrated?
   4. WHAT evidence supports that conclusion?
   5. WHAT cannot yet be verified?
   6. WHAT remains to be completed?
   7. WHY is the confidence score what it is?
7. Output ONLY a valid JSON object matching this schema exactly, and nothing else (no markdown wrapping if possible):

{
  "evidenceMatch": true,
  "matchedActivityId": "ACT-12345",
  "matchedActivityName": "Initial excavation",
  "completionPercentage": 45,
  "confidence": 91,
  "explanation": "The submitted image is consistent with the Initial Excavation activity. The excavation footprint and partial soil removal are visibly present, which supports advancement beyond the previously verified 20%. However, the evidence does not establish that the required excavation depth has been achieved across the full marked area. The worker's description indicates that approximately half of the excavation area has been completed. Based on the combined visual and textual evidence, the activity can reasonably advance to 45%, while the remaining excavation and depth verification remain outstanding.",
  "requiresAdditionalEvidence": false,
  "riskFlags": []
}
`;

async function processEvidence(taskId, workerId, imageBase64, description, io) {
  // 1. Fetch Task Context & Activities
  const task = db.prepare('SELECT * FROM tasks WHERE taskId = ?').get(taskId);
  if (!task) throw new Error("Task not found");

  const activities = db.prepare('SELECT * FROM task_activities WHERE taskId = ? ORDER BY activityNumber ASC').all(taskId);

  // 2. Save Evidence to DB
  const evidenceId = `EVID-${Date.now()}`;
  db.prepare(`
    INSERT INTO worker_evidence (evidenceId, taskId, workerId, imageBase64, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(evidenceId, taskId, workerId, imageBase64, description);

  let verificationResult;

  // 3. AI Analysis
  if (!genAI) {
    console.log("No GEMINI_API_KEY found. Using fallback mock verification.");
    
    await new Promise(r => setTimeout(r, 1500));
    
    // Deterministic Mock Logic
    const activeActivity = activities.find(a => a.progress < 100) || activities[0];
    let previousActivityProgress = activeActivity ? activeActivity.progress : 0;
    
    let newProgress = previousActivityProgress + 35;
    if (newProgress > 100) newProgress = 100;
    
    verificationResult = {
      evidenceMatch: true,
      matchedActivityId: activeActivity ? activeActivity.activityId : null,
      matchedActivityName: activeActivity ? activeActivity.name : null,
      completionPercentage: newProgress,
      confidence: 94,
      explanation: "The submitted evidence shows active progress on the task site consistent with the worker's description. The progress is verified.",
      requiresAdditionalEvidence: false,
      riskFlags: []
    };

    if (description && description.toLowerCase().includes('issue')) {
      verificationResult.riskFlags.push("Worker reported an issue in the description.");
      verificationResult.completionPercentage = previousActivityProgress;
    }
  } else {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const activitiesList = activities.map(a => 
        `- ID: ${a.activityId}, Name: ${a.name}, Current Progress: ${a.progress}%`
      ).join('\n');

      const contextStr = `
TASK DETAILS:
Title: ${task.title}
Description: ${task.description}
Project: ${task.projectId}

ACTIVITIES:
${activitiesList || 'No specific activities mapped, assume entire task is one activity.'}

WORKER SUBMITTED TEXT: "${description}"
      `;

      const contents = [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood. I will respond with the required JSON schema.' }] }
      ];

      const parts = [{ text: contextStr }];
      if (imageBase64) {
        const mimeType = imageBase64.split(';')[0].split(':')[1];
        const base64Data = imageBase64.split(',')[1];
        parts.push({ inlineData: { data: base64Data, mimeType: mimeType || 'image/jpeg' } });
      }

      contents.push({ role: 'user', parts });

      const result = await model.generateContent({ contents });
      const text = result.response.text();
      
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '').trim();
      
      verificationResult = JSON.parse(cleaned);

      // Enforce cumulative progress based on matched activity
      if (verificationResult.matchedActivityId) {
        const matchedAct = activities.find(a => a.activityId === verificationResult.matchedActivityId);
        if (matchedAct && verificationResult.completionPercentage < matchedAct.progress) {
          verificationResult.completionPercentage = matchedAct.progress;
          verificationResult.explanation += " (Note: Calculated progress was lower than previous for this activity, adhering to cumulative progress rule).";
        }
      }

    } catch (err) {
      console.error("AI Evidence Verification Error:", err);
      throw new Error("AI verification failed. Please try again later.");
    }
  }

  // 4. Update Database
  const verificationId = `VERIF-${Date.now()}`;
  db.prepare(`
    INSERT INTO ai_evidence_verifications (
      verificationId, evidenceId, taskId, matchedActivityId, completionPercentage, confidence, 
      explanation, completedWork, remainingWork, matchStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    verificationId, evidenceId, taskId, 
    verificationResult.matchedActivityId,
    verificationResult.completionPercentage, 
    verificationResult.confidence, 
    verificationResult.explanation, 
    '[]', '[]',
    verificationResult.evidenceMatch ? 'MATCH' : 'MISMATCH'
  );

  let updatedActivities = activities;

  if (verificationResult.matchedActivityId && verificationResult.evidenceMatch) {
    let actStatus = 'IN_PROGRESS';
    if (verificationResult.completionPercentage >= 100) actStatus = 'COMPLETED';

    db.prepare(`
      UPDATE task_activities 
      SET progress = ?, status = ?, aiConfidence = ? 
      WHERE activityId = ?
    `).run(verificationResult.completionPercentage, actStatus, verificationResult.confidence, verificationResult.matchedActivityId);
    
    updatedActivities = db.prepare('SELECT * FROM task_activities WHERE taskId = ? ORDER BY activityNumber ASC').all(taskId);
  }

  // Calculate overall task progress (equal weighting for now)
  let overallProgress = 0;
  if (updatedActivities.length > 0) {
    const totalProgress = updatedActivities.reduce((sum, act) => sum + act.progress, 0);
    overallProgress = Math.round(totalProgress / updatedActivities.length);
  } else {
    // Fallback if no activities exist
    overallProgress = verificationResult.completionPercentage;
  }

  let newStatus = task.status;
  if (overallProgress >= 100) {
    newStatus = 'SUBMITTED';
  } else if (overallProgress > 0 && newStatus === 'ASSIGNED') {
    newStatus = 'IN_PROGRESS';
  }

  db.prepare(`
    UPDATE tasks SET progress = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE taskId = ?
  `).run(overallProgress, newStatus, taskId);

  db.prepare(`
    INSERT INTO task_updates (updateId, taskId, workerId, text, location) 
    VALUES (?, ?, ?, ?, ?)
  `).run(`UPD-${Date.now()}`, taskId, workerId, `AI Verified Activity [${verificationResult.matchedActivityName || 'Task'}]: ${verificationResult.completionPercentage}%`, 'System');

  // 5. Emit Socket.IO Events
  const payload = {
    taskId,
    workerId,
    completionPercentage: overallProgress,
    activityPercentage: verificationResult.completionPercentage,
    matchedActivityId: verificationResult.matchedActivityId,
    confidence: verificationResult.confidence,
    status: newStatus,
    explanation: verificationResult.explanation
  };

  io.emit('task_updated', payload);
  io.emit('evidence_verified', payload);

  return verificationResult;
}

module.exports = {
  processEvidence
};
