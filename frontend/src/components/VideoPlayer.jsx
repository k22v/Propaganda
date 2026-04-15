import { useState, useRef, useEffect } from 'react'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

function VideoPlayer({ src, subtitles, poster }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showCaptions, setShowCaptions] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const controlsTimeout = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onLoadedMetadata = () => setDuration(video.duration)
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)
    }
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100)
      }
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('progress', onProgress)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('progress', onProgress)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return
      const video = videoRef.current
      if (!video) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'ArrowRight':
          e.preventDefault()
          video.currentTime = Math.min(video.duration, video.currentTime + 10)
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(v => Math.min(1, v + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(v => Math.max(0, v - 0.1))
          break
        case 'm':
          toggleMute()
          break
        case 'f':
          toggleFullscreen()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }, [speed])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.pause()
    } else {
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }

  const handleSeek = (e) => {
    const video = videoRef.current
    if (!video) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    video.currentTime = percent * video.duration
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000)
  }

  const skip = (seconds) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
  }

  return (
    <div 
      ref={containerRef}
      className="custom-video-player"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onClick={togglePlay}
        playsInline
      />
      
      {!playing && (
        <div className="play-overlay" onClick={togglePlay}>
          <div className="play-button-large">▶</div>
        </div>
      )}

      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
        <div className="progress-bar" onClick={handleSeek}>
          <div className="progress-buffered" style={{ width: `${buffered}%` }} />
          <div className="progress-played" style={{ width: `${progress}%` }} />
          <div className="progress-handle" style={{ left: `${progress}%` }} />
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button className="control-btn" onClick={togglePlay}>
              {playing ? '⏸' : '▶'}
            </button>
            
            <button className="control-btn" onClick={() => skip(-10)}>⏪</button>
            <button className="control-btn" onClick={() => skip(10)}>⏩</button>
            
            <div className="volume-control">
              <button className="control-btn" onClick={toggleMute}>
                {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
              />
            </div>

            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            {subtitles && subtitles.length > 0 && (
              <div className="captions-wrapper">
                <button 
                  className={`control-btn ${showCaptions ? 'active' : ''}`}
                  onClick={() => setShowCaptions(!showCaptions)}
                  title="Субтитры"
                >
                  CC
                </button>
                {showCaptions && (
                  <div className="captions-menu">
                    {subtitles.map((sub, i) => (
                      <button key={i} className="captions-option">
                        {sub.label || sub.lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="speed-wrapper">
              <button 
                className="control-btn speed-btn"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              >
                {speed}x
              </button>
              {showSpeedMenu && (
                <div className="speed-menu">
                  {SPEEDS.map(s => (
                    <button 
                      key={s}
                      className={speed === s ? 'active' : ''}
                      onClick={() => {
                        setSpeed(s)
                        setShowSpeedMenu(false)
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="control-btn" onClick={toggleFullscreen} title="Полноэкранный режим (F)">
              ⛶
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-video-player {
          position: relative;
          width: 100%;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }

        .custom-video-player video {
          width: 100%;
          display: block;
          cursor: pointer;
        }

        .play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.3);
          cursor: pointer;
        }

        .play-button-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: #333;
          transition: transform 0.2s;
        }

        .play-overlay:hover .play-button-large {
          transform: scale(1.1);
        }

        .video-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          padding: 40px 12px 12px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .video-controls.visible {
          opacity: 1;
        }

        .progress-bar {
          position: relative;
          height: 4px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          cursor: pointer;
          margin-bottom: 10px;
        }

        .progress-bar:hover {
          height: 6px;
        }

        .progress-buffered {
          position: absolute;
          height: 100%;
          background: rgba(255,255,255,0.5);
          border-radius: 2px;
        }

        .progress-played {
          position: absolute;
          height: 100%;
          background: #e11d48;
          border-radius: 2px;
        }

        .progress-handle {
          position: absolute;
          top: 50%;
          width: 12px;
          height: 12px;
          background: #e11d48;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .progress-bar:hover .progress-handle {
          opacity: 1;
        }

        .controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .controls-left, .controls-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-btn {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          opacity: 0.9;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: rgba(255,255,255,0.2);
          opacity: 1;
        }

        .control-btn.active {
          color: #e11d48;
        }

        .volume-control {
          display: flex;
          align-items: center;
        }

        .volume-slider {
          width: 0;
          opacity: 0;
          transition: all 0.3s;
          accent-color: #e11d48;
        }

        .volume-control:hover .volume-slider {
          width: 80px;
          opacity: 1;
          margin-left: 4px;
        }

        .time-display {
          color: white;
          font-size: 13px;
          opacity: 0.9;
          margin-left: 8px;
        }

        .speed-wrapper, .captions-wrapper {
          position: relative;
        }

        .speed-btn {
          font-size: 14px;
          min-width: 40px;
        }

        .speed-menu, .captions-menu {
          position: absolute;
          bottom: 100%;
          right: 0;
          background: rgba(0,0,0,0.9);
          border-radius: 8px;
          padding: 8px 0;
          margin-bottom: 8px;
          min-width: 80px;
        }

        .speed-menu button, .captions-menu button {
          display: block;
          width: 100%;
          padding: 8px 16px;
          text-align: center;
          color: white;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }

        .speed-menu button:hover, .captions-menu button:hover {
          background: rgba(255,255,255,0.1);
        }

        .speed-menu button.active {
          color: #e11d48;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default VideoPlayer