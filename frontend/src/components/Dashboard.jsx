import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, ClipboardList, Award, Bell, ChevronRight, Play } from 'lucide-react'
import { Card, Badge, Button, ProgressBar } from './ui/index.jsx'
import { CourseCard, CourseGrid } from './CourseComponents'
import './Dashboard.css'

const KPI_CARDS = [
  { key: 'in_progress', icon: BookOpen, label: 'В процессе', color: '#3b82f6' },
  { key: 'completed', icon: CheckCircle2, label: 'Завершено', color: '#10b981' },
  { key: 'tests', icon: ClipboardList, label: 'Тестов', color: '#f59e0b' },
  { key: 'certificates', icon: Award, label: 'Сертификатов', color: '#8b5cf6' },
]

function StatsGrid({ stats }) {
  const cards = KPI_CARDS.map(c => ({
    ...c,
    value: stats?.[c.key] ?? 0
  }))

  return (
    <div className="stats-grid">
      {cards.map(card => (
        <Card key={card.key} className="stat-card" padding="md">
          <div className="stat-icon-wrapper" style={{ backgroundColor: `${card.color}15` }}>
            <card.icon size={24} style={{ color: card.color }} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{card.value}</span>
            <span className="stat-label">{card.label}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ContinueLearning({ courses, onOpen }) {
  if (!courses || courses.length === 0) {
    return (
      <Card padding="lg">
        <div className="dashboard-section">
          <h2 className="section-title">Продолжить обучение</h2>
          <div className="empty-state-card">
            <BookOpen size={48} className="empty-icon" />
            <p>У вас пока нет активных курсов</p>
            <Link to="/courses" className="btn btn-primary">Выбрать курс</Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title">Продолжить обучение</h2>
        <Link to="/my-courses" className="section-link">
          Все <ChevronRight size={16} />
        </Link>
      </div>
      <div className="courses-grid">
        {courses.slice(0, 3).map(course => (
          <Card key={course.id} className="course-card-dashboard" padding="none">
            <div className="course-cover" style={{ backgroundColor: getCourseColor(course.specialization) }}>
              <span className="course-specialty-badge">{getSpecialtyLabel(course.specialization)}</span>
            </div>
            <div className="course-info">
              <h3 className="course-title">{course.title}</h3>
              <div className="course-progress">
                <ProgressBar value={course.progress || 0} size="sm" />
                <span className="progress-text">{course.progress || 0}%</span>
              </div>
              <div className="course-meta">
                <span>{course.lessons_count || 0} уроков</span>
                {course.next_lesson && <span>След: {course.next_lesson}</span>}
              </div>
            </div>
            <div className="course-card-footer">
              <Button onClick={() => onOpen?.(course)} className="btn-block">
                <Play size={16} /> Продолжить
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function NotificationsPanel({ notifications }) {
  if (!notifications || notifications.length === 0) {
    return (
      <Card padding="lg">
        <h3 className="panel-title">
          <Bell size={18} /> Уведомления
        </h3>
        <div className="empty-notifications">
          <Bell size={32} />
          <p>Нет новых уведомлений</p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="md">
      <h3 className="panel-title">
        <Bell size={18} /> Уведомления
      </h3>
      <div className="notifications-list">
        {notifications.slice(0, 5).map(n => (
          <div key={n.id} className={`notification-item ${n.is_read ? '' : 'unread'}`}>
            <div className="notification-icon">
              {getNotificationIcon(n.type)}
            </div>
            <div className="notification-content">
              <p className="notification-message">{n.message}</p>
              <span className="notification-time">{formatTime(n.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function RecommendedCourses({ courses }) {
  if (!courses || courses.length === 0) return null

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title">Рекомендованные курсы</h2>
        <Link to="/courses" className="section-link">
          Все <ChevronRight size={16} />
        </Link>
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

function UpcomingPanel() {
  const items = [
    { text: 'Вебинар: Имплантация — сегодня в 19:00', time: 'today' },
    { text: 'Дедлайн теста по асептике — через 2 дня', time: 'soon' },
    { text: 'Новый модуль добавлен в ваш курс', time: 'new' },
  ]

  return (
    <Card padding="md">
      <h3 className="panel-title">
        <Bell size={18} /> Ближайшее
      </h3>
      <div className="mt-4 space-y-3 text-sm text-gray-600">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {item.text}
          </div>
        ))}
      </div>
    </Card>
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
          <Button onClick={onContinueLast}>
            <Play size={16} /> Продолжить последний урок
          </Button>
        )}
      </div>

      <StatsGrid stats={stats} />
      <ContinueLearning courses={enrolledCourses} onOpen={(course) => console.log('open course', course.id)} />

      <div className="dashboard-grid">
        <NotificationsPanel notifications={notifications} />
        <UpcomingPanel />
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

export { Dashboard, StatsGrid, ContinueLearning, NotificationsPanel, RecommendedCourses }
