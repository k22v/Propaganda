import { useEffect } from 'react'

export default function Dental3DViewer({ 
  modelUrl, 
  hotspots = [],
  autoRotate = true,
  cameraControls = true,
  ar = false
}) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js'
    document.head.appendChild(script)
    
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div style={{ 
      width: '100%', 
      height: '500px', 
      background: '#f5f5f5',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <model-viewer
        src={modelUrl}
        alt="3D-модель"
        autoRotate={autoRotate}
        cameraControls={cameraControls}
        ar={ar}
        ar-modes="webxr scene-viewer quick-look"
        style={{ width: '100%', height: '100%' }}
        shadow-intensity="1"
        exposure="0.8"
        environment-image="neutral"
      >
        {hotspots.map((hotspot, idx) => (
          <button
            key={idx}
            slot={`hotspot-${idx + 1}`}
            data-position={hotspot.position}
            data-normal={hotspot.normal}
            style={{
              background: '#fff',
              border: '2px solid #1a1a1a',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={hotspot.label}
          >
            {idx + 1}
          </button>
        ))}
        
        <div slot="progress-bar" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '50%',
          height: '4px',
          background: '#ddd',
          borderRadius: '2px'
        }}>
          <div style={{
            width: '0%',
            height: '100%',
            background: '#1a1a1a',
            borderRadius: '2px',
            transition: 'width 0.3s'
          }} />
        </div>
      </model-viewer>
      
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px'
      }}>
        🖱️ Вращайте: зажмите + двигайте
        <br />
        🔍 Приближать: колесико
        <br />
        📱 AR: кнопка справа снизу
      </div>
    </div>
  )
}
