import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  Clock, FileText, Image, Video, List, MousePointer, Minus, Paperclip,
  ChevronUp, ChevronDown, X, Plus, BookOpen, CheckCircle, Quote,
  Lock, Calendar, Edit, Eye, EyeOff, ClipboardList, ArrowLeft
} from 'lucide-react'
import { coursesApi, authApi } from '../api'
import ContentModal from '../components/ContentModal'
import Reviews from '../components/Reviews'
import { ToastContainer, useToast, withToastHandler } from '../components/Toast'
import { Card, Badge, Button } from '../components/ui/index.jsx'
import '../components/CourseDetail.css'
import '../components/ContentModal.css'

const CONTENT_ICONS = {
  text: FileText,
  quote: Quote,
  image: Image,
  video: Video,
  list: List,
  interactive: MousePointer,
  separator: Minus,
  file: Paperclip,
}

function CountdownTimer({ startDate }) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startDate)
      const now = new Date()
      const diff = start - now
      if (diff <= 0) return null
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return { days, hours, minutes }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000)
    return () => clearInterval(timer)
  }, [startDate])

  if (!timeLeft) return null

  return (
    <div className="countdown-timer">
      <p><Clock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />До начала курса:</p>
      <div className="countdown-days">
        {timeLeft.days > 0 && <span>{timeLeft.days} дн. </span>}
        {timeLeft.hours > 0 && <span>{timeLeft.hours} ч. </span>}
        {timeLeft.minutes > 0 && <span>{timeLeft.minutes} мин.</span>}
      </div>
    </div>
  )
}

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
      const courseRes = await coursesApi.getById(id)
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
  const isSuperuser = currentUser && (currentUser.is_superuser || currentUser.role === 'admin')
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.is_superuser)
  const canEdit = isAuthor || isAdmin
  const canPublish = canEdit
  const canAccessPractice = canEdit || !!course?.is_enrolled

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

  const updateSpecialization = async (specialization) => {
    console.log('updateSpecialization called with:', specialization)
    try {
      console.log('Calling API with specialization:', specialization)
      const response = await coursesApi.update(id, { specialization: specialization || null })
      console.log('API response:', response)
      console.log('Reloading data...')
      await loadData()
      console.log('Data reloaded')
      showToast('Специализация обновлена', 'success')
    } catch (err) {
      console.error('Error updating specialization:', err.response || err)
      showToast(err.response?.data?.detail || 'Ошибка обновления', 'error')
    }
  }

  const openContentModal = (chapterId) => {
    setSelectedChapterId(chapterId)
    setShowContentModal(true)
  }

  if (loading) return <div className="loading">Загрузка...</div>
  if (!course) return <div className="error">Курс не найден</div>

  return (
    <div className="course-detail-page">
      {isSuperuser && (
        <div className="course-specialization-edit">
          <label>Специализация курса:</label>
          <select 
            value={course.specialization || ''}
            onChange={(e) => updateSpecialization(e.target.value)}
          >
            <option value="">Без специализации</option>
            <option value="dentist">Врач-стоматолог</option>
            <option value="assistant">Ассистент стоматолога</option>
            <option value="technician">Зубной техник</option>
            <option value="clinic_admin">Администратор клиники</option>
          </select>
        </div>
      )}
      <div className="course-header">
        <h1>{course.title}</h1>
        {canPublish && (
          <div className="course-actions">
            <Button variant="outline" onClick={() => navigate(`/builder/${id}`)}>
              <Edit size={16} /> Редактор
            </Button>
            <Button onClick={handleTogglePublish}>
              {course.is_published ? <><EyeOff size={16} /> Снять с публикации</> : <><Eye size={16} /> Опубликовать</>}
            </Button>
          </div>
        )}
        {canAccessPractice && (
          <div className="course-actions" style={{ marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => navigate(`/courses/${id}/practice`)}>
              <ClipboardList size={16} /> Задачи
            </Button>
            <Button variant="secondary" onClick={() => navigate('/my-courses')}>
              <ArrowLeft size={16} /> К моим курсам
            </Button>
          </div>
        )}
      </div>

      {course.description && <p className="course-desc">{course.description}</p>}

      {canEdit && (
        <div className="editor-section">
          <div className="section-header">
            <h2><BookOpen size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Структура курса</h2>
            <Button onClick={() => setShowAddSection(true)}>
              <Plus size={16} /> Раздел
            </Button>
          </div>

          {showAddSection && (
            <div className="add-form">
              <input type="text" placeholder="Название раздела" value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} />
              <textarea placeholder="Описание" value={newSection.description} onChange={e => setNewSection({...newSection, description: e.target.value})} />
              <div className="add-form-actions">
                <Button onClick={handleAddSection}>Добавить</Button>
                <Button variant="secondary" onClick={() => setShowAddSection(false)}>Отмена</Button>
              </div>
            </div>
          )}

          <div className="sections-list">
            {course.sections?.map((section, sIdx) => (
              <div key={section.id} className="section-card">
                <div className="section-title-row">
                  <h3>{section.title}</h3>
                  <div className="move-buttons">
                    <button className="btn-move" onClick={() => moveSection(section.id, 'up')} disabled={sIdx === 0}><ChevronUp size={16} /></button>
                    <button className="btn-move" onClick={() => moveSection(section.id, 'down')} disabled={sIdx === course.sections.length - 1}><ChevronDown size={16} /></button>
                    <button className="btn-delete" onClick={() => handleDeleteSection(section.id)}><X size={16} /></button>
                  </div>
                </div>
                {section.description && <p className="section-desc">{section.description}</p>}
                
                <div className="chapters-list">
                  {section.chapters?.map((chapter, cIdx) => (
                    <div key={chapter.id} className="chapter-item">
                      <div className="chapter-title-row">
                        <h4>{chapter.title}</h4>
                        <div className="move-buttons">
                          <button className="btn-move" onClick={() => moveChapter(section.id, chapter.id, 'up')} disabled={cIdx === 0}><ChevronUp size={16} /></button>
                          <button className="btn-move" onClick={() => moveChapter(section.id, chapter.id, 'down')} disabled={cIdx === section.chapters.length - 1}><ChevronDown size={16} /></button>
                          <button className="btn-delete" onClick={() => handleDeleteChapter(chapter.id)}><X size={16} /></button>
                        </div>
                      </div>
                      
                      <div className="contents-list">
                        {chapter.contents?.map((content, ctIdx) => {
                          const IconComponent = CONTENT_ICONS[content.content_type] || FileText
                          return (
                            <Link key={content.id} to={`/courses/${id}/content/${content.id}`} className="content-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                              <span className="content-icon"><IconComponent size={16} /></span>
                              <span className="content-title">{content.title}</span>
                              <div className="move-buttons" onClick={e => e.preventDefault()}>
                                <button className="btn-move" onClick={() => moveContent(chapter.id, content.id, 'up')} disabled={ctIdx === 0}><ChevronUp size={14} /></button>
                                <button className="btn-move" onClick={() => moveContent(chapter.id, content.id, 'down')} disabled={ctIdx === chapter.contents.length - 1}><ChevronDown size={14} /></button>
                                <button className="btn-delete" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteContent(content.id) }}><X size={14} /></button>
                              </div>
                            </Link>
                          )
                        })}
                        <button className="btn-add-content" onClick={() => openContentModal(chapter.id)}><Plus size={14} /> Добавить контент</button>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn-add-chapter" onClick={() => openAddChapterModal(section.id)}><Plus size={14} /> Глава</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!canEdit && (
        <div className="course-view">
          {course.description && <p className="course-desc">{course.description}</p>}
          
          {course.specializationError ? (
            <Card padding="lg">
              <div className="locked-message">
                <Lock size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                <p>{course.error || 'Доступ к этому курсу запрещён'}</p>
                <Link to="/courses"><Button style={{ marginTop: '1rem' }}>К курсам</Button></Link>
              </div>
            </Card>
          ) : course.is_published ? (
            !currentUser ? (
              <Card padding="lg">
                <div className="locked-message">
                  <Lock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Войдите или зарегистрируйтесь для доступа к курсу</p>
                  <div className="locked-actions">
                    <Link to="/login"><Button>Войти</Button></Link>
                    <Link to="/register"><Button variant="secondary">Регистрация</Button></Link>
                  </div>
                </div>
              </Card>
            ) : !course.is_enrolled ? (
              <Card padding="lg">
                <div className="locked-message">
                  {course.start_date && course.end_date && (
                    <div className="course-dates">
                      <p><Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />Период обучения: {new Date(course.start_date).toLocaleDateString('ru-RU')} - {new Date(course.end_date).toLocaleDateString('ru-RU')}</p>
                    </div>
                  )}
                  {course.start_date && new Date(course.start_date) > new Date() && (
                    <CountdownTimer startDate={course.start_date} />
                  )}
                  <p>Запишитесь на курс для доступа к материалам</p>
                  <Button onClick={async () => { 
                    try { 
                      await coursesApi.enroll(id); 
                      loadData(); 
                      showToast('Вы записаны на курс!', 'success')
                    } catch (err) {
                      showToast(err.response?.data?.detail || 'Ошибка записи на курс', 'error')
                    }
                  }}>
                    <BookOpen size={16} /> Записаться
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="course-content">
                {course.sections?.map(section => (
                  <div key={section.id} className="view-section">
                    <h2><BookOpen size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />{section.title}</h2>
                    {section.chapters?.map(chapter => (
                      <div key={chapter.id} className="view-chapter">
                        <h3>{chapter.title}</h3>
                        {chapter.contents?.map(content => {
                          const IconComponent = CONTENT_ICONS[content.content_type] || FileText
                          return (
                            <Link key={content.id} to={`/courses/${id}/content/${content.id}`} className="view-content-link">
                              <span className="content-icon"><IconComponent size={16} /></span>
                              {content.title}
                            </Link>
                          )
                        })}
                        {chapter.quiz && (
                          <Link to={`/courses/${id}/quiz/${chapter.quiz.id}`} className="view-content-link quiz-link">
                            <span className="content-icon"><ClipboardList size={16} /></span>
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
            <Card padding="lg">
              <div className="locked-message">
                <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Этот курс находится на модерации</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {showAddChapter && (
        <div className="modal-overlay" onClick={() => setShowAddChapter(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}><Plus size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />Добавить главу</h3>
              <button onClick={() => setShowAddChapter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <input
              type="text"
              placeholder="Название главы"
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmAddChapter()}
              autoFocus
            />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowAddChapter(null)}>Отмена</Button>
              <Button onClick={confirmAddChapter}>Добавить</Button>
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

      {course && <Reviews courseId={id} isEnrolled={course.is_enrolled} isSuperuser={isSuperuser} />}

      <ToastContainer toast={toast} onClose={closeToast} />
    </div>
  )
}

export default CourseDetail
