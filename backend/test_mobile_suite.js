const http = require('http');

const API_BASE = 'http://localhost:3001';

async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runMobileTestSuite() {
  console.log('====================================================');
  console.log('🚀 SANCHALAN MOBILE FULL SUITE AUTOMATED API TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${extra}`);
      failed++;
    }
  }

  // 1. Admin / Site Engineer Login
  console.log('1. Testing Authentication...');
  const adminRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_mobile: 'admin', password: 'admin123' })
  });
  assert('Admin Login', adminRes.ok && adminRes.data.token, `Role: ${adminRes.data.user?.role}`);
  const adminToken = adminRes.data.token;

  // 2. Worker Login (WRK-101 assigned to STR-110)
  const workerRes = await request('/api/auth/worker/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Arun Kumar', mobileNumber: '9999999901' })
  });
  assert('Worker Login', workerRes.ok && workerRes.data.token, `WorkerId: ${workerRes.data.user?.workerId}`);
  const workerToken = workerRes.data.token;

  // 3. Projects List
  console.log('\n2. Testing Projects & Dashboard APIs...');
  const projRes = await request('/api/projects', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert('Projects API', projRes.ok && Array.isArray(projRes.data), `Total: ${projRes.data.length} projects`);

  // 4. Stats API
  const statsRes = await request('/api/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert('Dashboard Stats API', statsRes.ok && statsRes.data.totalProjects !== undefined, `Projects: ${statsRes.data.totalProjects}, Tasks: ${statsRes.data.totalTasks}`);

  // 5. Tasks List
  console.log('\n3. Testing Tasks & L5/L6 Activities...');
  const tasksRes = await request('/api/tasks', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert('Tasks List API', tasksRes.ok && Array.isArray(tasksRes.data), `Total: ${tasksRes.data.length} tasks`);

  // 6. Task Details with Activities Breakdown
  const detailsRes = await request(`/api/tasks/CIV-101/details`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert('Task Details & Activities API', detailsRes.ok && detailsRes.data.task, `Activities Count: ${detailsRes.data.activities?.length || 0}`);

  // 7. Field Location Telemetry Update
  console.log('\n4. Testing Real GPS & Location Telemetry...');
  const locUpdateRes = await request('/api/location/update', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${workerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      latitude: 13.0827,
      longitude: 80.2707,
      accuracy: 8,
      timestamp: new Date().toISOString()
    })
  });
  assert('GPS Location Update API', locUpdateRes.ok && locUpdateRes.data.success, `Accuracy: ±${locUpdateRes.data.location?.accuracy}m`);

  // 8. Admin Active Workforce Map
  const adminLocsRes = await request('/api/admin/locations', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert('Admin Workforce Map API', adminLocsRes.ok && Array.isArray(adminLocsRes.data), `Active Workers: ${adminLocsRes.data.length}`);

  // 9. Worker History Breadcrumbs
  const historyRes = await request(`/api/admin/locations/WRK-101/history`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert('Worker GPS History Breadcrumbs API', historyRes.ok && Array.isArray(historyRes.data.points), `Breadcrumb Points: ${historyRes.data.points.length}`);

  // 10. Real GPS Field Walk / Spatial Verification Submission for STR-110 (assigned to WRK-101)
  console.log('\n5. Testing Real GPS Field Walk Verification...');
  const fieldWalkForm = new FormData();
  fieldWalkForm.append('activityId', 'ACT-STR-1');
  fieldWalkForm.append('distance', '420.5');
  fieldWalkForm.append('estimatedArea', '1850');
  fieldWalkForm.append('gpsAccuracy', '6.5');
  fieldWalkForm.append('startedAt', new Date(Date.now() - 600000).toISOString());
  fieldWalkForm.append('stoppedAt', new Date().toISOString());
  fieldWalkForm.append('coordinates', JSON.stringify([
    { lat: 13.0827, lng: 80.2707, accuracy: 6, timestamp: Date.now() - 500000 },
    { lat: 13.0835, lng: 80.2715, accuracy: 6, timestamp: Date.now() - 300000 },
    { lat: 13.0840, lng: 80.2710, accuracy: 5, timestamp: Date.now() - 100000 }
  ]));
  fieldWalkForm.append('description', 'Real Mobile GPS Walk traced 420.5m across column alignment grid');

  const fieldWalkRes = await fetch(`${API_BASE}/api/tasks/STR-110/verify-field`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${workerToken}` },
    body: fieldWalkForm
  });
  const fieldWalkData = await fieldWalkRes.json();
  assert('GPS Field Walk Submission API', fieldWalkRes.ok && fieldWalkData.success, `Verification ID: ${fieldWalkData.verificationId}`);

  // 11. Risk and Delay Ripple CPM DAG Engine
  console.log('\n6. Testing Risk & Delay Ripple Engine...');
  const rippleRes = await request(`/api/admin/intelligence/projects/PROJ-001/risk-delay-ripple`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert('Risk & Delay Ripple DAG API', rippleRes.ok && Array.isArray(rippleRes.data.activities) && rippleRes.data.activities.length > 0, `Calculated Activities: ${rippleRes.data.activities?.length || 0}`);

  // 12. Simulation of 5-day Delay
  const simRes = await request(`/api/admin/intelligence/projects/PROJ-001/risk-delay-ripple?simulateActivityId=ACT-CIV-2&simulateDelayDays=5`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert('What-If 5-Day Delay Simulation API', simRes.ok && simRes.data.summary, `Simulated Risk Level: ${simRes.data.summary?.overallRisk}, Delayed Count: ${simRes.data.summary?.delayed}`);

  // 13. Execution Prediction & Scenario Modeling
  console.log('\n7. Testing AI Execution Prediction Service...');
  const predRes = await request('/api/visualization/team/civil-a', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const productivityVal = predRes.data.summary?.teamProductivity ?? predRes.data.productivity;
  assert('AI Execution Prediction API', predRes.ok && productivityVal !== undefined, `Productivity: ${productivityVal}%, Scenarios: ${Object.keys(predRes.data.scenarios || {}).join(', ')}`);

  // 14. Pending Evidence Verification Queue for Site Engineer
  console.log('\n8. Testing Evidence Verification Review Queue...');
  const pendingRes = await request('/api/admin/verifications/pending', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert('Site Engineer Pending Queue API', pendingRes.ok && Array.isArray(pendingRes.data), `Pending Verifications: ${pendingRes.data.length}`);

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('🎉 ALL MOBILE BACKEND & INTELLIGENCE APIS ARE 100% OPERATIONAL!');
  }
}

runMobileTestSuite().catch(console.error);
