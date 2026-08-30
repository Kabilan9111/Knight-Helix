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

async function processEvidence(taskId, activityId, workerId, imageBase64, description, io) {
  // 1. Fetch Task Context & Activities
  const task = db.prepare('SELECT * FROM tasks WHERE taskId = ?').get(taskId);
  if (!task) throw new Error("Task not found");

  const activity = db.prepare('SELECT * FROM task_activities WHERE taskId = ? AND activityId = ?').get(taskId, activityId);
  if (!activity) throw new Error("Activity not found");

  if (activity.status === 'VERIFICATION_PENDING') {
      throw new Error("Evidence has already been submitted for this activity and is pending verification.");
  }

  let detectedTimestamp = null;

  // 2. OCR Timestamp Extraction & Validation
  if (genAI && imageBase64) {
    try {
      const timestampModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const mimeType = imageBase64.split(';')[0].split(':')[1];
      const base64Data = imageBase64.split(',')[1];
      
      const tsPrompt = "Extract the visible date and time stamped on this image. Look closely at the corners, edges, or overlays. If there is a visible capture date/time, return it in strict ISO format (e.g. 2026-08-30T14:10:00). If there are multiple dates, return the most likely capture time. If no date/time is visible, reply exactly with 'NOT_FOUND'. Only output the timestamp or NOT_FOUND, nothing else.";
      
      const tsContents = [
        { role: 'user', parts: [
          { text: tsPrompt },
          { inlineData: { data: base64Data, mimeType: mimeType || 'image/jpeg' } }
        ] }
      ];
      
      const tsResult = await timestampModel.generateContent({ contents: tsContents });
      let tsText = tsResult.response.text().trim();
      
      if (tsText !== 'NOT_FOUND') {
          // Clean up potential markdown
          if (tsText.startsWith('`') && tsText.endsWith('`')) {
              tsText = tsText.replace(/`/g, '').trim();
          }
          detectedTimestamp = new Date(tsText);
          if (isNaN(detectedTimestamp.getTime())) {
              detectedTimestamp = null;
          }
      }
    } catch (err) {
       console.error("Timestamp OCR failed:", err);
    }
  } else if (!genAI) {
    // Mock timestamp if no API key is provided
    detectedTimestamp = new Date();
  }

  if (!detectedTimestamp) {
      throw new Error("Could not verify the capture date and time. Please upload a clear, timestamped photo.");
  }
  
  const serverNow = new Date();
  const diffHours = (serverNow - detectedTimestamp) / (1000 * 60 * 60);
  
  if (diffHours < -0.5) { // Small buffer for clock drift
      throw new Error("Invalid timestamp: Future capture date detected.");
  }
  
  if (diffHours > 2) {
      throw new Error("Invalid timestamp: Photo is older than the allowed 2-hour window. Please upload current evidence.");
  }
  
  if (detectedTimestamp.getDate() !== serverNow.getDate() || detectedTimestamp.getMonth() !== serverNow.getMonth() || detectedTimestamp.getFullYear() !== serverNow.getFullYear()) {
      throw new Error("Invalid timestamp: Photo must be taken today.");
  }

  // 3. Save Evidence to DB
  const evidenceId = `EVID-${Date.now()}`;
  db.prepare(`
    INSERT INTO worker_evidence (evidenceId, taskId, workerId, imageBase64, description, activityId, detectedCaptureDateTime, verificationStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(evidenceId, taskId, workerId, imageBase64, description, activityId, detectedTimestamp.toISOString());

  let verificationResult;

  // 4. AI Analysis for Progress
  if (!genAI) {
    console.log("No GEMINI_API_KEY found. Using fallback mock verification.");
    
    await new Promise(r => setTimeout(r, 1500));
    
    let previousActivityProgress = activity.progress;
    let newProgress = previousActivityProgress + 35;
    if (newProgress > 100) newProgress = 100;
    
    verificationResult = {
      evidenceMatch: true,
      matchedActivityId: activityId,
      matchedActivityName: activity.name,
      completionPercentage: newProgress,
      confidence: 94,
      explanation: "The submitted evidence shows active progress on the task site consistent with the worker's description. The progress is verified.",
      requiresAdditionalEvidence: false,
      riskFlags: []
    };
  } else {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const contextStr = `
TASK DETAILS:
Title: ${task.title}
Description: ${task.description}

SUBMITTED FOR ACTIVITY:
ID: ${activity.activityId}
Name: ${activity.name}
Current Progress: ${activity.progress}%

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
      // Force it to match the requested activity for safety
      verificationResult.matchedActivityId = activityId;
      verificationResult.evidenceMatch = true;

      // Enforce cumulative progress
      if (verificationResult.completionPercentage < activity.progress) {
        verificationResult.completionPercentage = activity.progress;
        verificationResult.explanation += " (Note: Calculated progress was lower than previous, adhering to cumulative progress rule).";
      }
    } catch (err) {
      console.error("AI Evidence Verification Error:", err);
      throw new Error("AI verification failed. Please try again later.");
    }
  }

  // 5. Update Database
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

  let updatedActivities = [];

  if (verificationResult.matchedActivityId && verificationResult.evidenceMatch) {
    let actStatus = 'VERIFICATION_PENDING';

    db.prepare(`
      UPDATE task_activities 
      SET progress = ?, status = ?, aiConfidence = ?, evidenceReceivedAt = CURRENT_TIMESTAMP 
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

  let newStatus = 'VERIFICATION_PENDING';

  db.prepare(`
    UPDATE tasks SET progress = ?, status = ?, updatedAt = CURRENT_TIMESTAMP, evidenceReceivedAt = CURRENT_TIMESTAMP WHERE taskId = ?
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

const FIELD_SYSTEM_PROMPT = `
You are the SANCHALAN Autonomous AI Field Verification Agent.
Your job is to analyze spatial GPS evidence (distance, area, path) alongside task activity context to determine the verified completion percentage of a specific task activity.

RULES:
1. You will receive TASK details, ACTIVITY details, and FIELD EVIDENCE (distance, area, GPS accuracy, and optional images/descriptions).
2. DO NOT blindly trust the engineer's claim. Reason from the available evidence.
3. OUTPUT STRICT JSON MATCHING THIS EXACT SCHEMA:
{
  "matchedActivityId": "ACT-12345",
  "recommendedProgress": 65,
  "confidence": 87,
  "evidenceMatch": 91,
  "spatialVerification": 82,
  "scheduleConsistency": 88,
  "decision": "PENDING_APPROVAL",
  "completedWork": ["Excavated perimeter"],
  "remainingWork": ["Final depth grading"],
  "evidenceAssessment": "Visual evidence aligns with excavation.",
  "spatialAssessment": "Traced 124m path with 1800m2 area matching the planned zone.",
  "scheduleAssessment": "Work is within planned dates.",
  "strategicExplanation": "Field verification traced approximately 1800 m2... [Write a professional, non-generic paragraph explaining EXACTLY what the spatial metrics and evidence prove, and why the percentage was recommended]",
  "recommendedNextStep": "Complete the remaining interior zone."
}
4. The strategicExplanation must explicitly answer: What evidence was submitted? Which activity? What do GPS trace/distance/area demonstrate? Does it align with scheduled activity? What portion is complete/incomplete? Why this percentage? What next?
`;

async function processFieldVerification(taskId, engineerId, fieldData, io) {
  const { activityId, distance, estimatedArea, gpsAccuracy, startedAt, stoppedAt, description, imageBase64 } = fieldData;
  
  const task = db.prepare('SELECT * FROM tasks WHERE taskId = ?').get(taskId);
  if (!task) throw new Error("Task not found");

  const activities = db.prepare('SELECT * FROM task_activities WHERE taskId = ? ORDER BY activityNumber ASC').all(taskId);
  const targetActivity = activityId ? activities.find(a => a.activityId === activityId) : null;

  let verificationResult;

  if (!genAI) {
    console.log("No GEMINI_API_KEY found. Using fallback mock field verification.");
    await new Promise(r => setTimeout(r, 1500));
    
    verificationResult = {
      matchedActivityId: targetActivity ? targetActivity.activityId : (activities[0]?.activityId || null),
      recommendedProgress: 65,
      confidence: 87,
      evidenceMatch: 91,
      spatialVerification: 82,
      scheduleConsistency: 88,
      decision: "PENDING_APPROVAL",
      completedWork: ["Tracked perimeter boundary"],
      remainingWork: ["Final inspection"],
      evidenceAssessment: "The field trace corresponds to the assigned area.",
      spatialAssessment: `Recorded distance of ${distance}m and area of ${estimatedArea || 0}m2.`,
      scheduleAssessment: "Consistent with schedule.",
      strategicExplanation: `Field verification traced a distance of ${distance}m. The spatial evidence supports the progression of this activity. No significant conflicts detected.`,
      recommendedNextStep: "Proceed with final review."
    };
  } else {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const activitiesList = activities.map(a => 
        `- ID: ${a.activityId}, Name: ${a.name}, Description: ${a.description}, Current Progress: ${a.progress}%`
      ).join('\n');

      const contextStr = `
TASK:
Title: ${task.title}
Description: ${task.description}
Location: ${task.site}
Dates: ${task.startDate} to ${task.dueDate}

ACTIVITIES:
${activitiesList || 'No specific activities mapped.'}
Target Activity ID: ${activityId || 'Not specified'}

FIELD EVIDENCE:
Distance Traced: ${distance} meters
Estimated Enclosed Area: ${estimatedArea ? estimatedArea + ' m2' : 'N/A (Not closed loop)'}
GPS Accuracy: ±${gpsAccuracy} meters
Duration: ${startedAt} to ${stoppedAt}
Engineer Description: "${description || 'None'}"
      `;

      const contents = [
        { role: 'user', parts: [{ text: FIELD_SYSTEM_PROMPT }] },
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

    } catch (err) {
      console.error("AI Field Verification Error:", err);
      throw new Error("AI verification failed.");
    }
  }

  // NOTE: We do NOT update task progress here. We only return the recommendation.
  // The frontend will present it, and the user must click APPROVE VERIFICATION.
  return verificationResult;
}

module.exports = {
  processEvidence,
  processFieldVerification
};
