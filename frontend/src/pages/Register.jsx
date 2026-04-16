import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Stethoscope } from 'lucide-react'
import { authApi } from '../api'
import { Card, Button } from '../components/ui/index.jsx'

function Register() {
  const [form, setForm] = useState({ 
    email: '', 
    username: '', 
    password: '', 
    full_name: '', 
    specialization: '' 
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const specializations = [
    { value: 'dentist', label: 'Врач-стоматолог' },
    { value: 'assistant', label: 'Ассистент стоматолога' },
    { value: 'technician', label: 'Зубной техник' },
    { value: 'clinic_admin', label: 'Администратор клиники' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem',
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    }}>
      <Card padding="lg" style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <UserPlus size={28} color="white" />
          </div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>Регистрация</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Создайте новый аккаунт</p>
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
              Email *
            </label>
            <input
              type="email"
              placeholder="example@mail.ru"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              Имя пользователя *
            </label>
            <input
              type="text"
              placeholder="Придумайте логин"
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
              Полное имя
            </label>
            <input
              type="text"
              placeholder="Ваше имя"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
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
              <Stethoscope size={14} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Специальность *
            </label>
            <select
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                border: '1px solid var(--color-border)', 
                borderRadius: '10px', 
                fontSize: '0.95rem',
                background: 'var(--color-background)',
                cursor: 'pointer'
              }}
            >
              <option value="">Выберите специальность</option>
              {specializations.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Пароль *
            </label>
            <input
              type="password"
              placeholder="Придумайте пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
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
          
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </form>
        
        <p style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          fontSize: '0.875rem', 
          color: 'var(--color-text-secondary)' 
        }}>
          Есть аккаунт? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Войти</Link>
        </p>
      </Card>
    </div>
  )
}

export default Register
