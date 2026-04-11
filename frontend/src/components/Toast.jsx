import { useState, useEffect } from 'react'
import './Toast.css'
import './Toast.css'

let toastTimeout = null

function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (toastTimeout) clearTimeout(toastTimeout)
    toastTimeout = setTimeout(onClose, 4000)
    return () => { if (toastTimeout) clearTimeout(toastTimeout) }
  }, [onClose])

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">
        {type === 'error' && '❌'}
        {type === 'success' && '✅'}
        {type === 'warning' && '⚠️'}
        {type === 'info' && 'ℹ️'}
      </span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  const closeToast = () => setToast(null)

  return { toast, showToast, closeToast }
}

export function ToastContainer({ toast, onClose }) {
  if (!toast) return null
  return <Toast message={toast.message} type={toast.type} onClose={onClose} />
}

export function withToastHandler(handlers, showToast) {
  const wrapped = {}
  for (const [key, fn] of Object.entries(handlers)) {
    if (typeof fn === 'function') {
      wrapped[key] = async (...args) => {
        try {
          return await fn(...args)
        } catch (err) {
          const msg = err.response?.data?.detail || err.message || 'Ошибка'
          showToast(msg, 'error')
          console.error(err)
        }
      }
    }
  }
  return wrapped
}
