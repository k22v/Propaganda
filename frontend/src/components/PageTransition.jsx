import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

export function AnimatedRoutes({ children }) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(null)

  useEffect(() => {
    setDisplayLocation(location)
  }, [location])

  if (!displayLocation) {
    return children
  }

  return (
    <div className="page-transition fadeIn">
      {children}
    </div>
  )
}

export function PrefetchLink({ to, children, className, onClick }) {
  const [prefetched, setPrefetched] = useState(false)

  const handleMouseEnter = () => {
    if (!prefetched) {
      setPrefetched(true)
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = to
      document.head.appendChild(link)
    }
  }

  return (
    <a 
      href={to} 
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
    >
      {children}
    </a>
  )
}