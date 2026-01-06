import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/sw-register'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 注册 Service Worker（仅在生产环境，开发环境禁用避免干扰 HMR）
if (import.meta.env.PROD) {
  registerServiceWorker().catch(console.error)
} else {
  // 开发环境不注册，避免干扰 Vite HMR
  console.log('[SW] Service Worker disabled in development mode')
}

