import { useState, useEffect, useRef } from 'react'
import '../ui.css'

export function Badge({ children, variant = 'default', size = 'md' }) {
  const variants = {
    default: 'badge-default',
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
  }

  return (
    <span className={`badge ${variants[variant]} badge-${size}`}>
      {children}
    </span>
  )
}

export function Card({ children, className = '', padding = 'md', ...props }) {
  return (
    <div className={`card card-padding-${padding} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = ''
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span className="btn-spinner" />}
      {children}
    </button>
  )
}

export function ProgressBar({ value, max = 100, showText = true, size = 'md' }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div className={`progress-container progress-${size}`}>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percent}%` }}
        />
      </div>
      {showText && (
        <span className="progress-text">{Math.round(percent)}%</span>
      )}
    </div>
  )
}

export function Avatar({ name, src, size = 'md' }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0

  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={`avatar avatar-${size}`}
      />
    )
  }

  return (
    <div 
      className={`avatar avatar-${size} avatar-initials`}
      style={{ backgroundColor: colors[colorIndex] }}
    >
      {initials}
    </div>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

export function Skeleton({ variant = 'text', width, height }) {
  return (
    <div 
      className={`skeleton skeleton-${variant}`}
      style={{ width, height }}
    />
  )
}

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal modal-${size}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export function DropdownMenu({ trigger, items, align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="dropdown" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className={`dropdown-menu dropdown-${align}`}>
          {items.map((item, i) => (
            <button
              key={i}
              className={`dropdown-item ${item.danger ? 'dropdown-item-danger' : ''}`}
              onClick={() => {
                item.onClick?.()
                setIsOpen(false)
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}