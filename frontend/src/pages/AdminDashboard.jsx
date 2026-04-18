import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Download, Users, BookOpen, CheckCircle2, ClipboardList } from 'lucide-react'
import { adminApi } from '../api'
import { ToastContainer, useToast } from '../components/Toast'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Card, Badge, Button, Tabs } from '../components/ui/index.jsx'
import { AdminToolbar, UsersTable, UserRowActions, AdminStatsRow } from '../components/AdminComponents'
import { StatsCharts } from '../components/StatsCharts'
import '../components/AdminComponents.css'
import '../components/CourseDetail.css'

const TABS = [
  { id: 'stats', label: 'Статистика' },
  { id: 'users', label: 'Пользователи' },
  { id: 'quiz-results', label: 'Результаты тестов' },
]

export default function AdminDashboard() {
  const { toast, showToast, closeToast } = useToast()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [quizResults, setQuizResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [quizFilter, setQuizFilter] = useState({ user: '', course: '' })
  const [selectedResult, setSelectedResult] = useState(null)
  const [filters, setFilters] = useState({ search: '', role: '', specialization: '', status: '' })
  const [pagination, setPagination] = useState({ page: 1, total: 0 })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const initialized = useRef(false)

  const loadStats = async () => {
    try {
      const statsRes = await adminApi.getStats()
      setStats(statsRes.data)
    } catch (err) {
      console.error('Stats load error:', err)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.role) params.role = filters.role
      if (filters.specialization) params.specialization = filters.specialization
      if (filters.status !== '') params.is_active = filters.status === 'true'
      
      const usersRes = await adminApi.getUsers(params)
      setUsers(usersRes.data.users || [])
      setPagination(prev => ({ ...prev, total: usersRes.data.total || 0 }))
    } catch (err) {
      console.error('Users load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadQuizResults = async () => {
    try {
      const quizRes = await adminApi.getQuizResults()
      setQuizResults(quizRes.data || [])
    } catch (err) {
      console.error('Quiz results load error:', err)
    }
  }

  const loadData = async () => {
    await Promise.all([loadStats(), loadUsers(), loadQuizResults()])
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    }
  }, [filters, activeTab])

  const filteredQuizResults = useMemo(() => {
    return quizResults.filter(r => 
      (!quizFilter.user || 
        r.username.toLowerCase().includes(quizFilter.user.toLowerCase()) ||
        r.full_name?.toLowerCase().includes(quizFilter.user.toLowerCase())) &&
      (!quizFilter.course || 
        r.course_title.toLowerCase().includes(quizFilter.course.toLowerCase()))
    )
  }, [quizResults, quizFilter])

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
    exportToCSV(filteredQuizResults, 'quiz_results', columns)
  }

  const updateRole = async (userId, role) => {
    try {
      await adminApi.updateUserRole(userId, { role })
      loadUsers()
      showToast('Роль обновлена', 'success')
    } catch (err) {
      console.error('Role update error:', err)
      showToast('Ошибка при обновлении роли', 'error')
    }
  }

  const updateSpecialization = async (userId, specialization) => {
    try {
      await adminApi.updateUserSpecialization(userId, specialization || null)
      loadUsers()
      showToast('Специализация обновлена', 'success')
    } catch (err) {
      console.error('Specialization update error:', err)
      showToast('Ошибка при обновлении специализации', 'error')
    }
  }

  const toggleBlock = async (userId) => {
    try {
      await adminApi.toggleUserBlock(userId)
      loadUsers()
    } catch (err) {
      console.error('Block toggle error:', err)
      showToast('Ошибка при блокировке', 'error')
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return
    try {
      await adminApi.deleteUser(deleteConfirm)
      loadUsers()
      showToast('Пользователь удалён', 'success')
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Ошибка при удалении', 'error')
    }
    setDeleteConfirm(null)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">Загрузка...</div>
      </div>
    )
  }

  const adminStats = {
    users_count: stats?.users || 0,
    courses_count: stats?.courses || 0,
    active_users: stats?.active_users || 0,
    tests_completed: quizResults.length || 0,
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Панель администратора</h1>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'stats' && stats && (
        <>
          <AdminStatsRow stats={adminStats} />
          <StatsCharts stats={stats} quizResults={quizResults} />
        </>
      )}

      {activeTab === 'users' && (
        <>
          <AdminToolbar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters({ search: '', role: '', specialization: '', status: '' })}
            onExport={handleExportUsers}
          />
          <UsersTable
            users={users}
            isLoading={loading}
            pagination={pagination}
            onPageChange={(page) => setPagination(p => ({ ...p, page }))}
            onDelete={(userId) => setDeleteConfirm(userId)}
            onRoleChange={updateRole}
            onSpecializationChange={updateSpecialization}
            onBlock={toggleBlock}
          />
        </>
      )}

      {activeTab === 'quiz-results' && (
        <div className="quiz-results-section">
          <div className="table-actions" style={{ marginBottom: '1rem' }}>
            <Button variant="secondary" onClick={handleExportQuizResults}>
              <Download size={16} /> Экспорт CSV
            </Button>
          </div>
          
          <Card padding="md" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Фильтр по пользователю..."
                value={quizFilter.user}
                onChange={(e) => setQuizFilter({ ...quizFilter, user: e.target.value })}
                className="toolbar-input"
                style={{ flex: 1 }}
              />
              <input
                type="text"
                placeholder="Фильтр по курсу..."
                value={quizFilter.course}
                onChange={(e) => setQuizFilter({ ...quizFilter, course: e.target.value })}
                className="toolbar-input"
                style={{ flex: 1 }}
              />
            </div>
          </Card>
          
          {filteredQuizResults.length === 0 ? (
            <Card padding="lg">
              <div className="empty-state">
                <ClipboardList size={48} />
                <h3 className="empty-title">Нет результатов</h3>
                <p className="empty-description">Пока нет результатов тестов</p>
              </div>
            </Card>
          ) : (
            <Card padding="none">
              <div className="table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Пользователь</th>
                      <th>Курс</th>
                      <th>Урок</th>
                      <th>Результат</th>
                      <th>Статус</th>
                      <th>Дата</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuizResults.map(result => (
                      <tr key={result.attempt_id}>
                        <td>
                          <div className="user-info">
                            <span className="user-name">{result.full_name || result.username}</span>
                            <span className="user-email">@{result.username}</span>
                          </div>
                        </td>
                        <td>{result.course_title}</td>
                        <td>
                          <div style={{ fontSize: '0.875rem' }}>
                            <strong>{result.lesson_title}</strong>
                            <br />
                            <small style={{ color: 'var(--color-text-secondary)' }}>
                              {result.section_title} / {result.chapter_title}
                            </small>
                          </div>
                        </td>
                        <td>
                          <Badge variant={result.score >= 70 ? 'success' : 'danger'}>
                            {result.score}%
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={result.passed ? 'primary' : 'default'}>
                            {result.passed ? 'Пройден' : 'Не пройден'}
                          </Badge>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {result.completed_at ? new Date(result.completed_at).toLocaleString('ru-RU') : '-'}
                        </td>
                        <td>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedResult(result)}>
                            Подробнее
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {selectedResult && (
        <div className="modal-overlay" onClick={() => setSelectedResult(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Детали теста</h2>
              <button className="modal-close" onClick={() => setSelectedResult(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <p><strong>Пользователь:</strong> {selectedResult.full_name || selectedResult.username} ({selectedResult.user_email})</p>
                <p><strong>Курс:</strong> {selectedResult.course_title}</p>
                <p><strong>Раздел:</strong> {selectedResult.section_title}</p>
                <p><strong>Глава:</strong> {selectedResult.chapter_title}</p>
                <p><strong>Урок:</strong> {selectedResult.lesson_title}</p>
                <p><strong>Тест:</strong> {selectedResult.quiz_title}</p>
                <p>
                  <strong>Результат:</strong>{' '}
                  <Badge variant={selectedResult.score >= 70 ? 'success' : 'danger'}>
                    {selectedResult.score}%
                  </Badge>
                </p>
              </div>
              
              <h3 style={{ marginBottom: '1rem' }}>Ответы на вопросы:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedResult.question_results?.map((q, idx) => (
                  <Card 
                    key={q.question_id} 
                    padding="md"
                    className={q.is_correct ? 'correct-answer-card' : 'wrong-answer-card'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>Вопрос {idx + 1}</strong>
                      <Badge variant={q.is_correct ? 'success' : 'danger'}>
                        {q.is_correct ? '✓ Правильно' : '✗ Неправильно'}
                      </Badge>
                    </div>
                    <p>{q.question_text}</p>
                    {!q.is_correct && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                        <p><span style={{ color: '#ef4444' }}>Ответ пользователя:</span> {q.user_answer_text}</p>
                        <p><span style={{ color: '#10b981' }}>Правильный ответ:</span> {q.correct_answer_text}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer toast={toast} onClose={closeToast} />
      
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Удаление пользователя"
        message="Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        danger={true}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
