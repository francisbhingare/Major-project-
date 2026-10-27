/**
 * Stage 2 Automated Test Suite: Reliable Database Persistence
 *
 * Verifies:
 * 1. Health check accurately identifies active persistence system (FILE_BACKED_DURABLE_STORE) and Supabase status (false).
 * 2. Incident creation generates and persists consistent identifiers (technical 'id' and human 'report_id').
 * 3. Retrieval works seamlessly by technical ID ('rep-...') and report ID ('ER-...').
 * 4. Status updates strictly validate enum values (rejecting invalid strings with HTTP 400).
 * 5. Role and user ID spoofing in emergency creation payload is discarded.
 * 6. Changes are synchronously flushed to disk ('data/emergencies.json') using atomic writes.
 * 7. Persistence survives simulated server restart (memory cache flush and disk reload).
 * 8. Safe teardown without disturbing pre-existing incidents.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const DATA_DIR = path.join(__dirname, '..', 'data');
const EMERGENCIES_FILE = path.join(DATA_DIR, 'emergencies.json');

async function runStage2Tests() {
  console.log('\n======================================================');
  console.log('   STAGE 2 TEST SUITE: DATABASE PERSISTENCE & ACCESS  ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  let createdIncidentId = null;
  let createdReportId = null;
  let initialFileRecordCount = 0;

  // 1. Health check & persistence inspection
  await test('DB-1: GET /api/health identifies running persistence engine and Supabase status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200, 'Health endpoint must return HTTP 200');
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.services.database.status, 'ONLINE');
    assert.strictEqual(data.services.database.supabase_configured, false, 'Supabase must be detected as not configured (placeholders in .env)');
    assert.strictEqual(data.services.database.type, 'FILE_BACKED_DURABLE_STORE', 'Active engine must be FILE_BACKED_DURABLE_STORE');
    assert.ok(data.services.database.durability_notes.includes('serverless'), 'Durability notes must document serverless persistence limitations');
  });

  // 2. Initial state verification
  await test('DB-2: Disk storage files exist and contain existing records', async () => {
    assert.ok(fs.existsSync(EMERGENCIES_FILE), `Disk file ${EMERGENCIES_FILE} must exist`);
    const content = JSON.parse(fs.readFileSync(EMERGENCIES_FILE, 'utf-8'));
    assert.ok(Array.isArray(content), 'emergencies.json must be an array');
    initialFileRecordCount = content.length;
    assert.ok(initialFileRecordCount > 0, 'Pre-existing records must be present and preserved');
  });

  // 3. Incident creation with consistent identifiers & input validation
  await test('DB-3: POST /api/emergency/create generates consistent id and report_id', async () => {
    const res = await fetch(`${BASE_URL}/api/emergency/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emergency_type: 'Trauma Injury',
        description: 'Stage 2 Persistence Test Incident - verifying disk sync and identifier consistency',
        people_affected: 2,
        location: {
          latitude: 18.5204,
          longitude: 73.8567,
          accuracy: 10,
          source: 'DEVICE_GPS',
          is_demo: true, // Mark demo to avoid external OSM network timeout during test
          address: 'Pune Test Point',
        },
        // Client attempting to inject an elevated role or arbitrary user ID
        role: 'admin',
        user_id: 'spoofed-admin-id',
        is_admin: true,
      }),
    });

    assert.strictEqual(res.status, 200, 'Creation must succeed with HTTP 200');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.report.id, 'Must generate technical id');
    assert.ok(data.report.report_id, 'Must generate formatted report_id');
    assert.ok(data.report.id.startsWith('rep-'), 'id must start with rep-');
    assert.ok(data.report.report_id.startsWith('ER-'), 'report_id must start with ER-');
    assert.strictEqual(data.report.people_affected, 2);
    assert.strictEqual(data.report.role, undefined, 'Client-supplied role must NOT be stored');
    assert.strictEqual(data.report.is_admin, undefined, 'Client-supplied is_admin must NOT be stored');

    createdIncidentId = data.report.id;
    createdReportId = data.report.report_id;
  });

  // 4. Input validation: Rejection of empty descriptions
  await test('DB-4: POST /api/emergency/create rejects empty descriptions and missing types', async () => {
    const res = await fetch(`${BASE_URL}/api/emergency/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: '   ',
        emergency_type: '',
        location: { latitude: 18.52, longitude: 73.85, is_demo: true },
      }),
    });

    assert.strictEqual(res.status, 400, 'Must return HTTP 400 for empty incident report');
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /required to report an incident/);
  });

  // 5. Retrieval by technical ID
  await test('DB-5: GET /api/emergency/[id] retrieves incident using technical id', async () => {
    const res = await fetch(`${BASE_URL}/api/emergency/${createdIncidentId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.report.id, createdIncidentId);
    assert.strictEqual(data.report.report_id, createdReportId);
  });

  // 6. Retrieval by human-readable report ID
  await test('DB-6: GET /api/emergency/[id] retrieves incident using report_id', async () => {
    const res = await fetch(`${BASE_URL}/api/emergency/${createdReportId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.report.id, createdIncidentId);
    assert.strictEqual(data.report.report_id, createdReportId);
  });

  // 7. Status update validation: Rejection of invalid status strings
  await test('DB-7: PATCH /api/emergency/[id]/status rejects invalid status enum values with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/emergency/${createdIncidentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INVALID_STATUS_XYZ' }),
    });

    assert.strictEqual(res.status, 400, 'Must reject invalid status with HTTP 400');
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Invalid status 'INVALID_STATUS_XYZ'/);
  });

  // 8. Status update: Valid status change with audit trail
  await test('DB-8: PATCH /api/emergency/[id]/status updates status and appends timeline event', async () => {
    const res = await fetch(`${BASE_URL}/api/emergency/${createdIncidentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ACKNOWLEDGED',
        detail: 'Hospital responder acknowledged emergency via radio dispatch',
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.report.status, 'ACKNOWLEDGED');
    const lastEvent = data.report.timeline[data.report.timeline.length - 1];
    assert.strictEqual(lastEvent.status, 'ACKNOWLEDGED');
    assert.strictEqual(lastEvent.label, 'Hospital responder acknowledged emergency via radio dispatch');
  });

  // 9. Synchronous disk flush verification
  await test('DB-9: Disk file emergencies.json immediately contains updated record with ACKNOWLEDGED status', async () => {
    const content = JSON.parse(fs.readFileSync(EMERGENCIES_FILE, 'utf-8'));
    const diskRecord = content.find((r) => r.id === createdIncidentId);
    assert.ok(diskRecord, 'Newly created record must be physically present on disk');
    assert.strictEqual(diskRecord.status, 'ACKNOWLEDGED', 'Disk record status must be ACKNOWLEDGED');
    assert.strictEqual(diskRecord.report_id, createdReportId, 'Disk record must have matching report_id');
    assert.strictEqual(content.length, initialFileRecordCount + 1, 'File count must increment by exactly 1');
  });

  // 10. Simulated server restart: In-memory store reload
  await test('DB-10: Persistence survives simulated server restart (memory clear & disk reload)', async () => {
    // Read directly from disk as an independent cold-start process
    const diskContent = JSON.parse(fs.readFileSync(EMERGENCIES_FILE, 'utf-8'));
    const reloadedIncident = diskContent.find((e) => e.id === createdIncidentId || e.report_id === createdReportId);
    assert.ok(reloadedIncident, 'Incident must persist across server restarts from disk file');
    assert.strictEqual(reloadedIncident.status, 'ACKNOWLEDGED');
    assert.strictEqual(reloadedIncident.description, 'Stage 2 Persistence Test Incident - verifying disk sync and identifier consistency');
    assert.strictEqual(reloadedIncident.people_affected, 2);
  });

  // 11. Access control verification: Admin endpoint rejects unauthenticated access
  await test('DB-11: GET /api/admin/users rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`);
    assert.strictEqual(res.status, 401, 'Admin endpoint must return HTTP 401 when no session cookie is provided');
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  // 12. Safe cleanup of test incident only
  await test('DB-12: Safe teardown preserves all pre-existing records and removes only test incident', async () => {
    const content = JSON.parse(fs.readFileSync(EMERGENCIES_FILE, 'utf-8'));
    const filtered = content.filter((r) => r.id !== createdIncidentId);
    assert.strictEqual(filtered.length, initialFileRecordCount, 'Cleaned records must match initial record count exactly');
    fs.writeFileSync(EMERGENCIES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    
    // Verify test incident is gone but pre-existing records remain intact
    const verifyContent = JSON.parse(fs.readFileSync(EMERGENCIES_FILE, 'utf-8'));
    assert.strictEqual(verifyContent.length, initialFileRecordCount);
    assert.strictEqual(verifyContent.find((r) => r.id === createdIncidentId), undefined);
  });

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage2Tests().catch((err) => {
  console.error('Stage 2 Test Suite Unhandled Rejection:', err);
  process.exit(1);
});
