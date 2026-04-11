import { useState, useEffect } from 'react'

function Loader() {
  return (
    <div className="loader-overlay">
      <div className="loader-content">
        <div className="loader-logo">
          {"Пропаганда ДВ".split("").map((char, i) => (
            <span 
              key={i} 
              className="loader-char"
              style={{
                animationDelay: `${i * 0.08}s`
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>
        <div className="loader-spinner"></div>
        <p className="loader-text">Загрузка...</p>
      </div>
    </div>
  )
}

export default Loader
