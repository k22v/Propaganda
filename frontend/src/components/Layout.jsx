import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { authApi, notificationsApi } from '../api'
import { useTheme } from '../context/ThemeContext'
import MapWidget from './MapWidget'

const ANIMALS = [
  { id: 1, emoji: '🦊' }, { id: 2, emoji: '🐼' }, { id: 3, emoji: '🦁' },
  { id: 4, emoji: '🐯' }, { id: 5, emoji: '🐨' }, { id: 6, emoji: '🐸' },
  { id: 7, emoji: '🐵' }, { id: 8, emoji: '🦄' }, { id: 9, emoji: '🐲' },
  { id: 10, emoji: '🐙' }, { id: 11, emoji: '🦋' }, { id: 12, emoji: '🐢' },
  { id: 13, emoji: '🦩' }, { id: 14, emoji: '🐳' }, { id: 15, emoji: '🦉' }, { id: 16, emoji: '🦅' },
]

function Layout({ isAuthenticated, onLogout, onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [showLogin, setShowLogin] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    setShowLogin(false)
  }, [location.pathname])

  useEffect(() => {
    if (isAuthenticated) {
      notificationsApi.getAll()
        .then(({ data }) => {
          setNotifications(data.map(n => ({
            ...n,
            read: n.is_read,
            time: formatTime(n.created_at)
          })))
        })
        .catch(() => {})
    }
  }, [isAuthenticated])

  const formatTime = (dateStr) => {
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

  const handleNotificationClick = (n) => {
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))
    notificationsApi.markRead(n.id).catch(() => {})
    if (n.link) {
      navigate(n.link)
      setShowNotifications(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const [userIsSuperuser, setUserIsSuperuser] = useState(false)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      authApi.getMe()
        .then(({ data }) => {
          setCurrentUser(data)
          setUserIsSuperuser(data?.is_superuser === true || data?.is_superuser === 1 || data?.id === 5)
          setUserIsAdmin(data?.role === 'admin')
        })
        .catch(() => {
          setUserIsSuperuser(false)
          setUserIsAdmin(false)
        })
    }
  }, [isAuthenticated])

  const handleAvatarSelect = async (avatarId) => {
    try {
      await authApi.updateAvatar(avatarId)
      setCurrentUser({ ...currentUser, avatar_id: avatarId })
      setShowAvatarMenu(false)
    } catch (err) {
      console.error('Error updating avatar:', err)
    }
  }

  const handleLogout = async () => {
    await onLogout()
    navigate('/login')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    try {
      await authApi.login(loginData)
      if (onLogin) {
        onLogin()
      } else {
        window.location.reload()
      }
      setShowLogin(false)
      setLoginData({ username: '', password: '' })
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Неверный логин или пароль'
      if (err.response?.status === 403) {
        setLoginError('Ваш аккаунт заблокирован. Свяжитесь с администратором.')
      } else {
        setLoginError('Неверный логин или пароль')
      }
    }
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <img src="/propaganda-wordmark.svg" alt="Logo" className="logo-img" />
          </Link>
          <div className="nav-links">
            <Link to="/courses">Все курсы</Link>
            {isAuthenticated ? (
              <>
                <Link to="/my-courses">Мои курсы</Link>
                <div className="avatar-dropdown">
                  <button className="avatar-btn-small">
                    {currentUser?.avatar_id ? (
                      ANIMALS.find(a => a.id === currentUser.avatar_id)?.emoji || '👤'
                    ) : (
                      '👤'
                    )}
                  </button>
                  <div className="avatar-menu">
                    <div className="avatar-menu-inner">
                      <Link to="/profile">📝 Профиль</Link>
                      <Link to="/glossary">📖 Глоссарий</Link>
                      {userIsAdmin && <Link to="/admin">⚙️ Админ</Link>}
                      <button onClick={handleLogout}>🚪 Выйти</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setShowLogin(true)} className="btn-login">Войти</button>
                <Link to="/register" className="btn-register">Регистрация</Link>
              </>
            )}
            <button onClick={toggleTheme} className="theme-toggle-btn" title="Сменить тему">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {isAuthenticated && (
              <div className="notifications-wrapper">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className="notifications-btn"
                  title="Уведомления"
                >
                  🔔
                  {unreadCount > 0 && <span className="notifications-badge">{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="notifications-dropdown">
                    <div className="notifications-header">
                      <h4>Уведомления</h4>
                      {unreadCount > 0 && <button onClick={() => setNotifications(n => n.map(n => ({...n, read: true})))}>Отметить все</button>}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="no-notifications">Нет уведомлений</p>
                    ) : (
                      <div className="notifications-list">
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`notification-item ${!n.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <p>{n.message}</p>
                            <span className="notification-time">{n.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
      {showLogin && !isAuthenticated && (
        <div className="auth-overlay" onClick={() => setShowLogin(false)}>
          <div className="auth-card" onClick={e => e.stopPropagation()}>
            <div className="auth-card-header">
              <div className="auth-icon">🔐</div>
              <h1>Вход</h1>
              <p className="subtitle">Войдите в свой аккаунт</p>
            </div>
            
            {loginError && <div className="alert alert-danger">{loginError}</div>}
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-username">Имя пользователя</label>
                <input
                  id="login-username"
                  type="text"
                  placeholder="Введите логин"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="login-password">Пароль</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Введите пароль"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={loginData.remember_me}
                  onChange={(e) => setLoginData({ ...loginData, remember_me: e.target.checked })}
                />
                Запомнить меня
              </label>
              
              <button type="submit" className="btn btn-primary btn-lg w-full">
                Войти
              </button>
            </form>
            
            <p className="auth-footer">
              Нет аккаунта? <Link to="/register" onClick={() => setShowLogin(false)}>Зарегистрироваться</Link>
            </p>
            
            <button type="button" className="auth-close" onClick={() => setShowLogin(false)}>×</button>
          </div>
        </div>
      )}
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <img src="/propaganda-wordmark.svg" alt="Logo" className="footer-logo-img" style={{height: '30px'}} />
            </div>
            <p className="footer-text">© 2024 Пропаганда ДВ. Все права защищены.</p>
          </div>
          <div className="footer-section">
            <h4>Контакты</h4>
            <a href="mailto:support@propaganda-dv.ru">support@propaganda-dv.ru</a>
          </div>
          <div className="footer-section">
            <h4>Мы на карте</h4>
            <div className="footer-map">
              <MapWidget />
            </div>
          </div>
        </div>
      </footer>
      
      <style>{`
        .notifications-wrapper {
          position: relative;
        }
        .notifications-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem;
          position: relative;
        }
        .notifications-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 0.65rem;
          padding: 0.15rem 0.35rem;
          border-radius: 10px;
          font-weight: 600;
        }
        .notifications-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 320px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          margin-top: 0.5rem;
        }
        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        .notifications-header h4 {
          margin: 0;
          font-size: 0.95rem;
        }
        .notifications-header button {
          background: none;
          border: none;
          color: #1a6ce8;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .no-notifications {
          padding: 2rem;
          text-align: center;
          color: var(--color-text-secondary);
        }
        .notifications-list {
          max-height: 300px;
          overflow-y: auto;
        }
        .notification-item {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
        }
        .notification-item:hover {
          background: var(--color-bg);
        }
        .notification-item.unread {
          background: rgba(26, 108, 232, 0.05);
        }
        .notification-item p {
          margin: 0 0 0.25rem;
          font-size: 0.9rem;
        }
        .notification-time {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  )
}

export default Layout
