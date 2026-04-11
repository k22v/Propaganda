import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { instrumentsApi, authApi } from '../api'
import { useToast, ToastContainer } from '../components/Toast'

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

  if (loading) return <div className="loading">Загрузка...</div>
  if (notLoggedIn) {
    return (
      <div className="instrument-detail-page">
        <div className="page-header">
          <Link to="/glossary" className="back-link">← К глоссарию</Link>
        </div>
        <div className="locked-message">
          <p>Войдите для просмотра информации об инструменте</p>
          <div className="locked-actions">
            <Link to="/login" className="btn btn-primary">Войти</Link>
            <Link to="/register" className="btn btn-secondary">Регистрация</Link>
          </div>
        </div>
      </div>
    )
  }
  if (!instrument) return null

  return (
    <div className="instrument-detail-page">
      <div className="page-header">
        <Link to="/glossary" className="back-link">← К глоссарию</Link>
        {currentUser?.is_superuser && (
          <div className="course-actions">
            {!isEditing ? (
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Редактировать</button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Отмена</button>
                <button className="btn btn-primary" onClick={handleSave}>Сохранить</button>
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