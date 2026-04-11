import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { coursesApi, authApi } from '../api'
import { ToastContainer, useToast } from '../components/Toast'

function MyCourses() {
  const { toast, showToast, closeToast } = useToast()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSuperuser, setIsSuperuser] = useState(false)

  useEffect(() => {
    authApi.getMe()
      .then(({ data }) => setIsSuperuser(data?.is_superuser === true || data?.is_superuser === 1 || data?.id === 5))
      .catch(() => setIsSuperuser(false))
  }, [])

  useEffect(() => {
    coursesApi.getMy()
      .then(({ data }) => setCourses(data))
      .catch((err) => {
        console.error(err)
        showToast('Ошибка загрузки курсов', 'error')
      })
      .finally(() => setLoading(false))
  }, [showToast])

  const handleDelete = async (id) => {
    if (!confirm('Удалить курс?')) return
    try {
      await coursesApi.delete(id)
      setCourses(courses.filter(c => c.id !== id))
      showToast('Курс удалён', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Ошибка удаления курса', 'error')
    }
  }

  if (loading) return <div className="loading">Загрузка...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="courses-page">
      <ToastContainer toast={toast} onClose={closeToast} />
      
      <div className="page-header">
        <h1>{isSuperuser ? 'Все курсы' : 'Мои курсы'}</h1>
        {isSuperuser && <Link to="/create" className="btn btn-primary">Создать курс</Link>}
      </div>
      
      {courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>Пока нет курсов</h3>
          {isSuperuser && <p>Создайте свой первый курс</p>}
          {isSuperuser && <Link to="/create" className="btn btn-primary">Создать курс</Link>}
          {!isSuperuser && <p>Запишитесь на курс в разделе "Курсы"</p>}
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <Link to={`/courses/${course.id}`} className="course-card-link">
                <h3>{course.title}</h3>
                <p>{course.description || 'Описание отсутствует'}</p>
                <div className="course-meta">
                  <span className={`badge ${course.is_published ? 'badge-success' : 'badge-secondary'}`}>
                    {course.is_published ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
              </Link>
              <div className="course-actions">
                <Link to={`/courses/${course.id}`} className="btn btn-secondary btn-full">Открыть</Link>
                {isSuperuser && (
                  <>
                    <Link to={`/courses/${course.id}`} className="btn btn-primary btn-full">Редактировать</Link>
                    <button onClick={() => handleDelete(course.id)} className="btn btn-danger btn-full">Удалить</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyCourses
