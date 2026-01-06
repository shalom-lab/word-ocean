// IndexedDB 缓存管理，用于缓存大文件数据
// 支持离线缓存和版本控制

const DB_NAME = 'word-ocean-cache';
const DB_VERSION = 1;
const STORE_NAME = 'similarity-data';

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
}

// 打开数据库
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// 获取缓存
export async function getCache(key: string): Promise<any | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // 检查是否过期（7天）
          const now = Date.now();
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (now - result.timestamp < sevenDays) {
            resolve(result.data);
          } else {
            // 过期，删除并返回null
            deleteCache(key);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('获取缓存失败:', error);
    return null;
  }
}

// 设置缓存
export async function setCache(key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const entry: CacheEntry = {
        key,
        data,
        timestamp: Date.now(),
      };
      const request = store.put(entry, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('设置缓存失败:', error);
  }
}

// 删除缓存
export async function deleteCache(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('删除缓存失败:', error);
  }
}

// 清除所有缓存
export async function clearCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
}

