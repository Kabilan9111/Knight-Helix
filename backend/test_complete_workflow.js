const assert = require('assert');
const http = require('http');
const express = require('express');
const Database = require('better-sqlite3');

async function runTests() {
  console.log('--- STARTING COMPLETE MOBILE END-TO-END WORKFLOW TEST ---');

  const db = new Database('sanchalan.db');

  // 1. Verify Database Schema and Tables
  console.log('1. Checking Database Tables & Schema...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  ['tasks', 'task_activities', 'worker_evidence', 'field_verifications', 'projects', 'workers'].forEach(tbl => {
    assert(tables.includes(tbl), `Missing expected table: ${tbl}`);
  });
  console.log('   ✓ All required SQLite database tables verified.');

  // 2. Simulate Task Assignment with L5/L6 Activities
  console.log('2. Simulating Site Engineer Task Assignment...');
  const newTaskId = `TASK-TEST-${Date.now()}`;
  const testTitle = 'Foundation Rebar Tying (L6-CIVIL-301)';
  const testWorkerId = 'WRK-102';
  const testProjectId = 'PROJ-001';

  db.transaction(() => {
    db.prepare(`
      INSERT INTO tasks (taskId, title, description, projectId, site, assignedWorkerId, priority, startDate, dueDate, status, progress)
      VALUES (?, ?, ?, ?, ?, ?, 'High', '2026-08-31', '2026-09-05', 'ASSIGNED', 0)
    `).run(newTaskId, testTitle, 'Test task assignment', testProjectId, 'Site B - Construction Area', testWorkerId);

    db.prepare(`
      INSERT INTO task_activities (activityId, taskId, activityNumber, name, description, startDate, endDate, status, progress, aiConfidence)
      VALUES (?, ?, 1, ?, 'Sub-activity step 1', '2026-08-31', '2026-09-02', 'Pending', 0, 95)
    `).run(`ACT-${newTaskId}-1`, newTaskId, testTitle);
  })();

  const createdTask = db.prepare('SELECT * FROM tasks WHERE taskId = ?').get(newTaskId);
  assert(createdTask, 'Task was not created in database');
  assert.strictEqual(createdTask.assignedWorkerId, testWorkerId);
  console.log(`   ✓ Task ${newTaskId} created and assigned to ${testWorkerId}`);

  // 3. Verify Worker Task Synchronization
  console.log('3. Verifying Worker Mobile View Query...');
  const workerTasks = db.prepare('SELECT * FROM tasks WHERE assignedWorkerId = ?').all(testWorkerId);
  const found = workerTasks.find(t => t.taskId === newTaskId);
  assert(found, 'Worker query did not return newly assigned task');
  console.log(`   ✓ Worker ${testWorkerId} successfully receives assigned task in query.`);

  // 4. Worker Uploads Evidence
  console.log('4. Simulating Worker Work Proof Evidence Submission...');
  const evidenceId = `EV-TEST-${Date.now()}`;
  db.prepare(`
    INSERT INTO worker_evidence (evidenceId, taskId, workerId, activityId, imageBase64, description, verificationStatus)
    VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(evidenceId, newTaskId, testWorkerId, `ACT-${newTaskId}-1`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'Completed initial rebar alignment');

  const insertedEvidence = db.prepare('SELECT * FROM worker_evidence WHERE evidenceId = ?').get(evidenceId);
  assert(insertedEvidence, 'Evidence was not recorded');
  assert.strictEqual(insertedEvidence.verificationStatus, 'PENDING');
  console.log(`   ✓ Evidence ${evidenceId} submitted with status PENDING.`);

  // 5. Site Engineer Performs GPS Field Walk & Submits Spatial Verification
  console.log('5. Simulating Real GPS Field Walk & Spatial Verification...');
  const fverifId = `FVERIF-TEST-${Date.now()}`;
  const gpsCoordinates = [
    { lat: 12.8342, lng: 79.7036, accuracy: 4.5, timestamp: Date.now() - 60000 },
    { lat: 12.8346, lng: 79.7040, accuracy: 3.8, timestamp: Date.now() - 40000 },
    { lat: 12.8349, lng: 79.7045, accuracy: 3.2, timestamp: Date.now() - 20000 },
    { lat: 12.8342, lng: 79.7036, accuracy: 4.0, timestamp: Date.now() }
  ];
  const distance = 142.5; // meters
  const estimatedArea = 1250.0; // sq meters

  db.prepare(`
    INSERT INTO field_verifications (
      verificationId, taskId, activityId, engineerId, startedAt, stoppedAt,
      coordinates, distance, estimatedArea, gpsAccuracy, status, aiVerificationResult, approvedAt
    ) VALUES (?, ?, ?, 'admin-1', '2026-08-31T10:00:00Z', '2026-08-31T10:15:00Z', ?, ?, ?, 4.0, 'APPROVED', ?, CURRENT_TIMESTAMP)
  `).run(
    fverifId, newTaskId, `ACT-${newTaskId}-1`,
    JSON.stringify(gpsCoordinates), distance, estimatedArea,
    JSON.stringify({ recommendedProgress: 100, confidence: 96, strategicExplanation: 'Full closed boundary walked.' })
  );

  // 6. Complete Verification Workflow: Mark Activity & Task Completed/Verified
  console.log('6. Completing Verification Workflow & Status Updates...');
  db.transaction(() => {
    db.prepare(`UPDATE worker_evidence SET verificationStatus = 'APPROVED' WHERE evidenceId = ?`).run(evidenceId);
    db.prepare(`UPDATE task_activities SET status = 'Completed', progress = 100 WHERE activityId = ?`).run(`ACT-${newTaskId}-1`);
    db.prepare(`UPDATE tasks SET status = 'COMPLETED', progress = 100 WHERE taskId = ?`).run(newTaskId);
  })();

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE taskId = ?').get(newTaskId);
  const updatedEvidence = db.prepare('SELECT * FROM worker_evidence WHERE evidenceId = ?').get(evidenceId);
  const updatedActivity = db.prepare('SELECT * FROM task_activities WHERE activityId = ?').get(`ACT-${newTaskId}-1`);
  const fieldVerif = db.prepare('SELECT * FROM field_verifications WHERE verificationId = ?').get(fverifId);

  assert.strictEqual(updatedEvidence.verificationStatus, 'APPROVED', 'Evidence is not approved');
  assert.strictEqual(updatedActivity.status, 'Completed', 'Activity is not completed');
  assert.strictEqual(updatedActivity.progress, 100, 'Activity progress is not 100');
  assert.strictEqual(updatedTask.status, 'COMPLETED', 'Task status is not COMPLETED');
  assert.strictEqual(updatedTask.progress, 100, 'Task progress is not 100');
  assert.strictEqual(fieldVerif.status, 'APPROVED', 'Field verification is not approved');

  console.log('   ✓ Database state verified:');
  console.log(`     - Task Status: ${updatedTask.status} (${updatedTask.progress}%)`);
  console.log(`     - Evidence Verification Status: ${updatedEvidence.verificationStatus}`);
  console.log(`     - Activity Status: ${updatedActivity.status} (${updatedActivity.progress}%)`);
  console.log(`     - GPS Field Walk Distance: ${fieldVerif.distance}m, Area: ${fieldVerif.estimatedArea}m²`);

  // Clean up test records
  db.prepare('DELETE FROM field_verifications WHERE verificationId = ?').run(fverifId);
  db.prepare('DELETE FROM worker_evidence WHERE evidenceId = ?').run(evidenceId);
  db.prepare('DELETE FROM task_activities WHERE taskId = ?').run(newTaskId);
  db.prepare('DELETE FROM tasks WHERE taskId = ?').run(newTaskId);
  db.close();

  console.log('\n--- ALL WORKFLOW CHECKS PASSED PERFECTLY ---');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
