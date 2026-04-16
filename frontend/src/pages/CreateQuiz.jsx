import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, CheckCircle, X, ChevronLeft } from 'lucide-react'
import { quizApi } from '../api'
import { useToast } from '../components/Toast'
import { Card, Badge, Button } from '../components/ui/index.jsx'

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
    <div className="create-quiz-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div className="page-header">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', cursor: 'pointer', marginBottom: '1rem' }}>
          <ChevronLeft size={20} /> Назад
        </button>
        <h1>Создание теста</h1>
      </div>
      
      <Card padding="lg">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Основная информация</h3>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Название теста</label>
              <input 
                id="title"
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Введите название теста"
                required 
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Описание</label>
              <textarea 
                id="description"
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Опишите тест"
                rows={3}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="passingScore" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Проходной балл (%)</label>
              <input 
                id="passingScore"
                type="number" 
                value={passingScore} 
                onChange={e => setPassingScore(parseInt(e.target.value))}
                min="1" max="100"
                style={{ width: '100px', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              />
              <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Минимальный процент для прохождения
              </span>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem' }}>Вопросы</h3>
            
            {questions.map((question, qIndex) => (
              <Card key={qIndex} padding="md" style={{ marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <Badge variant="primary">Вопрос {qIndex + 1}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)}>
                    <Trash2 size={14} /> Удалить
                  </Button>
                </div>
                <textarea
                  value={question.text}
                  onChange={e => updateQuestion(qIndex, e.target.value)}
                  placeholder="Текст вопроса"
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '1rem' }}
                  rows={2}
                />
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Варианты ответа (отметьте правильный)</label>
                  {question.answers.map((answer, aIndex) => (
                    <div key={aIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={answer.is_correct}
                        onChange={e => updateAnswer(qIndex, aIndex, 'is_correct', e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <input
                        type="text"
                        value={answer.text}
                        onChange={e => updateAnswer(qIndex, aIndex, 'text', e.target.value)}
                        placeholder="Текст ответа"
                        required
                        style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                      />
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addAnswer(qIndex)}>
                    <Plus size={14} /> Добавить вариант
                  </Button>
                </div>
              </Card>
            ))}

            <Button variant="secondary" onClick={addQuestion}>
              <Plus size={16} /> Добавить вопрос
            </Button>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <Button type="submit" size="lg" disabled={saving || questions.length === 0}>
              {saving ? 'Создание...' : 'Создать тест'}
            </Button>
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CreateQuiz