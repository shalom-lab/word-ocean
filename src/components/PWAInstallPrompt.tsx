import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// 检测是否为 iOS 设备
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// 检测是否为 iOS Safari（不包括其他浏览器）
const isIOSSafari = () => {
  const ua = navigator.userAgent;
  const isIOSDevice = isIOS();
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
  return isIOSDevice && isSafari;
};

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 检测 iOS 设备
    const ios = isIOSSafari();
    setIsIOSDevice(ios);

    // iOS Safari 不支持 beforeinstallprompt，需要手动提示
    if (ios) {
      const hasShownPrompt = localStorage.getItem('pwa-install-prompt-shown');
      if (!hasShownPrompt) {
        // 延迟显示，给用户一些时间浏览
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Android Chrome 和其他支持 beforeinstallprompt 的浏览器
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 检查本地存储，避免频繁提示
      const hasShownPrompt = localStorage.getItem('pwa-install-prompt-shown');
      if (!hasShownPrompt) {
        // 延迟显示，给用户一些时间浏览
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
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
    if (isIOSDevice) {
      // iOS 需要显示手动安装说明
      setShowIOSInstructions(true);
      return;
    }

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
    setShowIOSInstructions(false);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
  };

  // 如果已安装，不显示
  if (isInstalled) {
    return null;
  }

  // iOS 显示安装说明
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="font-semibold text-slate-900 mb-4 text-lg">添加到主屏幕</h3>
          <div className="space-y-4 text-sm text-slate-700 mb-6">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold">1</span>
              <p>点击 Safari 浏览器底部的<Share className="inline-block mx-1" size={16} />分享按钮</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold">2</span>
              <p>在菜单中选择"添加到主屏幕"</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold">3</span>
              <p>点击"添加"完成安装</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            知道了
          </button>
        </div>
      </div>
    );
  }

  // Android/桌面端：需要 beforeinstallprompt 事件
  if (!isIOSDevice && !deferredPrompt) {
    return null;
  }

  // 如果没有提示，不显示
  if (!showPrompt) {
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
