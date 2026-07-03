import { useState, useEffect } from 'react'
import { isAuthenticated, getUser } from '../utils/auth'
import LoginPage from './LoginPage'

const ProtectedRoute = ({ children, onLogin, requiredRole = null }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      if (isAuthenticated()) {
        const userData = getUser()
        setUser(userData)
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
        setUser(null)
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogin = (userData) => {
    setIsLoggedIn(true)
    setUser(userData)
    if (onLogin) {
      onLogin(userData)
    }
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole && !user?.role?.includes?.(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  // Render protected content
  return children
}

export default ProtectedRoute

