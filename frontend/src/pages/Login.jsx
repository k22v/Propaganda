import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, User } from 'lucide-react'
import { authApi } from '../api'
import { Card, Button } from '../components/ui/index.jsx'

function Login() {
  const [form, setForm] = useState({ username: '', password: '', remember_me: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.login({ username: form.username, password: form.password, remember_me: form.remember_me })
      window.location.href = '/'
    } catch (err) {
      setLoading(false)
      setError(err.response?.data?.detail || 'Неверный логин или пароль')
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem',
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    }}>
      <Card padding="lg" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Lock size={28} color="white" />
          </div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>Вход</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Войдите в свой аккаунт</p>
        </div>
        
        {error && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Имя пользователя
            </label>
            <input
              type="text"
              placeholder="Введите логин"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                border: '1px solid var(--color-border)', 
                borderRadius: '10px', 
                fontSize: '0.95rem',
                background: 'var(--color-background)'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Пароль
            </label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                border: '1px solid var(--color-border)', 
                borderRadius: '10px', 
                fontSize: '0.95rem',
                background: 'var(--color-background)'
              }}
            />
          </div>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '1.5rem', 
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)'
          }}>
            <input
              type="checkbox"
              checked={form.remember_me}
              onChange={(e) => setForm({ ...form, remember_me: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            Запомнить меня
          </label>
          
          <Button type="submit" size="lg" className="w-full btn-primary" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
        
        <p style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          fontSize: '0.875rem', 
          color: 'var(--color-text-secondary)' 
        }}>
          Нет аккаунта? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Зарегистрироваться</Link>
        </p>
      </Card>
    </div>
  )
}

export default Login
