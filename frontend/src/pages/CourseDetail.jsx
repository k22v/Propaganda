import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { coursesApi, authApi } from '../api'
import ContentModal from '../components/ContentModal'
import Reviews from '../components/Reviews'
import { ToastContainer, useToast, withToastHandler } from '../components/Toast'
import '../components/CourseDetail.css'
import '../components/ContentModal.css'

function CourseDetail() {
  const { courseId: id } = useParams()
  const navigate = useNavigate()
  const { toast, showToast, closeToast } = useToast()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSection, setNewSection] = useState({ title: '', description: '' })
  const [showContentModal, setShowContentModal] = useState(false)
  const [selectedChapterId, setSelectedChapterId] = useState(null)
  const [showAddChapter, setShowAddChapter] = useState(null)
  const [newChapterTitle, setNewChapterTitle] = useState('')

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    try {
      const courseRes = await coursesApi.getOne(id)
      setCourse(courseRes.data)
      try {
        const userRes = await authApi.getMe()
        setCurrentUser(userRes.data)
      } catch (e) { setCurrentUser(null) }
    } catch (err) { 
      if (err.response?.status === 403) {
        setCourse({ error: err.response.data.detail, specializationError: true })
      } else {
        showToast('Ошибка загрузки курса', 'error')
      }
    }
    finally { setLoading(false) }
  }

  const isAuthor = currentUser && course && String(currentUser.id) === String(course.author_id)
  const isSuperuser = currentUser && currentUser.is_superuser
  const canEdit = isAuthor || isSuperuser

  const wrappedApi = withToastHandler({
    addSection: async () => {
      if (!newSection.title) {
        showToast('Введите название раздела', 'warning')
        return
      }
      await coursesApi.createSection(id, newSection)
      setNewSection({ title: '', description: '' })
      setShowAddSection(false)
      loadData()
      showToast('Раздел добавлен', 'success')
    },
    deleteSection: async (sectionId) => {
      await coursesApi.deleteSection(id, sectionId)
      loadData()
      showToast('Раздел удалён', 'success')
    },
    addChapter: async (sectionId, title) => {
      if (!title) {
        showToast('Введите название главы', 'warning')
        return
      }
      await coursesApi.createChapter(id, { section_id: sectionId, title, order: 0 })
      loadData()
      showToast('Глава добавлена', 'success')
    },
    deleteChapter: async (chapterId) => {
      await coursesApi.deleteChapter(id, chapterId)
      loadData()
      showToast('Глава удалена', 'success')
    },
    addContent: async (contentData) => {
      await coursesApi.createContent(id, { ...contentData, order: 0 })
      loadData()
      showToast('Контент добавлен', 'success')
    },
    deleteContent: async (contentId) => {
      await coursesApi.deleteContent(id, contentId)
      loadData()
      showToast('Контент удалён', 'success')
    },
    togglePublish: async () => {
      const newStatus = !course.is_published
      await coursesApi.update(id, { is_published: newStatus })
      loadData()
      showToast(newStatus ? 'Курс опубликован' : 'Курс снят с публикации', 'success')
    }
  }, showToast)

  const handleAddSection = () => wrappedApi.addSection()
  const handleDeleteSection = (sectionId) => wrappedApi.deleteSection(sectionId)
  const handleAddChapter = (sectionId, title) => wrappedApi.addChapter(sectionId, title)
  
  const moveSection = async (sectionId, direction) => {
    const sections = course.sections || []
    const idx = sections.findIndex(s => s.id === sectionId)
    if (idx === -1) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= sections.length) return
    
    const newOrder = sections.map((s, i) => ({ id: s.id, order: i }))
    newOrder[idx].order = newIdx
    newOrder[newIdx].order = idx
    
    await coursesApi.reorderSections(id, { items: newOrder })
    loadData()
  }
  
  const moveChapter = async (sectionId, chapterId, direction) => {
    const section = course.sections?.find(s => s.id === sectionId)
    if (!section) return
    const chapters = section.chapters || []
    const idx = chapters.findIndex(c => c.id === chapterId)
    if (idx === -1) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= chapters.length) return
    
    const newOrder = chapters.map((c, i) => ({ id: c.id, order: i }))
    newOrder[idx].order = newIdx
    newOrder[newIdx].order = idx
    
    await coursesApi.reorderChapters(id, { items: newOrder })
    loadData()
  }
  
  const moveContent = async (chapterId, contentId, direction) => {
    const section = course.sections?.find(s => s.chapters?.some(c => c.id === chapterId))
    if (!section) return
    const chapter = section.chapters?.find(c => c.id === chapterId)
    if (!chapter) return
    const contents = chapter.contents || []
    const idx = contents.findIndex(c => c.id === contentId)
    if (idx === -1) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= contents.length) return
    
    const newOrder = contents.map((c, i) => ({ id: c.id, order: i }))
    newOrder[idx].order = newIdx
    newOrder[newIdx].order = idx
    
    await coursesApi.reorderContents(id, { items: newOrder })
    loadData()
  }

  const openAddChapterModal = (sectionId) => {
    setShowAddChapter(sectionId)
    setNewChapterTitle('')
  }

  const confirmAddChapter = () => {
    if (newChapterTitle.trim()) {
      handleAddChapter(showAddChapter, newChapterTitle.trim())
      setShowAddChapter(null)
      setNewChapterTitle('')
    }
  }
  const handleDeleteChapter = (chapterId) => wrappedApi.deleteChapter(chapterId)
  const handleAddContent = (contentData) => wrappedApi.addContent(contentData)
  const handleDeleteContent = (contentId) => wrappedApi.deleteContent(contentId)
  const handleTogglePublish = () => wrappedApi.togglePublish()

  const openContentModal = (chapterId) => {
    setSelectedChapterId(chapterId)
    setShowContentModal(true)
  }

  if (loading) return <div className="loading">Загрузка...</div>
  if (!course) return <div className="error">Курс не найден</div>

  return (
    <div className="course-detail-page">
      <div className="course-header">
        <h1>{course.title}</h1>
        {canEdit && (
          <div className="course-actions">
            <button onClick={handleTogglePublish} className="btn btn-primary">
              {course.is_published ? 'Снять с публикации' : 'Опубликовать'}
            </button>
            <button onClick={() => navigate(`/courses/${id}/practice`)} className="btn btn-secondary">📝 Задачи</button>
            <button onClick={() => navigate('/my-courses')} className="btn btn-secondary">К моим курсам</button>
          </div>
        )}
      </div>

      {course.description && <p className="course-desc">{course.description}</p>}

      {canEdit && (
        <div className="editor-section">
          <div className="section-header">
            <h2>Структура курса</h2>
            <button onClick={() => setShowAddSection(true)} className="btn btn-primary">+ Раздел</button>
          </div>

          {showAddSection && (
            <div className="add-form">
              <input type="text" placeholder="Название раздела" value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} />
              <textarea placeholder="Описание" value={newSection.description} onChange={e => setNewSection({...newSection, description: e.target.value})} />
              <div className="add-form-actions">
                <button onClick={handleAddSection} className="btn btn-primary">Добавить</button>
                <button onClick={() => setShowAddSection(false)} className="btn btn-secondary">Отмена</button>
              </div>
            </div>
          )}

          <div className="sections-list">
            {course.sections?.map((section, sIdx) => (
              <div key={section.id} className="section-card">
                <div className="section-title-row">
                  <h3>{section.title}</h3>
                  <div className="move-buttons">
                    <button className="btn-move" onClick={() => moveSection(section.id, 'up')} disabled={sIdx === 0}>⬆️</button>
                    <button className="btn-move" onClick={() => moveSection(section.id, 'down')} disabled={sIdx === course.sections.length - 1}>⬇️</button>
                    <button className="btn-delete" onClick={() => handleDeleteSection(section.id)}>×</button>
                  </div>
                </div>
                {section.description && <p className="section-desc">{section.description}</p>}
                
                <div className="chapters-list">
                  {section.chapters?.map((chapter, cIdx) => (
                    <div key={chapter.id} className="chapter-item">
                      <div className="chapter-title-row">
                        <h4>{chapter.title}</h4>
                        <div className="move-buttons">
                          <button className="btn-move" onClick={() => moveChapter(section.id, chapter.id, 'up')} disabled={cIdx === 0}>⬆️</button>
                          <button className="btn-move" onClick={() => moveChapter(section.id, chapter.id, 'down')} disabled={cIdx === section.chapters.length - 1}>⬇️</button>
                          <button className="btn-delete" onClick={() => handleDeleteChapter(chapter.id)}>×</button>
                        </div>
                      </div>
                      
                      <div className="contents-list">
                        {chapter.contents?.map((content, ctIdx) => (
                          <Link key={content.id} to={`/courses/${id}/content/${content.id}`} className="content-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <span className="content-icon">
                              {content.content_type === 'text' && '📝'}
                              {content.content_type === 'quote' && '❝'}
                              {content.content_type === 'image' && '🖼️'}
                              {content.content_type === 'video' && '🎬'}
                              {content.content_type === 'list' && '📋'}
                              {content.content_type === 'interactive' && '🖱️'}
                              {content.content_type === 'separator' && '➖'}
                              {content.content_type === 'file' && '📎'}
                            </span>
                            <span className="content-title">{content.title}</span>
                            <div className="move-buttons" onClick={e => e.preventDefault()}>
                              <button className="btn-move" onClick={() => moveContent(chapter.id, content.id, 'up')} disabled={ctIdx === 0}>⬆️</button>
                              <button className="btn-move" onClick={() => moveContent(chapter.id, content.id, 'down')} disabled={ctIdx === chapter.contents.length - 1}>⬇️</button>
                              <button className="btn-delete" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteContent(content.id) }}>×</button>
                            </div>
                          </Link>
                        ))}
                        <button className="btn-add-content" onClick={() => openContentModal(chapter.id)}>+ Добавить контент</button>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn-add-chapter" onClick={() => openAddChapterModal(section.id)}>+ Глава</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!canEdit && (
        <div className="course-view">
          {course.description && <p className="course-desc">{course.description}</p>}
          
          {course.specializationError ? (
            <div className="locked-message">
              <p>⛔ {course.error || 'Доступ к этому курсу запрещён'}</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
                Этот курс предназначен для другой специализации. Выберите курс, соответствующий вашей специализации.
              </p>
              <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>К курсам</Link>
            </div>
          ) : course.is_published ? (
            !currentUser ? (
              <div className="locked-message">
                <p>Войдите или зарегистрируйтесь для доступа к курсу</p>
                <div className="locked-actions">
                  <Link to="/login" className="btn btn-primary">Войти</Link>
                  <Link to="/register" className="btn btn-secondary">Регистрация</Link>
                </div>
              </div>
            ) : !course.is_enrolled ? (
              <div className="locked-message">
                <p>Запишитесь на курс для доступа к материалам</p>
                <button onClick={async () => { 
                  try { 
                    await coursesApi.enroll(id); 
                    loadData(); 
                    showToast('Вы записаны на курс!', 'success')
                  } catch (err) {
                    showToast('Ошибка записи на курс', 'error')
                  }
                }} className="btn btn-primary">Записаться</button>
              </div>
            ) : (
              <div className="course-content">
                {course.sections?.map(section => (
                  <div key={section.id} className="view-section">
                    <h2>{section.title}</h2>
                    {section.chapters?.map(chapter => (
                      <div key={chapter.id} className="view-chapter">
                        <h3>{chapter.title}</h3>
                        {chapter.contents?.map(content => (
                          <Link key={content.id} to={`/courses/${id}/content/${content.id}`} className="view-content-link">
                            <span className="content-icon">
                              {content.content_type === 'text' && '📝'}
                              {content.content_type === 'quote' && '❝'}
                              {content.content_type === 'image' && '🖼️'}
                              {content.content_type === 'video' && '🎬'}
                              {content.content_type === 'list' && '📋'}
                              {content.content_type === 'interactive' && '🖱️'}
                              {content.content_type === 'separator' && '➖'}
                              {content.content_type === 'file' && '📎'}
                            </span>
                            {content.title}
                          </Link>
                        ))}
                        {chapter.quiz && (
                          <Link to={`/courses/${id}/quiz/${chapter.quiz.id}`} className="view-content-link" style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.5rem' }}>
                            <span className="content-icon">📋</span>
                            {chapter.quiz.title}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="locked-message">
              <p>Этот курс находится на модерации</p>
            </div>
          )}
        </div>
      )}

      {showAddChapter && (
        <div className="modal-overlay" onClick={() => setShowAddChapter(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Добавить главу</h3>
            <input
              type="text"
              placeholder="Название главы"
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmAddChapter()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddChapter(null)}>Отмена</button>
              <button className="btn btn-primary" onClick={confirmAddChapter}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      <ContentModal
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
        chapterId={selectedChapterId}
        onSave={handleAddContent}
      />

      {course && <Reviews courseId={id} isEnrolled={course.is_enrolled} />}

      <ToastContainer toast={toast} onClose={closeToast} />
    </div>
  )
}

export default CourseDetail
