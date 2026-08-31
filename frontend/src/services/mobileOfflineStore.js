import { openDB } from 'idb';
import { getApiUrl } from '../mobile/config';

const DB_NAME = 'sanchalan_mobile_db';
const DB_VERSION = 1;

function resolveEndpoint(endpoint) {
  if (!endpoint) return '';
  if (endpoint.startsWith('/')) {
    return `${getApiUrl()}${endpoint}`;
  }
  try {
    const url = new URL(endpoint);
    const currentBase = new URL(getApiUrl());
    url.protocol = currentBase.protocol;
    url.host = currentBase.host;
    return url.toString();
  } catch {
    return endpoint;
  }
}

/**
 * Initializes IndexedDB for SANCHALAN Mobile
 */
export async function getOfflineDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('cached_tasks')) {
        db.createObjectStore('cached_tasks', { keyPath: 'taskId' });
      }
      if (!db.objectStoreNames.contains('cached_projects')) {
        db.createObjectStore('cached_projects', { keyPath: 'projectId' });
      }
      if (!db.objectStoreNames.contains('cached_intelligence')) {
        db.createObjectStore('cached_intelligence', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('outbox_queue')) {
        const outboxStore = db.createObjectStore('outbox_queue', { keyPath: 'id', autoIncrement: true });
        outboxStore.createIndex('by_status', 'status');
      }
      if (!db.objectStoreNames.contains('local_gps_traces')) {
        const gpsStore = db.createObjectStore('local_gps_traces', { keyPath: 'id', autoIncrement: true });
        gpsStore.createIndex('by_taskId', 'taskId');
      }
    }
  });
}

/**
 * Cache tasks for offline viewing
 */
export async function cacheTasks(tasks) {
  if (!tasks || !Array.isArray(tasks)) return;
  const db = await getOfflineDB();
  const tx = db.transaction('cached_tasks', 'readwrite');
  for (const task of tasks) {
    await tx.store.put(task);
  }
  await tx.done;
}

export async function getCachedTasks() {
  const db = await getOfflineDB();
  return db.getAll('cached_tasks');
}

export async function getCachedTaskById(taskId) {
  const db = await getOfflineDB();
  return db.get('cached_tasks', taskId);
}

/**
 * Cache project info
 */
export async function cacheProjects(projects) {
  if (!projects || !Array.isArray(projects)) return;
  const db = await getOfflineDB();
  const tx = db.transaction('cached_projects', 'readwrite');
  for (const p of projects) {
    await tx.store.put(p);
  }
  await tx.done;
}

export async function getCachedProjects() {
  const db = await getOfflineDB();
  return db.getAll('cached_projects');
}

/**
 * Outbox queue for offline operations (evidence, field walks, updates)
 */
export async function addToOutbox(item) {
  const db = await getOfflineDB();
  const entry = {
    ...item,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    retries: 0
  };
  const id = await db.add('outbox_queue', entry);
  return { ...entry, id };
}

export async function getOutboxItems() {
  const db = await getOfflineDB();
  return db.getAll('outbox_queue');
}

export async function removeOutboxItem(id) {
  const db = await getOfflineDB();
  return db.delete('outbox_queue', id);
}

export async function updateOutboxItem(id, updates) {
  const db = await getOfflineDB();
  const item = await db.get('outbox_queue', id);
  if (!item) return;
  const updated = { ...item, ...updates };
  await db.put('outbox_queue', updated);
  return updated;
}

/**
 * Save offline GPS walk
 */
export async function saveLocalGpsTrace(trace) {
  const db = await getOfflineDB();
  const entry = {
    ...trace,
    createdAt: new Date().toISOString(),
    synced: false
  };
  return db.add('local_gps_traces', entry);
}

export async function getLocalGpsTraces() {
  const db = await getOfflineDB();
  return db.getAll('local_gps_traces');
}

/**
 * Process the outbox queue when online
 */
export async function processOutboxQueue(token, onProgress) {
  const db = await getOfflineDB();
  const items = await db.getAll('outbox_queue');
  if (!items || items.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      if (onProgress) onProgress({ current: item, status: 'SYNCING' });
      await updateOutboxItem(item.id, { status: 'SYNCING' });

      let response;
      if (item.type === 'EVIDENCE_SUBMISSION') {
        const formData = new FormData();
        if (item.payload.imageBlob) {
          formData.append('image', item.payload.imageBlob, item.payload.fileName || 'evidence.jpg');
        } else if (item.payload.imageBase64) {
          // Convert base64 back to Blob
          const base64Data = item.payload.imageBase64.split(',')[1] || item.payload.imageBase64;
          const mime = item.payload.imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';
          const byteChars = atob(base64Data);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
          }
          const blob = new Blob([new Uint8Array(byteNumbers)], { type: mime });
          formData.append('image', blob, 'evidence.jpg');
        }
        formData.append('description', item.payload.description || '');
        formData.append('activityId', item.payload.activityId);

        const targetUrl = resolveEndpoint(item.endpoint);
        response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      } else if (item.type === 'FIELD_VERIFICATION') {
        const formData = new FormData();
        formData.append('activityId', item.payload.activityId);
        formData.append('distance', item.payload.distance);
        if (item.payload.estimatedArea) formData.append('estimatedArea', item.payload.estimatedArea);
        formData.append('gpsAccuracy', item.payload.gpsAccuracy);
        formData.append('startedAt', item.payload.startedAt);
        formData.append('stoppedAt', item.payload.stoppedAt);
        formData.append('coordinates', JSON.stringify(item.payload.coordinates));
        formData.append('description', item.payload.description || 'Field Verification Walk');

        const targetUrl = resolveEndpoint(item.endpoint);
        response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      } else if (item.type === 'VERIFICATION_RESOLVE') {
        const targetUrl = resolveEndpoint(item.endpoint);
        response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item.payload)
        });
      }

      if (response && response.ok) {
        await removeOutboxItem(item.id);
        processed++;
        if (onProgress) onProgress({ current: item, status: 'SUCCESS' });
      } else {
        const errText = response ? await response.text() : 'Network error';
        await updateOutboxItem(item.id, { 
          status: 'FAILED', 
          lastError: errText, 
          retries: (item.retries || 0) + 1 
        });
        failed++;
        if (onProgress) onProgress({ current: item, status: 'FAILED', error: errText });
      }
    } catch (err) {
      console.error('Outbox sync error on item:', item.id, err);
      await updateOutboxItem(item.id, { 
        status: 'FAILED', 
        lastError: err.message, 
        retries: (item.retries || 0) + 1 
      });
      failed++;
      if (onProgress) onProgress({ current: item, status: 'FAILED', error: err.message });
    }
  }

  return { processed, failed };
}

/**
 * Get summary stats for mobile dashboard
 */
export async function getStorageStats() {
  const db = await getOfflineDB();
  const tasksCount = await db.count('cached_tasks');
  const outboxCount = await db.count('outbox_queue');
  const tracesCount = await db.count('local_gps_traces');
  return { tasksCount, outboxCount, tracesCount };
}
