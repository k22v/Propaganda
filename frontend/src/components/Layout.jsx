import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, Bell, User, BookOpen, LogOut, Settings, Menu, X } from 'lucide-react'
import { authApi, notificationsApi } from '../api'
import { useTheme } from '../context/ThemeContext'
import MapWidget from './MapWidget'
import './Layout.css'

const ANIMALS = [
  { id: 1, emoji: '🦊' }, { id: 2, emoji: '🐼' }, { id: 3, emoji: '🦁' },
  { id: 4, emoji: '🐯' }, { id: 5, emoji: '🐨' }, { id: 6, emoji: '🐸' },
  { id: 7, emoji: '🐵' }, { id: 8, emoji: '🦄' }, { id: 9, emoji: '🐲' },
  { id: 10, emoji: '🐙' }, { id: 11, emoji: '🦋' }, { id: 12, emoji: '🐢' },
  { id: 13, emoji: '🦩' }, { id: 14, emoji: '🐳' }, { id: 15, emoji: '🦉' }, { id: 16, emoji: '🦅' },
]

function Layout({ isAuthenticated, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [showLogin, setShowLogin] = useState(false)
  const [loginData, setLoginData] = useState({ username: '', password: '', remember_me: false })
  const [loginError, setLoginError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const avatarMenuRef = useRef(null)
  const notificationsRef = useRef(null)

  useEffect(() => {
    setShowLogin(false)
    setMobileMenuOpen(false)
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
    } else {
      setNotifications([])
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      authApi.getMe()
        .then(({ data }) => {
          setCurrentUser(data)
          setUserIsAdmin(data?.role === 'admin' || data?.is_superuser)
        })
        .catch(() => {
          setUserIsAdmin(false)
        })
    } else {
      setCurrentUser(null)
      setUserIsAdmin(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    function handleClickOutside(event) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
        setShowAvatarMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const handleLogout = async () => {
    await onLogout()
    navigate('/login')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    try {
      await authApi.login(loginData)
      window.location.reload()
      setShowLogin(false)
      setLoginData({ username: '', password: '' })
    } catch (err) {
      if (err.response?.status === 403) {
        setLoginError('Ваш аккаунт заблокирован. Свяжитесь с администратором.')
      } else {
        setLoginError('Неверный логин или пароль')
      }
    }
  }

  const getAvatarEmoji = () => {
    if (currentUser?.avatar_id) {
      return ANIMALS.find(a => a.id === currentUser.avatar_id)?.emoji || '👤'
    }
    return '👤'
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <img src="/propaganda-wordmark.svg" alt="Logo" className="logo-img" />
          </Link>

          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`nav-links ${mobileMenuOpen ? 'nav-links-open' : ''}`}>
            <Link to="/courses" className="nav-link">
              <BookOpen size={18} />
              <span>Все курсы</span>
            </Link>
            
            {isAuthenticated && (
              <Link to="/my-courses" className="nav-link">
                <span>Мои курсы</span>
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                <div className="avatar-dropdown" ref={avatarMenuRef}>
                  <button 
                    className="avatar-btn-small"
                    onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                  >
                    <span className="avatar-emoji">{getAvatarEmoji()}</span>
                  </button>
                  {showAvatarMenu && (
                    <div className="avatar-menu">
                      <div className="avatar-menu-header">
                        <span className="avatar-name">{currentUser?.full_name || currentUser?.username}</span>
                        <span className="avatar-email">{currentUser?.email}</span>
                      </div>
                      <div className="avatar-menu-items">
                        <Link to="/profile" className="menu-item">
                          <User size={16} />
                          Профиль
                        </Link>
                        {userIsAdmin && (
                          <Link to="/admin" className="menu-item">
                            <Settings size={16} />
                            Админ-панель
                          </Link>
                        )}
                        <button onClick={handleLogout} className="menu-item menu-item-danger">
                          <LogOut size={16} />
                          Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setShowLogin(true)} className="btn btn-secondary btn-sm">
                  Войти
                </button>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Регистрация
                </Link>
              </>
            )}
            
            <button onClick={toggleTheme} className="theme-toggle-btn" title="Сменить тему">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {isAuthenticated && (
              <div className="notifications-wrapper" ref={notificationsRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className="notifications-btn"
                  title="Уведомления"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notifications-badge">{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="notifications-dropdown">
                    <div className="notifications-header">
                      <h4>Уведомления</h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={async () => {
                            try {
                              await notificationsApi.markAllRead()
                              setNotifications(n => n.map(n => ({...n, read: true})))
                            } catch (err) {
                              console.error('Error marking all as read:', err)
                            }
                          }}
                          className="mark-all-btn"
                        >
                          Отметить все
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="no-notifications">
                        <Bell size={32} />
                        <p>Нет уведомлений</p>
                      </div>
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
            
            <button type="button" className="auth-close" onClick={() => setShowLogin(false)}>
              <X size={24} />
            </button>
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
              <img src="/propaganda-wordmark.svg" alt="Logo" className="footer-logo-img" />
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
    </div>
  )
}

export default Layout
