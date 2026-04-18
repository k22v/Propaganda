import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, X, Lightbulb, HelpCircle } from 'lucide-react'
import { practiceApi, authApi } from '../api'
import { ToastContainer, useToast } from '../components/Toast'
import { Card, Badge, Button } from '../components/ui/index.jsx'

function PracticeQuestions() {
  const { courseId } = useParams()
  const { showToast, toast, closeToast } = useToast()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [course, setCourse] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'text',
    image_url: '',
    answer_hint: '',
    explanation: ''
  })

  useEffect(() => {
    authApi.getMe().then(r => setCurrentUser(r.data)).catch(() => {})
  }, [])

  useEffect(() => { 
    loadQuestions() 
    if (courseId) {
      import('../api').then(({ coursesApi }) => 
        coursesApi.getById(courseId).then(r => setCourse(r.data)).catch(() => {})
      )
    }
  }, [courseId])

  const canManage = currentUser?.is_superuser || 
    (currentUser?.role === 'admin') || 
    (course && currentUser?.id === course.author_id)

  const loadQuestions = async () => {
    try {
      const res = await practiceApi.getQuestions(courseId)
      setQuestions(res.data || [])
    } catch (e) {
      showToast('Ошибка загрузки', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newQuestion.question_text.trim()) return showToast('Введите вопрос', 'warning')
    try {
      await practiceApi.create({ ...newQuestion, course_id: parseInt(courseId) })
      showToast('Вопрос добавлен!', 'success')
      setShowAddModal(false)
      setNewQuestion({
        question_text: '',
        question_type: 'text',
        image_url: '',
        answer_hint: '',
        explanation: ''
      })
      loadQuestions()
    } catch (e) {
      showToast('Ошибка добавления', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить вопрос?')) return
    try {
      await practiceApi.delete(id)
      showToast('Удалено', 'success')
      loadQuestions()
    } catch (e) {
      showToast('Ошибка удаления', 'error')
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem' }}>
            <HelpCircle size={28} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Банк практических задач
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Вопросы для практики учеников</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Добавить вопрос
          </Button>
        )}
      </div>

      {loading ? (
        <Card padding="lg"><div style={{ textAlign: 'center' }}>Загрузка...</div></Card>
      ) : questions.length === 0 ? (
        <Card padding="lg">
          <div className="empty-state">
            <HelpCircle size={48} />
            <h3 className="empty-title">Пока нет практических вопросов</h3>
            <p className="empty-description">Добавьте вопросы для практики учеников</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, i) => (
            <Card key={q.id} padding="md">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Badge variant="primary" style={{ flexShrink: 0 }}>{i + 1}</Badge>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.75rem', lineHeight: 1.6 }}>{q.question_text}</p>
                  {q.image_url && (
                    <img src={q.image_url} alt="" style={{ maxWidth: '200px', borderRadius: '8px', marginBottom: '0.75rem' }} />
                  )}
                  {q.answer_hint && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.5rem', 
                      padding: '0.75rem',
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      <Lightbulb size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                      <span>{q.answer_hint}</span>
                    </div>
                  )}
                </div>
                {canManage && (
                  <Button variant="danger" size="sm" onClick={() => handleDelete(q.id)}>
                  <Trash2 size={14} />
                </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <Card className="modal-content" padding="none" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <h3 style={{ margin: 0 }}>
                <Plus size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Добавить вопрос
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  Текст вопроса *
                </label>
                <textarea
                  value={newQuestion.question_text}
                  onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}
                  placeholder="Опишите ситуацию или вопрос..."
                  rows={4}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  Изображение (URL)
                </label>
                <input
                  value={newQuestion.image_url}
                  onChange={e => setNewQuestion({...newQuestion, image_url: e.target.value})}
                  placeholder="https://..."
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  <Lightbulb size={14} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  Подсказка
                </label>
                <input
                  value={newQuestion.answer_hint}
                  onChange={e => setNewQuestion({...newQuestion, answer_hint: e.target.value})}
                  placeholder="Намек на ответ"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                  Пояснение
                </label>
                <textarea
                  value={newQuestion.explanation}
                  onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                  placeholder="Объяснение правильного ответа..."
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  Отмена
                </Button>
                <Button onClick={handleAdd}>
                  Добавить
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <ToastContainer toast={toast} onClose={closeToast} />
    </div>
  )
}

export default PracticeQuestions
