import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'

const COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export function StatsCharts({ stats, quizResults }) {
  const specializationData = stats?.by_specialization 
    ? Object.entries(stats.by_specialization).map(([name, value]) => ({
        name: getSpecializationLabel(name),
        value
      }))
    : []

  const enrollmentData = stats?.recent_enrollments || []

  const quizScoreData = quizResults?.slice(0, 10).map((r, i) => ({
    name: r.user_name || `User ${i + 1}`,
    score: Math.round(r.score || 0),
    attempts: r.attempts_count || 1
  })) || []

  return (
    <div className="stats-charts">
      <div className="charts-grid">
        {specializationData.length > 0 && (
          <div className="chart-card">
            <h3>Пользователи по специализациям</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={specializationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {specializationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    layout="vertical" 
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => <span style={{ color: 'var(--color-text)' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {quizScoreData.length > 0 && (
          <div className="chart-card">
            <h3>Последние результаты тестов</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={quizScoreData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Результат']} />
                  <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {enrollmentData.length > 0 && (
          <div className="chart-card chart-wide">
            <h3>Активность записавшихся</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} name="Записи" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getSpecializationLabel(spec) {
  const labels = {
    dentist: 'Стоматолог',
    assistant: 'Ассистент',
    technician: 'Техник',
    clinic_admin: 'Админ',
    hygienist: 'Гигиенист'
  }
  return labels[spec] || spec
}
