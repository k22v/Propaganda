import axios from 'axios'

const TOKEN_KEY = 'access_token'

export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthCheck = error.config?.url === '/auth/me'
      if (!isAuthCheck && !window.location.pathname.startsWith('/login')) {
        clearToken()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data) => api.post('/auth/register', data),

  login: (data) => {
    const formData = new URLSearchParams()
    formData.append('username', data.username)
    formData.append('password', data.password)

    if (data.remember_me) {
      formData.append('scope', 'remember_me')
    }

    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then((res) => {
      if (res.data.access_token) {
        localStorage.setItem(TOKEN_KEY, res.data.access_token)
      }
      return res
    })
  },

  logout: () => {
    clearToken()
    return api.post('/auth/logout')
  },

  getMe: () => api.get('/auth/me'),
  getProfileStats: () => api.get('/auth/profile-stats'),
  updateAvatar: (avatarId) => api.put('/auth/avatar', { avatar_id: avatarId }),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
}

export const coursesApi = {
  getAll: (params) => api.get('/courses/', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getMy: () => api.get('/courses/my'),
  create: (data) => api.post('/courses/', data),
  update: (id, data) => api.patch(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  enroll: (id) => api.post(`/courses/${id}/enroll`),
  unenroll: (id) => api.delete(`/courses/${id}/enroll`),
  createSection: (courseId, data) => api.post(`/courses/${courseId}/sections`, data),
  updateSection: (courseId, sectionId, data) => api.patch(`/courses/${courseId}/sections/${sectionId}`, data),
  deleteSection: (courseId, sectionId) => api.delete(`/courses/${courseId}/sections/${sectionId}`),
  createChapter: (courseId, data) => api.post(`/courses/${courseId}/chapters`, data),
  updateChapter: (courseId, chapterId, data) => api.patch(`/courses/${courseId}/chapters/${chapterId}`, data),
  deleteChapter: (courseId, chapterId) => api.delete(`/courses/${courseId}/chapters/${chapterId}`),
  createContent: (courseId, data) => api.post(`/courses/${courseId}/contents`, data),
  updateContent: (courseId, contentId, data) => api.patch(`/courses/${courseId}/contents/${contentId}`, data),
  deleteContent: (courseId, contentId) => api.delete(`/courses/${courseId}/contents/${contentId}`),
  reorderContent: (courseId, data) => api.post(`/courses/${courseId}/reorder-content`, data),
  getContent: (courseId, contentId) => api.get(`/courses/${courseId}/contents/${contentId}`),
}

export const quizzesApi = {
  getById: (id) => api.get(`/quizzes/${id}`),
  getOne: (id) => api.get(`/quizzes/${id}`),
  getByLesson: (lessonId) => api.get(`/quizzes/lesson/${lessonId}`),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  getResults: (attemptId) => api.get(`/quizzes/results/${attemptId}`),
}

export const quizApi = quizzesApi

export const reviewsApi = {
  getByCourse: (courseId) => api.get(`/reviews/course/${courseId}`),
  getStats: (courseId) => api.get(`/reviews/course/${courseId}/stats`),
  getMy: () => api.get('/reviews/my'),
  create: (data) => api.post('/reviews/', data),
  update: (id, data) => api.patch(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  respond: (reviewId, response) => api.post(`/reviews/${reviewId}/respond`, { response }),
}

export const commentsApi = {
  getByLesson: (lessonId) => api.get(`/comments/lesson/${lessonId}`),
  create: (data) => api.post('/comments/', data),
  delete: (id) => api.delete(`/comments/${id}`),
}

export const templatesApi = {
  getAll: () => api.get('/templates/'),
  create: (data) => api.post('/templates/', data),
  update: (id, data) => api.patch(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
}

export const notificationsApi = {
  getAll: () => api.get('/notifications/'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/mark-read/${id}`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
}

export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getStats: () => api.get('/admin/stats'),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
  updateUserRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
  toggleBlock: (id) => api.patch(`/admin/users/${id}/block`),
  toggleUserBlock: (id) => api.patch(`/admin/users/${id}/block`),
  updateUserSpecialization: (id, specialization) => api.patch(`/admin/users/${id}/specialization`, { specialization }),
}

export const instrumentsApi = {
  getAll: (params) => api.get('/instruments/', { params }),
  getById: (id) => api.get(`/instruments/${id}`),
  getOne: (id) => api.get(`/instruments/${id}`),
  create: (data) => api.post('/instruments/', data),
  update: (id, data) => api.patch(`/instruments/${id}`, data),
  delete: (id) => api.delete(`/instruments/${id}`),
}

export const practiceApi = {
  getQuestions: (courseId) => api.get(`/practice/course/${courseId}`),
  getQuestion: (id) => api.get(`/practice/${id}`),
  create: (data) => api.post('/practice/', data),
  update: (id, data) => api.patch(`/practice/${id}`, data),
  delete: (id) => api.delete(`/practice/${id}`),
}

export const learningPathsApi = {
  getAll: (params) => api.get('/learning-paths/', { params }),
  getById: (id) => api.get(`/learning-paths/${id}`),
  create: (data) => api.post('/learning-paths/', data),
  updateCourses: (id, courses) => api.put(`/learning-paths/${id}/courses`, courses),
}

export const certificatesApi = {
  getMy: () => api.get('/certificates/my'),
  verify: (code) => api.post('/certificates/verify', { verification_code: code }),
  issue: (courseId, userId) => api.post('/certificates/issue', { course_id: courseId, user_id: userId }),
}

export const builderApi = {
  getTree: (courseId) => api.get(`/builder/courses/${courseId}/tree`),
  createSection: (courseId, data) => api.post(`/builder/courses/${courseId}/sections`, data),
  updateSection: (courseId, sectionId, data) => api.patch(`/builder/courses/${courseId}/sections/${sectionId}`, data),
  deleteSection: (courseId, sectionId) => api.delete(`/builder/courses/${courseId}/sections/${sectionId}`),
  reorderSections: (courseId, data) => api.post(`/builder/courses/${courseId}/sections/reorder`, data),
  createPage: (sectionId, data) => api.post(`/builder/sections/${sectionId}/pages`, data),
  updatePage: (pageId, data) => api.patch(`/builder/pages/${pageId}`, data),
  deletePage: (pageId) => api.delete(`/builder/pages/${pageId}`),
  reorderPages: (sectionId, data) => api.post(`/builder/sections/${sectionId}/pages/reorder`, data),
  getPage: (pageId) => api.get(`/builder/pages/${pageId}`),
  createBlock: (pageId, data) => api.post(`/builder/pages/${pageId}/blocks`, data),
  updateBlock: (blockId, data) => api.patch(`/builder/blocks/${blockId}`, data),
  deleteBlock: (blockId) => api.delete(`/builder/blocks/${blockId}`),
  bulkBlocks: (data) => api.post(`/builder/blocks/bulk`, data),
  getThemes: () => api.get('/builder/themes'),
  createTheme: (data) => api.post('/builder/themes', data),
}

export { api }
export default api
