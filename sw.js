// Service Worker — 毕业人生模拟器离线缓存
const CACHE_NAME = 'ge-ben-dong-xi-v2';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
];

// 安装：预缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  // 立即激活，不等待旧 SW
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：缓存优先，离线可用
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // 命中缓存直接返回
      if (cached) return cached;

      // 尝试网络请求
      return fetch(event.request).then(response => {
        // 不缓存非成功响应
        if (!response || response.status !== 200) return response;

        // 缓存成功的 HTML/JS/CSS/JSON 请求
        const url = new URL(event.request.url);
        const cacheable = url.pathname.endsWith('.html')
          || url.pathname.endsWith('.js')
          || url.pathname.endsWith('.css')
          || url.pathname.endsWith('.json')
          || url.pathname === '/' || url.pathname.endsWith('/');

        if (cacheable) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cloned);
          });
        }

        return response;
      }).catch(() => {
        // 网络失败且无缓存 — 返回 HTML 页面（SPA fallback）
        return caches.match('./index.html');
      });
    })
  );
});
