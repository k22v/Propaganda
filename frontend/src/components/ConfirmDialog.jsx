import { useState, useEffect, useCallback } from 'react'

export function ConfirmDialog({ isOpen, title, message, confirmText = 'Подтвердить', cancelText = 'Отмена', onConfirm, onCancel, danger = false }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(isOpen)
  }, [isOpen])

  const handleConfirm = () => {
    onConfirm?.()
    setIsVisible(false)
  }

  const handleCancel = () => {
    onCancel?.()
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="confirm-overlay" onClick={handleCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={handleCancel}>{cancelText}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={handleConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm() {
  const [confirmConfig, setConfirmConfig] = useState(null)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmConfig({
        ...options,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      })
    })
  }, [])

  const ConfirmComponent = confirmConfig ? (
    <ConfirmDialog
      isOpen={true}
      title={confirmConfig.title}
      message={confirmConfig.message}
      confirmText={confirmConfig.confirmText}
      cancelText={confirmConfig.cancelText}
      danger={confirmConfig.danger}
      onConfirm={confirmConfig.onConfirm}
      onCancel={confirmConfig.onCancel}
    />
  ) : null

  return { confirm, ConfirmComponent }
}