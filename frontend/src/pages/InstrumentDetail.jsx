import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Edit, Save, X, Thermometer, Clock, Gauge } from 'lucide-react'
import { instrumentsApi, authApi } from '../api'
import { useToast, ToastContainer } from '../components/Toast'
import { Card, Badge, Button } from '../components/ui/index.jsx'

function InstrumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast, toast, closeToast } = useToast()
  const [instrument, setInstrument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [notLoggedIn, setNotLoggedIn] = useState(false)
  const [form, setForm] = useState({
    name: '', name_en: '', description: '', category: '',
    image_url: '', how_to_pack: '', sterilization_method: '',
    autoclave_temp: '', autoclave_time: '', autoclave_pressure: '',
    notes: '', video_url: ''
  })

  useEffect(() => { checkAuth() }, [id])

  const checkAuth = async () => {
    try {
      const { data } = await authApi.getMe()
      setCurrentUser(data)
      setNotLoggedIn(false)
      loadData()
    } catch {
      setNotLoggedIn(true)
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const res = await instrumentsApi.getOne(id)
      setInstrument(res.data)
      setForm(res.data)
    } catch (e) {
      showToast('Ошибка загрузки', 'error')
      navigate('/glossary')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await instrumentsApi.update(id, form)
      showToast('Сохранено!', 'success')
      setIsEditing(false)
      loadData()
    } catch (e) {
      showToast('Ошибка сохранения', 'error')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Удалить инструмент?')) return
    try {
      await instrumentsApi.delete(id)
      showToast('Удалено', 'success')
      navigate('/glossary')
    } catch (e) {
      showToast('Ошибка удаления', 'error')
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const res = await instrumentsApi.uploadImage(file)
      setForm({ ...form, image_url: res.data.url })
      showToast('Изображение загружено', 'success')
    } catch (e) {
      showToast('Ошибка загрузки', 'error')
    }
  }

  if (loading) return <Card padding="lg"><div style={{ textAlign: 'center' }}>Загрузка...</div></Card>
  if (notLoggedIn) {
    return (
      <div className="instrument-detail-page" style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
        <Card padding="lg">
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1.5rem' }}>Войдите для просмотра информации об инструменте</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/login"><Button>Войти</Button></Link>
              <Link to="/register"><Button variant="secondary">Регистрация</Button></Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }
  if (!instrument) return null

  return (
    <div className="instrument-detail-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div className="page-header">
        <Link to="/glossary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
          <ChevronLeft size={20} /> К глоссарию
        </Link>
        {currentUser?.is_superuser && (
          <div className="course-actions">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit size={16} /> Редактировать
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  <X size={16} /> Отмена
                </Button>
                <Button onClick={handleSave}>
                  <Save size={16} /> Сохранить
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="instrument-content">
        <div className="instrument-image-section">
          {isEditing ? (
            <div className="image-upload">
              {form.image_url && <img src={form.image_url} alt={form.name} />}
              <label className="upload-btn">
                Загрузить файл
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
            </div>
          ) : instrument.image_url ? (
            <img src={instrument.image_url} alt={instrument.name} className="instrument-large-image" />
          ) : (
            <div className="no-image">📷</div>
          )}
        </div>

        <div className="instrument-details">
          {isEditing ? (
            <div className="instrument-form">
              <div className="form-group">
                <label>Название</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Название (англ)</label>
                <input value={form.name_en} onChange={e => setForm({...form, name_en: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Категория</label>
                <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Как паковать</label>
                <textarea value={form.how_to_pack} onChange={e => setForm({...form, how_to_pack: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Метод стерилизации</label>
                <input value={form.sterilization_method} onChange={e => setForm({...form, sterilization_method: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Температура °C</label>
                  <input value={form.autoclave_temp} onChange={e => setForm({...form, autoclave_temp: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Время (мин)</label>
                  <input value={form.autoclave_time} onChange={e => setForm({...form, autoclave_time: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Давление (бар)</label>
                  <input value={form.autoclave_pressure} onChange={e => setForm({...form, autoclave_pressure: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Video URL</label>
                <input value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} />
              </div>
              {currentUser?.is_superuser && (
                <button className="btn btn-danger" onClick={handleDelete}>Удалить инструмент</button>
              )}
            </div>
          ) : (
            <>
              <h1>{instrument.name}</h1>
              {instrument.name_en && <p className="name-en">{instrument.name_en}</p>}
              {instrument.category && <span className="badge">{instrument.category}</span>}
              
              {instrument.description && (
                <div className="detail-section">
                  <h3>Описание</h3>
                  <p>{instrument.description}</p>
                </div>
              )}

              <div className="detail-section">
                <h3>📦 Как паковать</h3>
                <div className="info-box">
                  {instrument.how_to_pack || 'Информация отсутствует'}
                </div>
              </div>

              <div className="detail-section">
                <h3>🧼 Стерилизация</h3>
                <div className="info-box">
                  <p><strong>Метод:</strong> {instrument.sterilization_method || '—'}</p>
                  <div className="autoclave-params">
                    <span>🌡️ {instrument.autoclave_temp || '—'}°C</span>
                    <span>⏱️ {instrument.autoclave_time || '—'} мин</span>
                    <span>⚡ {instrument.autoclave_pressure || '—'} бар</span>
                  </div>
                </div>
              </div>

              {instrument.notes && (
                <div className="detail-section">
                  <h3>📝 Notes</h3>
                  <p>{instrument.notes}</p>
                </div>
              )}

              {instrument.video_url && (
                <div className="detail-section">
                  <h3>🎬 Видео</h3>
                  <a href={instrument.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                    Смотреть видео
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          <button onClick={closeToast}>×</button>
        </div>
      )}
    </div>
  )
}

export default InstrumentDetail