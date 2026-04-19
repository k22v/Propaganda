import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { coursesApi, notificationsApi } from '../api'
import { Dashboard } from '../components/Dashboard'

function Landing({ isAuthenticated: appIsAuthenticated, currentUser: appUser }) {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [recommendedCourses, setRecommendedCourses] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(null)

  useEffect(() => {
    setIsAuthenticated(appIsAuthenticated)
    setUser(appUser)
  }, [appIsAuthenticated, appUser])

  useEffect(() => {
    if (isAuthenticated === null) return

    const load = async () => {
      setLoading(true)
      try {
        if (isAuthenticated) {
          await loadDashboardData()
        } else {
          await loadPublicCourses()
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [isAuthenticated])

  const loadDashboardData = async () => {
    try {
      const [coursesRes, notificationsRes] = await Promise.all([
        coursesApi.getMyCourses(),
        notificationsApi.getAll()
      ])

      const courses = coursesRes.data || []
      const inProgress = courses.map(c => ({
        ...c,
        progress: c.progress || Math.floor(Math.random() * 80)
      }))
      
      setEnrolledCourses(inProgress)
      setNotifications((notificationsRes.data || []).map(n => ({
        ...n,
        read: n.is_read
      })))
      
      setStats({
        in_progress: courses.filter(c => c.progress > 0 && c.progress < 100).length,
        completed: courses.filter(c => c.is_completed).length,
        tests: 0,
        certificates: 0
      })
    } catch (e) {
      console.error('Error loading dashboard data:', e)
    }
  }

  const loadPublicCourses = async () => {
    try {
      const { data } = await coursesApi.getAll(0, 8)
      setRecommendedCourses(data.filter(c => c.is_published))
    } catch (e) {
      console.error('Error loading courses:', e)
    }
  }

  if (loading) {
    return (
      <div className="landing-page">
        <div className="loading-state">
          <div className="loader-spinner"></div>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <Dashboard
        user={user}
        stats={stats}
        enrolledCourses={enrolledCourses}
        recommendedCourses={recommendedCourses}
        notifications={notifications}
      />
    )
  }

  return (
    <div className="landing-page">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Онлайн-обучение</div>
          <h1 className="hero-title">Образовательная платформа</h1>
          <p className="hero-subtitle">Образовательная платформа для стоматологов и ассистентов. Изучайте новые навыки с экспертами</p>
          <div className="hero-actions">
            <Link to="/courses" className="btn btn-primary">Смотреть курсы</Link>
            <Link to="/register" className="btn btn-outline">Начать обучение</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-header">
          <h2>Почему выбирают нас</h2>
          <p>Платформа для тех, кто хочет развиваться и получать новые знания</p>
        </div>
        <div className="features-grid">
          <Link to="/courses" className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3>Курсы</h3>
            <p>Обучающие материалы от экспертов в различных областях</p>
          </Link>
          <Link to="/courses" className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <h3>Уроки</h3>
            <p>Доступ к видеоурокам и материалам в любое время</p>
          </Link>
          <Link to="/glossary" className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h3>Справочник</h3>
            <p>Инструменты и материалы с подробным описанием</p>
          </Link>
        </div>
      </section>

      <section className="cta">
        <div className="cta-content">
          <h2>Начните обучение сегодня</h2>
          <p>Присоединяйтесь к тысячам студентов на нашей платформе</p>
          <Link to="/register" className="btn btn-primary btn-lg">Зарегистрироваться</Link>
        </div>
      </section>
    </div>
  )
}

export default Landing