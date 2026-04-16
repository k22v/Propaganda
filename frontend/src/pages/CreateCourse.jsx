import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Calendar } from 'lucide-react'
import { coursesApi, authApi } from '../api'
import { useToast } from '../components/Toast'
import { Card, Badge, Button } from '../components/ui/index.jsx'

const SPECIALIZATIONS = [
  { value: 'dentist', label: 'Врач-стоматолог' },
  { value: 'assistant', label: 'Ассистент стоматолога' },
  { value: 'technician', label: 'Зубной техник' },
  { value: 'clinic_admin', label: 'Администратор клиники' },
]

function CreateCourse() {
  const [form, setForm] = useState({ title: '', description: '', specialization: '' })
  const [dates, setDates] = useState({ start_date: '', end_date: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    authApi.getMe()
      .then(({ data }) => setCurrentUser(data))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.specialization) {
      showToast('Выберите специализацию', 'warning')
      return
    }
    if (!form.title.trim()) {
      showToast('Введите название курса', 'warning')
      return
    }
    setIsLoading(true)
    try {
      const courseData = { 
        title: form.title,
        description: form.description,
        specialization: form.specialization || null,
        start_date: dates.start_date ? new Date(dates.start_date).toISOString() : null,
        end_date: dates.end_date ? new Date(dates.end_date).toISOString() : null,
      }
      console.log('Creating course with data:', courseData)
      const { data: course } = await coursesApi.create(courseData)
      console.log('Course created successfully:', course)
      navigate(`/courses/${course.id}`)
    } catch (err) {
      console.error('Error creating course:', err)
      console.log('Response status:', err.response?.status)
      console.log('Response data:', err.response?.data)
      showToast(err.response?.data?.detail || 'Ошибка создания курса', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="create-course-page">
      <div className="page-header">
        <h1>Создание курса</h1>
      </div>
      
      <div className="create-course-container">
        <Card padding="lg" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Новый курс</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Создайте свой первый обучающий курс
              </p>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3 style={{ marginBottom: '1.5rem' }}>Основная информация</h3>
            
            <div className="form-group">
              <label htmlFor="title">Название курса</label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Например: Основы программирования"
                required
                className="input-large"
              />
              <span className="form-hint">Придумайте запоминающееся название</span>
            </div>

            <div className="form-group">
              <label htmlFor="specialization">Специализация</label>
              <select
                id="specialization"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                required
              >
                <option value="">Выберите специализацию</option>
                {SPECIALIZATIONS.map(spec => (
                  <option key={spec.value} value={spec.value}>{spec.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Описание курса</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Опишите, что студенты изучат после прохождения курса..."
                rows={5}
              />
              <span className="form-hint">Расскажите подробнее о курсе</span>
            </div>
          </div>

          {currentUser?.is_superuser && (
            <div className="form-section" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>
                <Calendar size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Период доступа
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Дата начала</label>
                  <input
                    id="start_date"
                    type="date"
                    value={dates.start_date}
                    onChange={(e) => setDates({ ...dates, start_date: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="end_date">Дата окончания</label>
                  <input
                    id="end_date"
                    type="date"
                    value={dates.end_date}
                    onChange={(e) => setDates({ ...dates, end_date: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  />
                </div>
              </div>
            </div>
          )}

            <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading ? 'Создание...' : 'Создать курс'}
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate('/my-courses')}>
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default CreateCourse