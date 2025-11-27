import { TrainingExample, TrainingDocument, Message } from '../types';

const DB_NAME = 'VertexAIDemoDB';
const DOCS_STORE = 'documents';
const DB_VERSION = 1;

// --- LocalStorage Helpers (Sync, for small data like Text & Chat) ---

export const saveExamples = (examples: TrainingExample[]) => {
  try {
    localStorage.setItem('vertex_demo_examples', JSON.stringify(examples));
  } catch (e) {
    console.error("Failed to save examples", e);
  }
};

export const loadExamples = (): TrainingExample[] => {
  try {
    const data = localStorage.getItem('vertex_demo_examples');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveChatHistory = (messages: Message[]) => {
   try {
    localStorage.setItem('vertex_demo_chat', JSON.stringify(messages));
  } catch (e) {
    console.error("Failed to save chat", e);
  }
}

export const loadChatHistory = (): Message[] => {
  try {
    const data = localStorage.getItem('vertex_demo_chat');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// --- IndexedDB Helpers (Async, for large files like PDFs) ---

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DOCS_STORE)) {
        db.createObjectStore(DOCS_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveDocuments = async (docs: TrainingDocument[]) => {
  try {
      const db = await openDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(DOCS_STORE, 'readwrite');
        const store = tx.objectStore(DOCS_STORE);
        
        // Clear existing to sync state (simple strategy for demo)
        store.clear();

        docs.forEach(doc => {
          store.put(doc);
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
  } catch (error) {
      console.error("Error saving documents to DB:", error);
  }
};

export const loadDocuments = async (): Promise<TrainingDocument[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DOCS_STORE, 'readonly');
      const store = tx.objectStore(DOCS_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Error loading docs DB", e);
    return [];
  }
};

export const clearAllData = async () => {
    localStorage.removeItem('vertex_demo_examples');
    localStorage.removeItem('vertex_demo_chat');
    try {
        const db = await openDB();
        const tx = db.transaction(DOCS_STORE, 'readwrite');
        tx.objectStore(DOCS_STORE).clear();
    } catch (e) {
        console.error("Error clearing DB", e);
    }
}