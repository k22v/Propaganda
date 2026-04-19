import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, BookOpen, Plus } from 'lucide-react'
import { coursesApi, authApi } from '../api'
import { useToast, ToastContainer } from '../components/Toast'
import { Card, Badge, Button } from '../components/ui/index.jsx'
import { CourseCard, CourseGrid } from '../components/CourseComponents'
import './Courses.css'

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
  const [searchQuery, setSearchQuery] = useState('')
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

  const loadCourses = useCallback(async (pageNum, spec, search = null) => {
    setLoading(true)
    try {
      const { data } = await coursesApi.getAll({
        skip: pageNum * PAGE_SIZE,
        limit: PAGE_SIZE,
        specialization: spec || undefined,
        search: search || undefined,
      })
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

  const canCreateCourse = !!currentUser && (
    currentUser.is_superuser === true ||
    currentUser.is_superuser === 1 ||
    currentUser.role === 'admin' ||
    currentUser.role === 'teacher'
  )

  const handleSpecializationChange = (specValue, index) => {
    if (specValue && currentUser && !currentUser.is_superuser && currentUser.specialization) {
      if (specValue !== currentUser.specialization) {
        showToast(`Курсы для "${SPECIALIZATIONS.find(s => s.value === specValue)?.label}" недоступны. Ваша специализация: ${SPECIALIZATIONS.find(s => s.value === currentUser.specialization)?.label}`, 'warning')
        return
      }
    }
    setSpecialization(specValue)
    updateSlider(index)
  }

  const handleEnroll = async (courseId) => {
    try {
      await coursesApi.enroll(courseId)
      showToast('Вы записаны на курс!', 'success')
      loadCourses(0, specialization, searchQuery)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Ошибка записи', 'error')
    }
  }

  return (
    <div className="courses-page">
      <div className="page-header">
        <h1>Доступные курсы</h1>
        {canCreateCourse && (
          <Link to="/create">
            <Button><Plus size={16} /> Создать курс</Button>
          </Link>
        )}
      </div>
      
      <div className="search-box">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Поиск курсов..."
          onChange={(e) => {
            const q = e.target.value
            setSearchQuery(q)
            if (q.length >= 2 || q.length === 0) {
              setPage(0)
              loadCourses(0, specialization, q)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(0)
              loadCourses(0, specialization, e.target.value)
            }
          }}
        />
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
      
      {loading && courses.length === 0 ? (
        <CourseGrid courses={[]} isLoading={true} />
      ) : courses.length === 0 && !loading ? (
        <Card padding="lg">
          <div className="empty-state">
            <BookOpen size={48} />
            <h3 className="empty-title">Курсов не найдено</h3>
            <p className="empty-description">
              {searchQuery ? `По запросу "${searchQuery}" ничего не найдено` : 'Курсов пока нет'}
            </p>
            {searchQuery && (
              <Button variant="secondary" onClick={() => {
                setSearchQuery('')
                setPage(0)
                loadCourses(0, specialization, '')
              }}>
                Очистить поиск
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <CourseGrid 
            courses={courses} 
            isLoading={false}
            onEnroll={handleEnroll}
          />
          <div ref={loaderRef} className="infinite-scroll-loader">
            {loading && (
              <div className="loading-more">
                <div className="loader-spinner"></div>
                <span>Загрузка...</span>
              </div>
            )}
            {!hasMore && courses.length > 0 && (
              <p className="end-message">Все курсы загружены ({courses.length})</p>
            )}
          </div>
        </>
      )}
      <ToastContainer toast={toast} onClose={closeToast} />
    </div>
  )
}

export default Courses
