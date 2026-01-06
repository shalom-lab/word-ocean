import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 检查是否已安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 监听 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      // 阻止默认提示
      e.preventDefault();
      // 保存事件以便稍后使用
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 检查本地存储，看用户是否已拒绝过
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        // 延迟显示提示（3秒后）
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 监听已安装事件
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 显示安装提示
    await deferredPrompt.prompt();

    // 等待用户选择
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('用户接受了安装提示');
      setShowPrompt(false);
    } else {
      console.log('用户拒绝了安装提示');
    }

    // 清除保存的提示
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 记住用户的选择，24小时内不再显示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // 如果已安装或不显示，返回 null
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4 animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-purple-500 p-4 flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Download className="text-purple-600" size={24} />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 mb-1">安装词海应用</h3>
          <p className="text-sm text-slate-600">
            添加到主屏幕，离线使用，体验更佳
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            安装
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

