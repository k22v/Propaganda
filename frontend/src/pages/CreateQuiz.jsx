import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizApi } from '../api'
import { useToast } from '../components/Toast'

function CreateQuiz() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [questions, setQuestions] = useState([])
  const [saving, setSaving] = useState(false)

  const addQuestion = () => {
    setQuestions([...questions, { 
      text: '', 
      order: questions.length,
      answers: [{ text: '', is_correct: false, order: 0 }] 
    }])
  }

  const addAnswer = (qIndex) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].answers.push({ 
      text: '', 
      is_correct: false, 
      order: newQuestions[qIndex].answers.length 
    })
    setQuestions(newQuestions)
  }

  const updateQuestion = (qIndex, text) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].text = text
    setQuestions(newQuestions)
  }

  const updateAnswer = (qIndex, aIndex, field, value) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].answers[aIndex][field] = value
    if (field === 'is_correct' && value) {
      newQuestions[qIndex].answers.forEach((a, i) => {
        if (i !== aIndex) a.is_correct = false
      })
    }
    setQuestions(newQuestions)
  }

  const removeQuestion = (qIndex) => {
    setQuestions(questions.filter((_, i) => i !== qIndex))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      await quizApi.create({
        lesson_id: parseInt(lessonId),
        title,
        description,
        passing_score: passingScore,
        questions: questions.map((q, i) => ({
          text: q.text,
          order: i,
          answers: q.answers.map((a, j) => ({
            text: a.text,
            is_correct: a.is_correct,
            order: j
          }))
        }))
      })
      showToast('Тест создан!', 'success')
      navigate(-1)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Ошибка при создании теста', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="create-quiz-page">
      <div className="page-header">
        <h1>Создание теста</h1>
      </div>
      
      <div className="create-quiz-container">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Основная информация</h3>
            
            <div className="form-group">
              <label htmlFor="title">Название теста</label>
              <input 
                id="title"
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Введите название теста"
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Описание</label>
              <textarea 
                id="description"
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Опишите тест"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="passingScore">Проходной балл (%)</label>
              <input 
                id="passingScore"
                type="number" 
                value={passingScore} 
                onChange={e => setPassingScore(parseInt(e.target.value))}
                min="1" max="100"
              />
              <span className="form-hint">Минимальный процент правильных ответов для прохождения</span>
            </div>
          </div>

          <div className="form-section">
            <h3>Вопросы</h3>
            
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="question-block">
                <div className="question-header">
                  <span className="question-number">Вопрос {qIndex + 1}</span>
                  <button type="button" onClick={() => removeQuestion(qIndex)} className="btn btn-ghost btn-sm text-danger">
                    Удалить
                  </button>
                </div>
                <textarea
                  value={question.text}
                  onChange={e => updateQuestion(qIndex, e.target.value)}
                  placeholder="Текст вопроса"
                  required
                />
                
                <div className="answers-block">
                  <label>Варианты ответа</label>
                  {question.answers.map((answer, aIndex) => (
                    <div key={aIndex} className="answer-row">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={answer.is_correct}
                          onChange={e => updateAnswer(qIndex, aIndex, 'is_correct', e.target.checked)}
                        />
                      </label>
                      <input
                        type="text"
                        value={answer.text}
                        onChange={e => updateAnswer(qIndex, aIndex, 'text', e.target.value)}
                        placeholder="Текст ответа"
                        required
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => addAnswer(qIndex)} className="btn btn-ghost btn-sm">
                    Добавить вариант
                  </button>
                </div>
              </div>
            ))}

            <button type="button" onClick={addQuestion} className="btn btn-secondary">
              Добавить вопрос
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving || questions.length === 0} className="btn btn-primary btn-lg">
              {saving ? 'Создание...' : 'Создать тест'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateQuiz