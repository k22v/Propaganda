import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-illustration">
          <svg viewBox="0 0 200 200" className="tooth-svg">
            <defs>
              <linearGradient id="toothGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-primary-dark, #1a5c9e)" />
              </linearGradient>
            </defs>
            <path 
              d="M100 10 C60 10 35 40 35 80 C35 100 30 130 40 160 C45 180 55 195 70 195 L80 195 C85 185 85 175 80 165 C75 155 75 145 80 135 L85 120 C90 100 95 90 100 90 C105 90 110 100 115 120 L120 135 C125 145 125 155 120 165 C115 175 115 185 120 195 L130 195 C145 195 155 180 160 160 C170 130 165 100 165 80 C165 40 140 10 100 10 Z" 
              fill="url(#toothGradient)"
              stroke="var(--color-primary-dark, #1a5c9e)"
              strokeWidth="3"
            />
            <ellipse cx="75" cy="70" rx="8" ry="10" fill="white" opacity="0.8"/>
            <ellipse cx="125" cy="70" rx="8" ry="10" fill="white" opacity="0.8"/>
            <path d="M70 120 Q100 150 130 120" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6"/>
          </svg>
          <div className="broken-piece">💔</div>
        </div>
        <h1>404</h1>
        <h2>Ой! Такой страницы не нашлось</h2>
        <p>Похоже, этот зуб выпал из нашей базы данных</p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">🏠 На главную</Link>
          <Link to="/courses" className="btn btn-secondary">📚 К курсам</Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
