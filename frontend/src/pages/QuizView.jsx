import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, ChevronLeft, RotateCcw, Send } from 'lucide-react'
import { quizApi } from '../api'
import { useToast, ToastContainer } from '../components/Toast'
import { Card, Badge, Button } from '../components/ui/index.jsx'

function QuizView() {
  const { courseId, quizId } = useParams()
  const { showToast, toast, closeToast } = useToast()
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [attempt, setAttempt] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    quizApi.getOne(quizId)
      .then(res => {
        setQuiz(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading quiz:', err)
        showToast('Ошибка загрузки теста', 'error')
        setLoading(false)
      })
  }, [quizId])

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

  if (loading) return <Card padding="lg"><div style={{ textAlign: 'center', padding: '2rem' }}>Загрузка теста...</div></Card>
  if (!quiz) return <Card padding="lg"><div style={{ textAlign: 'center', padding: '2rem' }}>Тест не найден</div></Card>

  return (
    <div className="quiz-view" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link to={`/courses/${courseId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
        <ChevronLeft size={20} /> Назад к курсу
      </Link>
      
      <Card padding="lg" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.5rem' }}>{quiz.title}</h1>
        {quiz.description && <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{quiz.description}</p>}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Badge variant="primary">{quiz.questions?.length || 0} вопросов</Badge>
          <Badge variant="warning">Проходной: {quiz.passing_score}%</Badge>
        </div>
      </Card>
      
      {attempt && submitted && (
        <Card 
          padding="lg" 
          className={`attempt-result ${attempt.passed ? 'passed' : 'failed'}`} 
          style={{ 
            marginBottom: '1.5rem', 
            textAlign: 'center',
            border: attempt.passed ? '2px solid #10b981' : '2px solid #ef4444'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            {attempt.passed ? (
              <CheckCircle size={48} style={{ color: '#10b981' }} />
            ) : (
              <XCircle size={48} style={{ color: '#ef4444' }} />
            )}
            <div>
              <h2 style={{ margin: 0 }}>Результат: {attempt.score}%</h2>
            </div>
          </div>
          <p style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>
            {attempt.passed ? 'Поздравляем! Тест пройден!' : 'Тест не пройден. Попробуйте ещё раз.'}
          </p>
          {attempt.passed && (
            <Badge variant="success" style={{ marginTop: '0.5rem' }}>
              Проходной балл: {quiz.passing_score}%
            </Badge>
          )}
        </Card>
      )}

      {!submitted && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {quiz.questions?.map((question, qIndex) => (
              <Card key={question.id} padding="md">
                <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>
                  <Badge variant="default" style={{ marginRight: '0.5rem' }}>{qIndex + 1}</Badge>
                  {question.text}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {question.answers?.map(answer => (
                    <label 
                      key={answer.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        background: selectedAnswers[question.id] === String(answer.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        borderColor: selectedAnswers[question.id] === String(answer.id) ? 'var(--color-primary)' : 'var(--color-border)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={selectedAnswers[question.id] === String(answer.id)}
                        onChange={() => handleAnswerSelect(String(question.id), String(answer.id))}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>{answer.text}</span>
                    </label>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <Button onClick={handleSubmit} size="lg">
              <Send size={18} /> Отправить ответы ({Object.keys(selectedAnswers).length}/{quiz.questions?.length || 0})
            </Button>
          </div>
        </>
      )}

      {submitted && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Button variant="secondary" onClick={() => { setSubmitted(false); setSelectedAnswers({}); setAttempt(null) }}>
            <RotateCcw size={16} /> Пройти заново
          </Button>
        </div>
      )}
      
      <ToastContainer toast={toast} onClose={closeToast} />
    </div>
  )
}

export default QuizView
