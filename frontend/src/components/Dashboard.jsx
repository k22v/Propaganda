import { Link } from 'react-router-dom'
import './Dashboard.css'

const KPI_CARDS = [
  { key: 'in_progress', icon: '📚', label: 'В процессе', value: 0 },
  { key: 'completed', icon: '✅', label: 'Завершено', value: 0 },
  { key: 'tests', icon: '📝', label: 'Тестов', value: 0 },
  { key: 'certificates', icon: '🏆', label: 'Сертификатов', value: 0 },
]

function StatsCharts({ stats }) {
  const cards = KPI_CARDS.map(c => ({
    ...c,
    value: stats?.[c.key] ?? c.value
  }))

  return (
    <div className="stats-grid">
      {cards.map(card => (
        <div key={card.key} className="stat-card">
          <span className="stat-icon">{card.icon}</span>
          <div className="stat-content">
            <span className="stat-value">{card.value}</span>
            <span className="stat-label">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ContinueLearning({ courses }) {
  if (!courses || courses.length === 0) {
    return (
      <div className="dashboard-section">
        <h2 className="section-title">Продолжить обучение</h2>
        <div className="empty-state-card">
          <span className="empty-icon">📚</span>
          <p>У вас пока нет активных курсов</p>
          <Link to="/courses" className="btn btn-primary">Выбрать курс</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title">Продолжить обучение</h2>
        <Link to="/my-courses" className="section-link">Все →</Link>
      </div>
      <div className="courses-grid">
        {courses.slice(0, 3).map(course => (
          <Link key={course.id} to={`/courses/${course.id}`} className="course-card-dashboard">
            <div className="course-cover" style={{ backgroundColor: getCourseColor(course.specialization) }}>
              <span className="course-specialty-badge">{getSpecialtyLabel(course.specialization)}</span>
            </div>
            <div className="course-info">
              <h3 className="course-title">{course.title}</h3>
              <div className="course-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${course.progress || 0}%` }} />
                </div>
                <span className="progress-text">{course.progress || 0}%</span>
              </div>
              <div className="course-meta">
                <span>{course.lessons_count || 0} уроков</span>
                {course.next_lesson && <span>След: {course.next_lesson}</span>}
              </div>
            </div>
            <button className="btn btn-primary course-action">Продолжить</button>
          </Link>
        ))}
      </div>
    </div>
  )
}

function NotificationsPanel({ notifications }) {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="notifications-panel">
        <h3 className="panel-title">Уведомления</h3>
        <div className="empty-notifications">
          <span>🔔</span>
          <p>Нет новых уведомлений</p>
        </div>
      </div>
    )
  }

  return (
    <div className="notifications-panel">
      <h3 className="panel-title">Уведомления</h3>
      <div className="notifications-list">
        {notifications.slice(0, 5).map(n => (
          <div key={n.id} className={`notification-item ${n.is_read ? '' : 'unread'}`}>
            <span className="notification-icon">{getNotificationIcon(n.type)}</span>
            <div className="notification-content">
              <p className="notification-message">{n.message}</p>
              <span className="notification-time">{formatTime(n.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecommendedCourses({ courses }) {
  if (!courses || courses.length === 0) return null

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title">Рекомендованные курсы</h2>
        <Link to="/courses" className="section-link">Все →</Link>
      </div>
      <div className="recommended-grid">
        {courses.slice(0, 4).map(course => (
          <Link key={course.id} to={`/courses/${course.id}`} className="recommended-card">
            <div className="course-cover" style={{ backgroundColor: getCourseColor(course.specialization) }}>
              <span className="course-specialty-badge">{getSpecialtyLabel(course.specialization)}</span>
            </div>
            <h4>{course.title}</h4>
            <p>{course.description?.slice(0, 80)}...</p>
            <span className="course-lessons">{course.lessons_count || 0} уроков</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Dashboard({ user, stats, enrolledCourses, recommendedCourses, notifications, onContinueLast }) {
  const greeting = getGreeting()
  const inProgressCount = enrolledCourses?.filter(c => c.progress > 0 && c.progress < 100).length || 0
  const pendingTests = stats?.pending_tests || 0

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="greeting-section">
          <h1>{greeting}, {user?.full_name || user?.username || 'Студент'}</h1>
          <p>
            У вас {inProgressCount} курсов в процессе
            {pendingTests > 0 && `, ${pendingTests} тест ожидает прохождения`}
          </p>
        </div>
        {enrolledCourses?.length > 0 && (
          <button className="btn btn-primary btn-continue" onClick={onContinueLast}>
            Продолжить последний урок →
          </button>
        )}
      </div>

      <StatsCharts stats={stats} />
      <ContinueLearning courses={enrolledCourses} />

      <div className="dashboard-grid">
        <NotificationsPanel notifications={notifications} />
        <RecommendedCourses courses={recommendedCourses} />
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function getSpecialtyLabel(specialization) {
  const labels = {
    dentist: 'Стоматолог',
    assistant: 'Ассистент',
    technician: 'Техник',
    clinic_admin: 'Админ'
  }
  return labels[specialization] || specialization || ''
}

function getCourseColor(specialization) {
  const colors = {
    dentist: '#3b82f6',
    assistant: '#10b981',
    technician: '#f59e0b',
    clinic_admin: '#8b5cf6'
  }
  return colors[specialization] || '#6366f1'
}

function getNotificationIcon(type) {
  const icons = {
    enrollment: '📚',
    quiz_passed: '✅',
    quiz_failed: '❌',
    certificate: '🏆',
    comment: '💬',
    course_published: '📢',
    system: '⚙️'
  }
  return icons[type] || '🔔'
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 60) return `${diffMins} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays < 7) return `${diffDays} дн. назад`
  return date.toLocaleDateString('ru')
}

export { Dashboard, StatsCharts, ContinueLearning, NotificationsPanel, RecommendedCourses }