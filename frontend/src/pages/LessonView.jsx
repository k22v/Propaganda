import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  CheckCircle, XCircle, MessageSquare, Send, Plus, Trash2, 
  ChevronLeft, ChevronRight, FileQuestion, Award, RotateCcw, Edit
} from 'lucide-react'
import { coursesApi, quizApi, authApi, commentsApi } from '../api'
import { useToast, ToastContainer } from '../components/Toast'
import { Card, Badge, Button } from '../components/ui/index.jsx'

function LessonView() {
  const { courseId, lessonId, contentId } = useParams()
  const { showToast, toast, closeToast } = useToast()
  const [lesson, setLesson] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [quizLoading, setQuizLoading] = useState(true)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [attempt, setAttempt] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [showCreateQuiz, setShowCreateQuiz] = useState(false)
  const [newQuiz, setNewQuiz] = useState({ title: '', description: '', passing_score: 70, questions: [] })
  const [currentQuestion, setCurrentQuestion] = useState({ text: '', answers: [{ text: '', is_correct: false }] })
  const [currentUser, setCurrentUser] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    authApi.getMe()
      .then(({ data }) => setCurrentUser(data))
      .catch(() => setCurrentUser(null))
  }, [])

  const contentOrLessonId = lessonId || contentId

  useEffect(() => {
    if (contentId) {
      coursesApi.getContent(courseId, contentId)
        .then(res => setLesson(res.data))
        .catch(console.error)
    } else if (lessonId) {
      coursesApi.getLessons(courseId)
        .then(res => {
          const found = res.data.find(l => l.id === parseInt(lessonId))
          if (found) setLesson(found)
        })
        .catch(console.error)
    }
  }, [courseId, lessonId, contentId])

  useEffect(() => {
    const idToFetch = lessonId || contentId
    if (!idToFetch) return
    quizApi.getByLesson(idToFetch)
      .then(res => {
        setQuiz(res.data)
        setSelectedAnswers({})
        setSubmitted(false)
        setAttempt(null)
        setQuizLoading(false)
      })
      .catch((err) => {
        console.error('Error loading quiz:', err)
        setQuizLoading(false)
      })
  }, [lessonId, contentId])

  useEffect(() => {
    if (showComments && contentOrLessonId) {
      commentsApi.getByLesson(contentOrLessonId)
        .then(res => setComments(res.data))
        .catch(console.error)
    }
  }, [showComments, contentOrLessonId])

  const handleAnswerSelect = (questionId, answerId) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }))
  }

  const handleSubmit = async () => {
    if (!quiz) return
    
    const totalQuestions = quiz.questions?.length || 0
    const answeredQuestions = Object.keys(selectedAnswers).length
    
    if (answeredQuestions < totalQuestions) {
      showToast(`Ответьте на все вопросы! (${answeredQuestions}/${totalQuestions})`, 'warning')
      return
    }
    
    try {
      const answersObj = {}
      Object.entries(selectedAnswers).forEach(([k, v]) => {
        answersObj[parseInt(k)] = parseInt(v)
      })
      const res = await quizApi.submit(quiz.id, answersObj)
      setAttempt(res.data)
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting quiz:', err)
      showToast(err.response?.data?.detail || 'Ошибка при отправке', 'error')
    }
  }

  const addQuestion = () => {
    if (!currentQuestion.text) return
    setNewQuiz({
      ...newQuiz,
      questions: [...newQuiz.questions, { ...currentQuestion, order: newQuiz.questions.length }],
      questions_count: (newQuiz.questions_count || 0) + 1
    })
    setCurrentQuestion({ text: '', answers: [{ text: '', is_correct: false }] })
  }

  const addAnswer = () => {
    setCurrentQuestion({
      ...currentQuestion,
      answers: [...currentQuestion.answers, { text: '', is_correct: false }]
    })
  }

  const updateAnswer = (index, field, value) => {
    const answers = [...currentQuestion.answers]
    if (field === 'is_correct' && value) {
      answers.forEach((a, i) => answers[i] = { ...a, is_correct: false })
    }
    answers[index][field] = value
    setCurrentQuestion({ ...currentQuestion, answers })
  }

  const handleCreateQuiz = async () => {
    if (!newQuiz.title || newQuiz.questions.length === 0) {
      showToast('Добавьте название и хотя бы один вопрос', 'warning')
      return
    }
    try {
      await quizApi.create({ ...newQuiz, lesson_id: contentOrLessonId })
      showToast('Тест создан!', 'success')
      setShowCreateQuiz(false)
      window.location.reload()
    } catch (err) {
      showToast('Ошибка создания теста', 'error')
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      await commentsApi.create({ content: newComment, lesson_id: contentOrLessonId })
      setNewComment('')
      const res = await commentsApi.getByLesson(contentOrLessonId)
      setComments(res.data)
      showToast('Комментарий добавлен', 'success')
    } catch (err) {
      showToast('Ошибка добавления комментария', 'error')
    }
  }

  const handleDeleteComment = async (id) => {
    try {
      await commentsApi.delete(id)
      setComments(comments.filter(c => c.id !== id))
      showToast('Комментарий удалён', 'success')
    } catch (err) {
      showToast('Ошибка удаления', 'error')
    }
  }

  if (!lesson) return <div className="loading">Загрузка урока...</div>

  const getVideoId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
    return match ? match[1] : null
  }

  const videoId = lesson.video_url ? getVideoId(lesson.video_url) : null

  return (
    <div className="lesson-view">
      <Link to={`/courses/${courseId}`} className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
        <ChevronLeft size={20} /> Назад к курсу
      </Link>
      
      <h1>{lesson.title}</h1>
      
      {lesson.video_url && (
        <div className="video-container">
          {videoId ? (
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allowFullScreen
              title={lesson.title}
            />
          ) : (
            <video controls width="100%">
              <source src={lesson.video_url} type="video/mp4" />
              Ваш браузер не поддерживает видео
            </video>
          )}
        </div>
      )}

      {lesson.content && (
        <div className="lesson-content">
          <h3>Материал урока</h3>
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      )}

      {!quizLoading && quiz && (
        <div className="quiz-section">
          <h2>Тест: {quiz.title}</h2>
          {quiz.description && <p>{quiz.description}</p>}
          
          {attempt && submitted && (
            <Card padding="md" className={`attempt-result ${attempt.passed ? 'passed' : 'failed'}`} style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                {attempt.passed ? (
                  <CheckCircle size={32} style={{ color: '#10b981' }} />
                ) : (
                  <XCircle size={32} style={{ color: '#ef4444' }} />
                )}
                <h3 style={{ margin: 0 }}>Результат: {attempt.score}%</h3>
              </div>
              <p style={{ margin: 0 }}>{attempt.passed ? 'Поздравляем! Тест пройден!' : 'Тест не пройден. Попробуйте ещё раз.'}</p>
            </Card>
          )}

          {!submitted && (
            <>
              {quiz.questions?.map((question, qIndex) => (
                <div key={question.id} className="quiz-question">
                  <p><strong>Вопрос {qIndex + 1}:</strong> {question.text}</p>
                  <div className="answers">
                    {question.answers?.map(answer => (
                      <div 
                        key={answer.id} 
                        className="answer-option"
                        onClick={() => handleAnswerSelect(String(question.id), String(answer.id))}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={selectedAnswers[String(question.id)] === String(answer.id)}
                          onChange={() => handleAnswerSelect(String(question.id), String(answer.id))}
                          style={{ marginRight: '8px' }}
                        />
                        {answer.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <button 
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
              >
                Отправить ответы ({Object.keys(selectedAnswers).length}/{quiz.questions?.length || 0})
              </button>
            </>
          )}

          {submitted && (
            <Button variant="secondary" onClick={() => { setSubmitted(false); setSelectedAnswers({}) }}>
              <RotateCcw size={16} /> Пройти заново
            </Button>
          )}
        </div>
      )}

      {!quizLoading && !quiz && currentUser && (currentUser.is_superuser || currentUser.role === 'admin') && (
        <div className="no-quiz">
          <p>К этому уроку пока нет теста.</p>
          <button onClick={() => setShowCreateQuiz(true)} className="btn btn-primary">
            Создать тест
          </button>
        </div>
      )}

      {showCreateQuiz && (
        <div className="create-quiz-form">
          <h2>Создание теста</h2>
          <div className="form-group">
            <label>Название теста</label>
            <input
              type="text"
              value={newQuiz.title}
              onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
              placeholder="Тест по уроку"
            />
          </div>
          <div className="form-group">
            <label>Проходной балл (%)</label>
            <input
              type="number"
              value={newQuiz.passing_score}
              onChange={(e) => setNewQuiz({ ...newQuiz, passing_score: parseInt(e.target.value) })}
              min="1" max="100"
            />
          </div>

          <div className="questions-section">
            <h3>Вопросы</h3>
            {newQuiz.questions.map((q, i) => (
              <div key={i} className="question-preview">
                <strong>Вопрос {i + 1}:</strong> {q.text} ({q.answers.filter(a => a.is_correct).length > 0 ? 'Есть правильный ответ' : 'Нет правильного ответа'})
              </div>
            ))}

            <div className="new-question-form">
              <input
                type="text"
                placeholder="Текст вопроса"
                value={currentQuestion.text}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
              />
              <div className="answers-form">
                {currentQuestion.answers.map((a, i) => (
                  <div key={i} className="answer-row">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={a.is_correct}
                      onChange={(e) => updateAnswer(i, 'is_correct', e.target.checked)}
                      title="Правильный ответ"
                    />
                    <input
                      type="text"
                      placeholder="Текст ответа"
                      value={a.text}
                      onChange={(e) => updateAnswer(i, 'text', e.target.value)}
                    />
                  </div>
                ))}
                <button type="button" onClick={addAnswer} className="btn-text">+ Добавить вариант</button>
              </div>
              <button onClick={addQuestion} className="btn btn-secondary">Добавить вопрос</button>
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleCreateQuiz} disabled={newQuiz.questions.length === 0} className="btn btn-primary">
              Создать тест
            </button>
            <button onClick={() => setShowCreateQuiz(false)} className="btn btn-secondary">Отмена</button>
          </div>
        </div>
      )}

      <div className="comments-section">
        <Button variant="secondary" onClick={() => setShowComments(!showComments)}>
          <MessageSquare size={16} /> Комментарии ({comments.length})
        </Button>
        
        {showComments && (
          <Card padding="md" style={{ marginTop: '1rem' }}>
            {currentUser && (
              <form onSubmit={handleCommentSubmit} className="comment-form" style={{ marginBottom: '1.5rem' }}>
                <textarea
                  placeholder="Написать комментарий..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.9rem' }}
                />
                <Button type="submit">
                  <Send size={16} /> Отправить
                </Button>
              </form>
            )}
            
            {comments.length === 0 ? (
              <p className="no-comments" style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
                Пока нет комментариев. Будьте первым!
              </p>
            ) : (
              <div className="comments-list">
                {comments.map(comment => (
                  <div key={comment.id} className="comment-item" style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="comment-author" style={{ fontWeight: 600 }}>{comment.user?.username || 'User'}</span>
                      <span className="comment-date" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(comment.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <p className="comment-content" style={{ margin: 0, lineHeight: 1.5 }}>{comment.content}</p>
                    {currentUser && (currentUser.id === comment.user_id || currentUser.is_superuser) && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="btn-delete" style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>
                        <Trash2 size={14} /> Удалить
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
      
      <ToastContainer toast={toast} onClose={closeToast} />
    </div>
  )
}

export default LessonView
