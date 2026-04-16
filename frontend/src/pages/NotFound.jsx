import { Link } from 'react-router-dom'
import { Home, BookOpen, HeartCrack } from 'lucide-react'
import { Button } from '../components/ui/index.jsx'

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
              <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="3" dy="8" stdDeviation="4" floodColor="#1e293b" floodOpacity="0.3"/>
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
            <HeartCrack size={32} style={{ color: '#ef4444' }} />
          </div>
        </div>
        
        <h1>404</h1>
        <h2>Ой! Такой страницы не нашлось</h2>
        <p>Похоже, этот зуб выпал из нашей базы данных</p>
        
        <div className="not-found-actions">
          <Button as={Link} to="/">
            <Home size={16} /> На главную
          </Button>
          <Button as={Link} to="/courses" variant="secondary">
            <BookOpen size={16} /> К курсам
          </Button>
        </div>
      </div>

      <style>{`
        .not-found-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }
        
        .not-found-content {
          text-align: center;
          color: white;
          max-width: 500px;
        }
        
        .not-found-illustration {
          position: relative;
          display: inline-block;
          margin-bottom: 2rem;
        }
        
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
          top: 30%;
          right: 0;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }

        .crack path {
          animation: crackAppear 2s ease-in-out infinite;
        }

        @keyframes crackAppear {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        .not-found-content h1 {
          font-size: 6rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .not-found-content h2 {
          font-size: 1.5rem;
          margin: 0.5rem 0 1rem;
        }
        
        .not-found-content p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
        }
        
        .not-found-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  )
}

export default NotFound