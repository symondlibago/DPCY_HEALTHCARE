import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Receipt,
  Wallet,
  Users,
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Stethoscope,
  Coins,
  Clock,
  LogIn,
  LogOut
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { getTransactions, getExpenses, getServices, getShifts, getUser } from '../utils/auth'

const formatCurrency = (amount) =>
  `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const todayStr = () => {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0]
}

const formatTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : null

const formatTimeAgo = (dateString) => {
  if (!dateString) return ''
  const diffMin = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} hour(s) ago`
  return `${Math.floor(diffH / 24)} day(s) ago`
}

function Dashboard() {
  const userRole = getUser()?.role
  const canViewEmployees = userRole === 'admin' || userRole === 'super_admin'

  const [data, setData] = useState({
    revenue: 0, txCount: 0, expenses: 0, employees: 0, activeServices: 0
  })
  const [recentTx, setRecentTx] = useState([])
  const [recentExp, setRecentExp] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const today = todayStr()
      const [txs, exps, services, shiftRows] = await Promise.all([
        getTransactions(`?date=${today}`),
        getExpenses(`?date=${today}`),
        getServices(),
        canViewEmployees ? getShifts(`?date=${today}`) : Promise.resolve([])
      ])

      const revenue = txs.reduce((s, t) => s + Number(t.total || 0), 0)
      const expenses = exps.reduce((s, e) => s + Number(e.amount || 0), 0)

      setData({
        revenue,
        txCount: txs.length,
        expenses,
        employees: shiftRows.length,
        activeServices: services.filter((s) => s.is_active).length
      })
      setRecentTx(txs.slice(0, 5))
      setRecentExp(exps.slice(0, 5))
      setShifts(shiftRows)
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Dashboard error:', e)
    } finally {
      setLoading(false)
    }
  }, [canViewEmployees])

  useEffect(() => { fetchData() }, [fetchData])

  const net = data.revenue - data.expenses

  const timedIn = shifts.filter((s) => s.time_in && !s.time_out).length
  const timedOut = shifts.filter((s) => s.time_out).length
  const notStarted = shifts.filter((s) => !s.time_in).length

  const statsCards = [
    { title: "Today's Revenue", value: formatCurrency(data.revenue), icon: Coins },
    { title: "Today's Transactions", value: String(data.txCount), icon: Receipt },
    { title: "Today's Expenses", value: formatCurrency(data.expenses), icon: Wallet },
    { title: 'Net Today', value: formatCurrency(net), icon: TrendingUp }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-[var(--color-foreground)]/70 mt-2">Diagnostic &amp; Drug Testing Center — daily summary</p>
          {lastUpdated && (
            <p className="text-xs text-[var(--color-foreground)]/50 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          variant="outline"
          className="border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <Card className="bg-[var(--color-card)] border-[var(--color-border)] border-2 hover:border-[var(--color-primary)] transition-all duration-300 shadow-md hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[var(--color-foreground)]/70">
                    {stat.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--color-foreground)]">
                    {loading ? (
                      <div className="flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
                    ) : stat.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Secondary stat row */}
      <div className={`grid grid-cols-1 gap-6 ${canViewEmployees ? 'md:grid-cols-2' : ''}`}>
        <Card className="bg-[var(--color-card)] border border-[var(--color-border)] shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-foreground)]/60">Active Services</p>
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{data.activeServices}</p>
            </div>
            <Stethoscope className="h-8 w-8 text-[var(--color-primary)]/40" />
          </CardContent>
        </Card>
        {canViewEmployees && (
          <Card className="bg-[var(--color-card)] border border-[var(--color-border)] shadow-md">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-foreground)]/60">Employees</p>
                <p className="text-2xl font-bold text-[var(--color-foreground)]">{data.employees}</p>
              </div>
              <Users className="h-8 w-8 text-[var(--color-primary)]/40" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Employee Shift Monitor */}
      {canViewEmployees && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card className="bg-[var(--color-card)] border border-[var(--color-border)] shadow-md">
            <CardHeader>
              <CardTitle className="text-[var(--color-foreground)] flex items-center gap-2">
                <Clock className="h-5 w-5 text-[var(--color-primary)]" /> Employee Shift Monitor (Today)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700/70">On Shift</p>
                    <p className="text-xl font-bold text-emerald-900">{timedIn}</p>
                  </div>
                  <LogIn className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700/70">Timed Out</p>
                    <p className="text-xl font-bold text-emerald-900">{timedOut}</p>
                  </div>
                  <LogOut className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700/70">Not Started</p>
                    <p className="text-xl font-bold text-emerald-900">{notStarted}</p>
                  </div>
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" /></div>
              ) : shifts.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {shifts.map((s) => (
                    <div key={s.employee_id} className="flex items-center justify-between text-sm py-1.5 border-b border-[var(--color-border)]/50 last:border-0">
                      <div>
                        <p className="text-[var(--color-foreground)] font-medium">{s.name}</p>
                        <p className="text-xs text-[var(--color-foreground)]/60">{s.position}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        s.time_out ? 'bg-emerald-100 text-emerald-700'
                          : s.time_in ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.time_out ? `Completed ${formatTime(s.time_in)} – ${formatTime(s.time_out)}${s.auto_closed ? ' (auto 6PM)' : ''}`
                          : s.time_in ? `On shift since ${formatTime(s.time_in)}`
                          : 'Not started'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-[var(--color-foreground)]/60">No employees found</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <Card className="bg-[var(--color-card)] border border-[var(--color-border)] shadow-md">
            <CardHeader>
              <CardTitle className="text-[var(--color-foreground)] flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[var(--color-primary)]" /> Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" /></div>
              ) : recentTx.length > 0 ? (
                <div className="space-y-3">
                  {recentTx.map((t) => (
                    <div key={t.id} className="flex items-center gap-3">
                      <Receipt className="h-4 w-4 text-[var(--color-primary)]" />
                      <div className="flex-1">
                        <p className="text-sm text-[var(--color-foreground)]">{t.patient_name}</p>
                        <p className="text-xs text-[var(--color-foreground)]/60">{t.receipt_no} · {formatTimeAgo(t.created_at)}</p>
                      </div>
                      <div className="text-sm font-semibold text-[var(--color-primary)]">{formatCurrency(t.total)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--color-foreground)]/60">No transactions today</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Expenses */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
          <Card className="bg-[var(--color-card)] border border-[var(--color-border)] shadow-md">
            <CardHeader>
              <CardTitle className="text-[var(--color-foreground)] flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[var(--color-primary)]" /> Recent Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" /></div>
              ) : recentExp.length > 0 ? (
                <div className="space-y-3">
                  {recentExp.map((e) => (
                    <div key={e.id} className="flex items-center gap-3">
                      <Wallet className="h-4 w-4 text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm text-[var(--color-foreground)]">{e.description}</p>
                        <p className="text-xs text-[var(--color-foreground)]/60">{e.category || 'Uncategorized'}</p>
                      </div>
                      <div className="text-sm font-semibold text-red-500">{formatCurrency(e.amount)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--color-foreground)]/60">No expenses today</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
