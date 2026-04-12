import axios from 'axios'

const TOKEN_KEY = 'access_token'

const getToken = () => localStorage.getItem(TOKEN_KEY)
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
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
    }).then(res => {
      if (res.data.access_token) {
        setToken(res.data.access_token)
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
  getAll: (skip = 0, limit = 12, specialization = null) => {
    let url = `/courses/?skip=${skip}&limit=${limit}`
    if (specialization) url += `&specialization=${specialization}`
    return api.get(url)
  },
  getMy: () => api.get('/courses/my'),
  getMyCourses: () => api.get('/courses/my'),
  getOne: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses/', data),
  update: (id, data) => api.patch(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  uploadFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/courses/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // Sections
  createSection: (courseId, data) => api.post(`/courses/${courseId}/sections`, data),
  deleteSection: (courseId, sectionId) => api.delete(`/courses/${courseId}/sections/${sectionId}`),
  reorderSections: (courseId, data) => api.post(`/courses/${courseId}/sections/reorder`, data),
  reorderChapters: (courseId, data) => api.post(`/courses/${courseId}/chapters/reorder`, data),
  reorderContents: (courseId, data) => api.post(`/courses/${courseId}/contents/reorder`, data),
  
  // Chapters
  createChapter: (courseId, data) => api.post(`/courses/${courseId}/chapters`, data),
  deleteChapter: (courseId, chapterId) => api.delete(`/courses/${courseId}/chapters/${chapterId}`),
  
  // Contents
  createContent: (courseId, data) => api.post(`/courses/${courseId}/contents`, data),
  updateContent: (courseId, contentId, data) => api.patch(`/courses/${courseId}/contents/${contentId}`, data),
  deleteContent: (courseId, contentId) => api.delete(`/courses/${courseId}/contents/${contentId}`),
  getContent: (courseId, contentId) => api.get(`/courses/${courseId}/contents/${contentId}`),
  
  enroll: (id) => api.post(`/courses/${id}/enroll`),
}

export const quizApi = {
  getByLesson: (lessonId) => api.get(`/quizzes/lesson/${lessonId}`),
  getOne: (quizId) => api.get(`/quizzes/${quizId}`),
  create: (data) => api.post('/quizzes/', data),
  submit: (quizId, answers) => api.post(`/quizzes/${quizId}/attempt`, { answers }),
  getBestAttempt: (quizId) => api.get(`/quizzes/attempt/${quizId}/best`),
}

export const templatesApi = {
  getAll: () => api.get('/templates/'),
  create: (data) => api.post('/templates/', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
}

export const instrumentsApi = {
  getAll: (params) => api.get('/instruments/', { params }),
  getOne: (id) => api.get(`/instruments/${id}`),
  getCategories: () => api.get('/instruments/categories'),
  create: (data) => api.post('/instruments/', data),
  update: (id, data) => api.patch(`/instruments/${id}`, data),
  delete: (id) => api.delete(`/instruments/${id}`),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/instruments/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

export const practiceApi = {
  getQuestions: (courseId) => api.get(`/practice/course/${courseId}`),
  getRandomQuestion: (courseId) => api.get(`/practice/course/${courseId}/random`),
  create: (data) => api.post('/practice/', data),
  update: (id, data) => api.patch(`/practice/${id}`, data),
  delete: (id) => api.delete(`/practice/${id}`),
}

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  updateUserSpecialization: (id, specialization) => api.patch(`/admin/users/${id}/specialization`, { specialization }),
  toggleUserBlock: (id) => api.patch(`/admin/users/${id}/block`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getQuizResults: () => api.get('/admin/quiz-results'),
}

export const commentsApi = {
  getByLesson: (lessonId) => api.get(`/comments/lesson/${lessonId}`),
  create: (data) => api.post('/comments/', data),
  delete: (id) => api.delete(`/comments/${id}`),
}

export const reviewsApi = {
  getByCourse: (courseId) => api.get(`/reviews/course/${courseId}`),
  getStats: (courseId) => api.get(`/reviews/course/${courseId}/stats`),
  create: (data) => api.post('/reviews/', data),
  update: (id, data) => api.patch(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  respond: (id, response) => api.post(`/reviews/${id}/respond`, { response }),
  getMy: () => api.get('/reviews/my'),
}

export { api }
export default api
