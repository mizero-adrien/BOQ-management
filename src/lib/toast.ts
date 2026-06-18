type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

type ToastListener = (toasts: Toast[]) => void

class ToastManager {
  private toasts: Toast[] = []
  private listeners: ToastListener[] = []

  private notify() {
    this.listeners.forEach((l) => l([...this.toasts]))
  }

  subscribe(listener: ToastListener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  show(type: ToastType, title: string, message?: string, duration = 4000) {
    const id = Math.random().toString(36).slice(2)
    const t: Toast = { id, type, title, message, duration }
    this.toasts = [t, ...this.toasts].slice(0, 5)
    this.notify()
    if (duration > 0) setTimeout(() => this.dismiss(id), duration)
    return id
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
    this.notify()
  }

  success(title: string, message?: string) { return this.show('success', title, message) }
  error(title: string, message?: string) { return this.show('error', title, message, 6000) }
  warning(title: string, message?: string) { return this.show('warning', title, message, 5000) }
  info(title: string, message?: string) { return this.show('info', title, message) }
  loading(title: string, message?: string) { return this.show('info', title, message, 0) }
}

export const toast = new ToastManager()
export type { Toast, ToastType }
