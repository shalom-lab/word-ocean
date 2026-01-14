import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 监听 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 检查本地存储，避免频繁提示
      const hasShownPrompt = localStorage.getItem('pwa-install-prompt-shown');
      if (!hasShownPrompt) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 监听应用安装成功事件
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-install-prompt-shown', 'true');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 显示安装提示
    deferredPrompt.prompt();

    // 等待用户选择
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }
    
    // 清除提示
    setDeferredPrompt(null);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
  };

  // 如果已安装或没有提示，不显示
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-4 flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">安装词海应用</h3>
          <p className="text-sm text-slate-600 mb-3">
            将词海添加到主屏幕，享受更快的加载速度和离线访问体验。
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download size={16} />
              安装
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              稍后
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
          aria-label="关闭"
        >
          <X size={18} className="text-slate-500" />
        </button>
      </div>
    </div>
  );
}
