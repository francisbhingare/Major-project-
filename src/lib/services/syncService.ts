import { SyncQueueItem, EmergencyReport } from '@/types/emergency';

const SYNC_STORAGE_KEY = 'ai_emergency_sync_queue';
const PENDING_INCIDENTS_KEY = 'ai_emergency_local_incidents';

export function getLocalSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalSyncQueue(queue: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to persist sync queue:', err);
  }
}

export function queueIncidentForSync(report: EmergencyReport): SyncQueueItem {
  const queue = getLocalSyncQueue();
  const newItem: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    local_id: report.id,
    incident_id: report.id,
    status: 'PENDING',
    retry_count: 0,
    created_at: new Date().toISOString(),
  };

  queue.unshift(newItem);
  saveLocalSyncQueue(queue);

  // Also cache incident payload locally
  try {
    const cached = localStorage.getItem(PENDING_INCIDENTS_KEY);
    const incidents: EmergencyReport[] = cached ? JSON.parse(cached) : [];
    incidents.unshift(report);
    localStorage.setItem(PENDING_INCIDENTS_KEY, JSON.stringify(incidents));
  } catch (err) {
    console.error('Failed to cache local incident payload:', err);
  }

  return newItem;
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = getLocalSyncQueue();
  const pendingItems = queue.filter((item) => item.status === 'PENDING' || item.status === 'FAILED');

  if (pendingItems.length === 0) return { synced: 0, failed: 0 };

  // Read cached local reports
  let cachedReports: EmergencyReport[] = [];
  try {
    const raw = localStorage.getItem(PENDING_INCIDENTS_KEY);
    if (raw) cachedReports = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse cached incidents for sync:', err);
  }

  if (cachedReports.length === 0) {
    // Clear orphaned queue items
    saveLocalSyncQueue([]);
    return { synced: 0, failed: 0 };
  }

  try {
    const res = await fetch('/api/emergency/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports: cachedReports }),
    });

    if (res.ok) {
      const data = await res.json();
      // Mark all queue items as SYNCED
      queue.forEach((item) => {
        item.status = 'SYNCED';
        item.last_attempt = new Date().toISOString();
      });
      saveLocalSyncQueue(queue);
      // Clear processed cached incidents
      localStorage.removeItem(PENDING_INCIDENTS_KEY);
      return { synced: data.synced_count || cachedReports.length, failed: 0 };
    } else {
      throw new Error(`Sync HTTP error ${res.status}`);
    }
  } catch (err: any) {
    console.warn('[Sync Service] Offline sync attempt failed:', err?.message || err);
    queue.forEach((item) => {
      item.status = 'FAILED';
      item.retry_count += 1;
      item.error = err.message || 'Network sync error';
      item.last_attempt = new Date().toISOString();
    });
    saveLocalSyncQueue(queue);
    return { synced: 0, failed: pendingItems.length };
  }
}
