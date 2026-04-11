import { useState, useRef } from 'react'

export default function DragDropUpload({ 
  onUpload, 
  accept = "*", 
  multiple = true, 
  maxSize = 10 * 1024 * 1024,
  label = "Перетащите файлы сюда или нажмите для выбора"
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({})
  const inputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    processFiles(selectedFiles)
  }

  const processFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`Файл ${file.name} слишком большой (макс. ${maxSize / 1024 / 1024}MB)`)
        return false
      }
      return true
    })
    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    
    const results = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress(prev => ({ ...prev, [i]: 0 }))
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100)
            setProgress(prev => ({ ...prev, [i]: percent }))
          }
        }
        
        const result = await new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText))
            } else {
              reject(new Error('Upload failed'))
            }
          }
          xhr.onerror = reject
          xhr.open('POST', '/api/upload')
          xhr.send(formData)
        })
        
        results.push(result)
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err)
      }
    }
    
    setUploading(false)
    if (onUpload) onUpload(results)
    setFiles([])
    setProgress({})
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="drag-drop-upload">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <div className="drop-zone-icon">📁</div>
        <p className="drop-zone-text">{label}</p>
        <p className="drop-zone-hint">Макс. размер: {maxSize / 1024 / 1024}MB</p>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatSize(file.size)}</span>
              </div>
              {uploading && progress[index] !== undefined && (
                <div className="upload-progress">
                  <div 
                    className="upload-progress-bar" 
                    style={{ width: `${progress[index]}%` }}
                  />
                </div>
              )}
              {!uploading && (
                <button 
                  className="btn-remove" 
                  onClick={(e) => { e.stopPropagation(); removeFile(index) }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          {!uploading && (
            <button className="btn btn-primary upload-btn" onClick={handleUpload}>
              Загрузить {files.length} файл(ов)
            </button>
          )}
          {uploading && (
            <button className="btn btn-secondary upload-btn" disabled>
              Загрузка...
            </button>
          )}
        </div>
      )}
    </div>
  )
}
