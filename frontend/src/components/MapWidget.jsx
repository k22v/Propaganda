function MapWidget() {
  return (
    <div className="footer-map-interactive">
      <iframe
        src="https://yandex.ru/map-widget/v1/?um=constructor%3A0&source=constructor&ll=135.079861%2C48.492971&z=16&pt=135.079861%2C48.492971%2Cpm2rdm"
        width="100%"
        height="100%"
        frameBorder="0"
        title="Карта офиса"
      ></iframe>
    </div>
  )
}

export default MapWidget
