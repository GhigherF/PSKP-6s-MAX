const DB_NAME = 'draft_db';
const STORE = 'draft_files';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

export async function saveDraftFiles(files) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  store.clear();
  files.forEach(f => store.add({ file: f }));
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

export async function loadDraftFiles() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = e => resolve(e.target.result.map(r => r.file));
    req.onerror = e => reject(e.target.error);
  });
}

export async function clearDraftFiles() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).clear();
    req.onsuccess = resolve;
    req.onerror = e => reject(e.target.error);
  });
}
