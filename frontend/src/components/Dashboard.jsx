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
  UserCheck,
  UserX,
  MinusCircle,
  BadgePercent,
  HeartHandshake,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { getTransactions, getExpenses, getServices, getAttendance, getUser, getDiscountEnrolleeStats, getServiceStats } from '../utils/auth'
import { CustomDatePicker } from './CustomInputs'

const formatCurrency = (amount) =>
  `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const toLocalDateStr = (d) => {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0]
}

const todayStr = () => toLocalDateStr(new Date())

const getWeekRange = () => {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return [toLocalDateStr(monday), toLocalDateStr(sunday)]
}

const getMonthRange = () => {
  const now = new Date()
  return [
    toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
    toLocalDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  ]
}

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
  const [attendance, setAttendance] = useState([])
  const [enrolleeStats, setEnrolleeStats] = useState({ total: 0, by_type: { PWD: 0, Senior: 0, 'Yakap Member': 0 }, yakap_manual: 0 })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Service availment panel (own range filter, independent of the daily cards)
  const [svcQuick, setSvcQuick] = useState('today') // 'today' | 'week' | 'month' | 'custom'
  const [svcFrom, setSvcFrom] = useState(todayStr())
  const [svcTo, setSvcTo] = useState(todayStr())
  const [svcStats, setSvcStats] = useState({ data: [], total_availed: 0, total_revenue: 0 })
  const [svcLoading, setSvcLoading] = useState(true)

  const applySvcQuick = (key) => {
    setSvcQuick(key)
    if (key === 'today') { const t = todayStr(); setSvcFrom(t); setSvcTo(t) }
    else if (key === 'week') { const [f, t] = getWeekRange(); setSvcFrom(f); setSvcTo(t) }
    else if (key === 'month') { const [f, t] = getMonthRange(); setSvcFrom(f); setSvcTo(t) }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setSvcLoading(true)
      try {
        const res = await getServiceStats(`?from=${svcFrom}&to=${svcTo}`)
        if (!cancelled) setSvcStats(res)
      } catch (e) {
        console.error('Service stats error:', e)
      } finally {
        if (!cancelled) setSvcLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [svcFrom, svcTo])

  // Recent Transactions panel (own range filter, independent of the daily cards)
  const [txQuick, setTxQuick] = useState('today')
  const [txFrom, setTxFrom] = useState(todayStr())
  const [txTo, setTxTo] = useState(todayStr())
  const [txLoading, setTxLoading] = useState(true)

  const applyTxQuick = (key) => {
    setTxQuick(key)
    if (key === 'today') { const t = todayStr(); setTxFrom(t); setTxTo(t) }
    else if (key === 'week') { const [f, t] = getWeekRange(); setTxFrom(f); setTxTo(t) }
    else if (key === 'month') { const [f, t] = getMonthRange(); setTxFrom(f); setTxTo(t) }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setTxLoading(true)
      try {
        const res = await getTransactions(`?from=${txFrom}&to=${txTo}`)
        if (!cancelled) setRecentTx(res)
      } catch (e) {
        console.error('Transactions error:', e)
      } finally {
        if (!cancelled) setTxLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [txFrom, txTo])

  // Recent Expenses panel (own range filter, independent of the daily cards)
  const [expQuick, setExpQuick] = useState('today')
  const [expFrom, setExpFrom] = useState(todayStr())
  const [expTo, setExpTo] = useState(todayStr())
  const [expLoading, setExpLoading] = useState(true)

  const applyExpQuick = (key) => {
    setExpQuick(key)
    if (key === 'today') { const t = todayStr(); setExpFrom(t); setExpTo(t) }
    else if (key === 'week') { const [f, t] = getWeekRange(); setExpFrom(f); setExpTo(t) }
    else if (key === 'month') { const [f, t] = getMonthRange(); setExpFrom(f); setExpTo(t) }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setExpLoading(true)
      try {
        const res = await getExpenses(`?from=${expFrom}&to=${expTo}`)
        if (!cancelled) setRecentExp(res)
      } catch (e) {
        console.error('Expenses error:', e)
      } finally {
        if (!cancelled) setExpLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [expFrom, expTo])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const today = todayStr()
      const [txs, exps, services, attendanceRows, enrolleeStatsRes] = await Promise.all([
        getTransactions(`?date=${today}`),
        getExpenses(`?date=${today}`),
        getServices(),
        canViewEmployees ? getAttendance(`?date=${today}`) : Promise.resolve([]),
        canViewEmployees ? getDiscountEnrolleeStats() : Promise.resolve({ total: 0, by_type: { PWD: 0, Senior: 0, 'Yakap Member': 0 }, yakap_manual: 0 })
      ])

      const revenue = txs.reduce((s, t) => s + Number(t.total || 0), 0)
      const expenses = exps.reduce((s, e) => s + Number(e.amount || 0), 0)

      setData({
        revenue,
        txCount: txs.length,
        expenses,
        employees: attendanceRows.length,
        activeServices: services.filter((s) => s.is_active).length
      })
      setAttendance(attendanceRows)
      setEnrolleeStats(enrolleeStatsRes)
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Dashboard error:', e)
    } finally {
      setLoading(false)
    }
  }, [canViewEmployees])

  useEffect(() => { fetchData() }, [fetchData])

  const net = data.revenue - data.expenses

  const presentCount = attendance.filter((a) => a.status === 'present').length
  const absentCount = attendance.filter((a) => a.status === 'absent').length
  const notMarkedCount = attendance.filter((a) => a.status === 'not_marked').length

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
        className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
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

      {/* Service Availments (per-service counts over a date range) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="bg-[var(--color-card)] border border-[var(--color-border)] shadow-md">
          <CardHeader>
            <CardTitle className="text-[var(--color-foreground)] flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" /> Service Availments
            </CardTitle>
            <p className="text-xs text-[var(--color-foreground)]/60">How many patients availed each service in the selected period.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters: quick presets + custom From/To */}
            <div className="flex flex-wrap items-end gap-2">
              {[['today', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => applySvcQuick(key)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    svcQuick === key ? 'bg-emerald-700 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="flex gap-2 sm:ml-auto">
                <CustomDatePicker label="From" value={svcFrom} onChange={(v) => { setSvcFrom(v); setSvcQuick('custom') }} />
                <CustomDatePicker label="To" align="right" value={svcTo} onChange={(v) => { setSvcTo(v); setSvcQuick('custom') }} />
              </div>
            </div>

            {/* Totals for the range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-xs text-emerald-700/70">Total Availments</p>
                <p className="text-lg font-bold text-emerald-900">{svcLoading ? '…' : svcStats.total_availed}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center">
                <p className="text-xs text-gray-600">Revenue (range)</p>
                <p className="text-lg font-bold text-gray-800">{svcLoading ? '…' : formatCurrency(svcStats.total_revenue)}</p>
              </div>
            </div>

            {svcLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" /></div>
            ) : svcStats.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[520px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 text-[11px] font-bold text-gray-500 uppercase">Service</th>
                      <th className="p-3 text-[11px] font-bold text-gray-500 uppercase text-right">Availed</th>
                      <th className="p-3 text-[11px] font-bold text-gray-500 uppercase text-right">Receipts</th>
                      <th className="p-3 text-[11px] font-bold text-gray-500 uppercase text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {svcStats.data.map((s) => (
                      <tr key={s.name} className={`hover:bg-emerald-50/30 ${s.availed === 0 ? 'opacity-50' : ''}`}>
                        <td className="p-3 font-semibold text-gray-900 flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-emerald-300 shrink-0" />{s.name}
                        </td>
                        <td className={`p-3 text-right font-bold ${s.availed > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>{s.availed}</td>
                        <td className="p-3 text-right text-sm text-gray-600">{s.transactions}</td>
                        <td className="p-3 text-right text-sm font-semibold text-gray-800">{formatCurrency(s.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--color-foreground)]/60">No services availed in this period.</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Yakap Member Verified (manual enrollments only) */}
      {canViewEmployees && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
          <Card className="bg-emerald-50/40 border border-emerald-100/70 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-[var(--color-primary)]" />
                <p className="text-sm font-medium text-[var(--color-foreground)]/70">Yakap Member Verified</p>
              </div>
              <p className="text-2xl font-bold text-[var(--color-foreground)]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : enrolleeStats.yakap_manual ?? 0}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Discount Enrollees (PWD / Senior / Yakap Member) */}
      {canViewEmployees && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.27 }}>
          <Card className="bg-[var(--color-card)] border border-[var(--color-border)] shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BadgePercent className="h-5 w-5 text-[var(--color-primary)]" />
                  <p className="text-sm font-medium text-[var(--color-foreground)]/70">Discounts</p>
                </div>
                <p className="text-2xl font-bold text-[var(--color-foreground)]">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : enrolleeStats.total}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-center">
                  <p className="text-xs text-blue-700/70">PWD</p>
                  <p className="text-lg font-bold text-blue-900">{enrolleeStats.by_type?.PWD ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-center">
                  <p className="text-xs text-amber-700/70">Senior</p>
                  <p className="text-lg font-bold text-amber-900">{enrolleeStats.by_type?.Senior ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-xs text-emerald-700/70">Yakap Member</p>
                  <p className="text-lg font-bold text-emerald-900">{enrolleeStats.by_type?.['Yakap Member'] ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Attendance Monitoring Logs */}
      {canViewEmployees && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card className="bg-[var(--color-card)] border border-[var(--color-border)] shadow-md">
            <CardHeader>
              <CardTitle className="text-[var(--color-foreground)] flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[var(--color-primary)]" /> Attendance Monitoring Logs (Today)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700/70">Present</p>
                    <p className="text-xl font-bold text-emerald-900">{presentCount}</p>
                  </div>
                  <UserCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-700/70">Absent</p>
                    <p className="text-xl font-bold text-red-900">{absentCount}</p>
                  </div>
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Not Marked</p>
                    <p className="text-xl font-bold text-gray-700">{notMarkedCount}</p>
                  </div>
                  <MinusCircle className="h-6 w-6 text-gray-500" />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" /></div>
              ) : attendance.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {attendance.map((a) => (
                    <div key={a.employee_id} className="flex items-center justify-between text-sm py-1.5 border-b border-[var(--color-border)]/50 last:border-0">
                      <div>
                        <p className="text-[var(--color-foreground)] font-medium">{a.name}</p>
                        <p className="text-xs text-[var(--color-foreground)]/60">{a.position}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        a.status === 'present' ? 'bg-emerald-100 text-emerald-700'
                          : a.status === 'absent' ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {a.status === 'present' ? 'Present' : a.status === 'absent' ? 'Absent' : 'Not marked'}
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
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-2">
                {[['today', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => applyTxQuick(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      txQuick === key ? 'bg-emerald-700 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <div className="flex gap-2 sm:ml-auto">
                  <CustomDatePicker label="From" value={txFrom} onChange={(v) => { setTxFrom(v); setTxQuick('custom') }} />
                  <CustomDatePicker label="To" align="right" value={txTo} onChange={(v) => { setTxTo(v); setTxQuick('custom') }} />
                </div>
              </div>

              {txLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" /></div>
              ) : recentTx.length > 0 ? (
                <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
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
                <div className="text-center py-8 text-[var(--color-foreground)]/60">No transactions in this period</div>
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
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-2">
                {[['today', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => applyExpQuick(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      expQuick === key ? 'bg-emerald-700 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <div className="flex gap-2 sm:ml-auto">
                  <CustomDatePicker label="From" value={expFrom} onChange={(v) => { setExpFrom(v); setExpQuick('custom') }} />
                  <CustomDatePicker label="To" align="right" value={expTo} onChange={(v) => { setExpTo(v); setExpQuick('custom') }} />
                </div>
              </div>

              {expLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" /></div>
              ) : recentExp.length > 0 ? (
                <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
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
                <div className="text-center py-8 text-[var(--color-foreground)]/60">No expenses in this period</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
