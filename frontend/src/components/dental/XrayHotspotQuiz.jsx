import { useState } from 'react'

export default function XrayHotspotQuiz({ 
  imageUrl, 
  hotspots = [], 
  onComplete,
  title = 'Найдите проблемные зоны на рентгене'
}) {
  const [clickedSpots, setClickedSpots] = useState([])
  const [showResults, setShowResults] = useState(false)

  const handleImageClick = (e) => {
    if (showResults) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const clickPoint = { x, y, clickX: ((x / rect.width) * 100).toFixed(1), clickY: ((y / rect.height) * 100).toFixed(1) }
    
    setClickedSpots(prev => [...prev, clickPoint])
  }

  const checkHotspot = (clickX, clickY, hotspot) => {
    const tolerance = 10
    return Math.abs(clickX - hotspot.x) < tolerance && Math.abs(clickY - hotspot.y) < tolerance
  }

  const handleSubmit = () => {
    setShowResults(true)
    
    const results = hotspots.map(h => ({
      ...h,
      found: clickedSpots.some(click => checkHotspot(click.clickX, click.clickY, h))
    }))
    
    const correct = results.filter(r => r.correct && r.found).length
    const wrong = results.filter(r => !r.correct && r.found).length
    
    if (onComplete) {
      onComplete({
        correct,
        wrong,
        total: hotspots.filter(h => h.correct).length,
        results
      })
    }
  }

  const handleReset = () => {
    setClickedSpots([])
    setShowResults(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '16px', color: '#1a1a1a' }}>{title}</h3>
      
      <p style={{ marginBottom: '16px', color: '#666' }}>
        Кликните по рентгену в местах, где вы видите проблемы (кариес, киста, гранулема и т.д.)
      </p>
      
      <div 
        style={{ 
          position: 'relative', 
          cursor: showResults ? 'default' : 'crosshair',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <img 
          src={imageUrl} 
          alt="Рентген"
          onClick={handleImageClick}
          style={{ 
            width: '100%', 
            display: 'block',
            pointerEvents: showResults ? 'none' : 'auto'
          }}
        />
        
        {clickedSpots.map((spot, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${spot.clickX}%`,
              top: `${spot.clickY}%`,
              width: '24px',
              height: '24px',
              marginLeft: '-12px',
              marginTop: '-12px',
              borderRadius: '50%',
              background: showResults 
                ? (hotspots.some(h => checkHotspot(spot.clickX, spot.clickY, h) && h.correct) ? 'rgba(0,200,0,0.5)' : 'rgba(255,0,0,0.5)')
                : 'rgba(255,165,0,0.6)',
              border: showResults 
                ? (hotspots.some(h => checkHotspot(spot.clickX, spot.clickY, h) && h.correct) ? '2px solid #00aa00' : '2px solid #ff0000')
                : '2px solid #ff9900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#fff',
              fontWeight: 'bold'
            }}
          >
            {showResults && (hotspots.some(h => checkHotspot(spot.clickX, spot.clickY, h) && h.correct) ? '✓' : '✗')}
          </div>
        ))}
      </div>
      
      {showResults && (
        <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h4 style={{ marginTop: 0 }}>Результаты:</h4>
          <ul style={{ paddingLeft: '20px' }}>
            {hotspots.filter(h => h.correct).map((h, idx) => (
              <li key={idx} style={{ color: '#00aa00', marginBottom: '4px' }}>
                ✓ {h.diagnosis}
              </li>
            ))}
            {hotspots.filter(h => !h.correct).map((h, idx) => (
              <li key={idx} style={{ color: '#ff6600', marginBottom: '4px' }}>
                ↻ {h.diagnosis}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
        {!showResults ? (
          <button 
            onClick={handleSubmit}
            disabled={clickedSpots.length === 0}
            style={{
              padding: '12px 24px',
              background: clickedSpots.length > 0 ? '#1a1a1a' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: clickedSpots.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Проверить ({clickedSpots.length} точек)
          </button>
        ) : (
          <button 
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              background: '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Попробовать снова
          </button>
        )}
      </div>
    </div>
  )
}
