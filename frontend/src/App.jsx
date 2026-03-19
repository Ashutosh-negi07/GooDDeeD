import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ExploreCausesPage from './pages/ExploreCausesPage'
import CauseDetailPage from './pages/CauseDetailPage'
import MyTasksPage from './pages/MyTasksPage'
import MyCausesPage from './pages/MyCausesPage'
import ManageCausePage from './pages/ManageCausePage'
import ProfilePage from './pages/ProfilePage'
import CreateCausePage from './pages/CreateCausePage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/explore" element={<ExploreCausesPage />} />
          <Route path="/causes/create" element={
            <ProtectedRoute>
              <CreateCausePage />
            </ProtectedRoute>
          } />
          <Route path="/causes/:id" element={<CauseDetailPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/tasks" element={
            <ProtectedRoute>
              <MyTasksPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/causes" element={
            <ProtectedRoute>
              <MyCausesPage />
            </ProtectedRoute>
          } />
          <Route path="/cause/:id/manage" element={
            <ProtectedRoute>
              <ManageCausePage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
