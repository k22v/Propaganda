import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { authApi, adminApi } from '../api'
import { StatsCharts } from '../components/StatsCharts'
import '../components/CourseDetail.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [quizResults, setQuizResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [quizFilter, setQuizFilter] = useState({ user: '', course: '' })
  const [selectedResult, setSelectedResult] = useState(null)
  const tabsRef = useRef(null)
  const initialized = useRef(false)

  const loadData = async () => {
    try {
      console.log('Loading admin data...')
      const statsRes = await adminApi.getStats()
      console.log('Stats:', statsRes.data)
      setStats(statsRes.data)
      
      const usersRes = await adminApi.getUsers()
      console.log('Users:', usersRes.data)
      setUsers(usersRes.data)
      
      const quizRes = await adminApi.getQuizResults()
      console.log('Quiz results:', quizRes.data)
      setQuizResults(quizRes.data)
    } catch (err) {
      console.error('Admin load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateSlider = (index) => {
    if (!tabsRef.current) return
    const tabs = tabsRef.current.querySelectorAll('.filter-pill')
    const activeTabEl = tabs[index]
    if (!activeTabEl) return
    
    const containerRect = tabsRef.current.getBoundingClientRect()
    const tabRect = activeTabEl.getBoundingClientRect()
    
    tabsRef.current.style.setProperty('--slider-left', `${tabRect.left - containerRect.left}px`)
    tabsRef.current.style.setProperty('--slider-width', `${tabRect.width}px`)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!loading) {
      const tabIndex = { stats: 0, users: 1, 'quiz-results': 2 }
      const targetIndex = tabIndex[activeTab] !== undefined ? tabIndex[activeTab] : 1
      updateSlider(targetIndex)
    }
  }, [activeTab, loading])

  useEffect(() => {
    if (!loading && !initialized.current) {
      initialized.current = true
      updateSlider(1)
    }
  }, [loading])

  const exportToCSV = (data, filename, columns) => {
    const headers = columns.map(c => c.label).join(',')
    const rows = data.map(item => 
      columns.map(c => {
        let value = item[c.key]
        if (value === null || value === undefined) value = ''
        if (typeof value === 'string' && value.includes(',')) value = `"${value}"`
        return value
      }).join(',')
    )
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleExportUsers = () => {
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'is_active', label: 'Active' },
      { key: 'created_at', label: 'Created' }
    ]
    exportToCSV(users, 'users', columns)
  }

  const handleExportQuizResults = () => {
    const columns = [
      { key: 'username', label: 'User' },
      { key: 'user_email', label: 'Email' },
      { key: 'course_title', label: 'Course' },
      { key: 'quiz_title', label: 'Quiz' },
      { key: 'score', label: 'Score %' },
      { key: 'passed', label: 'Passed' },
      { key: 'completed_at', label: 'Date' }
    ]
    exportToCSV(quizResults, 'quiz_results', columns)
  }

  const updateRole = async (userId, role) => {
    console.log('updateRole called:', userId, role)
    try {
      console.log('Sending PATCH request to:', `/admin/users/${userId}/role`, 'with role:', role)
      const res = await adminApi.updateUserRole(userId, role)
      console.log('updateRole response:', res)
      window.location.reload()
    } catch (err) {
      console.error('Role update error:', err)
      let errorMsg = 'Unknown error'
      if (err.response) {
        errorMsg = err.response.data?.detail || JSON.stringify(err.response.data)
      } else if (err.request) {
        errorMsg = 'No response from server'
      } else {
        errorMsg = err.message
      }
      alert('Ошибка при обновлении роли: ' + errorMsg)
    }
  }

  const updateSpecialization = async (userId, specialization) => {
    console.log('updateSpecialization called:', userId, specialization)
    const value = specialization === '' ? null : specialization
    try {
      console.log('Sending PATCH request to:', `/admin/users/${userId}/specialization`, 'with value:', value)
      const res = await adminApi.updateUserSpecialization(userId, value)
      console.log('updateSpecialization response:', res)
      console.log('Updated user data:', res.data)
      window.location.reload()
    } catch (err) {
      console.error('Specialization update error:', err)
      let errorMsg = 'Unknown error'
      if (err.response) {
        errorMsg = err.response.data?.detail || JSON.stringify(err.response.data)
      } else if (err.request) {
        errorMsg = 'No response from server'
      } else {
        errorMsg = err.message
      }
      alert('Ошибка при обновлении специализации: ' + errorMsg)
    }
  }

  const toggleBlock = async (userId) => {
    try {
      await adminApi.toggleUserBlock(userId)
      loadData()
    } catch (err) {
      console.error('Block toggle error:', err)
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите удалить пользователя?')) return
    try {
      await adminApi.deleteUser(userId)
      loadData()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  if (loading) return <div className="page">Загрузка...</div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Панель администратора</h1>
      </div>

      <div className="courses-filter" ref={tabsRef}>
        <button 
          className={`filter-pill ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Статистика
        </button>
        <button 
          className={`filter-pill ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Пользователи
        </button>
        <button 
          className={`filter-pill ${activeTab === 'quiz-results' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz-results')}
        >
          Результаты тестов
        </button>
      </div>

      {activeTab === 'stats' && stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.users}</div>
              <div className="stat-label">Всего пользователей</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.active_users}</div>
              <div className="stat-label">Активных пользователей</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.courses}</div>
              <div className="stat-label">Курсов</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.enrollments}</div>
              <div className="stat-label">Записей на курсы</div>
            </div>
          </div>
          <StatsCharts stats={stats} quizResults={quizResults} />
        </>
      )}

      {activeTab === 'users' && (
        <div className="users-table">
          <div className="table-actions">
            <button className="btn btn-secondary" onClick={handleExportUsers}>
              📥 Экспорт CSV
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя пользователя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Специальность</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={!user.is_active ? 'blocked-row' : ''}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <select 
                      className="admin-table-select"
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      className="admin-table-select"
                      value={user.specialization || ''}
                      onChange={(e) => updateSpecialization(user.id, e.target.value || null)}
                    >
                      <option value="">-</option>
                      <option value="dentist">Dentist</option>
                      <option value="assistant">Assistant</option>
                      <option value="hygienist">Hygienist</option>
                      <option value="technician">Technician</option>
                      <option value="clinic_admin">Clinic Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={user.is_active ? 'status-active' : 'status-blocked'}>
                      {user.is_active ? 'Активен' : 'Заблокирован'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm"
                      onClick={() => toggleBlock(user.id)}
                    >
                      {user.is_active ? 'Блокировать' : 'Разблокировать'}
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteUser(user.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'quiz-results' && (
        <div className="quiz-results-section">
          <div className="table-actions">
            <button className="btn btn-secondary" onClick={handleExportQuizResults}>
              📥 Экспорт CSV
            </button>
          </div>
          <div className="quiz-results-filters">
            <input
              type="text"
              placeholder="Фильтр по пользователю..."
              value={quizFilter.user}
              onChange={(e) => setQuizFilter({ ...quizFilter, user: e.target.value })}
              className="filter-input"
            />
            <input
              type="text"
              placeholder="Фильтр по курсу..."
              value={quizFilter.course}
              onChange={(e) => setQuizFilter({ ...quizFilter, course: e.target.value })}
              className="filter-input"
            />
          </div>
          
          {quizResults.length === 0 ? (
            <p className="empty-message">Пока нет результатов тестов</p>
          ) : (
            <div className="quiz-results-table">
              <table>
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Курс</th>
                    <th>Урок</th>
                    <th>Результат</th>
                    <th>Статус</th>
                    <th>Дата</th>
                    <th>Детали</th>
                  </tr>
                </thead>
                <tbody>
                  {quizResults
                    .filter(r => 
                      (!quizFilter.user || 
                        r.username.toLowerCase().includes(quizFilter.user.toLowerCase()) ||
                        r.full_name?.toLowerCase().includes(quizFilter.user.toLowerCase())) &&
                      (!quizFilter.course || 
                        r.course_title.toLowerCase().includes(quizFilter.course.toLowerCase()))
                    )
                    .map(result => (
                    <tr key={result.attempt_id}>
                      <td>
                        <div className="user-cell">
                          <strong>{result.full_name || result.username}</strong>
                          <small>@{result.username}</small>
                        </div>
                      </td>
                      <td>{result.course_title}</td>
                      <td>
                        <div className="lesson-cell">
                          <strong>{result.lesson_title}</strong>
                          <small>{result.section_title} / {result.chapter_title}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`score score-${result.score >= 70 ? 'pass' : 'fail'}`}>
                          {result.score}%
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${result.passed ? 'passed' : 'failed'}`}>
                          {result.passed ? 'Пройден' : 'Не пройден'}
                        </span>
                      </td>
                      <td>{result.completed_at ? new Date(result.completed_at).toLocaleString('ru-RU') : '-'}</td>
                      <td>
                        <button 
                          className="btn btn-sm"
                          onClick={() => setSelectedResult(result)}
                        >
                          Подробнее
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedResult && (
        <div className="modal-overlay" onClick={() => setSelectedResult(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Детали теста</h2>
              <button className="modal-close" onClick={() => setSelectedResult(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="result-summary">
                <p><strong>Пользователь:</strong> {selectedResult.full_name || selectedResult.username} ({selectedResult.user_email})</p>
                <p><strong>Курс:</strong> {selectedResult.course_title}</p>
                <p><strong>Раздел:</strong> {selectedResult.section_title}</p>
                <p><strong>Глава:</strong> {selectedResult.chapter_title}</p>
                <p><strong>Урок:</strong> {selectedResult.lesson_title}</p>
                <p><strong>Тест:</strong> {selectedResult.quiz_title}</p>
                <p><strong>Результат:</strong> <span className={`score score-${selectedResult.score >= 70 ? 'pass' : 'fail'}`}>{selectedResult.score}%</span></p>
              </div>
              
              <h3>Ответы на вопросы:</h3>
              <div className="question-results">
                {selectedResult.question_results?.map((q, idx) => (
                  <div key={q.question_id} className={`question-result ${q.is_correct ? 'correct' : 'wrong'}`}>
                    <div className="question-header">
                      <span className="question-number">Вопрос {idx + 1}</span>
                      <span className={`question-status ${q.is_correct ? 'correct' : 'wrong'}`}>
                        {q.is_correct ? '✓ Правильно' : '✗ Неправильно'}
                      </span>
                    </div>
                    <p className="question-text">{q.question_text}</p>
                    {!q.is_correct && (
                      <div className="answer-comparison">
                        <p><span className="wrong-answer">Ответ пользователя:</span> {q.user_answer_text}</p>
                        <p><span className="correct-answer">Правильный ответ:</span> {q.correct_answer_text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
