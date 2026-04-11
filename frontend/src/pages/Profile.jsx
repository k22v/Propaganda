import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { ToastContainer, useToast, withToastHandler } from '../components/Toast'

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

const SPECIALIZATIONS = [
  { value: '', label: 'Не выбрана' },
  { value: 'dentist', label: 'Стоматолог' },
  { value: 'assistant', label: 'Ассистент стоматолога' },
  { value: 'hygienist', label: 'Гигиенист' },
  { value: 'technician', label: 'Зубной техник' },
  { value: 'clinic_admin', label: 'Администратор клиники' },
]

function Profile() {
  const navigate = useNavigate()
  const { toast, showToast, closeToast } = useToast()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [fullName, setFullName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' })

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { data } = await authApi.getMe()
      setUser(data)
      setSelectedAvatar(data.avatar_id)
      setFullName(data.full_name || '')
      setSpecialization(data.specialization || '')
    } catch (err) {
      showToast('Ошибка загрузки профиля', 'error')
    } finally {
      setLoading(false)
    }
  }

  const wrappedApi = withToastHandler({
    saveProfile: async () => {
      const hasNameChanged = fullName !== (user.full_name || '')
      const hasSpecChanged = specialization !== (user.specialization || '')
      const hasAvatarChanged = selectedAvatar !== user.avatar_id

      if (!hasNameChanged && !hasSpecChanged && !hasAvatarChanged) {
        showToast('Нечего сохранять', 'info')
        return
      }

      if (hasSpecChanged || hasNameChanged) {
        await authApi.updateProfile({
          full_name: fullName,
          specialization: specialization
        })
      }

      if (hasAvatarChanged) {
        await authApi.updateAvatar(selectedAvatar)
      }

      showToast('Профиль сохранён', 'success')
      loadUser()
    }
  }, showToast)

  const handleSave = () => wrappedApi.saveProfile()

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

  if (loading) return <div className="loading">Загрузка...</div>

  return (
    <div className="profile-page">
      <ToastContainer toast={toast} onClose={closeToast} />
      <div className="profile-card">
        <h1>Профиль</h1>
        
        <div className="profile-avatar-large">
          {selectedAvatar ? (
            ANIMALS.find(a => a.id === selectedAvatar)?.emoji || '👤'
          ) : (
            '👤'
          )}
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>Имя пользователя</label>
            <input type="text" value={user?.username} disabled />
          </div>
          
          <div className="form-group">
            <label>Полное имя</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Введите ваше имя"
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user?.email} disabled />
          </div>

          <div className="form-group">
            <label>Специализация</label>
            <select value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
              {SPECIALIZATIONS.map(spec => (
                <option key={spec.value} value={spec.value}>{spec.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Роль</label>
            <input 
              type="text" 
              value={user?.role === 'admin' ? 'Администратор' : user?.role === 'teacher' ? 'Преподаватель' : 'Студент'} 
              disabled 
            />
          </div>
        </div>

        <div className="password-section">
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? 'Отмена' : '🔒 Сменить пароль'}
          </button>
          
          {showPasswordForm && (
            <form className="password-form" onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Текущий пароль</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Новый пароль</label>
                <input
                  type="password"
                  value={passwordData.newPass}
                  onChange={(e) => setPasswordData({...passwordData, newPass: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Подтвердите пароль</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Сохранить пароль</button>
            </form>
          )}
        </div>

        <div className="avatar-selection">
          <h3>Выберите аватар</h3>
          <div className="avatar-grid">
            {ANIMALS.map(animal => (
              <button
                key={animal.id}
                className={`avatar-btn ${selectedAvatar === animal.id ? 'selected' : ''}`}
                onClick={() => setSelectedAvatar(animal.id)}
                title={animal.name}
              >
                {animal.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="profile-actions">
          <button onClick={handleSave} className="btn btn-primary">
            Сохранить
          </button>
          <button onClick={() => navigate('/my-courses')} className="btn btn-secondary">
            Назад к курсам
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
