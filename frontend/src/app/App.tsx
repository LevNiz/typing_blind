import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import TrainTextPage from '@/pages/TrainTextPage'
import TrainCodePage from '@/pages/TrainCodePage'
import TextsPage from '@/pages/TextsPage'
import LeaderboardPage from '@/pages/LeaderboardPage'
import ProfilePage from '@/pages/ProfilePage'
import AdminPanel from '@/pages/AdminPanel'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="train/text"
          element={
            <ProtectedRoute>
              <TrainTextPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="train/code"
          element={
            <ProtectedRoute>
              <TrainCodePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="texts"
          element={
            <ProtectedRoute>
              <TextsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          }
        />
        <Route
          index
          element={
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold mb-4">Добро пожаловать!</h1>
              <p className="text-foreground-secondary">Выберите раздел в меню</p>
            </div>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
