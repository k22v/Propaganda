import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { coursesApi, authApi } from '../api'
import { useToast } from '../components/Toast'

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
        <div className="create-course-intro">
          <div className="intro-icon">📚</div>
          <h2>Новый курс</h2>
          <p>Создайте свой первый обучающий курс. Добавьте название, описание и наполните его полезным контентом.</p>
        </div>

        <form onSubmit={handleSubmit} className="create-course-form">
          <div className="form-section">
            <h3>Основная информация</h3>
            
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
            <div className="form-section">
              <h3>Период доступа (только для superuser)</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Дата начала</label>
                  <input
                    id="start_date"
                    type="date"
                    value={dates.start_date}
                    onChange={(e) => setDates({ ...dates, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="end_date">Дата окончания</label>
                  <input
                    id="end_date"
                    type="date"
                    value={dates.end_date}
                    onChange={(e) => setDates({ ...dates, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Создание...' : 'Создать курс'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/my-courses')}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCourse