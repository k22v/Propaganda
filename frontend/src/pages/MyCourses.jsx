import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Trash2, Edit, ArrowRight } from 'lucide-react'
import { coursesApi, authApi } from '../api'
import { ToastContainer, useToast } from '../components/Toast'
import { Card, Badge, Button } from '../components/ui/index.jsx'
import { CourseGrid } from '../components/CourseComponents'

function MyCourses() {
  const { toast, showToast, closeToast } = useToast()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSuperuser, setIsSuperuser] = useState(false)

  useEffect(() => {
    authApi.getMe()
      .then(({ data }) => setIsSuperuser(data?.is_superuser === true || data?.is_superuser === 1))
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

  if (loading) return <CourseGrid courses={[]} isLoading={true} />

  return (
    <div className="courses-page">
      <ToastContainer toast={toast} onClose={closeToast} />
      
      <div className="page-header">
        <h1>{isSuperuser ? 'Все курсы' : 'Мои курсы'}</h1>
        {isSuperuser && (
          <Button as={Link} to="/create">
            <Plus size={16} /> Создать курс
          </Button>
        )}
      </div>
      
      {courses.length === 0 ? (
        <Card padding="lg">
          <div className="empty-state">
            <BookOpen size={48} />
            <h3 className="empty-title">Пока нет курсов</h3>
            <p className="empty-description">
              {isSuperuser 
                ? 'Создайте свой первый курс для начала работы' 
                : 'Запишитесь на курс в разделе "Все курсы"'}
            </p>
            {isSuperuser ? (
              <Button as={Link} to="/create" style={{ marginTop: '1rem' }}>
                <Plus size={16} /> Создать курс
              </Button>
            ) : (
              <Button as={Link} to="/courses" variant="secondary" style={{ marginTop: '1rem' }}>
                <BookOpen size={16} /> К каталогу курсов
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {courses.map(course => (
            <Card key={course.id} padding="none" className="course-card">
              <Link to={`/courses/${course.id}`} className="course-card-link" style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                <div className="course-card-cover" style={{ height: '120px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Badge variant={course.is_published ? 'success' : 'default'} style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                    {course.is_published ? 'Опубликован' : 'Черновик'}
                  </Badge>
                </div>
                <div className="course-card-body" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="course-card-title" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{course.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', flex: 1 }}>
                    {course.description || 'Описание отсутствует'}
                  </p>
                  {course.progress !== undefined && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span>Прогресс</span>
                        <span style={{ color: 'var(--color-primary)' }}>{course.progress}%</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${course.progress}%`, height: '100%', background: 'var(--color-primary)' }} />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
              <div className="course-card-footer" style={{ padding: '0 1.25rem 1.25rem', display: 'flex', gap: '0.5rem' }}>
                <Button as={Link} to={`/courses/${course.id}`} variant="secondary" size="sm" style={{ flex: 1 }}>
                  <ArrowRight size={14} /> Открыть
                </Button>
                {isSuperuser && (
                  <>
                    <Button as={Link} to={`/courses/${course.id}`} size="sm" style={{ flex: 1 }}>
                      <Edit size={14} /> Редакт.
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(course.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyCourses
