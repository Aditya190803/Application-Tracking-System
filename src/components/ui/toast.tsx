'use client'

import { AlertCircle, CheckCircle, Info,X } from 'lucide-react'
import { createContext, ReactNode,useCallback, useContext, useState } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-foreground" />,
    error: <X className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  }

  const backgrounds = {
    success: 'bg-card border-border',
    error: 'bg-red-50 border-red-100',
    warning: 'bg-amber-50 border-amber-100',
    info: 'bg-blue-50 border-blue-100',
  }

  const textColors = {
    success: 'text-foreground',
    error: 'text-red-900',
    warning: 'text-amber-900',
    info: 'text-blue-900',
  }

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border
        min-w-[300px] max-w-[400px] shadow-xl animate-slide-in
        ${backgrounds[toast.type]}
      `}
    >
      <div className="flex-shrink-0">
        {icons[toast.type]}
      </div>
      <p className={`flex-1 text-sm font-semibold ${textColors[toast.type]}`}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Simple hook for direct toast usage without provider (fallback)
export function toast(message: string, type: ToastType = 'info') {
  // For server-side or when provider is not available
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('toast', { detail: { message, type } })
    window.dispatchEvent(event)
  }
}
