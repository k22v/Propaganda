import { BookOpen, CheckCircle, Award, FileText, Edit, Lock } from 'lucide-react'
import { Card, Avatar, Button, Badge } from './ui/index.jsx'
import './ProfileSidebar.css'

export function ProfileSidebar({ user, onEdit, onPassword }) {
  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: 'Администратор', variant: 'danger' },
      teacher: { label: 'Преподаватель', variant: 'warning' },
      student: { label: 'Студент', variant: 'default' },
    }
    return badges[role] || badges.student
  }

  const role = getRoleBadge(user?.role)

  return (
    <Card className="profile-sidebar" padding="lg">
      <div className="profile-avatar-section">
        <Avatar name={user?.full_name || user?.username} size="xl" />
        <h2 className="profile-username">{user?.full_name || user?.username}</h2>
        <span className="profile-username-small">@{user?.username}</span>
        <Badge variant={role.variant} size="md">
          {role.label}
        </Badge>
      </div>

      <div className="profile-info">
        <div className="profile-info-item">
          <span className="profile-info-label">Email</span>
          <span className="profile-info-value">{user?.email}</span>
        </div>
        
        <div className="profile-info-item">
          <span className="profile-info-label">Специализация</span>
          <span className="profile-info-value">
            {getSpecialtyLabel(user?.specialization) || 'Не выбрана'}
          </span>
        </div>

        <div className="profile-info-item">
          <span className="profile-info-label">Участник с</span>
          <span className="profile-info-value">
            {user?.created_at ? formatDate(user.created_at) : '-'}
          </span>
        </div>
      </div>

      <div className="profile-actions">
        <Button onClick={onEdit} className="w-full">
          Редактировать профиль
        </Button>
        <Button variant="secondary" onClick={onPassword} className="w-full">
          Сменить пароль
        </Button>
      </div>
    </Card>
  )
}

function getSpecialtyLabel(specialization) {
  const labels = {
    dentist: 'Стоматолог',
    assistant: 'Ассистент',
    technician: 'Зубной техник',
    clinic_admin: 'Администратор клиники',
  }
  return labels[specialization] || specialization
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function ProfileStatsGrid({ stats }) {
  const items = [
    { label: 'Курсов', value: stats?.courses_count || 0, icon: BookOpen, color: '#3b82f6' },
    { label: 'Завершено', value: stats?.completed_count || 0, icon: CheckCircle, color: '#10b981' },
    { label: 'Сертификатов', value: stats?.certificates_count || 0, icon: Award, color: '#f59e0b' },
    { label: 'Тестов', value: stats?.tests_count || 0, icon: FileText, color: '#8b5cf6' },
  ]

  return (
    <div className="stats-grid-profile">
      {items.map(item => (
        <Card key={item.label} className="stat-item" padding="md">
          <span className="stat-icon" style={{ color: item.color }}><item.icon size={24} /></span>
          <div className="stat-content">
            <span className="stat-value">{item.value}</span>
            <span className="stat-label">{item.label}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function ActivityFeed({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <Card padding="md">
        <h3 className="section-title">Последняя активность</h3>
        <div className="empty-activity">
          <span>📋</span>
          <p>Нет активности</p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="md">
      <h3 className="section-title">Последняя активность</h3>
      <div className="activity-list">
        {activities.map(activity => (
          <div key={activity.id} className="activity-item">
            <span className="activity-icon">{getActivityIcon(activity.type)}</span>
            <div className="activity-content">
              <p className="activity-text">{activity.message}</p>
              <span className="activity-time">{formatTimeAgo(activity.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function getActivityIcon(type) {
  const icons = {
    lesson_completed: '📖',
    quiz_passed: '✅',
    course_enrolled: '📚',
    certificate_earned: '🏆',
    comment_added: '💬',
  }
  return icons[type] || '📌'
}

function formatTimeAgo(dateStr) {
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