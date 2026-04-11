import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api'

function Register() {
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '', specialization: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const specializations = [
    { value: 'dentist', label: 'Врач-стоматолог' },
    { value: 'assistant', label: 'Ассистент стоматолога' },
    { value: 'hygienist', label: 'Гигиенист' },
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon">📝</div>
          <h1>Регистрация</h1>
          <p className="subtitle">Создайте новый аккаунт</p>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="example@mail.ru"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              id="username"
              type="text"
              placeholder="Придумайте логин"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="full_name">Полное имя (необязательно)</label>
            <input
              id="full_name"
              type="text"
              placeholder="Ваше имя"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialization">Специальность</label>
            <select
              id="specialization"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              required
            >
              <option value="">Выберите специальность</option>
              {specializations.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              placeholder="Придумайте пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <p className="auth-footer">
          Есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
