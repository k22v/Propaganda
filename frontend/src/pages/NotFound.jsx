import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-illustration">
          <svg viewBox="0 0 200 200" className="tooth-3d-svg">
            <defs>
              <linearGradient id="toothBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="30%" stopColor="#e2e8f0" />
                <stop offset="70%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="toothGlos" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="toothShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0" />
              </linearGradient>
              <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="3" dy="8" stdDeviation="4" floodColor="#1e293b" floodOpacity="0.3"/>
              </filter>
              <filter id="innerGlow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            
            <g transform="translate(100, 100)">
              <g filter="url(#dropShadow)">
                <path 
                  d="M0 -85 C-35 -85 -55 -55 -55 -20 C-55 10 -50 35 -45 55 C-40 75 -30 90 -15 95 L-10 95 C-5 85 -5 75 -10 65 C-15 55 -15 45 -10 35 L-5 20 C0 -5 5 -15 10 -15 L15 -15 C20 -5 25 20 30 35 C35 45 35 55 30 65 C25 75 25 85 30 95 L45 95 C60 90 70 75 75 55 C80 35 85 10 85 -20 C85 -55 65 -85 0 -85 Z" 
                  fill="url(#toothBody)"
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                
                <ellipse cx="-25" cy="-35" rx="12" ry="18" fill="url(#toothGlos)" transform="rotate(-15)"/>
                <ellipse cx="25" cy="-30" rx="8" ry="12" fill="url(#toothGlos)" transform="rotate(10)"/>
                
                <path d="M-20 55 Q0 70 20 55" stroke="#94a3b8" strokeWidth="2" fill="none" opacity="0.5"/>
                <path d="M-15 70 Q0 82 15 70" stroke="#94a3b8" strokeWidth="1.5" fill="none" opacity="0.4"/>
              </g>
            </g>
            
            <g className="crack" transform="translate(100, 100)">
              <path 
                d="M5 -50 L8 -35 L2 -20 L6 -5"
                stroke="#e2e8f0"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="4 2"
              />
            </g>
          </svg>
          
          <div className="broken-piece">
            <span className="broken-icon">💔</span>
          </div>
        </div>
        
        <h1>404</h1>
        <h2>Ой! Такой страницы не нашлось</h2>
        <p>Похоже, этот зуб выпал из нашей базы данных</p>
        
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">🏠 На главную</Link>
          <Link to="/courses" className="btn btn-secondary">📚 К курсам</Link>
        </div>
      </div>

      <style>{`
        .tooth-3d-svg {
          width: 180px;
          height: 180px;
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        .broken-piece {
          position: absolute;
          top: 50%;
          right: 20%;
          font-size: 2rem;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }

        .crack path {
          animation: crackAppear 2s ease-in-out infinite;
        }

        @keyframes crackAppear {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

export default NotFound