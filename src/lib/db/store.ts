import fs from 'fs';
import path from 'path';
import { EmergencyReport, Hospital, EmergencyStatus, EmailStatus } from '@/types/emergency';
import { SAMPLE_HOSPITALS } from './seed';
import { isSupabaseConfigured, getSupabaseConfig } from './supabaseClient';

const DATA_DIR = path.join(process.cwd(), 'data');
const EMERGENCIES_FILE = path.join(DATA_DIR, 'emergencies.json');
const EMAIL_LOGS_FILE = path.join(DATA_DIR, 'email_logs.json');
const HOSPITALS_FILE = path.join(DATA_DIR, 'hospitals.json');

// Internal cache
let emergenciesStore: EmergencyReport[] = [];
let hospitalsStore: Hospital[] = [...SAMPLE_HOSPITALS];
let emailLogsStore: { id: string; emergency_id: string; recipient: string; subject: string; sent_at: string; status: 'SUCCESS' | 'FAILED'; error?: string }[] = [];
let isInitialized = false;

function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err: any) {
    console.warn('[DB_STORE] Could not create data directory:', err.message);
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err: any) {
    console.warn(`[DB_STORE] Error reading ${filePath}:`, err.message);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDataDirectory();
    // Use atomic write pattern (write to temp file then rename) to prevent partial writes
    const tempFile = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, filePath);
  } catch (err: any) {
    console.error(`[DB_STORE] Error persisting ${filePath}:`, err.message);
  }
}

// Seed templates for initial setup
function getDefaultEmergencies(): EmergencyReport[] {
  return [
    {
      id: 'rep-001',
      report_id: 'ER-2026-000101',
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      emergency_type: 'Road Accident',
      description: 'Multi-vehicle collision on highway. Two individuals unconscious and experiencing severe hemorrhage.',
      people_affected: 2,
      severity: 'CRITICAL',
      ai_confidence: 96,
      status: 'ALERT_SENT',
      location: {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10,
        address: 'Main Highway Junction, Km 14',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      ai_assessment: {
        emergency_type: 'Road Accident',
        categories: ['Road Accident', 'Trauma', 'Hemorrhage'],
        severity: 'CRITICAL',
        is_critical: true,
        confidence: 96,
        reasoning: 'Unconscious victims with active severe hemorrhage indicates high risk of hemorrhagic shock and airway compromise.',
        required_facilities: ['Trauma Center', 'ICU', 'Blood Bank', 'Emergency Department'],
        recommended_response: 'Immediate dispatch of Advanced Life Support (ALS) ambulance and trauma surgery team preparation.',
        immediate_safety_actions: [
          'Do not move unconscious victims unless immediate fire hazard exists.',
          'Apply direct pressure to bleeding wounds using clean cloth.',
          'Keep airway clear if vomiting occurs by turning head sideways gently.',
        ],
        structured_extraction: {
          incident: 'Road Accident',
          patient_count: 2,
          consciousness: 'Unconscious',
          breathing: 'Difficulty',
          visible_bleeding: true,
          possible_injury: 'Severe trauma and active hemorrhage',
          possible_trauma: true,
          observed_information: ['Unconscious victims', 'Active hemorrhage'],
          user_reported_information: ['Multi-vehicle collision on highway'],
          ai_inference: ['High risk of hemorrhagic shock and airway compromise'],
        },
        disclaimer: 'AI-generated assessment — verify with qualified emergency personnel.',
      },
      recommended_hospital_id: 'hosp-001',
      recommended_hospital: SAMPLE_HOSPITALS[0],
      timeline: [
        { status: 'NEW', label: 'Emergency submitted', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
        { status: 'ANALYZING', label: 'AI analysis completed', timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString() },
        { status: 'HOSPITAL_RECOMMENDED', label: 'Apex Trauma Center matched', timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString() },
        { status: 'REPORT_GENERATED', label: 'PDF Report generated', timestamp: new Date(Date.now() - 1000 * 60 * 23).toISOString() },
        { status: 'ALERT_SENT', label: 'Hospital alert dispatched to er-trauma@apexhospital-demo.org', timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
      ],
      email_status: {
        sent: true,
        sent_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        recipient: 'er-trauma@apexhospital-demo.org',
        subject: 'URGENT EMERGENCY ALERT — CRITICAL — ER-2026-000101',
      },
    },
    {
      id: 'rep-002',
      report_id: 'ER-2026-000102',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      emergency_type: 'Chest Pain',
      description: 'Elderly patient complaining of severe radiating chest pain, cold sweats, and nausea.',
      people_affected: 1,
      severity: 'CRITICAL',
      ai_confidence: 94,
      status: 'ACKNOWLEDGED',
      location: {
        latitude: 19.0620,
        longitude: 72.8610,
        accuracy: 15,
        address: 'Flat 402, Oakwood Towers',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      ai_assessment: {
        emergency_type: 'Chest Pain',
        categories: ['Chest Pain', 'Cardiac Emergency'],
        severity: 'CRITICAL',
        is_critical: true,
        confidence: 94,
        reasoning: 'Radiating chest pain with diaphoresis in elderly patient strongly suggests Acute Coronary Syndrome / Myocardial Infarction.',
        required_facilities: ['Cardiology', 'ICU', 'Emergency Department', 'Cath Lab'],
        recommended_response: 'Priority cardiac ambulance dispatch and pre-activation of interventional cardiology team.',
        immediate_safety_actions: [
          'Keep patient calm in comfortable sitting position.',
          'Loosen tight clothing around neck and chest.',
          'Do not offer food or liquid.',
        ],
        structured_extraction: {
          incident: 'Chest Pain',
          patient_count: 1,
          consciousness: 'Conscious',
          breathing: 'Difficulty',
          visible_bleeding: false,
          possible_injury: 'Suspected Myocardial Infarction / ACS',
          possible_trauma: false,
          observed_information: ['Cold sweats', 'Nausea'],
          user_reported_information: ['Severe radiating chest pain'],
          ai_inference: ['High risk Acute Coronary Syndrome'],
        },
        disclaimer: 'AI-generated assessment — verify with qualified emergency personnel.',
      },
      recommended_hospital_id: 'hosp-003',
      recommended_hospital: SAMPLE_HOSPITALS[2],
      timeline: [
        { status: 'NEW', label: 'Emergency submitted', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
        { status: 'ANALYZING', label: 'AI analysis completed', timestamp: new Date(Date.now() - 1000 * 60 * 59).toISOString() },
        { status: 'HOSPITAL_RECOMMENDED', label: 'St. Jude Heart Institute matched', timestamp: new Date(Date.now() - 1000 * 60 * 59).toISOString() },
        { status: 'ALERT_SENT', label: 'Alert email sent', timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString() },
        { status: 'ACKNOWLEDGED', label: 'Hospital staff acknowledged emergency', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
      ],
      email_status: {
        sent: true,
        sent_at: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
        recipient: 'cardiac-er@stjude-demo.org',
        subject: 'URGENT EMERGENCY ALERT — CRITICAL — ER-2026-000102',
      },
    },
  ];
}

// Initialize store with durable on-disk database files
export function initializeStore() {
  if (isInitialized) return;

  ensureDataDirectory();
  const loadedEmergencies = readJsonFile<EmergencyReport[]>(EMERGENCIES_FILE, []);

  if (loadedEmergencies.length > 0) {
    emergenciesStore = loadedEmergencies;
  } else {
    emergenciesStore = getDefaultEmergencies();
    writeJsonFile(EMERGENCIES_FILE, emergenciesStore);
  }

  const loadedEmailLogs = readJsonFile<any[]>(EMAIL_LOGS_FILE, []);
  emailLogsStore = loadedEmailLogs;

  const loadedHospitals = readJsonFile<Hospital[]>(HOSPITALS_FILE, []);
  if (loadedHospitals.length > 0) {
    hospitalsStore = loadedHospitals;
  } else {
    hospitalsStore = [...SAMPLE_HOSPITALS];
    writeJsonFile(HOSPITALS_FILE, hospitalsStore);
  }

  isInitialized = true;
}

// Call on module load
initializeStore();

export function getEmergencies(): EmergencyReport[] {
  initializeStore();
  return emergenciesStore;
}

export function getEmergencyById(id: string): EmergencyReport | undefined {
  initializeStore();
  return emergenciesStore.find((e) => e.id === id || e.report_id === id);
}

export function saveEmergency(report: EmergencyReport): EmergencyReport {
  initializeStore();
  if (!report || (!report.id && !report.report_id)) {
    throw new Error('Cannot save emergency report without a valid id or report_id.');
  }

  // Consistent identifier matching: find by technical 'id' OR human-readable 'report_id'
  const index = emergenciesStore.findIndex(
    (e) => (report.id && e.id === report.id) || (Boolean(report.report_id) && e.report_id === report.report_id)
  );

  let savedRecord: EmergencyReport;
  if (index >= 0) {
    const existing = emergenciesStore[index];
    savedRecord = {
      ...report,
      id: existing.id || report.id,
      report_id: existing.report_id || report.report_id,
      created_at: existing.created_at || report.created_at,
    };
    emergenciesStore[index] = savedRecord;
  } else {
    savedRecord = report;
    emergenciesStore.unshift(savedRecord);
  }

  // Synchronously persist to disk for durability across restarts
  writeJsonFile(EMERGENCIES_FILE, emergenciesStore);

  // Asynchronously sync to Supabase PostgreSQL if credentials are configured
  if (isSupabaseConfigured()) {
    syncToSupabase(savedRecord).catch((err) => {
      console.warn('[SUPABASE_SYNC] Sync error:', err.message);
    });
  }

  return savedRecord;
}

/**
 * Resets in-memory cache and reloads directly from disk.
 * Used for verifying persistence durability across simulated server restarts.
 */
export function reloadStoreFromDisk(): EmergencyReport[] {
  isInitialized = false;
  initializeStore();
  return emergenciesStore;
}

export function updateEmergencyStatus(
  id: string,
  status: EmergencyStatus,
  detailLabel?: string
): EmergencyReport | undefined {
  initializeStore();
  const emergency = getEmergencyById(id);
  if (!emergency) return undefined;

  emergency.status = status;
  const newTimelineEvent = {
    status,
    label: detailLabel || `Status updated to ${status.replace(/_/g, ' ')}`,
    timestamp: new Date().toISOString(),
  };

  if (!emergency.timeline.some((t) => t.status === status && t.label === newTimelineEvent.label)) {
    emergency.timeline.push(newTimelineEvent);
  }

  saveEmergency(emergency);
  return emergency;
}

export function getHospitals(): Hospital[] {
  initializeStore();
  return hospitalsStore;
}

export function getHospitalById(id: string): Hospital | undefined {
  initializeStore();
  return hospitalsStore.find((h) => h.id === id);
}

export function logEmailDispatch(log: {
  emergency_id: string;
  recipient: string;
  subject: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}) {
  initializeStore();
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    sent_at: new Date().toISOString(),
    ...log,
  };
  emailLogsStore.unshift(newLog);
  writeJsonFile(EMAIL_LOGS_FILE, emailLogsStore);
  return newLog;
}

export function getEmailLogs() {
  initializeStore();
  return emailLogsStore;
}

export function getDatabaseHealth() {
  initializeStore();
  return {
    status: 'ONLINE',
    type: isSupabaseConfigured() ? 'SUPABASE_POSTGRES' : 'FILE_BACKED_DURABLE_STORE',
    incidents_count: emergenciesStore.length,
    hospitals_count: hospitalsStore.length,
    email_logs_count: emailLogsStore.length,
    persistent_directory: DATA_DIR,
    supabase_configured: isSupabaseConfigured(),
    durability_notes: isSupabaseConfigured()
      ? 'Connected to remote Supabase PostgreSQL database.'
      : 'Using local filesystem JSON storage. Durable across local server restarts, but ephemeral in multi-instance serverless deployments.',
  };
}

async function syncToSupabase(report: EmergencyReport) {
  const config = getSupabaseConfig();
  if (!config.configured) return;

  const url = `${config.url}/rest/v1/incidents`;
  const payload = {
    report_id: report.report_id,
    emergency_type: report.emergency_type,
    description: report.description,
    people_affected: report.people_affected,
    latitude: report.location.latitude,
    longitude: report.location.longitude,
    gps_accuracy: report.location.accuracy || 10,
    location_source: report.location.source || 'DEVICE_GPS',
    location_timestamp: report.location.timestamp || new Date().toISOString(),
    severity: report.severity,
    ai_confidence: report.ai_confidence,
    status: report.status,
    is_demo: report.is_demo || false,
  };

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(payload),
  });
}

