import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { coursesApi, authApi } from '../api'
import { useToast, ToastContainer } from '../components/Toast'

const PAGE_SIZE = 12

const SPECIALIZATIONS = [
  { value: '', label: 'Все курсы' },
  { value: 'dentist', label: 'Врач-стоматолог' },
  { value: 'assistant', label: 'Ассистент стоматолога' },
  { value: 'technician', label: 'Зубной техник' },
  { value: 'clinic_admin', label: 'Администратор клиники' },
]

function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [specialization, setSpecialization] = useState('')
  const loaderRef = useRef(null)
  const filterRef = useRef(null)
  const { showToast, toast, closeToast } = useToast()

  const updateSlider = (index) => {
    if (!filterRef.current) return
    const pills = filterRef.current.querySelectorAll('.filter-pill')
    const activePill = pills[index]
    if (!activePill) return
    
    const containerRect = filterRef.current.getBoundingClientRect()
    const pillRect = activePill.getBoundingClientRect()
    
    filterRef.current.style.setProperty('--slider-left', `${pillRect.left - containerRect.left}px`)
    filterRef.current.style.setProperty('--slider-width', `${pillRect.width}px`)
  }

  useEffect(() => {
    authApi.getMe()
      .then(({ data }) => setCurrentUser(data))
      .catch(() => setCurrentUser(null))
  }, [])

  const loadCourses = useCallback(async (pageNum, spec) => {
    setLoading(true)
    try {
      const { data } = await coursesApi.getAll(pageNum * PAGE_SIZE, PAGE_SIZE, spec || null)
      const published = data.filter(c => c.is_published)
      if (pageNum === 0) {
        setCourses(published)
      } else {
        setCourses(prev => [...prev, ...published])
      }
      setHasMore(data.length === PAGE_SIZE)
    } catch (err) { console.error(err) }
    setLoading(false)
  }, [])

  useEffect(() => {
    setPage(0)
    loadCourses(0, specialization)
    const index = SPECIALIZATIONS.findIndex(s => s.value === specialization)
    updateSlider(index >= 0 ? index : 0)
  }, [specialization, loadCourses])

  useEffect(() => {
    updateSlider(0)
  }, [])

  useEffect(() => {
    if (page === 0) return
    loadCourses(page, specialization)
  }, [page])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1)
        }
      },
      { threshold: 0.1 }
    )
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }
    
    return () => observer.disconnect()
  }, [hasMore, loading])

  const showEditButton = currentUser && (currentUser.is_superuser || currentUser.id === 5)

  const handleSpecializationChange = (specValue, index) => {
    console.log('handleSpecializationChange:', specValue, currentUser?.specialization)
    if (specValue && currentUser && !currentUser.is_superuser && currentUser.specialization) {
      if (specValue !== currentUser.specialization) {
        console.log('Showing toast for blocked specialization')
        showToast(`Курсы для "${SPECIALIZATIONS.find(s => s.value === specValue)?.label}" недоступны. Ваша специализация: ${SPECIALIZATIONS.find(s => s.value === currentUser.specialization)?.label}`, 'warning')
        return
      }
    }
    setSpecialization(specValue)
    updateSlider(index)
  }

  return (
    <div className="courses-page">
      <div className="page-header">
        <h1>Доступные курсы</h1>
      </div>
      
      <div className="courses-filter" ref={filterRef}>
        {SPECIALIZATIONS.map((spec, index) => (
          <button
            key={spec.value}
            className={`filter-pill ${specialization === spec.value ? 'active' : ''}`}
            onClick={() => handleSpecializationChange(spec.value, index)}
          >
            {spec.label}
          </button>
        ))}
      </div>
      
      {courses.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>Курсов пока нет</h3>
          <p>Скоро здесь появятся интересные курсы</p>
        </div>
      ) : (
        <>
          <div className="courses-grid">
            {courses.map(course => (
              <div key={course.id} className="course-card">
                <Link to={`/courses/${course.id}`} className="course-card-link">
                  <h3>{course.title}</h3>
                  <p>{course.description || 'Описание отсутствует'}</p>
                  <div className="course-meta">
                    <span>Уроков: {course.lessons_count || 0}</span>
                  </div>
                </Link>
                {showEditButton && (
                  <div className="course-actions">
                    <Link to={`/courses/${course.id}`} className="btn btn-primary">Редактировать</Link>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div ref={loaderRef} className="infinite-scroll-loader">
            {loading && <div className="loader-spinner"></div>}
            {!hasMore && courses.length > 0 && <p className="end-message">Все курсы загружены</p>}
          </div>
        </>
      )}
      <ToastContainer toast={toast} onClose={closeToast} />
    </div>
  )
}

export default Courses
