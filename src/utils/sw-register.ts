// Service Worker 注册和更新管理

const SW_URL = '/word-ocean/sw.js';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/word-ocean/',
    });

    console.log('[SW] Service Worker registered:', registration);

    // 监听更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // 有新版本可用
          console.log('[SW] New version available');
          // 可以提示用户刷新页面（可选）
          // if (confirm('新版本可用，是否刷新页面？')) {
          //   window.location.reload();
          // }
        }
      });
    });

    // 监听消息（用于双向通信）
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW] Message from SW:', event.data);
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

// 取消注册（调试用）
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[SW] Service Worker unregistered');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
    return false;
  }
}

