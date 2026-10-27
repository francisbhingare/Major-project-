/**
 * Stage 1 Automated Test Suite: Real GPS and Hospital Discovery
 *
 * Verifies:
 * 1. Coordinate validation (WGS84 boundaries, NaN, Null Island)
 * 2. Haversine straight-line geodesic distance calculations against benchmarks
 * 3. Handling of GPS denial / invalid coordinates
 * 4. Isolation of demo mode (demo hospitals never masquerade as live results)
 * 5. Error handling when both live GIS providers return 0 results (can_retry: true)
 * 6. Straight-line distance labeling and verification status preservation
 */

const assert = require('assert');

// 1. Math Utility Verification (mirroring src/lib/utils/haversine.ts)
function isValidCoordinate(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  if (lat === 0 && lon === 0) return false;
  return true;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!isValidCoordinate(lat1, lon1)) {
    throw new Error(`Invalid origin coordinates: lat=${lat1}, lon=${lon1}`);
  }
  if (!isValidCoordinate(lat2, lon2)) {
    throw new Error(`Invalid destination coordinates: lat=${lat2}, lon=${lon2}`);
  }

  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

async function runStage1Tests() {
  console.log('\n======================================================');
  console.log('   STAGE 1 TEST SUITE: GPS & HOSPITAL DISCOVERY       ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // --- UNIT TESTS ---

  test('UT-1: isValidCoordinate identifies valid global coordinates', () => {
    assert.strictEqual(isValidCoordinate(18.9220, 72.8347), true, 'Mumbai coords should be valid');
    assert.strictEqual(isValidCoordinate(40.7128, -74.0060), true, 'New York coords should be valid');
    assert.strictEqual(isValidCoordinate(-33.8688, 151.2093), true, 'Sydney coords should be valid');
    assert.strictEqual(isValidCoordinate(51.5074, -0.1278), true, 'London coords should be valid');
  });

  test('UT-2: isValidCoordinate strictly rejects out-of-bounds, NaN, and Null Island', () => {
    assert.strictEqual(isValidCoordinate(91, 0), false, 'Lat > 90 must be invalid');
    assert.strictEqual(isValidCoordinate(-91, 0), false, 'Lat < -90 must be invalid');
    assert.strictEqual(isValidCoordinate(0, 181), false, 'Lon > 180 must be invalid');
    assert.strictEqual(isValidCoordinate(0, -181), false, 'Lon < -180 must be invalid');
    assert.strictEqual(isValidCoordinate(NaN, 72), false, 'NaN lat must be invalid');
    assert.strictEqual(isValidCoordinate(19, NaN), false, 'NaN lon must be invalid');
    assert.strictEqual(isValidCoordinate(0, 0), false, 'Null Island [0,0] must be invalid');
    assert.strictEqual(isValidCoordinate(null, undefined), false, 'Null/undefined must be invalid');
  });

  test('UT-3: calculateHaversineDistance matches great-circle mathematical benchmarks', () => {
    // Mumbai (18.9220, 72.8347) to Pune (18.5204, 73.8567)
    const distMUMtoPUN = calculateHaversineDistance(18.9220, 72.8347, 18.5204, 73.8567);
    assert.strictEqual(distMUMtoPUN, 116.5, 'Mumbai to Pune straight-line distance must be 116.5 km');

    // Equator 10 degrees longitude span at latitude 0: d = 6371 * (10 * pi / 180) = 1111.9 km
    const distEquator = calculateHaversineDistance(0.0001, 10, 0.0001, 20);
    assert.strictEqual(distEquator, 1111.9, '10 degrees on equator should be 1111.9 km');
  });

  test('UT-4: calculateHaversineDistance throws on invalid coordinates', () => {
    assert.throws(() => {
      calculateHaversineDistance(999, 72, 18, 73);
    }, /Invalid origin coordinates/);

    assert.throws(() => {
      calculateHaversineDistance(18, 72, 0, 0);
    }, /Invalid destination coordinates/);
  });

  // --- INTEGRATION TESTS AGAINST LOCAL RUNNING DEV SERVER ---
  const BASE_URL = 'http://localhost:3000';

  await testAsync('INT-1: GET /api/hospitals/nearby rejects missing or invalid coordinates with 400', async () => {
    const res1 = await fetch(`${BASE_URL}/api/hospitals/nearby`);
    assert.strictEqual(res1.status, 400, 'Missing coordinates must return 400');
    const data1 = await res1.json();
    assert.strictEqual(data1.success, false);

    const res2 = await fetch(`${BASE_URL}/api/hospitals/nearby?lat=999&lon=999`);
    assert.strictEqual(res2.status, 400, 'Out of bounds coordinates must return 400');
    const data2 = await res2.json();
    assert.match(data2.error, /Invalid GPS coordinates/);
  });

  await testAsync('INT-2: GET /api/hospitals/nearby with ?demo=true isolates seeded demo hospitals', async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals/nearby?lat=19.076&lon=72.877&radius=15&demo=true`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.is_demo_data, true, 'is_demo_data must be true in demo mode');
    assert.strictEqual(data.source_used, 'DEMO_DATA');
    assert.ok(data.hospitals.length > 0, 'Should return seeded demo hospitals');
    data.hospitals.forEach((h) => {
      assert.strictEqual(h.is_demo, true, 'Each hospital must be flagged is_demo=true');
      assert.strictEqual(h.source, 'DEMO_DATA', 'Each hospital source must be DEMO_DATA');
    });
  });

  await testAsync('INT-3: GET /api/hospitals/nearby with remote uninhabited coordinates returns 502 with can_retry and ZERO demo injection', async () => {
    // Point Nemo in South Pacific Ocean (-48.8767, -123.3933) - 0 hospitals on OSM
    const res = await fetch(`${BASE_URL}/api/hospitals/nearby?lat=-48.8767&lon=-123.3933&radius=5`);
    assert.strictEqual(res.status, 502, 'Ocean query must return 502 error when 0 live hospitals exist');
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.can_retry, true, 'Must indicate can_retry=true');
    assert.strictEqual(data.is_demo_data, false, 'Must NEVER masquerade demo hospitals as live results');
    assert.strictEqual(data.hospitals.length, 0, 'Must not inject demo hospitals into empty ocean query');
  });

  await testAsync('INT-4: POST /api/hospitals/recommend rejects invalid coordinates with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 'invalid', longitude: 72.877 }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Invalid coordinates/);
  });

  await testAsync('INT-5: POST /api/hospitals/recommend in live mode refuses to substitute demo hospitals on empty ocean coordinates', async () => {
    // Point Nemo query in live mode (is_demo=false)
    const res = await fetch(`${BASE_URL}/api/hospitals/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: -48.8767,
        longitude: -123.3933,
        emergency_type: 'Cardiac Emergency',
        is_demo: false,
      }),
    });
    assert.strictEqual(res.status, 502);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.can_retry, true);
    assert.strictEqual(data.is_demo_data, false);
    assert.strictEqual(data.recommended_hospital, undefined, 'Must not invent a demo hospital in live ocean query');
  });

  await testAsync('INT-6: POST /api/hospitals/recommend with explicit is_demo=true returns demo facilities with straight-line distance', async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 19.0760,
        longitude: 72.8777,
        emergency_type: 'Road Accident',
        is_demo: true,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.is_demo_data, true);
    assert.strictEqual(data.source_used, 'DEMO_DATA');
    assert.ok(data.recommended_hospital, 'Should recommend a demo hospital');
    assert.strictEqual(data.recommended_hospital.is_demo, true);
    assert.match(data.recommended_hospital.matchReasons.join(' '), /straight-line distance/);
  });

  await testAsync('INT-7: POST /api/emergency/create rejects submission with invalid coordinates', async () => {
    const res = await fetch(`${BASE_URL}/api/emergency/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emergency_type: 'Road Accident',
        description: 'Test incident with bad coordinates',
        location: { latitude: 999, longitude: 999 },
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Valid coordinates are required/);
  });

  await testAsync('INT-8: POST /api/emergency/create preserves genuine location source and straight-line timeline', async () => {
    const res = await fetch(`${BASE_URL}/api/emergency/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emergency_type: 'Road Accident',
        description: 'Genuine GPS telemetry test',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          accuracy: 12,
          source: 'DEVICE_GPS',
          is_demo: false,
          address: 'Bandra West, Mumbai',
        },
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.report.location.source, 'DEVICE_GPS');
    assert.strictEqual(data.report.location.is_demo, false);
    assert.strictEqual(data.report.location.latitude, 19.0760);
    assert.strictEqual(data.report.location.longitude, 72.8777);
  });

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage1Tests().catch((err) => {
  console.error('Test Suite Unhandled Rejection:', err);
  process.exit(1);
});
