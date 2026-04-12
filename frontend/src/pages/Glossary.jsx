import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { instrumentsApi, authApi } from '../api'
import { useToast, ToastContainer } from '../components/Toast'
import { useDebounce } from '../hooks/useDebounce'

function Glossary() {
  const navigate = useNavigate()
  const [instruments, setInstruments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [notLoggedIn, setNotLoggedIn] = useState(false)
  const [newInstrument, setNewInstrument] = useState({
    name: '', name_en: '', description: '', category: '', specialization: '',
    how_to_pack: '', sterilization_method: '',
    autoclave_temp: '', autoclave_time: '', autoclave_pressure: '',
    notes: ''
  })
  const { showToast, toast, closeToast } = useToast()
  const debouncedSearch = useDebounce(search, 400)
  const tabsRef = useRef(null)

  const updateSlider = (index) => {
    if (!tabsRef.current) return
    const tabs = tabsRef.current.querySelectorAll('.tab')
    const activeTab = tabs[index]
    if (!activeTab) return
    
    const containerRect = tabsRef.current.getBoundingClientRect()
    const tabRect = activeTab.getBoundingClientRect()
    
    tabsRef.current.style.setProperty('--slider-left', `${tabRect.left - containerRect.left}px`)
    tabsRef.current.style.setProperty('--slider-width', `${tabRect.width}px`)
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadInstruments() }, [debouncedSearch, selectedCategory])
  useEffect(() => { checkUser() }, [])
  useEffect(() => { 
    const idx = ['', ...categories].indexOf(selectedCategory)
    updateSlider(idx >= 0 ? idx : 0)
  }, [selectedCategory, categories])
  useEffect(() => { updateSlider(0) }, [])

  const checkUser = async () => {
    try {
      const { data } = await authApi.getMe()
      setIsSuperuser(data?.is_superuser === true || data?.is_superuser === 1)
      setNotLoggedIn(false)
    } catch { 
      setNotLoggedIn(true)
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const cats = await instrumentsApi.getCategories()
      setCategories(cats.data || [])
    } catch (e) { console.error(e) }
  }

  const loadInstruments = async () => {
    setLoading(true)
    try {
      const res = await instrumentsApi.getAll({
        search: debouncedSearch || undefined,
        category: selectedCategory || undefined
      })
      setInstruments(res.data || [])
    } catch (e) { 
      showToast('Ошибка загрузки', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newInstrument.name.trim()) return showToast('Введите название', 'warning')
    try {
      await instrumentsApi.create(newInstrument)
      showToast('Инструмент добавлен!', 'success')
      setShowAddModal(false)
      setNewInstrument({
        name: '', name_en: '', description: '', category: '', specialization: '',
        how_to_pack: '', sterilization_method: '',
        autoclave_temp: '', autoclave_time: '', autoclave_pressure: '',
        notes: ''
      })
      loadInstruments()
    } catch (e) {
      showToast('Ошибка добавления', 'error')
    }
  }

  if (loading) return <div className="loading">Загрузка...</div>
  if (notLoggedIn) {
    return (
      <div className="glossary-page">
        <div className="page-header">
          <h1>Глоссарий инструментов</h1>
          <p className="subtitle">Справочник для ассистентов стоматолога</p>
        </div>
        <div className="locked-message">
          <p>Войдите или зарегистрируйтесь для доступа к глоссарию</p>
          <div className="locked-actions">
            <Link to="/login" className="btn btn-primary">Войти</Link>
            <Link to="/register" className="btn btn-secondary">Регистрация</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glossary-page">
      <div className="page-header">
        <div>
          <h1>Глоссарий инструментов</h1>
          <p className="subtitle">Справочник для ассистентов стоматолога</p>
        </div>
        {isSuperuser && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Добавить
          </button>
        )}
      </div>

      <div className="glossary-filters">
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="category-tabs" ref={tabsRef}>
        <button 
          className={`tab ${!selectedCategory ? 'active' : ''}`}
          onClick={() => { setSelectedCategory(''); updateSlider(0) }}
        >
          Все
        </button>
        {categories.map((cat, idx) => (
          <button
            key={cat}
            className={`tab ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => { setSelectedCategory(cat); updateSlider(idx + 1) }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="instruments-grid">
        {loading ? (
          <div className="loader-spinner"></div>
        ) : instruments.length === 0 ? (
          <div className="empty-state">
            <p>Инструменты не найдены</p>
          </div>
        ) : (
          instruments.map(inst => (
            <Link key={inst.id} to={`/glossary/${inst.id}`} className="instrument-card">
              {inst.image_url && (
                <img src={inst.image_url} alt={inst.name} className="instrument-image" />
              )}
              <div className="instrument-info">
                <h3>{inst.name}</h3>
                {inst.name_en && <p className="name-en">{inst.name_en}</p>}
                {inst.category && <span className="badge">{inst.category}</span>}
              </div>
            </Link>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Добавить инструмент</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название *</label>
                <input 
                  value={newInstrument.name}
                  onChange={e => setNewInstrument({...newInstrument, name: e.target.value})}
                  placeholder="Например: Зеркало стоматологическое"
                />
              </div>
              <div className="form-group">
                <label>Название (английский)</label>
                <input 
                  value={newInstrument.name_en}
                  onChange={e => setNewInstrument({...newInstrument, name_en: e.target.value})}
                  placeholder="Dental mirror"
                />
              </div>
              <div className="form-group">
                <label>Категория</label>
                <input 
                  value={newInstrument.category}
                  onChange={e => setNewInstrument({...newInstrument, category: e.target.value})}
                  placeholder="Диагностика"
                />
              </div>
              {isSuperuser && (
                <div className="form-group">
                  <label>Специализация</label>
                  <select 
                    value={newInstrument.specialization}
                    onChange={e => setNewInstrument({...newInstrument, specialization: e.target.value})}
                  >
                    <option value="">Все специализации</option>
                    <option value="dentist">Врач-стоматолог</option>
                    <option value="assistant">Ассистент стоматолога</option>
                    <option value="technician">Зубной техник</option>
                    <option value="clinic_admin">Администратор клиники</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Как паковать</label>
                <textarea 
                  value={newInstrument.how_to_pack}
                  onChange={e => setNewInstrument({...newInstrument, how_to_pack: e.target.value})}
                  placeholder="Инструкция по упаковке..."
                />
              </div>
              <div className="form-group">
                <label>Метод стерилизации</label>
                <input 
                  value={newInstrument.sterilization_method}
                  onChange={e => setNewInstrument({...newInstrument, sterilization_method: e.target.value})}
                  placeholder="Автоклавирование"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Температура °C</label>
                  <input 
                    value={newInstrument.autoclave_temp}
                    onChange={e => setNewInstrument({...newInstrument, autoclave_temp: e.target.value})}
                    placeholder="134"
                  />
                </div>
                <div className="form-group">
                  <label>Время мин</label>
                  <input 
                    value={newInstrument.autoclave_time}
                    onChange={e => setNewInstrument({...newInstrument, autoclave_time: e.target.value})}
                    placeholder="5"
                  />
                </div>
                <div className="form-group">
                  <label>Давление бар</label>
                  <input 
                    value={newInstrument.autoclave_pressure}
                    onChange={e => setNewInstrument({...newInstrument, autoclave_pressure: e.target.value})}
                    placeholder="2.1"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleAdd}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          <button onClick={closeToast}>×</button>
        </div>
      )}
    </div>
  )
}

export default Glossary