import { useState, useEffect } from 'react'
import { quizApi } from '../api'

function Certificates() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    quizApi.getMyCertificates()
      .then(res => setCertificates(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Загрузка...</div>

  return (
    <div className="certificates-page">
      <div className="page-header">
        <h1>Мои сертификаты</h1>
      </div>
      
      {certificates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎓</div>
          <h3>Нет сертификатов</h3>
          <p>Пройдите все тесты курса для получения сертификата</p>
        </div>
      ) : (
        <div className="certificates-list">
          {certificates.map(cert => (
            <div key={cert.id} className="certificate-card">
              <div className="certificate-icon">🎓</div>
              <div className="certificate-content">
                <h2>Сертификат о прохождении</h2>
                <p className="certificate-course">{cert.course_title}</p>
                <div className="certificate-meta">
                  <span>№ {cert.certificate_number}</span>
                  <span>•</span>
                  <span>Выдан: {new Date(cert.issued_at).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
              <div className="certificate-actions">
                <button 
                  onClick={() => window.print()} 
                  className="btn btn-primary"
                >
                  Печать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Certificates