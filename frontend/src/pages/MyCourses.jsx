import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Trash2, Edit, ArrowRight } from 'lucide-react'
import { coursesApi, authApi } from '../api'
import { ToastContainer, useToast } from '../components/Toast'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Card, Badge, Button } from '../components/ui/index.jsx'
import { CourseGrid } from '../components/CourseComponents'

function MyCourses() {
  const { toast, showToast, closeToast } = useToast()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [canCreateCourse, setCanCreateCourse] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    authApi.getMe()
      .then(({ data }) => {
        setCurrentUser(data)
        setCanCreateCourse(
          data?.is_superuser === true ||
          data?.is_superuser === 1 ||
          data?.role === 'admin' ||
          data?.role === 'teacher'
        )
      })
      .catch(() => {
        setCurrentUser(null)
        setCanCreateCourse(false)
      })
  }, [])

  const canManageCourse = (course) =>
    !!currentUser && (
      currentUser.is_superuser === true ||
      currentUser.is_superuser === 1 ||
      currentUser.role === 'admin' ||
      String(currentUser.id) === String(course.author_id)
    )

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
    try {
      await coursesApi.delete(id)
      setCourses(courses.filter(c => c.id !== id))
      showToast('Курс удалён', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Ошибка удаления курса', 'error')
    }
  }

  const handleDeleteClick = (id) => {
    setDeleteConfirm(id)
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await handleDelete(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  if (loading) return <CourseGrid courses={[]} isLoading={true} />

  return (
    <div className="courses-page">
      <ToastContainer toast={toast} onClose={closeToast} />
      
      <div className="page-header">
        <h1>{canCreateCourse ? 'Все курсы' : 'Мои курсы'}</h1>
        {canCreateCourse && (
          <Link to="/create">
            <Button>
              <Plus size={16} /> Создать курс
            </Button>
          </Link>
        )}
      </div>
      
      {courses.length === 0 ? (
        <Card padding="lg">
          <div className="empty-state">
            <BookOpen size={48} />
            <h3 className="empty-title">Пока нет курсов</h3>
            <p className="empty-description">
              {canCreateCourse 
                ? 'Создайте свой первый курс для начала работы' 
                : 'Запишитесь на курс в разделе "Все курсы"'}
            </p>
            {canCreateCourse ? (
              <Link to="/create">
                <Button style={{ marginTop: '1rem' }}>
                  <Plus size={16} /> Создать курс
                </Button>
              </Link>
            ) : (
              <Link to="/courses">
                <Button variant="secondary" style={{ marginTop: '1rem' }}>
                  <BookOpen size={16} /> К каталогу курсов
                </Button>
              </Link>
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
                <Link to={`/courses/${course.id}`} style={{ flex: 1 }}>
                  <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                    <ArrowRight size={14} /> Открыть
                  </Button>
                </Link>
                {canManageCourse(course) && (
                  <>
                    <Link to={`/courses/${course.id}`} style={{ flex: 1 }}>
                      <Button size="sm" style={{ width: '100%' }}>
                        <Edit size={14} /> Редакт.
                      </Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteClick(course.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
      )}
      
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Удаление курса"
        message="Вы уверены, что хотите удалить этот курс? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        danger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}

export default MyCourses
