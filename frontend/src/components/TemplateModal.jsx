import { useState, useEffect } from 'react'
import { templatesApi, authApi } from '../api'
import RichTextEditor from './RichTextEditor'

export default function TemplateModal({ isOpen, onClose, onSelect, isSuperuser = false }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [canEdit, setCanEdit] = useState(isSuperuser)

  useEffect(() => {
    setCanEdit(isSuperuser)
  }, [isSuperuser])

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data } = await templatesApi.getAll()
      console.log('Templates loaded:', data)
      setTemplates(data)
    } catch (e) {
      console.log('Templates API error:', e)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (template = null) => {
    setEditingTemplate(template ? { ...template } : { id: 'new', title: '', content: '' })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingTemplate(null)
  }

  const saveTemplate = async () => {
    if (!editingTemplate.title.trim()) return
    
    try {
      if (editingTemplate.id === 'new') {
        await templatesApi.create(editingTemplate)
      } else {
        await templatesApi.update(editingTemplate.id, editingTemplate)
      }
      await loadTemplates()
      closeEditModal()
    } catch (e) {
      console.error('Failed to save template:', e)
    }
  }

  const deleteTemplate = async (id) => {
    if (!confirm('Удалить шаблон?')) return
    try {
      await templatesApi.delete(id)
      await loadTemplates()
    } catch (e) {
      console.error('Failed to delete template:', e)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="prompt-modal-overlay" onClick={onClose}>
        <div 
          className="prompt-modal" 
          style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} 
          onClick={e => e.stopPropagation()}
        >
          <h3 style={{ marginBottom: '1rem' }}>Выберите шаблон</h3>
          
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', overflowY: 'auto', padding: '4px', flex: 1 }}>
              {templates.map((tpl) => (
                <div 
                  key={tpl.id}
                  style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: '#fafafa',
                    position: 'relative'
                  }}
                  onClick={() => { onSelect(tpl.content); onClose(); }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#ddd'}
                >
                  <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>{tpl.title}</div>
                  <div 
                    style={{ fontSize: '12px', color: '#666', maxHeight: '60px', overflow: 'hidden' }}
                    dangerouslySetInnerHTML={{ __html: tpl.content }}
                  />
                  {isSuperuser && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(tpl) }}
                        style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', background: '#eee', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(tpl.id) }}
                        style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c00' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="prompt-modal-actions" style={{ marginTop: '1rem', justifyContent: 'space-between' }}>
            {isSuperuser && (
              <button className="btn btn-primary" onClick={() => openEditModal()}>+ Добавить шаблон</button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="prompt-modal-overlay" onClick={closeEditModal}>
          <div 
            className="prompt-modal" 
            style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} 
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem' }}>
              {editingTemplate.id === 'new' ? 'Новый шаблон' : 'Редактировать шаблон'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
              <input 
                type="text" 
                value={editingTemplate.title}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                placeholder="Название шаблона"
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
              />
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '14px', marginBottom: '8px' }}>Содержимое:</label>
                <div style={{ flex: 1, overflow: 'hidden', border: '1px solid #ddd', borderRadius: '8px' }}>
                  <RichTextEditor
                    value={editingTemplate.content}
                    onChange={(html) => setEditingTemplate({ ...editingTemplate, content: html })}
                    placeholder="Введите содержимое шаблона..."
                  />
                </div>
              </div>
            </div>
            <div className="prompt-modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={closeEditModal}>Отмена</button>
              <button className="btn btn-primary" onClick={saveTemplate} disabled={!editingTemplate.title.trim()}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
