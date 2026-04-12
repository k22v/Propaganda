import { Link } from 'react-router-dom'
import { useEffect, useState, useEffect as useEffectRef } from 'react'
import { coursesApi } from '../api'

function Landing() {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [continueCourses, setContinueCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [heroText, setHeroText] = useState(0)
  
  const heroTexts = ['Пропаганда ДВ', 'Обучение', 'Курсы']
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroText(prev => (prev + 1) % heroTexts.length)
    }, 1700)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
    if (token) {
      loadContinueCourses()
    }
  }, [])

  const loadContinueCourses = async () => {
    try {
      const { data } = await coursesApi.getMyCourses()
      const inProgress = data.filter(c => !c.is_completed).slice(0, 3)
      setContinueCourses(inProgress)
    } catch (e) {
      console.error('Error loading courses:', e)
    } finally {
      setLoadingCourses(false)
    }
  }

  if (isAuthenticated === null) return null

  return (
    <div className="landing-page">
      {isAuthenticated && continueCourses.length > 0 && !loadingCourses && (
        <section className="continue-section">
          <div className="continue-header">
            <h2>Продолжить обучение</h2>
            <Link to="/my-courses" className="see-all-link">Все курсы →</Link>
          </div>
          <div className="continue-grid">
            {continueCourses.map(course => (
              <Link key={course.id} to={`/courses/${course.id}`} className="continue-card">
                {course.cover_image ? (
                  <img src={course.cover_image} alt={course.title} />
                ) : (
                  <div className="continue-card-placeholder">📚</div>
                )}
                <div className="continue-card-content">
                  <h3>{course.title}</h3>
                  {course.progress !== undefined && (
                    <div className="continue-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{course.progress}%</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Онлайн-обучение</div>
          <h1 className="hero-title-animated">
            <span 
              key={heroText} 
              className="hero-title-text active"
            >
              {heroTexts[heroText]}
            </span>
          </h1>
          <p className="hero-subtitle">Образовательная платформа для развития и обучения. Изучайте новые навыки с экспертами</p>
          <div className="hero-actions">
            <Link to="/courses" className="btn btn-primary">Смотреть курсы</Link>
            {isAuthenticated ? (
              <Link to="/my-courses" className="btn btn-secondary">Мои курсы</Link>
            ) : (
              <Link to="/register" className="btn btn-outline">Начать обучение</Link>
            )}
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
            <div className="feature-icon">📚</div>
            <h3>Курсы</h3>
            <p>Обучающие материалы от экспертов в различных областях</p>
          </Link>
          <Link to="/courses" className="feature-card">
            <div className="feature-icon">📖</div>
            <h3>Уроки</h3>
            <p>Доступ к видеоурокам и материалам в любое время</p>
          </Link>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="cta">
          <div className="cta-content">
            <h2>Начните обучение сегодня</h2>
            <p>Присоединяйтесь к тысячам студентов на нашей платформе</p>
            <Link to="/register" className="btn btn-primary btn-lg">Зарегистрироваться</Link>
          </div>
        </section>
      )}
    </div>
  )
}

export default Landing