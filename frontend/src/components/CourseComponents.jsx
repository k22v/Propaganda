import { Link } from 'react-router-dom'
import { Card, Badge, Button, ProgressBar } from './ui/index.jsx'
import './CourseComponents.css'

export function CourseCard({ 
  course, 
  isEnrolled = false, 
  showProgress = false,
  onEnroll 
}) {
  const {
    id,
    title,
    description,
    cover_image,
    specialization,
    lessons_count = 0,
    progress = 0,
    is_published = true,
  } = course

  return (
    <Card className="course-card" padding="none">
      <Link to={`/courses/${id}`} className="course-card-link">
        <div className="course-card-cover">
          {cover_image ? (
            <img src={cover_image} alt={title} />
          ) : (
            <div className="course-card-placeholder" style={{ 
              backgroundColor: getSpecialtyColor(specialization) 
            }}>
              <span>{getSpecialtyIcon(specialization)}</span>
            </div>
          )}
          {specialization && (
            <Badge className="course-card-badge" variant={getSpecialtyVariant(specialization)}>
              {getSpecialtyLabel(specialization)}
            </Badge>
          )}
        </div>

        <div className="course-card-body">
          <h3 className="course-card-title">{title}</h3>
          
          {description && (
            <p className="course-card-description">{description}</p>
          )}

          <div className="course-card-meta">
            <span className="course-meta-item">
              <span>📚</span> {lessons_count} уроков
            </span>
          </div>

          {showProgress && isEnrolled && progress > 0 && (
            <div className="course-card-progress">
              <ProgressBar value={progress} size="sm" />
              <span className="progress-label">{progress}% завершено</span>
            </div>
          )}
        </div>
      </Link>

      <div className="course-card-footer">
        {isEnrolled ? (
          <Link to={`/courses/${id}`} className="btn btn-primary btn-block">
            {progress > 0 ? 'Продолжить' : 'Начать'}
          </Link>
        ) : (
          <Button 
            onClick={() => onEnroll?.(id)} 
            className="btn-block"
            disabled={!is_published}
          >
            Записаться
          </Button>
        )}
      </div>
    </Card>
  )
}

export function CourseCardCompact({ course, onClick }) {
  const { id, title, cover_image, specialization, progress = 0 } = course

  return (
    <Card className="course-card-compact" padding="none" onClick={onClick}>
      <div className="course-compact-cover">
        {cover_image ? (
          <img src={cover_image} alt={title} />
        ) : (
          <div className="course-card-placeholder" style={{ 
            backgroundColor: getSpecialtyColor(specialization) 
          }}>
            <span>{getSpecialtyIcon(specialization)}</span>
          </div>
        )}
      </div>
      <div className="course-compact-content">
        <h4>{title}</h4>
        <ProgressBar value={progress} size="sm" showText={false} />
        <span className="progress-label">{progress}%</span>
      </div>
    </Card>
  )
}

export function CourseGrid({ courses, isLoading, isEnrolled = false, onEnroll }) {
  if (isLoading) {
    return (
      <div className="courses-grid">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="course-card" padding="none">
            <div className="skeleton skeleton-card" />
            <div className="course-card-body">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" style={{ marginTop: '0.5rem' }} />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!courses || courses.length === 0) {
    return (
      <Card padding="lg">
        <div className="course-grid-empty">
          <span>📚</span>
          <h3>Курсы не найдены</h3>
          <p>Попробуйте изменить фильтры или поисковый запрос</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="courses-grid">
      {courses.map(course => (
        <CourseCard 
          key={course.id} 
          course={course}
          isEnrolled={isEnrolled}
          showProgress={isEnrolled}
          onEnroll={onEnroll}
        />
      ))}
    </div>
  )
}

function getSpecialtyLabel(specialization) {
  const labels = {
    dentist: 'Стоматолог',
    assistant: 'Ассистент',
    technician: 'Техник',
    clinic_admin: 'Администратор',
  }
  return labels[specialization] || specialization || ''
}

function getSpecialtyIcon(specialization) {
  const icons = {
    dentist: '🦷',
    assistant: '👩‍⚕️',
    technician: '🔧',
    clinic_admin: '🏥',
  }
  return icons[specialization] || '📚'
}

function getSpecialtyColor(specialization) {
  const colors = {
    dentist: '#3b82f6',
    assistant: '#10b981',
    technician: '#f59e0b',
    clinic_admin: '#8b5cf6',
  }
  return colors[specialization] || '#6366f1'
}

function getSpecialtyVariant(specialization) {
  const variants = {
    dentist: 'primary',
    assistant: 'success',
    technician: 'warning',
    clinic_admin: 'default',
  }
  return variants[specialization] || 'default'
}