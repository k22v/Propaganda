import { useEffect, useRef } from 'react'

function MapWidget() {
  const mapRef = useRef(null)
  const isLoaded = useRef(false)

  useEffect(() => {
    if (isLoaded.current) return
    isLoaded.current = true

    const loadMap = () => {
      if (!window.ymaps) {
        const script = document.createElement('script')
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY_HERE&lang=ru_RU'
        script.onload = () => initMap()
        document.head.appendChild(script)
      } else {
        initMap()
      }
    }

    const initMap = () => {
      window.ymaps.ready(() => {
        const map = new window.ymaps.Map(mapRef.current, {
          center: [48.4927, 135.0803],
          zoom: 16,
          controls: ['zoomControl', 'fullscreenControl']
        })

        const placemark = new window.ymaps.Placemark(
          [48.4927, 135.0803],
          {
            balloonContentHeader: 'Пропаганда ДВ',
            balloonContentBody: 'Хабаровск, Ленинградская 53к1',
            balloonContentFooter: 'Стоматологическая клиника'
          },
          {
            preset: 'islands#dotIcon',
            iconColor: '#0070ff'
          }
        )

        map.geoObjects.add(placemark)
      })
    }

    loadMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = ''
      }
    }
  }, [])

  return (
    <div className="map-container">
      <div ref={mapRef} id="ymap" style={{ width: '100%', height: '200px', borderRadius: '8px' }} />
      <a 
        href="https://yandex.ru/maps/76/khabarovsk/?ll=135.0803%2C48.4927&z=16"
        target="_blank"
        rel="noopener noreferrer"
        className="map-link"
      >
        Открыть на Яндекс.Картах →
      </a>
    </div>
  )
}

export default MapWidget