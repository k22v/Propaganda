import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const SHORTCUTS = {
  'g h': () => '/', // Go Home
  'g c': () => '/courses', // Go Courses
  'g m': () => '/my-courses', // Go My Courses
  'g p': () => '/profile', // Go Profile
  'g a': () => '/admin', // Go Admin
  'g g': () => '/glossary', // Go Glossary
  's': 'search', // Focus search
  '?': 'help', // Show shortcuts
  'Escape': 'close', // Close modals
  'd': 'dark', // Toggle dark mode
}

const DESKTOP_SHORTCUTS = [
  { key: 'g h', description: 'Главная страница' },
  { key: 'g c', description: 'Курсы' },
  { key: 'g m', description: 'Мои курсы' },
  { key: 'g p', description: 'Профиль' },
  { key: 'g a', description: 'Админ-панель' },
  { key: 'g g', description: 'Глоссарий' },
  { key: 's', description: 'Поиск' },
  { key: '?', description: 'Показать подсказки' },
  { key: 'd', description: 'Тёмная тема' },
  { key: 'Esc', description: 'Закрыть' },
]

export function useKeyboardShortcuts(callbacks = {}) {
  const navigate = useNavigate()

  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return
    }

    const key = e.key
    const ctrl = e.ctrlKey || e.metaKey
    const shift = e.shiftKey

    if (ctrl || shift) return

    const shortcut = SHORTCUTS[key]
    
    if (shortcut === 'search' && callbacks.focusSearch) {
      e.preventDefault()
      callbacks.focusSearch()
    } else if (shortcut === 'help' && callbacks.toggleHelp) {
      e.preventDefault()
      callbacks.toggleHelp()
    } else if (shortcut === 'close' && callbacks.closeModal) {
      e.preventDefault()
      callbacks.closeModal()
    } else if (shortcut === 'dark' && callbacks.toggleDarkMode) {
      e.preventDefault()
      callbacks.toggleDarkMode()
    } else if (typeof shortcut === 'function') {
      e.preventDefault()
      const path = shortcut()
      if (path) navigate(path)
    }

    if (key === 'g' && callbacks.pendingShortcut) {
      callbacks.pendingShortcut('g')
      setTimeout(() => callbacks.clearPending(), 1000)
    }
  }, [navigate, callbacks])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function ShortcutsHelp({ show, onClose }) {
  if (!show) return null

  return (
    <div className="shortcuts-modal-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>Горячие клавиши</h2>
          <button onClick={onClose} className="shortcuts-close">×</button>
        </div>
        <div className="shortcuts-list">
          {DESKTOP_SHORTCUTS.map(({ key, description }) => (
            <div key={key} className="shortcut-item">
              <kbd>{key}</kbd>
              <span>{description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
