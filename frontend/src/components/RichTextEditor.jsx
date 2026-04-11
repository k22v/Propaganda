import { useState, useEffect, useRef } from 'react'
import './RichTextEditor.css'
import { templatesApi } from '../api'

export default function RichTextEditor({ value, onChange, placeholder, onPrompt, isSuperuser = false }) {
  const editorRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState([])
  const [promptModal, setPromptModal] = useState({ show: false, title: '', placeholder: '', onConfirm: null, isConfirm: false })
  const [templateForm, setTemplateForm] = useState({ show: false, mode: 'create', data: null })
  const [templateEdit, setTemplateEdit] = useState({ title: '', content: '' })
  const [showFontDropdown, setShowFontDropdown] = useState(false)
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false)
  const [ignoreClickOutside, setIgnoreClickOutside] = useState(false)
  const savedSelectionRef = useRef(null)
  const dropdownOpenedRef = useRef(false)

  const fonts = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  ]

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']

  useEffect(() => {
    if (isSuperuser) {
      loadTemplates()
    }
  }, [isSuperuser])

  const loadTemplates = async () => {
    try {
      const { data } = await templatesApi.getAll()
      console.log('Loaded templates:', data)
      setTemplates(data)
    } catch (e) {
      console.log('Failed to load templates', e)
    }
  }

  useEffect(() => {
    if (value && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    
    const saveSelection = () => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && sel.toString().trim()) {
        savedSelectionRef.current = sel.getRangeAt(0).cloneRange()
        console.log('Selection saved:', sel.toString().substring(0, 50))
      }
    }
    
    editor.addEventListener('mouseup', saveSelection)
    editor.addEventListener('keyup', saveSelection)
    
    return () => {
      editor.removeEventListener('mouseup', saveSelection)
      editor.removeEventListener('keyup', saveSelection)
    }
  }, [])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command, value = null) => {
    if (command === 'insertHTML' && value) {
      document.execCommand('insertHTML', false, value)
    } else {
      document.execCommand(command, false, value)
    }
    editorRef.current?.focus()
    handleInput()
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ignoreClickOutside) {
        setIgnoreClickOutside(false)
        return
      }
      if (showHighlightDropdown && !e.target.closest('.toolbar-group.dropdown')) {
        setShowHighlightDropdown(false)
      }
      if (showFontDropdown && !e.target.closest('.toolbar-group.dropdown')) {
        setShowFontDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showHighlightDropdown, showFontDropdown, ignoreClickOutside])

  const useOnPrompt = onPrompt || ((title, placeholder, callback) => {
    setPromptModal({ show: true, title, placeholder, onConfirm: callback })
  })

  const handleCreateTemplate = () => {
    setTemplateEdit({ title: '', content: '' })
    setTemplateForm({ show: true, mode: 'create', data: null })
  }

  const handleEditTemplate = (template) => {
    setTemplateEdit({ title: template.title, content: template.content })
    setTemplateForm({ show: true, mode: 'edit', data: template })
  }

  const handleDeleteTemplate = async (template) => {
    setPromptModal({
      show: true,
      title: `Удалить шаблон "${template.title}"?`,
      placeholder: '',
      isConfirm: true,
      onConfirm: async () => {
        try {
          await templatesApi.delete(template.id)
          loadTemplates()
        } catch (e) {
          console.log('Failed to delete template')
        }
      }
    })
  }

  const handleSaveTemplate = async () => {
    if (!templateEdit.title.trim()) {
      setTemplateForm(prev => ({ ...prev, error: 'Введите название шаблона' }))
      return
    }
    try {
      if (templateForm.mode === 'create') {
        await templatesApi.create({ title: templateEdit.title, content: templateEdit.content })
      } else {
        await templatesApi.update(templateForm.data.id, { title: templateEdit.title, content: templateEdit.content })
      }
      loadTemplates()
      setTemplateForm({ show: false, mode: 'create', data: null })
    } catch (e) {
      console.log('Failed to save template')
    }
  }

  const insertTemplate = (template) => {
    console.log('Inserting template, editorRef:', editorRef.current)
    console.log('Template content:', template)
    
    if (!template) {
      console.log('Template is empty')
      return
    }
    if (!editorRef.current) {
      console.log('Editor ref is null')
      return
    }
    
    try {
      editorRef.current.focus()
      const currentContent = editorRef.current.innerHTML || ''
      editorRef.current.innerHTML = currentContent + template
      handleInput()
      console.log('Done')
    } catch (e) {
      console.log('Error inserting template:', e)
    }
  }

  const handleTemplateClick = (template) => {
    console.log('Template clicked:', template)
    insertTemplate(template.content || template)
  }

  const neonColors = [
    { name: 'Розовый', color: '#ff00ff' },
    { name: 'Циан', color: '#00ffff' },
    { name: 'Зелёный', color: '#00ff00' },
    { name: 'Жёлтый', color: '#ffff00' },
    { name: 'Оранжевый', color: '#ff6600' },
    { name: 'Красный', color: '#ff0066' },
  ]

  const handleNeonClick = (e, color) => {
    e.stopPropagation()
    console.log('Color clicked:', color)
    insertHighlight(color)
  }

  const handleRemoveHighlight = (e) => {
    e.stopPropagation()
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return
    }
    
    const text = selection.toString()
    if (!text.trim()) {
      return
    }
    
    const range = selection.getRangeAt(0)
    
    if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
      let node = range.startContainer.parentNode
      if (node && (node.tagName === 'SPAN' || node.tagName === 'MARK')) {
        const textNode = document.createTextNode(node.textContent)
        node.replaceWith(textNode)
        handleInput()
        return
      }
    }
    
    const fragment = range.extractContents()
    const textNode = document.createTextNode(fragment.textContent)
    range.insertNode(textNode)
    
    const newRange = document.createRange()
    newRange.selectNodeContents(textNode)
    selection.removeAllRanges()
    selection.addRange(newRange)
    handleInput()
  }

  const applyHighlight = (color, isNeon = false) => {
    console.log('=== applyHighlight called ===')
    const selection = window.getSelection()
    let selectedText = ''
    let range = null
    
    console.log('Initial selection:', selection?.toString())
    console.log('savedSelectionRef:', savedSelectionRef.current ? 'exists' : 'null')
    
    if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
      selectedText = selection.toString()
      range = selection.getRangeAt(0)
      console.log('Using current selection:', selectedText)
    } else if (savedSelectionRef.current) {
      console.log('Using saved selection')
      range = savedSelectionRef.current
      const tempRange = document.createRange()
      tempRange.selectNodeContents(editorRef.current)
      tempRange.setStart(range.startContainer, range.startOffset)
      tempRange.setEnd(range.endContainer, range.endOffset)
      selectedText = tempRange.toString()
      console.log('Recovered text:', selectedText)
    } else {
      console.log('NO SELECTION FOUND!')
    }
    
    if (!selectedText || !selectedText.trim()) {
      console.log('No text to highlight, returning')
      return
    }
    
    console.log('Applying highlight to:', selectedText)
    
    const wrapper = document.createElement('span')
    wrapper.style.cssText = `background: ${color}; color: #000; padding: 2px 4px; border-radius: 4px; font-weight: 500; box-shadow: 0 0 8px ${color}; display: inline;`
    wrapper.textContent = selectedText
    
    if (range) {
      range.deleteContents()
      range.insertNode(wrapper)
      range.setStartAfter(wrapper)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    savedSelectionRef.current = null
    handleInput()
    console.log('=== Highlight applied ===')
  }

  const insertHighlight = (color) => {
    console.log('insertHighlight called with color:', color)
    setShowHighlightDropdown(false)
    applyHighlight(color, true)
  }

  const insertNeonHighlight = (color) => {
    console.log('insertNeonHighlight called with color:', color)
    setShowHighlightDropdown(false)
    applyHighlight(color, true)
  }

  const handlePromptConfirm = (value) => {
    if (promptModal.onConfirm) {
      promptModal.onConfirm(value)
    }
    setPromptModal({ show: false, title: '', placeholder: '', onConfirm: null })
  }

  const insertLink = () => {
    useOnPrompt('Вставить ссылку', 'https://', (url) => {
      if (url) execCommand('createLink', url)
    })
  }

  const insertImage = () => {
    useOnPrompt('Вставить изображение', 'https://', (url) => {
      if (url) execCommand('insertImage', url)
    })
  }

  const insertVideo = () => {
    useOnPrompt('Вставить видео (YouTube, Vimeo или прямая ссылка)', 'https://', (url) => {
      if (!url) return
      let embedHtml = ''
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be') ? url.split('/').pop() : url.split('v=')[1]?.split('&')[0]
        embedHtml = `<div class="video-container"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`
      } else if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop()
        embedHtml = `<div class="video-container"><iframe width="560" height="315" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen></iframe></div>`
      } else {
        embedHtml = `<div class="video-container"><video controls><source src="${url}" type="video/mp4">Ваш браузер не поддерживает видео</video></div>`
      }
      insertTemplate(embedHtml)
    })
  }

  return (
    <div className={`rich-editor ${isFocused ? 'focused' : ''}`}>
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('bold')} title="Жирный (B)" className="toolbar-btn">
            <strong>Ж</strong>
          </button>
          <button type="button" onClick={() => execCommand('italic')} title="Курсив (I)" className="toolbar-btn">
            <em>К</em>
          </button>
          <button type="button" onClick={() => execCommand('underline')} title="Подчёркнутый (U)" className="toolbar-btn">
            <u>Ч</u>
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group dropdown">
          <button 
            type="button" 
            className="toolbar-btn"
            onClick={() => setShowFontDropdown(!showFontDropdown)}
            title="Шрифт"
          >
            Аrial ▾
          </button>
          {showFontDropdown && (
            <div className="dropdown-menu show" style={{ display: 'block', maxHeight: '200px', overflow: 'auto' }}>
              {fonts.map((font) => (
                <button 
                  key={font.name}
                  onClick={() => { execCommand('fontName', font.value); setShowFontDropdown(false); }}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('fontSize', '1')} title="Размер 1" className="toolbar-btn">А</button>
          <button type="button" onClick={() => execCommand('fontSize', '3')} title="Размер 3" className="toolbar-btn" style={{ fontSize: '14px' }}>А</button>
          <button type="button" onClick={() => execCommand('fontSize', '5')} title="Размер 5" className="toolbar-btn" style={{ fontSize: '18px' }}>А</button>
        </div>
        
        <div className="toolbar-divider" />
        
        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('formatBlock', 'h2')} title="Заголовок 2" className="toolbar-btn">
            H2
          </button>
          <button type="button" onClick={() => execCommand('formatBlock', 'h3')} title="Заголовок 3" className="toolbar-btn">
            H3
          </button>
          <button type="button" onClick={() => execCommand('formatBlock', 'p')} title="Обычный текст" className="toolbar-btn">
            T
          </button>
        </div>
        
        <div className="toolbar-divider" />
        
        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Маркированный список" className="toolbar-btn">
            •
          </button>
          <button type="button" onClick={() => execCommand('insertOrderedList')} title="Нумерованный список" className="toolbar-btn">
            1.
          </button>
        </div>
        
        <div className="toolbar-divider" />
        
        <div className="toolbar-group">
          <button type="button" onClick={insertLink} title="Вставить ссылку" className="toolbar-btn">
            🔗
          </button>
          <button type="button" onClick={insertImage} title="Вставить изображение" className="toolbar-btn">
            🖼️
          </button>
          <button type="button" onClick={insertVideo} title="Вставить видео" className="toolbar-btn">
            🎬
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            type="button" 
            className="toolbar-btn"
            onClick={() => {
              const sel = window.getSelection()
              if (sel && sel.rangeCount > 0 && sel.toString().trim()) {
                savedSelectionRef.current = sel.getRangeAt(0).cloneRange()
              }
            }}
            title="Выделить текст"
            style={{ background: '#ff00ff', color: '#fff', fontWeight: 'bold' }}
          >
            Н
          </button>
          <button 
            type="button"
            onClick={handleRemoveHighlight}
            title="Убрать выделение"
            style={{ 
              width: '24px', 
              height: '24px', 
              backgroundColor: '#fff', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              cursor: 'pointer',
              padding: 0,
              fontSize: '12px'
            }}
          >
            ✕
          </button>
          {neonColors.map((c) => (
            <button 
              key={c.color}
              onClick={(e) => handleNeonClick(e, c.color)}
              title={c.name}
              style={{ 
                width: '24px', 
                height: '24px', 
                backgroundColor: c.color, 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                boxShadow: `0 0 6px ${c.color}`,
                cursor: 'pointer',
                padding: 0
              }}
            />
          ))}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('indent')} title="Увеличить отступ" className="toolbar-btn">
            →
          </button>
          <button type="button" onClick={() => execCommand('outdent')} title="Уменьшить отступ" className="toolbar-btn">
            ←
          </button>
        </div>

        <div className="toolbar-divider" />
        
        {isSuperuser && (
          <div className="toolbar-group">
            <button 
              type="button" 
              className="toolbar-btn"
              onClick={() => setShowTemplateModal(!showTemplateModal)}
            >
              {showTemplateModal ? '✕ Закрыть' : '+ Шаблон'}
            </button>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', flex: 1, minHeight: '300px' }}>
        <div
          ref={editorRef}
          className="editor-content"
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          data-placeholder={placeholder || 'Введите текст...'}
          style={{ flex: 1, minHeight: '300px' }}
        />
      </div>

      <div className={`template-sidebar ${showTemplateModal ? 'open' : ''}`}>
        <div className="template-sidebar-header">
          <h3>Шаблоны</h3>
          <button 
            className="template-sidebar-close"
            onClick={() => setShowTemplateModal(false)}
          >
            ✕
          </button>
        </div>
        
        {!templateForm.show ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e5e5' }}>
              <button 
                className="toolbar-btn" 
                style={{ width: '100%', background: '#1a1a1a', color: '#fff', fontWeight: 500 }}
                onClick={handleCreateTemplate}
              >
                + Добавить шаблон
              </button>
            </div>
            <div className="template-sidebar-content">
              {templates.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  Нет шаблонов. Создайте первый шаблон.
                </div>
              )}
              {templates.map((tpl) => (
                <div 
                  key={tpl.id}
                  className="template-item"
                  onDoubleClick={() => insertTemplate(tpl.content)}
                >
                  <div 
                    className="template-item-title"
                    onClick={() => insertTemplate(tpl.content)}
                    style={{ cursor: 'pointer' }}
                  >
                    {tpl.title}
                  </div>
                  <div 
                    className="template-item-preview"
                    dangerouslySetInnerHTML={{ __html: tpl.content }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button 
                      className="toolbar-btn"
                      style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                      onClick={() => insertTemplate(tpl.content)}
                    >
                      Вставить
                    </button>
                    <button 
                      className="toolbar-btn"
                      style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                      onClick={() => handleEditTemplate(tpl)}
                    >
                      Изменить
                    </button>
                    <button 
                      className="toolbar-btn"
                      style={{ flex: 1, fontSize: '12px', padding: '6px', background: '#fee', color: '#c00', borderColor: '#fcc' }}
                      onClick={() => handleDeleteTemplate(tpl)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="template-form" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 16px' }}>
              {templateForm.mode === 'create' ? 'Новый шаблон' : 'Редактировать шаблон'}
            </h4>
            <input 
              type="text"
              placeholder="Название шаблона"
              value={templateEdit.title}
              onChange={(e) => setTemplateEdit({ ...templateEdit, title: e.target.value })}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '12px', fontSize: '14px' }}
            />
            <textarea
              placeholder="HTML-содержимое шаблона"
              value={templateEdit.content}
              onChange={(e) => setTemplateEdit({ ...templateEdit, content: e.target.value })}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '12px', fontSize: '14px', flex: 1, minHeight: '200px', resize: 'none', fontFamily: 'monospace' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="toolbar-btn"
                style={{ flex: 1, background: '#f5f5f5' }}
                onClick={() => setTemplateForm({ show: false, mode: 'create', data: null })}
              >
                Отмена
              </button>
              <button 
                className="toolbar-btn"
                style={{ flex: 1, background: '#1a1a1a', color: '#fff' }}
                onClick={handleSaveTemplate}
              >
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>

      {promptModal.show && (
        <div className="prompt-modal-overlay" onClick={() => setPromptModal({ show: false, title: '', placeholder: '', onConfirm: null, isConfirm: false })}>
          <div className={`prompt-modal ${promptModal.isConfirm ? 'confirm' : ''}`} onClick={e => e.stopPropagation()}>
            <h3>{promptModal.title}</h3>
            {promptModal.isConfirm ? (
              <div className="prompt-modal-actions">
                <button className="btn btn-secondary" onClick={() => setPromptModal({ show: false, title: '', placeholder: '', onConfirm: null, isConfirm: false })}>Отмена</button>
                <button className="btn btn-danger" onClick={() => { promptModal.onConfirm?.(); setPromptModal({ show: false, title: '', placeholder: '', onConfirm: null, isConfirm: false }) }}>Удалить</button>
              </div>
            ) : (
              <>
                <input 
                  type="text" 
                  id="prompt-input"
                  placeholder={promptModal.placeholder}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePromptConfirm(e.target.value)
                    if (e.key === 'Escape') setPromptModal({ show: false, title: '', placeholder: '', onConfirm: null, isConfirm: false })
                  }}
                />
                <div className="prompt-modal-actions">
                  <button className="btn btn-secondary" onClick={() => setPromptModal({ show: false, title: '', placeholder: '', onConfirm: null, isConfirm: false })}>Отмена</button>
                  <button className="btn btn-primary" onClick={() => handlePromptConfirm(document.getElementById('prompt-input').value)}>ОК</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
