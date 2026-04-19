import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { authApi, clearToken } from './api'
import Layout from './components/Layout'
import Loader from './components/Loader'
import { LoadingProvider } from './components/LoadingContext'
import { ShortcutsHelp } from './hooks/useKeyboardShortcuts.jsx'
import { useTheme } from './context/ThemeContext'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Landing = lazy(() => import('./pages/Landing'))
const Courses = lazy(() => import('./pages/Courses'))
const MyCourses = lazy(() => import('./pages/MyCourses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const CreateCourse = lazy(() => import('./pages/CreateCourse'))
const LessonView = lazy(() => import('./pages/LessonView'))
const CreateQuiz = lazy(() => import('./pages/CreateQuiz'))
const QuizView = lazy(() => import('./pages/QuizView'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Glossary = lazy(() => import('./pages/Glossary'))
const InstrumentDetail = lazy(() => import('./pages/InstrumentDetail'))
const PracticeQuestions = lazy(() => import('./pages/PracticeQuestions'))
const Builder = lazy(() => import('./pages/Builder'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const { toggleTheme } = useTheme() || {}

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return
      }
      
      if (e.key === '?') {
        setShowHelp(prev => !prev)
      }
      
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        if (toggleTheme) toggleTheme()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleTheme])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data } = await authApi.getMe()
      setCurrentUser(data)
      setIsAuthenticated(true)
    } catch (err) {
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    clearToken()
    try {
      await authApi.logout?.()
    } catch (err) {}
    setIsAuthenticated(false)
    setCurrentUser(null)
  }

  const handleLogin = async () => {
    try {
      const { data } = await authApi.getMe()
      setCurrentUser(data)
      setIsAuthenticated(true)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const isSuperuser = !!currentUser && (
    currentUser.is_superuser === true || 
    currentUser.is_superuser === 1 ||
    currentUser.role === 'admin' ||
    currentUser.role === 'teacher'
  )
  const isAdmin = !!currentUser && (currentUser.role === 'admin' || currentUser.is_superuser === true)

  if (loading) return <Loader />

return (
    <BrowserRouter>
      <LoadingProvider>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            <Route path="/" element={<Layout isAuthenticated={isAuthenticated} onLogout={handleLogout} onLogin={handleLogin} />} >
              <Route index element={<Landing isAuthenticated={isAuthenticated} currentUser={currentUser} />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/my-courses" element={isAuthenticated ? <MyCourses /> : <Navigate to="/login" />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/:courseId/content/:contentId" element={<LessonView />} />
              <Route path="/courses/:courseId/quiz/:quizId" element={isAuthenticated ? <QuizView /> : <Navigate to="/login" />} />
              <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/create" element={isSuperuser ? <CreateCourse /> : <NotFound />} />
              <Route path="/builder/:courseId" element={isSuperuser ? <Builder /> : <NotFound />} />
              <Route path="/builder/:courseId/page/:pageId" element={isSuperuser ? <Builder /> : <NotFound />} />
              <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <NotFound />} />
              <Route path="/glossary" element={<Glossary />} />
              <Route path="/glossary/:id" element={<InstrumentDetail />} />
              <Route path="/courses/:courseId/practice" element={<PracticeQuestions />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
        <ShortcutsHelp show={showHelp} onClose={() => setShowHelp(false)} />
      </LoadingProvider>
    </BrowserRouter>
  )
}

export default App