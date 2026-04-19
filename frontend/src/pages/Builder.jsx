import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ChevronDown, ChevronRight, FileText, Layers, Eye, Trash2, GripVertical } from 'lucide-react'
import { builderApi, coursesApi, authApi } from '../api'
import { useToast } from '../components/Toast'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Card, Badge, Button, Modal } from '../components/ui/index.jsx'
import './Builder.css'

function Builder() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [course, setCourse] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [sections, setSections] = useState([])
  const [expandedSections, setExpandedSections] = useState(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [editingPage, setEditingPage] = useState(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [showAddPage, setShowAddPage] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ type: null, id: null, title: '' })

  useEffect(() => {
    authApi.getMe()
      .then(({ data }) => {
        setCurrentUser(data)
        setAuthResolved(true)
      })
      .catch(() => {
        setAuthResolved(true)
        setAccessDenied(true)
      })
  }, [])

  useEffect(() => {
    if (courseId && currentUser) loadData()
  }, [courseId, currentUser])

  const checkPermission = (courseData, user) => {
    if (!courseData || !user) return false
    const isAuthor = courseData.author_id === user.id
    const isAdmin = user.role === 'admin' || user.is_superuser
    return isAuthor || isAdmin
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [{ data: courseData }, { data: tree }] = await Promise.all([
        coursesApi.getById(courseId),
        builderApi.getTree(courseId)
      ])

      const canEdit = checkPermission(courseData, currentUser)
      if (!canEdit) {
        setAccessDenied(true)
        showToast('Доступ запрещён', 'error')
        setIsLoading(false)
        return
      }

      setCourse(courseData)
      setSections(tree.sections)
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setAccessDenied(true)
        showToast('Доступ запрещён', 'error')
      } else {
        showToast('Ошибка загрузки курса', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const handleAddSection = async () => {
    const title = `Раздел ${sections.length + 1}`
    setSaving(true)
    try {
      const { data } = await builderApi.createSection(courseId, { title, description: '' })
      setSections(prev => [...prev, { ...data, pages: [] }])
      setExpandedSections(prev => new Set([...prev, data.id]))
      showToast('Раздел добавлен', 'success')
    } catch (err) {
      showToast('Ошибка создания раздела', 'error')
    } finally {
      setSaving(false)
      setShowAddSection(false)
    }
  }

  const handleUpdateSection = async (sectionId, title) => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await builderApi.updateSection(courseId, sectionId, { title })
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, title } : s))
      showToast('Сохранено', 'success')
    } catch (err) {
      showToast('Ошибка сохранения', 'error')
    } finally {
      setSaving(false)
      setEditingSection(null)
    }
  }

  const handleDeleteSection = async () => {
    const { id: sectionId } = confirmDelete
    if (!sectionId) return
    setSaving(true)
    try {
      await builderApi.deleteSection(courseId, sectionId)
      setSections(prev => prev.filter(s => s.id !== sectionId))
      showToast('Раздел удалён', 'success')
    } catch (err) {
      showToast('Ошибка удаления', 'error')
    } finally {
      setSaving(false)
      setConfirmDelete({ type: null, id: null, title: '' })
    }
  }

  const handleAddPage = async (sectionId) => {
    const section = sections.find(s => s.id === sectionId)
    const pageCount = section?.pages?.length || 0
    const title = `Страница ${pageCount + 1}`
    setSaving(true)
    try {
      const { data } = await builderApi.createPage(sectionId, { title })
      setSections(prev => prev.map(s => {
        if (s.id === sectionId) {
          return { ...s, pages: [...(s.pages || []), data] }
        }
        return s
      }))
      showToast('Страница добавлена', 'success')
    } catch (err) {
      showToast('Ошибка создания страницы', 'error')
    } finally {
      setSaving(false)
      setShowAddPage(null)
    }
  }

  const handleUpdatePage = async (pageId, title) => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await builderApi.updatePage(pageId, { title })
      setSections(prev => prev.map(s => ({
        ...s,
        pages: s.pages?.map(p => p.id === pageId ? { ...p, title } : p) || []
      })))
      showToast('Сохранено', 'success')
    } catch (err) {
      showToast('Ошибка сохранения', 'error')
    } finally {
      setSaving(false)
      setEditingPage(null)
    }
  }

  const handleDeletePage = async () => {
    const { id: pageId } = confirmDelete
    if (!pageId) return
    setSaving(true)
    try {
      await builderApi.deletePage(pageId)
      setSections(prev => prev.map(s => ({
        ...s,
        pages: s.pages?.filter(p => p.id !== pageId) || []
      })))
      showToast('Страница удалена', 'success')
    } catch (err) {
      showToast('Ошибка удаления', 'error')
    } finally {
      setSaving(false)
      setConfirmDelete({ type: null, id: null, title: '' })
    }
  }

  const openPageMessage = () => {
    showToast('Редактор страниц - в разработке', 'info')
  }

  if (!authResolved) {
    return (
      <div className="builder-loading">
        <div className="spinner"></div>
        <p>Проверка доступа...</p>
      </div>
    )
  }

  useEffect(() => {
    if (accessDenied) {
      navigate('/courses')
    }
  }, [accessDenied])

  if (accessDenied) {
    return null
  }

  if (isLoading) {
    return (
      <div className="builder-loading">
        <div className="spinner"></div>
        <p>Загрузка структуры курса...</p>
      </div>
    )
  }

  return (
    <div className="builder-page">
      <div className="builder-header">
        <div className="builder-header-left">
          <Layers className="builder-icon" />
          <div>
            <h1>Редактор курса</h1>
            <p className="builder-course-title">{course?.title}</p>
          </div>
        </div>
        <div className="builder-header-actions">
          <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
            <Eye size={16} /> Предпросмотр
          </Button>
          <Button onClick={() => showToast('Редактор страниц - в разработке', 'info')}>
            <Plus size={16} /> Добавить страницу
          </Button>
        </div>
      </div>

      <div className="builder-content">
        <Card>
          <div className="sections-list">
            {sections.length === 0 ? (
              <div className="empty-sections">
                <p>Структура курса пуста</p>
                <Button onClick={() => setShowAddSection(true)}>
                  <Plus size={16} /> Добавить раздел
                </Button>
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.id} className="section-item">
                  <div 
                    className="section-header"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="section-drag">
                      <GripVertical size={16} />
                    </div>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    {editingSection === section.id ? (
                      <input
                        type="text"
                        defaultValue={section.title}
                        autoFocus
                        onBlur={(e) => handleUpdateSection(section.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateSection(section.id, e.target.value)
                          if (e.key === 'Escape') setEditingSection(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="section-title-input"
                      />
                    ) : (
                      <span 
                        className="section-title"
                        onDoubleClick={() => setEditingSection(section.id)}
                      >
                        {section.title}
                      </span>
                    )}
                    <Badge variant="gray">{section.pages?.length || 0}</Badge>
                    <div className="section-actions">
                      <button 
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); setShowAddPage(section.id) }}
                        title="Добавить страницу"
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        className="icon-btn danger"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'section', id: section.id, title: section.title }) }}
                        title="Удалить раздел"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {expandedSections.has(section.id) && (
                    <div className="pages-list">
                      {section.pages?.map((page) => (
                        <div key={page.id} className="page-item">
                          <div className="page-drag">
                            <GripVertical size={14} />
                          </div>
                          <FileText size={14} className="page-icon" />
                          {editingPage === page.id ? (
                            <input
                              type="text"
                              defaultValue={page.title}
                              autoFocus
                              onBlur={(e) => handleUpdatePage(page.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdatePage(page.id, e.target.value)
                                if (e.key === 'Escape') setEditingPage(null)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="page-title-input"
                            />
                          ) : (
                            <span 
                              className="page-title"
                              onDoubleClick={() => setEditingPage(page.id)}
                              onClick={() => openPageMessage()}
                            >
                              {page.title}
                            </span>
                          )}
                          <div className="page-actions">
                            <button 
                              className="icon-btn"
                              onClick={() => openPageMessage()}
                              title="Редактировать"
                            >
                              <FileText size={14} />
                            </button>
                            <button 
                              className="icon-btn danger"
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'page', id: page.id, title: page.title }) }}
                              title="Удалить"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!section.pages || section.pages.length === 0) && (
                        <div className="empty-pages">
                          <span>Нет страниц</span>
                          <Button size="sm" variant="outline" onClick={() => setShowAddPage(section.id)}>
                            <Plus size={14} /> Добавить
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            
            {sections.length > 0 && (
              <div className="add-section-btn">
                <Button variant="outline" onClick={() => setShowAddSection(true)}>
                  <Plus size={16} /> Добавить раздел
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={showAddSection} onClose={() => setShowAddSection(false)}>
        <div className="modal-content">
          <h3>Новый раздел</h3>
          <Button onClick={handleAddSection} disabled={saving}>
            Добавить раздел
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showAddPage} onClose={() => setShowAddPage(null)}>
        <div className="modal-content">
          <h3>Новая страница</h3>
          <p>Страница будет добавлена в выбранный раздел</p>
          <Button onClick={() => handleAddPage(showAddPage)} disabled={saving}>
            Добавить страницу
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete.type}
        title={confirmDelete.type === 'section' ? 'Удалить раздел?' : 'Удалить страницу?'}
        message={confirmDelete.type === 'section' 
          ? `Раздел "${confirmDelete.title}" и все его страницы будут удалены.`
          : `Страница "${confirmDelete.title}" будет удалена.`}
        confirmText="Удалить"
        danger
        onConfirm={confirmDelete.type === 'section' ? handleDeleteSection : handleDeletePage}
        onCancel={() => setConfirmDelete({ type: null, id: null, title: '' })}
      />
    </div>
  )
}

export default Builder