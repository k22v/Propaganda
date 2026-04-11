import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { authApi } from '../api'
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
  const { theme, toggleTheme } = useTheme()
  const [loginData, setLoginData] = useState({ username: '', password: '', remember_me: false })
  const [loginError, setLoginError] = useState('')
  const [showLogin, setShowLogin] = useState(false)
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
            <img src="/blacklogo.png" alt="Logo" className="logo-img logo-dark" />
            <img src="/whitelogo.png" alt="Logo" className="logo-img logo-light" />
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
              <img src="/blacklogo.png" alt="Logo" className="footer-logo-img logo-dark" />
              <img src="/whitelogo.png" alt="Logo" className="footer-logo-img logo-light" />
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
              <a href="https://2gis.ru/khabarovsk/geo/4926447747626006" target="_blank" rel="noopener noreferrer" className="map-link">
                📍 Открыть карту
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
