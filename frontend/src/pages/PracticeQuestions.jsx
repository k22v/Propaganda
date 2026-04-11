import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { practiceApi } from '../api'
import { useToast } from '../components/Toast'

function PracticeQuestions() {
  const { courseId } = useParams()
  const { showToast, toast, closeToast } = useToast()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'text',
    image_url: '',
    answer_hint: '',
    explanation: ''
  })

  useEffect(() => { loadQuestions() }, [courseId])

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
    <div className="practice-page">
      <div className="page-header">
        <div>
          <h1>Банк практических задач</h1>
          <p className="subtitle">Вопросы для практики учеников</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Добавить вопрос
        </button>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <p>Пока нет практических вопросов</p>
          <p className="text-secondary">Добавьте вопросы для практики учеников</p>
        </div>
      ) : (
        <div className="questions-list">
          {questions.map((q, i) => (
            <div key={q.id} className="question-card">
              <div className="question-number">{i + 1}</div>
              <div className="question-content">
                <p>{q.question_text}</p>
                {q.image_url && <img src={q.image_url} alt="" className="question-image" />}
                {q.answer_hint && <div className="hint">💡 {q.answer_hint}</div>}
              </div>
              <button className="btn-delete" onClick={() => handleDelete(q.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Добав��ть вопрос</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Текст вопроса *</label>
                <textarea
                  value={newQuestion.question_text}
                  onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}
                  placeholder="Опишите ситуацию или вопрос..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Изображение (URL)</label>
                <input
                  value={newQuestion.image_url}
                  onChange={e => setNewQuestion({...newQuestion, image_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>Подсказка</label>
                <input
                  value={newQuestion.answer_hint}
                  onChange={e => setNewQuestion({...newQuestion, answer_hint: e.target.value})}
                  placeholder="Намек на ответ"
                />
              </div>
              <div className="form-group">
                <label>Пояснение</label>
                <textarea
                  value={newQuestion.explanation}
                  onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                  placeholder="Объяснение правильного ответа..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleAdd}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          <button onClick={closeToast}>×</button>
        </div>
      )}
    </div>
  )
}

export default PracticeQuestions