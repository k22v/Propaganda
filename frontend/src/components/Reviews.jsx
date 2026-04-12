import { useState, useEffect } from 'react'
import { reviewsApi } from '../api'
import { ToastContainer, useToast, withToastHandler } from './Toast'
import { ConfirmDialog } from './ConfirmDialog'

function Reviews({ courseId, isEnrolled, isSuperuser = false }) {
  const { toast, showToast, closeToast } = useToast()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ count: 0, average: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [myReview, setMyReview] = useState(null)
  const [form, setForm] = useState({ rating: 5, comment: '' })
  const [deleteReviewId, setDeleteReviewId] = useState(null)
  const [respondReviewId, setRespondReviewId] = useState(null)
  const [responseText, setResponseText] = useState('')

  const ANIMALS = [
    { id: 1, emoji: '🦊' }, { id: 2, emoji: '🐼' }, { id: 3, emoji: '🦁' },
    { id: 4, emoji: '🐯' }, { id: 5, emoji: '🐨' }, { id: 6, emoji: '🐸' },
    { id: 7, emoji: '🐵' }, { id: 8, emoji: '🦄' }, { id: 9, emoji: '🐲' },
    { id: 10, emoji: '🐙' }, { id: 11, emoji: '🦋' }, { id: 12, emoji: '🐢' },
    { id: 13, emoji: '🦩' }, { id: 14, emoji: '🐳' }, { id: 15, emoji: '🦉' },
    { id: 16, emoji: '🦅' },
  ]

  const getAvatarEmoji = (avatarId) => {
    if (!avatarId) return '👤'
    const animal = ANIMALS.find(a => a.id === avatarId)
    return animal?.emoji || '👤'
  }

  useEffect(() => {
    loadReviews()
  }, [courseId])

  const loadReviews = async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        reviewsApi.getByCourse(courseId),
        reviewsApi.getStats(courseId)
      ])
      setReviews(reviewsRes.data || [])
      setStats(statsRes.data || { count: 0, average: 0 })
      
      try {
        const myReviews = await reviewsApi.getMy()
        const mine = (myReviews.data || []).find(r => r.course_id === parseInt(courseId))
        setMyReview(mine)
      } catch (e) {}
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const wrappedApi = withToastHandler({
    submitReview: async () => {
      try {
        if (myReview) {
          await reviewsApi.update(myReview.id, form)
          showToast('Отзыв обновлён', 'success')
        } else {
          await reviewsApi.create({ course_id: courseId, ...form })
          showToast('Отзыв сохранён', 'success')
        }
        setShowForm(false)
        loadReviews()
      } catch (err) {
        const msg = err.response?.data?.detail || 'Ошибка сохранения'
        showToast(msg, 'error')
      }
    }
  }, showToast)

  const handleSubmit = (e) => {
    e.preventDefault()
    wrappedApi.submitReview()
  }

  const handleDelete = (id) => {
    setDeleteReviewId(id)
  }

  const renderStars = (rating, interactive = false, onSelect = () => {}) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map(n => (
          <span
            key={n}
            className={`star ${n <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && onSelect(n)}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  if (loading) return <div className="loading">Загрузка отзывов...</div>

  return (
    <div className="reviews-section">
      <ToastContainer toast={toast} onClose={closeToast} />
      <ConfirmDialog
        isOpen={deleteReviewId !== null}
        title="Удаление отзыва"
        message="Вы уверены, что хотите удалить этот отзыв?"
        confirmText="Удалить"
        danger={true}
        onConfirm={async () => {
          try {
            await reviewsApi.delete(deleteReviewId)
            loadReviews()
            setMyReview(null)
            showToast('Отзыв удалён', 'success')
          } catch (err) {
            showToast('Ошибка удаления', 'error')
          }
          setDeleteReviewId(null)
        }}
        onCancel={() => setDeleteReviewId(null)}
      />
      {respondReviewId && (
        <div className="respond-form">
          <h4>Ответ на отзыв</h4>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Введите ваш ответ..."
            rows={3}
          />
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setRespondReviewId(null)}>Отмена</button>
            <button className="btn btn-primary" onClick={async () => {
              try {
                await reviewsApi.respond(respondReviewId, responseText)
                showToast('Ответ добавлен', 'success')
                loadReviews()
              } catch (err) {
                showToast('Ошибка', 'error')
              }
              setRespondReviewId(null)
            }}>Отправить</button>
          </div>
        </div>
      )}
      <div className="reviews-header">
        <h3>Отзывы ({stats.count})</h3>
        {stats.count > 0 && (
          <div className="reviews-stats">
            {renderStars(Math.round(stats.average))}
            <span className="avg-rating">{stats.average.toFixed(1)}</span>
          </div>
        )}
      </div>

      {isEnrolled && (
        <div className="review-action">
          {myReview ? (
            <button className="btn btn-secondary" onClick={() => { setForm({ rating: myReview.rating, comment: myReview.comment || '' }); setShowForm(true) }}>
              Редактировать отзыв
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Написать отзыв
            </button>
          )}
        </div>
      )}

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Оценка</label>
            {renderStars(form.rating, true, (n) => setForm({ ...form, rating: n }))}
          </div>
          <div className="form-group">
            <label>Комментарий</label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Поделитесь впечатлениями о курсе..."
              rows={4}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Отмена</button>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </div>
        </form>
      )}

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">Пока нет отзывов. Будьте первым!</p>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="review-author">
                  <span className="author-avatar">
                    {getAvatarEmoji(review.user?.avatar_id)}
                  </span>
                  <span className="author-name">
                    {review.user?.full_name || review.user?.username || 'Пользователь'}
                  </span>
                </div>
                <div className="review-meta">
                  {renderStars(review.rating)}
                </div>
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
              {review.admin_response && (
                <div className="admin-response">
                  <strong>Ответ администратора:</strong>
                  <p>{review.admin_response}</p>
                </div>
              )}
              <div className="review-footer">
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString('ru-RU')}
                </span>
                <div className="review-actions">
                  {myReview?.id === review.id && (
                    <button className="btn-delete-review" onClick={() => handleDelete(review.id)}>Удалить</button>
                  )}
                  {isSuperuser && (
                    <>
                      {!review.admin_response && (
                        <button className="btn-respond-review" onClick={() => { setRespondReviewId(review.id); setResponseText('') }}>Ответить</button>
                      )}
                      <button className="btn-delete-review" onClick={() => handleDelete(review.id)}>🗑️</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .reviews-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--color-border);
        }
        .reviews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .reviews-header h3 { margin: 0; }
        .reviews-stats {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .avg-rating {
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        .review-action { margin-bottom: 1rem; }
        .review-form {
          background: var(--color-surface);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          margin-bottom: 1.5rem;
          border: 1px solid var(--color-border);
        }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg);
          color: var(--color-text);
          resize: vertical;
        }
        .form-actions { display: flex; gap: 0.75rem; }
        .stars-container { display: flex; gap: 0.25rem; }
        .star { font-size: 1.5rem; color: #ddd; cursor: default; }
        .star.filled { color: #ffc107; }
        .star.interactive { cursor: pointer; }
        .star.interactive:hover { color: #ffdb58; }
        .review-card {
          background: var(--color-surface);
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
          border: 1px solid var(--color-border);
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .review-author {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .author-avatar { font-size: 1.25rem; }
        .author-name { font-weight: 500; }
        .review-meta { display: flex; align-items: center; gap: 0.5rem; }
        .review-comment { margin: 0.5rem 0; color: var(--color-text); }
        .review-date { font-size: 0.85rem; color: var(--color-text-secondary); }
        .btn-delete-review {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0 0.25rem;
        }
        .no-reviews {
          text-align: center;
          color: var(--color-text-secondary);
          padding: 2rem;
        }
        .admin-response {
          background: var(--color-bg);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-top: 0.75rem;
          border-left: 3px solid #1a6ce8;
        }
        .admin-response strong { font-size: 0.85rem; color: #1a6ce8; }
        .admin-response p { margin: 0.25rem 0 0; font-size: 0.9rem; }
        .review-actions { display: flex; gap: 0.5rem; }
        .btn-respond-review {
          background: none;
          border: none;
          color: #1a6ce8;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0;
        }
        .btn-respond-review:hover { text-decoration: underline; }
        .respond-form {
          background: var(--color-surface);
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
          border: 1px solid var(--color-border);
        }
        .respond-form h4 { margin: 0 0 0.75rem; }
        .respond-form textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg);
          color: var(--color-text);
          resize: vertical;
          margin-bottom: 0.75rem;
        }
      `}</style>
    </div>
  )
}

export default Reviews
