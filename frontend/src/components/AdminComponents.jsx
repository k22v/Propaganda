import { Users, BookOpen, CheckCircle, FileText } from 'lucide-react'
import { Card, Badge, Button, DropdownMenu } from './ui/index.jsx'
import './AdminComponents.css'

export function AdminToolbar({ filters, onChange, onReset, onExport }) {
  return (
    <Card className="admin-toolbar" padding="md">
      <div className="toolbar-grid">
        <div className="toolbar-search">
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="toolbar-input"
          />
        </div>

        <select
          value={filters.role || ''}
          onChange={(e) => onChange({ ...filters, role: e.target.value })}
          className="toolbar-select"
        >
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="teacher">Преподаватель</option>
          <option value="student">Студент</option>
        </select>

        <select
          value={filters.specialization || ''}
          onChange={(e) => onChange({ ...filters, specialization: e.target.value })}
          className="toolbar-select"
        >
          <option value="">Все специализации</option>
          <option value="dentist">Стоматолог</option>
          <option value="assistant">Ассистент</option>
          <option value="technician">Техник</option>
          <option value="clinic_admin">Администратор клиники</option>
        </select>

        <select
          value={filters.is_active ?? ''}
          onChange={(e) => onChange({ 
            ...filters, 
            is_active: e.target.value === '' ? null : e.target.value === 'true' 
          })}
          className="toolbar-select"
        >
          <option value="">Все статусы</option>
          <option value="true">Активен</option>
          <option value="false">Заблокирован</option>
        </select>

        <div className="toolbar-actions">
          <Button variant="secondary" size="sm" onClick={onReset}>
            Сбросить
          </Button>
          <Button size="sm" onClick={onExport}>
            Экспорт
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function UsersTable({ users, isLoading, pagination, onPageChange, onDelete }) {
  if (isLoading) {
    return (
      <Card className="users-table-card" padding="none">
        <div className="table-loading">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="table-row-skeleton">
              <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              <div className="skeleton skeleton-text" style={{ width: '15%' }} />
              <div className="skeleton skeleton-text" style={{ width: '20%' }} />
              <div className="skeleton skeleton-text" style={{ width: '10%' }} />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (!users || users.length === 0) {
    return (
      <Card className="users-table-card" padding="lg">
        <div className="table-empty">
          <span>👥</span>
          <p>Пользователи не найдены</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="users-table-card" padding="none">
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Роль</th>
                <th>Специализация</th>
                <th>Статус</th>
                <th>Активность</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{user.username}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={getRoleVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </td>
                  <td>
                    <span className="user-specialty">
                      {getSpecialtyLabel(user.specialization) || '-'}
                    </span>
                  </td>
                  <td>
                    <Badge variant={user.is_active ? 'success' : 'danger'}>
                      {user.is_active ? 'Активен' : 'Заблокирован'}
                    </Badge>
                  </td>
                  <td>
                    <span className="user-activity">
                      {formatLastActive(user.last_login)}
                    </span>
                  </td>
                  <td>
                    <UserRowActions 
                      user={user} 
                      onDelete={onDelete ? () => onDelete(user.id) : undefined} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {pagination && pagination.total_pages > 1 && (
        <div className="pagination">
          <Button 
            variant="secondary" 
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            ←
          </Button>
          
          <span className="pagination-info">
            Страница {pagination.page} из {pagination.total_pages}
          </span>
          
          <Button 
            variant="secondary" 
            size="sm"
            disabled={pagination.page >= pagination.total_pages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            →
          </Button>
        </div>
      )}
    </>
  )
}

export function UserRowActions({ user, onEdit, onBlock, onDelete, onResetPassword }) {
  const items = [
    { label: 'Редактировать', onClick: () => onEdit?.(user) },
    { label: 'Изменить роль', onClick: () => {} },
    { 
      label: user.is_active ? 'Заблокировать' : 'Разблокировать', 
      onClick: () => onBlock?.(user) 
    },
    { label: 'Сбросить пароль', onClick: () => onResetPassword?.(user) },
    { label: 'Удалить', danger: true, onClick: () => onDelete?.(user) },
  ]

  return (
    <DropdownMenu
      trigger={<Button variant="ghost" size="sm">⋯</Button>}
      items={items}
    />
  )
}

export function AdminStatsRow({ stats }) {
  const items = [
    { label: 'Пользователей', value: stats?.users_count || 0, icon: Users, color: '#3b82f6' },
    { label: 'Курсов', value: stats?.courses_count || 0, icon: BookOpen, color: '#8b5cf6' },
    { label: 'Активных', value: stats?.active_users || 0, icon: CheckCircle, color: '#10b981' },
    { label: 'Тестов пройдено', value: stats?.tests_completed || 0, icon: FileText, color: '#f59e0b' },
  ]

  return (
    <div className="admin-stats-row">
      {items.map(item => (
        <Card key={item.label} className="admin-stat-card" padding="md">
          <span className="stat-icon" style={{ color: item.color }}><item.icon size={24} /></span>
          <div className="stat-info">
            <span className="stat-value">{item.value}</span>
            <span className="stat-label">{item.label}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}

function getRoleLabel(role) {
  const labels = {
    admin: 'Администратор',
    teacher: 'Преподаватель',
    student: 'Студент',
  }
  return labels[role] || role
}

function getRoleVariant(role) {
  const variants = {
    admin: 'danger',
    teacher: 'warning',
    student: 'default',
  }
  return variants[role] || 'default'
}

function getSpecialtyLabel(specialization) {
  const labels = {
    dentist: 'Стоматолог',
    assistant: 'Ассистент',
    technician: 'Техник',
    clinic_admin: 'Администратор',
  }
  return labels[specialization] || specialization
}

function formatLastActive(dateStr) {
  if (!dateStr) return 'Никогда'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Только что'
  if (diffMins < 60) return `${diffMins} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays < 7) return `${diffDays} дн. назад`
  return date.toLocaleDateString('ru')
}