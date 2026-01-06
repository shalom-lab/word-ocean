// Service Worker 版本号，更新时会触发缓存刷新
const CACHE_VERSION = 'v1';
const CACHE_NAME = `word-ocean-cache-${CACHE_VERSION}`;

// 需要预缓存的静态资源
const PRECACHE_ASSETS = [
  '/word-ocean/',
  '/word-ocean/index.html',
  '/word-ocean/json/word_top_similar.json',
  // 单词表 JSON 文件
  '/word-ocean/json/1-初中-顺序.json',
  '/word-ocean/json/2-高中-顺序.json',
  '/word-ocean/json/3-CET4-顺序.json',
  '/word-ocean/json/4-CET6-顺序.json',
  '/word-ocean/json/5-考研-顺序.json',
  '/word-ocean/json/6-托福-顺序.json',
  '/word-ocean/json/7-SAT-顺序.json',
];

// 安装时：预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      // 使用 Promise.allSettled 避免单个文件失败导致全部失败
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url => 
          cache.add(url).catch(err => {
            console.warn(`[SW] Failed to cache ${url}:`, err);
            return null;
          })
        )
      );
    }).then(() => {
      // 强制激活新的 Service Worker
      return self.skipWaiting();
    })
  );
});

// 激活时：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // 立即控制所有客户端
      return self.clients.claim();
    })
  );
});

// fetch 拦截：Cache First 策略（支持离线）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 跳过开发服务器相关请求（HMR、WebSocket等）
  if (
    url.pathname.includes('/@') || // Vite 开发服务器
    url.pathname.startsWith('/node_modules/') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    return;
  }

  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 处理所有请求（HTML、JSON、JS、CSS、assets等）
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Cache First: 优先返回缓存
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', url.pathname);
        return cachedResponse;
      }

      // 缓存未命中，从网络获取
      console.log('[SW] Fetching from network:', url.pathname);
      return fetch(request).then((response) => {
        // 只缓存成功的响应，且不是开发服务器响应
        if (response.status === 200 && !url.pathname.includes('/@')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      }).catch((error) => {
        console.error('[SW] Fetch failed (offline):', url.pathname);
        
        // 如果是导航请求（HTML），返回缓存的 index.html
        if (request.mode === 'navigate') {
          return caches.match('/word-ocean/index.html') || 
                 caches.match('/word-ocean/') ||
                 new Response('离线模式：请检查网络连接', {
                   status: 503,
                   headers: { 'Content-Type': 'text/plain' }
                 });
        }
        
        throw error;
      });
    })
  );
});

