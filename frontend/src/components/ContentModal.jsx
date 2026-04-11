import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { coursesApi, quizApi, authApi } from '../api'
import RichTextEditor from '../components/RichTextEditor'
import { useToast } from './Toast'

const contentTypes = [
  { type: 'text', icon: '📝', label: 'Текст', color: '#3b82f6' },
  { type: 'quote', icon: '❝', label: 'Цитата', color: '#8b5cf6' },
  { type: 'image', icon: '🖼️', label: 'Изображение', color: '#ec4899' },
  { type: 'video', icon: '🎬', label: 'Видео', color: '#ef4444' },
  { type: 'list', icon: '📋', label: 'Список', color: '#14b8a6' },
  { type: 'interactive', icon: '🖱️', label: 'Интерактив', color: '#f59e0b' },
  { type: 'separator', icon: '➖', label: 'Разделитель', color: '#6b7280' },
  { type: 'file', icon: '📎', label: 'Файл', color: '#10b981' },
]

const defaultTemplates = {
  quote: [
    { title: 'Классическая цитата', content: '<blockquote class="blockquote"><p>Цитата текст</p><cite>— Автор</cite></blockquote>' },
  ],
  image: [
    { title: 'Изображение с подписью', content: '<figure class="figure"><img src="https://placehold.co/800x400" alt=""/><figcaption>Подпись</figcaption></figure>' },
  ],
  list: [
    { title: 'Нумерованный список', content: '<ol><li>Пункт 1</li><li>Пункт 2</li></ol>' },
    { title: 'Маркированный список', content: '<ul><li>Пункт 1</li><li>Пункт 2</li></ul>' },
  ],
  interactive: [
    { title: 'Аккордеон', content: '<details><summary>Нажмите для раскрытия</summary><p>Скрытое содержимое</p></details>' },
    { title: 'Кнопка', content: '<button class="btn">Кнопка</button>' },
  ],
  separator: [
    { title: 'Линия', content: '<hr/>' },
    { title: 'Отступ', content: '<div style="height: 40px;"></div>' },
  ],
}

function ContentModal({ isOpen, onClose, chapterId, onSave }) {
  const { showToast } = useToast()
  const [step, setStep] = useState('select-type')
  const [contentType, setContentType] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [templates, setTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lms_custom_templates') || '{}')
    } catch { return {} }
  })

  useEffect(() => {
    authApi.getMe()
      .then(({ data }) => setIsSuperuser(data?.is_superuser === true || data?.is_superuser === 1))
      .catch(() => setIsSuperuser(false))
  }, [])

  const saveTemplate = useCallback((templateName) => {
    if (!templateName || !content) return
    const newTemplates = {
      ...templates,
      [contentType]: [...(templates[contentType] || []), { title: templateName, content }]
    }
    setTemplates(newTemplates)
    localStorage.setItem('lms_custom_templates', JSON.stringify(newTemplates))
  }, [content, contentType, templates])

  const deleteTemplate = useCallback((idx) => {
    const newTemplates = {
      ...templates,
      [contentType]: templates[contentType].filter((_, i) => i !== idx)
    }
    setTemplates(newTemplates)
    localStorage.setItem('lms_custom_templates', JSON.stringify(newTemplates))
  }, [contentType, templates])

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await coursesApi.uploadFile(file)
      if (type === 'image') {
        setContent(`<img src="${res.data.url}" alt="${file.name}" class="img-fluid"/>`)
      } else if (type === 'video') {
        setVideoUrl(res.data.url)
      } else {
        setFileUrl(res.data.url)
      }
    } catch (err) {
      showToast('Ошибка загрузки', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return showToast('Введите название', 'warning')
    setIsSaving(true)
    try {
      await onSave({
        title,
        content_type: contentType,
        content,
        video_url: videoUrl,
        file_url: fileUrl,
        chapter_id: chapterId,
        order: 0
      })
      doClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (isSaving) return
    if (content.trim() || title.trim() || videoUrl.trim() || fileUrl.trim()) {
      setShowConfirmClose(true)
      return
    }
    doClose()
  }

  const doClose = () => {
    setStep('select-type')
    setContentType(null)
    setTitle('')
    setContent('')
    setVideoUrl('')
    setFileUrl('')
    setShowConfirmClose(false)
    onClose()
  }

  const allTemplates = contentType === 'text' ? [] : [...(defaultTemplates[contentType] || []), ...(templates[contentType] || [])]

  useEffect(() => {
    if (isOpen) {
      setStep('select-type')
      setContentType(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    }}>
      <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {step === 'select-type' ? 'Выберите тип контента' : 
             step === 'select-template' ? 'Выберите шаблон' :
             `Добавить: ${contentTypes.find(c => c.type === contentType)?.label}`}
          </h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {step === 'select-type' && (
            <div className="content-type-grid">
              {contentTypes.map(({ type, icon, label, color }) => (
                <div
                  key={type}
                  className="content-type-card"
                  onClick={() => { setContentType(type); setStep('select-template') }}
                  style={{ borderColor: color }}
                >
                  <span className="type-icon">{icon}</span>
                  <span className="type-label">{label}</span>
                </div>
              ))}
            </div>
          )}

          {step === 'select-template' && (
            <div className="template-step">
              <div className="template-grid">
                {allTemplates.map((template, idx) => (
                  <div key={idx} className="template-card" onClick={() => {
                    setTitle(template.title)
                    setContent(template.content || '')
                    setStep('edit')
                  }}>
                    <div className="template-preview">
                      {template.content?.includes('<img') && '🖼️'}
                      {template.content?.includes('<blockquote') && '❝'}
                      {template.content?.includes('<ol') && '📋'}
                      {template.content?.includes('<ul') && '📋'}
                      {template.content?.includes('<details') && '🖱️'}
                      {template.content?.includes('<hr') && '➖'}
                      {!template.content && '📄'}
                    </div>
                    <span className="template-name">{template.title}</span>
                    {idx >= (defaultTemplates[contentType]?.length || 0) && (
                      <button className="template-delete" onClick={(e) => { e.stopPropagation(); deleteTemplate(idx - (defaultTemplates[contentType]?.length || 0)) }}>×</button>
                    )}
                  </div>
                ))}
                <div className="template-card template-new" onClick={() => setStep('edit')}>
                  <span className="template-new-icon">+</span>
                  <span className="template-name">Создать с нуля</span>
                </div>
              </div>
              <button className="btn-back" onClick={() => setStep('select-type')}>← Назад</button>
            </div>
          )}

          {step === 'edit' && (
            <div className="content-edit-form">
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Введите название"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Содержимое</label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Введите текст..."
                  isSuperuser={isSuperuser}
                />
              </div>

              {contentType === 'image' && (
                <div className="form-group">
                  <label>или загрузить изображение</label>
                  <label className="upload-btn">
                    {uploading ? 'Загрузка...' : '📷 Загрузить изображение'}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} disabled={uploading} hidden />
                  </label>
                </div>
              )}

              {contentType === 'video' && (
                <div className="form-group">
                  <label>Ссылка на видео</label>
                  <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." className="form-input" />
                  <label className="upload-btn" style={{marginTop: 10}}>
                    {uploading ? 'Загрузка...' : '📁 Загрузить видео'}
                    <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} disabled={uploading} hidden />
                  </label>
                </div>
              )}

              {contentType === 'file' && (
                <div className="form-group">
                  <label>Ссылка на файл</label>
                  <input type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." className="form-input" />
                  <label className="upload-btn" style={{marginTop: 10}}>
                    {uploading ? 'Загрузка...' : '📁 Загрузить файл'}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e, 'file')} disabled={uploading} hidden />
                  </label>
                </div>
              )}

              <div className="form-actions">
                <button className="btn-save-template" onClick={() => setShowSaveTemplate(true)}>💾 Сохранить как шаблон</button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'edit' && (
            <>
              <button className="btn btn-secondary" onClick={() => setStep('select-template')}>Назад</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Сохранение...' : 'Добавить'}
              </button>
            </>
          )}
        </div>
      </div>

      {showSaveTemplate && (
        <div className="modal-overlay" onClick={() => setShowSaveTemplate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Сохранить шаблон</h3>
            <input
              type="text"
              placeholder="Название шаблона"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveTemplate(templateName)}
              autoFocus
            />
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowSaveTemplate(false)}>Отмена</button>
                <button className="btn btn-primary" onClick={() => { saveTemplate(templateName); setShowSaveTemplate(false); setTemplateName('') }}>Сохранить</button>
              </div>
            </div>
          </div>
        )}
      )}

      {showConfirmClose && (
        <div className="modal-overlay" onClick={() => setShowConfirmClose(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>Несохранённые изменения</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>У вас есть несохранённые изменения. Вы уверены, что хотите закрыть?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirmClose(false)}>Отмена</button>
              <button className="btn btn-danger" onClick={doClose}>Закрыть без сохранения</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentModal
