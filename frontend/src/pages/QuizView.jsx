import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { quizApi } from '../api'
import { useToast, ToastContainer } from '../components/Toast'

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

  if (loading) return <div className="loading">Загрузка теста...</div>
  if (!quiz) return <div className="error">Тест не найден</div>

  return (
    <div className="quiz-view">
      <Link to={`/courses/${courseId}`} className="back-link">← Назад к курсу</Link>
      
      <h1>{quiz.title}</h1>
      {quiz.description && <p className="quiz-description">{quiz.description}</p>}
      
      {attempt && submitted && (
        <div className={`attempt-result ${attempt.passed ? 'passed' : 'failed'}`}>
          <h3>Результат: {attempt.score}%</h3>
          <p>{attempt.passed ? 'Поздравляем! Тест пройден!' : 'Тест не пройден. Попробуйте ещё раз.'}</p>
          {attempt.passed && <p>Проходной балл: {quiz.passing_score}%</p>}
        </div>
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
                    className={`answer-option ${selectedAnswers[question.id] === String(answer.id) ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(String(question.id), String(answer.id))}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={selectedAnswers[question.id] === String(answer.id)}
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
        <button onClick={() => { setSubmitted(false); setSelectedAnswers({}); setAttempt(null) }} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Пройти заново
        </button>
      )}

      <ToastContainer toast={toast} onClose={closeToast} />
    </div>
  )
}

export default QuizView