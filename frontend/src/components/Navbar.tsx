import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

function Navbar() {
  const location = useLocation()
  const { isAuthenticated, user, logout, isLoggingOut } = useAuth()

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: '/train/text', label: 'Тренировка (текст)' },
    { path: '/train/code', label: 'Тренировка (код)' },
    { path: '/texts', label: 'Тексты' },
    { path: '/leaderboard', label: 'Рейтинг' },
  ]

  return (
    <nav className="border-b border-foreground-secondary/20 bg-background-secondary">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="text-xl font-semibold text-foreground hover:text-foreground-secondary transition-colors"
          >
            Тренажёр печати
          </Link>

          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'text-foreground'
                        : 'text-foreground-secondary hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/profile"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/profile')
                      ? 'text-foreground'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {user?.username || 'Профиль'}
                </Link>
                <button
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? 'Выход...' : 'Выход'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/login')
                      ? 'text-foreground'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  Вход
                </Link>
                <Link
                  to="/register"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/register')
                      ? 'text-foreground'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
