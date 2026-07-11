import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt,
  ClipboardList,
  Wallet,
  Menu,
  X,
  Home,
  ChevronLeft,
  ChevronRight,
  Users,
  LogOut,
  Stethoscope,
  Settings as SettingsIcon,
  UserCheck,
  BarChart3,
  HeartHandshake,
  BadgePercent
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import logo from './assets/logo2.png'
import circlelogo from './assets/circlelogo.png'
import './App.css'

// Import components
import Dashboard from './components/Dashboard'
import Receipts from './components/Receipts'
import TransactionHistory from './components/TransactionHistory'
import Expenses from './components/Expenses'
import Services from './components/Services'
import Employee from './components/Employee'
import DiscountEnrollees from './components/DiscountEnrollees'
import YakapEnrollees from './components/YakapEnrollees'
import AttendanceLog from './components/AttendanceLog'
import SalesReport from './components/SalesReport'
import Settings from './components/Settings'
import LoginPage from './components/LoginPage'
import { logout, isAuthenticated, getUser } from './utils/auth'

// Navigation items with role-based access
const navigationItems = [
  { path: '/', icon: Home, label: 'Dashboard', color: 'text-white', roles: ['admin', 'staff', 'super_admin'] },
  { path: '/receipts', icon: Receipt, label: 'New Receipt', color: 'text-white', roles: ['admin', 'staff', 'super_admin'] },
  { path: '/transactions', icon: ClipboardList, label: 'Transaction History', color: 'text-white', roles: ['admin', 'staff', 'super_admin'] },
  { path: '/sales-report', icon: BarChart3, label: 'Sales Report', color: 'text-white', roles: ['admin', 'super_admin'] },
  { path: '/expenses', icon: Wallet, label: 'Daily Expenses', color: 'text-white', roles: ['admin', 'staff', 'super_admin'] },
  { path: '/services', icon: Stethoscope, label: 'Services', color: 'text-white', roles: ['admin', 'staff', 'super_admin'] },
  { path: '/discount-enrollees', icon: BadgePercent, label: 'Discounts', color: 'text-white', roles: ['admin', 'super_admin'] },
  { path: '/yakap-enrollees', icon: HeartHandshake, label: 'Yakap Enrollees', color: 'text-white', roles: ['admin', 'super_admin'] },
  { path: '/employees', icon: Users, label: 'Employee Management', color: 'text-white', roles: ['super_admin'] },
  { path: '/attendance', icon: UserCheck, label: 'Attendance Log', color: 'text-white', roles: ['admin', 'super_admin'] },
  { path: '/settings', icon: SettingsIcon, label: 'Settings', color: 'text-white', roles: ['admin', 'staff', 'super_admin'] },
  ]

function Sidebar({ isCollapsed, toggleSidebar, onLogout, isMobile, closeMobileSidebar, userRole }) {
  const location = useLocation()

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed && !isMobile ? 80 : isMobile && !isCollapsed ? '100%' : 280, x: isMobile && isCollapsed ? '-100%' : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-full bg-[var(--color-sidebar)] border-r border-[var(--color-sidebar-border)] z-50 flex flex-col"
    >
      {/* Header with toggle button */}
      <div className="border-b border-[var(--color-sidebar-border)] bg-white">
        {(!isCollapsed || isMobile) ? (
          <div className="flex items-center justify-between gap-2 px-4 py-3 min-h-[76px]">
            <img
              src={logo}
              alt="DPCY Healthcare"
              className="h-14 w-auto max-w-[220px] object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 shrink-0 self-start rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 h-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 h-8 w-8 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <img src={circlelogo} alt="DPCY Healthcare" className="h-12 w-12 object-contain" />
          </div>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-2 space-y-1">
        {filteredNavItems.map((item, index) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 + 0.1 }}
            >
              <Link to={item.path} onClick={isMobile ? closeMobileSidebar : undefined}>
              <motion.div
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-white text-[#064e3b] border border-[#064e3b]'
                    : 'hover:bg-[var(--color-sidebar-accent)]/50 text-white'
                }`}

                >

                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-[#064e3b]' : item.color}`} />

                  <AnimatePresence mode="wait">
                    {(!isCollapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`font-medium whitespace-nowrap ${isActive ? 'text-[#064e3b]' : 'text-[var(--color-sidebar-foreground)]'}`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active indicator */}
                  {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute right-2 w-2 h-2 rounded-full bg-[#064e3b]`}
                  />
                )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && !isMobile && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--color-sidebar-accent)] text-[var(--color-sidebar-accent-foreground)] text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </motion.div>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Logout Button */}
<div className="p-2 border-t border-[var(--color-sidebar-border)]">
  <motion.button
    whileHover={{ scale: 1.02, x: 2 }}
    whileTap={{ scale: 0.96, boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.35)' }}
    onClick={onLogout}
    className="relative flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group w-full hover:bg-[var(--color-destructive)]/20 text-white"
  >
    <LogOut className="h-5 w-5 flex-shrink-0 text-white" />

    {/* Animated Logout Text (only if expanded) */}
    <AnimatePresence mode="wait">
      {(!isCollapsed || isMobile) && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="font-medium whitespace-nowrap"
        >
          Logout
        </motion.span>
      )}
    </AnimatePresence>

    {/* Tooltip for collapsed state */}
    {isCollapsed && !isMobile && (
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[var(--color-sidebar-accent)] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
        Logout
      </div>
    )}
  </motion.button>
</div>

      {/* Footer status indicator */}
      <div className="p-4 border-t border-[var(--color-sidebar-border)]">
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5 }}
    className={`${isCollapsed && !isMobile ? 'flex justify-center' : ''}`}
  >
    {isCollapsed && !isMobile ? (
      <div className="flex flex-col space-y-1">
        <div className="w-2 h-2 bg-[var(--color-chart-1)] rounded-full animate-pulse"></div>
        <div
          className="w-2 h-2 bg-[var(--color-chart-2)] rounded-full animate-pulse"
          style={{ animationDelay: '0.2s' }}
        ></div>
        <div
          className="w-2 h-2 bg-[var(--color-chart-3)] rounded-full animate-pulse"
          style={{ animationDelay: '0.4s' }}
        ></div>
      </div>
    ) : (
      <div className="p-3 bg-[var(--color-sidebar-accent)]/10 rounded-lg border border-[var(--color-sidebar-border)] text-sm text-white text-center">
        <p>
          Made with <span className="text-red-500">❤</span><span className="font-semibold"></span>
        </p>
      </div>
    )}
  </motion.div>
</div>

    </motion.div>
  )
}

function MainContent({ sidebarCollapsed, onLogout, isMobile, userRole }) {
  const location = useLocation()

  // Role-based route protection
  const ProtectedComponent = ({ component: Component, allowedRoles }) => {
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }
    return <Component />
  }

  return (
    <motion.main
      initial={false}
      animate={{
        marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 280),
        width: isMobile ? '100%' : (sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)')
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="min-h-screen"
    >
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="p-3 md:p-6"
      >
        <Routes>
          {/* Admin routes */}
          <Route path="/" element={<ProtectedComponent component={Dashboard} allowedRoles={['admin', 'staff', 'super_admin']} />} />
          <Route path="/receipts" element={<ProtectedComponent component={Receipts} allowedRoles={['admin', 'staff', 'super_admin']} />} />
          <Route path="/transactions" element={<ProtectedComponent component={TransactionHistory} allowedRoles={['admin', 'staff', 'super_admin']} />} />
          <Route path="/sales-report" element={<ProtectedComponent component={SalesReport} allowedRoles={['admin', 'super_admin']} />} />
          <Route path="/expenses" element={<ProtectedComponent component={Expenses} allowedRoles={['admin', 'staff', 'super_admin']} />} />
          <Route path="/services" element={<ProtectedComponent component={Services} allowedRoles={['admin', 'staff', 'super_admin']} />} />
          <Route path="/discount-enrollees" element={<ProtectedComponent component={DiscountEnrollees} allowedRoles={['admin', 'super_admin']} />} />
          <Route path="/yakap-enrollees" element={<ProtectedComponent component={YakapEnrollees} allowedRoles={['admin', 'super_admin']} />} />
          <Route path="/employees" element={<ProtectedComponent component={Employee} allowedRoles={['super_admin']} />} />
          <Route path="/attendance" element={<ProtectedComponent component={AttendanceLog} allowedRoles={['admin', 'super_admin']} />} />
          <Route path="/settings" element={<ProtectedComponent component={Settings} allowedRoles={['admin', 'staff', 'super_admin']} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </motion.main>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = () => {
      if (isAuthenticated()) {
        const userData = getUser()
        setIsLoggedIn(true)
        setUser(userData)
      } else {
        setIsLoggedIn(false)
        setUser(null)
      }
      setLoading(false)
    }

    checkAuth()

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true) // Collapse sidebar by default on mobile
    } else {
      setSidebarCollapsed(false) // Expand sidebar by default on desktop
    }
  }, [isMobile])

  const handleLogin = (userData) => {
    setIsLoggedIn(true)
    setUser(userData)
  }

  const handleLogout = async () => {
    await logout()
    setIsLoggedIn(false)
    setUser(null)
    setSidebarCollapsed(false)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // Always show login page if not authenticated
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <Router>
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
        {isLoggedIn && isMobile && (
          <div className="mobile-menu-button-container">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mobile-menu-button"
            >
              {sidebarCollapsed ? <Menu className="h-6 w-6" /> : <X className="h-6 w-6" />}
            </Button>
          </div>
        )}
        
        <Sidebar
          isCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          onLogout={handleLogout}
          isMobile={isMobile}
          closeMobileSidebar={closeMobileSidebar}
          userRole={user?.role}
        />
        <MainContent
          sidebarCollapsed={sidebarCollapsed}
          onLogout={handleLogout}
          isMobile={isMobile}
          userRole={user?.role}
        />
      </div>
    </Router>
  )
}

export default App

