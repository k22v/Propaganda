import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { ToastContainer, useToast } from '../components/Toast'
import { Card, Badge, Button, ProgressBar, Avatar, Tabs } from '../components/ui/index.jsx'
import { ProfileSidebar, ProfileStatsGrid, ActivityFeed } from '../components/ProfileComponents'
import './Profile.css'

const ANIMALS = [
  { id: 1, emoji: '🦊', name: 'Лиса' },
  { id: 2, emoji: '🐼', name: 'Панда' },
  { id: 3, emoji: '🦁', name: 'Лев' },
  { id: 4, emoji: '🐯', name: 'Тигр' },
  { id: 5, emoji: '🐨', name: 'Коала' },
  { id: 6, emoji: '🐸', name: 'Лягушка' },
  { id: 7, emoji: '🐵', name: 'Обезьяна' },
  { id: 8, emoji: '🦄', name: 'Единорог' },
  { id: 9, emoji: '🐲', name: 'Дракон' },
  { id: 10, emoji: '🐙', name: 'Осьминог' },
  { id: 11, emoji: '🦋', name: 'Бабочка' },
  { id: 12, emoji: '🐢', name: 'Черепаха' },
  { id: 13, emoji: '🦩', name: 'Фламинго' },
  { id: 14, emoji: '🐳', name: 'Кит' },
  { id: 15, emoji: '🦉', name: 'Сова' },
  { id: 16, emoji: '🦅', name: 'Орел' },
]

const TABS = [
  { id: 'profile', label: 'Профиль' },
  { id: 'activity', label: 'Активность' },
]

function Profile() {
  const navigate = useNavigate()
  const { toast, showToast, closeToast } = useToast()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('profile')
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [fullName, setFullName] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' })
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    loadUser()
    loadStats()
  }, [])

  const loadUser = async () => {
    try {
      const { data } = await authApi.getMe()
      setUser(data)
      setSelectedAvatar(data.avatar_id)
      setFullName(data.full_name || '')
    } catch {
      showToast('Ошибка загрузки профиля', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data } = await authApi.getProfileStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats', err)
    }
  }

  const handleSave = async () => {
    try {
      if (fullName !== (user.full_name || '')) {
        await authApi.updateProfile({ full_name: fullName })
      }
      if (selectedAvatar !== user.avatar_id) {
        await authApi.updateAvatar(selectedAvatar)
      }
      showToast('Профиль сохранён', 'success')
      setEditing(false)
      loadUser()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Ошибка сохранения', 'error')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordData.newPass !== passwordData.confirm) {
      showToast('Пароли не совпадают', 'error')
      return
    }
    if (passwordData.newPass.length < 6) {
      showToast('Пароль должен быть минимум 6 символов', 'error')
      return
    }
    try {
      await authApi.changePassword({
        current_password: passwordData.current,
        new_password: passwordData.newPass
      })
      showToast('Пароль успешно изменён', 'success')
      setPasswordData({ current: '', newPass: '', confirm: '' })
      setShowPasswordForm(false)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Ошибка смены пароля', 'error')
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="loader-spinner"></div>
        </div>
      </div>
    )
  }

  const activities = stats?.reviews?.map(r => ({
    id: r.id,
    type: 'comment_added',
    message: `Оставлен отзыв: ${r.course_title}`,
    created_at: r.created_at
  })) || []

  return (
    <div className="profile-page">
      <ToastContainer toast={toast} onClose={closeToast} />
      
      <div className="profile-layout">
        <div className="profile-left">
          <ProfileSidebar 
            user={user} 
            onEdit={() => setEditing(true)}
            onPassword={() => setShowPasswordForm(!showPasswordForm)}
          />
        </div>

        <div className="profile-right">
          <Tabs tabs={TABS} activeTab={selectedTab} onChange={setSelectedTab} />

          {selectedTab === 'profile' && (
            <>
              <Card className="profile-details-card" padding="lg">
                <div className="profile-details-header">
                  <h2>Личные данные</h2>
                  {!editing ? (
                    <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                      Редактировать
                    </Button>
                  ) : (
                    <div className="edit-actions">
                      <Button size="sm" onClick={handleSave}>Сохранить</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Отмена</Button>
                    </div>
                  )}
                </div>

                <div className="profile-details-grid">
                  <div className="detail-item">
                    <label>Имя пользователя</label>
                    <span>{user?.username}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Полное имя</label>
                    {editing ? (
                      <input 
                        type="text" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        className="form-input"
                      />
                    ) : (
                      <span>{user?.full_name || 'Не указано'}</span>
                    )}
                  </div>

                  <div className="detail-item">
                    <label>Email</label>
                    <span>{user?.email}</span>
                  </div>

                  <div className="detail-item">
                    <label>Специализация</label>
                    <Badge variant="primary">{getSpecialtyLabel(user?.specialization) || 'Не выбрана'}</Badge>
                  </div>

                  <div className="detail-item">
                    <label>Роль</label>
                    <Badge variant={user?.role === 'admin' ? 'danger' : 'default'}>
                      {getRoleLabel(user?.role)}
                    </Badge>
                  </div>
                </div>
              </Card>

              <ProfileStatsGrid stats={stats} />

              {showPasswordForm && (
                <Card className="password-card" padding="lg">
                  <h3>Смена пароля</h3>
                  <form onSubmit={handleChangePassword} className="password-form">
                    <div className="form-group">
                      <label>Текущий пароль</label>
                      <input
                        type="password"
                        value={passwordData.current}
                        onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Новый пароль</label>
                      <input
                        type="password"
                        value={passwordData.newPass}
                        onChange={(e) => setPasswordData({...passwordData, newPass: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Подтвердите пароль</label>
                      <input
                        type="password"
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <Button type="submit">Сохранить пароль</Button>
                      <Button variant="ghost" type="button" onClick={() => setShowPasswordForm(false)}>
                        Отмена
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              <Card className="avatar-card" padding="lg">
                <h3>Выберите аватар</h3>
                <div className="avatar-selection">
                  {ANIMALS.map(animal => (
                    <button
                      key={animal.id}
                      className={`avatar-btn ${selectedAvatar === animal.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedAvatar(animal.id)
                        setEditing(true)
                      }}
                      title={animal.name}
                    >
                      {animal.emoji}
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}

          {selectedTab === 'activity' && (
            <ActivityFeed activities={activities} />
          )}
        </div>
      </div>
    </div>
  )
}

function getSpecialtyLabel(specialization) {
  const labels = {
    dentist: 'Стоматолог',
    assistant: 'Ассистент',
    technician: 'Техник',
    clinic_admin: 'Администратор клиники',
  }
  return labels[specialization] || specialization
}

function getRoleLabel(role) {
  const labels = {
    admin: 'Администратор',
    teacher: 'Преподаватель',
    student: 'Студент',
  }
  return labels[role] || role
}

export default Profile