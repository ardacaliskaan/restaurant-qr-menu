'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, Search, Filter, Eye, Edit2, Trash2, X, Plus,
  Package, ChefHat, CheckCircle, AlertCircle, XCircle,
  MapPin, User, MessageSquare, DollarSign, RefreshCw,
  Phone, Mail, Calendar, TrendingUp, ArrowRight, Sparkles,
  Utensils, Coffee, Download, Printer, Bell, BellOff,
  Settings, BarChart3, PieChart, Activity, Users, Zap,
  Timer, Target, Award, ThumbsUp, Flame, Grid, List,
  Maximize2, Minimize2, Volume2, VolumeX, Star, Flag
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminOrdersPage() {
  // States
  const [orders, setOrders] = useState([])
  const [originalOrders, setOriginalOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Selection & Modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterTable, setFilterTable] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  
  // View Options
  const [viewMode, setViewMode] = useState('grid') // grid, list, timeline
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [compactView, setCompactView] = useState(false)
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showCompletedOrders, setShowCompletedOrders] = useState(false)
  
  // Refs
  const audioRef = useRef(null)
  const previousOrderCountRef = useRef(0)

  const statusConfig = {
    pending: { label: 'Bekliyor', color: 'yellow', icon: Clock, gradient: 'from-yellow-400 to-orange-500' },
    preparing: { label: 'Hazırlanıyor', color: 'blue', icon: ChefHat, gradient: 'from-blue-500 to-indigo-600' },
    ready: { label: 'Hazır', color: 'green', icon: CheckCircle, gradient: 'from-green-500 to-emerald-600' },
    delivered: { label: 'Teslim Edildi', color: 'purple', icon: Package, gradient: 'from-purple-500 to-pink-600' },
    completed: { label: 'Tamamlandı', color: 'gray', icon: CheckCircle, gradient: 'from-gray-400 to-gray-600' },
    cancelled: { label: 'İptal', color: 'red', icon: XCircle, gradient: 'from-red-500 to-red-700' }
  }

  const priorityConfig = {
    urgent: { label: 'ACİL', color: 'red', icon: Flame },
    high: { label: 'Yüksek', color: 'orange', icon: Flag },
    normal: { label: 'Normal', color: 'blue', icon: Target },
    low: { label: 'Düşük', color: 'gray', icon: Activity }
  }

  useEffect(() => {
    loadOrders()
    if (autoRefresh) {
      const interval = setInterval(loadOrders, 30000)
      return () => clearInterval(interval)
    }
  }, [filterStatus, filterPriority, dateFilter, autoRefresh, showCompletedOrders])

  useEffect(() => {
    // Yeni sipariş geldiğinde ses çal
    if (soundEnabled && originalOrders.length > previousOrderCountRef.current && previousOrderCountRef.current > 0) {
      playNotificationSound()
      if (notificationsEnabled) {
        toast.success('Yeni sipariş geldi! 🔔', { duration: 4000 })
      }
    }
    previousOrderCountRef.current = originalOrders.length
  }, [originalOrders.length, soundEnabled, notificationsEnabled])

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
    }
  }

  const loadOrders = async () => {
    try {
      if (!loading) setRefreshing(true)
      
      const params = new URLSearchParams({
        groupByTable: 'true',
        sortBy,
        sortOrder,
        today: dateFilter === 'today' ? 'true' : 'false'
      })

      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterPriority !== 'all') params.append('priority', filterPriority)
      if (filterTable) params.append('tableNumber', filterTable)
      if (searchTerm) params.append('search', searchTerm)
      if (!showCompletedOrders) params.append('excludeCompleted', 'true')

      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()

      if (data.success) {
        setOrders(data.orders || [])
        setOriginalOrders(data.originalOrders || [])
        setStats(data.statistics)
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Yükleme hatası')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, action: 'updateStatus', status: newStatus })
      })

      const result = await res.json()
      if (result.success) {
        toast.success('Durum güncellendi ✅')
        loadOrders()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      }
    } catch (error) {
      toast.error('Güncelleme hatası')
    }
  }

  const updateOrderPriority = async (orderId, newPriority) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, priority: newPriority })
      })

      const result = await res.json()
      if (result.success) {
        toast.success('Öncelik güncellendi')
        loadOrders()
      }
    } catch (error) {
      toast.error('Güncelleme hatası')
    }
  }

  const deleteOrder = async (orderId) => {
    if (!confirm('Bu siparişi silmek istediğinizden emin misiniz?')) return

    try {
      const res = await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' })
      const result = await res.json()
      
      if (result.success) {
        toast.success('Sipariş silindi')
        loadOrders()
        setShowModal(false)
      }
    } catch (error) {
      toast.error('Silme hatası')
    }
  }

  const closeTable = async (tableNumber) => {
    if (!confirm(`Masa ${tableNumber} kapatılsın mı? Tüm siparişler tamamlanacak.`)) return

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'closeTable', tableNumber })
      })

      const result = await res.json()
      if (result.success) {
        toast.success(`Masa ${tableNumber} kapatıldı ✅`)
        playNotificationSound()
        loadOrders()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Masa kapatma hatası')
    }
  }

  const bulkUpdateStatus = async (tableNumber, newStatus) => {
    if (!confirm(`Masa ${tableNumber}'deki tüm siparişler "${statusConfig[newStatus]?.label}" durumuna getirilsin mi?`)) return

    try {
      const tableOrders = originalOrders.filter(o => o.tableNumber === tableNumber)
      
      await Promise.all(
        tableOrders.map(order => 
          fetch('/api/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: order.id, action: 'updateStatus', status: newStatus })
          })
        )
      )

      toast.success('Toplu güncelleme başarılı')
      loadOrders()
    } catch (error) {
      toast.error('Toplu güncelleme hatası')
    }
  }

  const printOrder = (order) => {
    window.print()
  }

  const exportData = () => {
    const dataStr = JSON.stringify(originalOrders, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    toast.success('Veriler indirildi')
  }

  const filteredOrders = orders.filter(table => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        table.tableNumber.toString().includes(search) ||
        table.orders?.some(o => 
          o.orderNumber?.toLowerCase().includes(search) ||
          o.items?.some(i => i.name.toLowerCase().includes(search))
        )
      )
    }
    return true
  })

  const getTimeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000)
    if (minutes < 1) return 'Az önce'
    if (minutes < 60) return `${minutes} dk önce`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} saat önce`
    return `${Math.floor(hours / 24)} gün önce`
  }

  const getUrgencyColor = (createdAt) => {
    const minutes = Math.floor((new Date() - new Date(createdAt)) / 60000)
    if (minutes > 30) return 'red'
    if (minutes > 15) return 'orange'
    return 'green'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Siparişler Yükleniyor</h3>
          <p className="text-gray-600">Lütfen bekleyin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Audio Element */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Sticky Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 space-y-4">
            {/* Top Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Title & Status */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                  <ChefHat className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                    Sipariş Yönetimi
                    {refreshing && (
                      <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
                    )}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    {filteredOrders.length} masa • {originalOrders.length} aktif sipariş
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {[
                    { mode: 'grid', icon: Grid, label: 'Kart' },
                    { mode: 'list', icon: List, label: 'Liste' }
                  ].map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        viewMode === mode
                          ? 'bg-white text-amber-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Settings Toggles */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2.5 rounded-xl transition-all ${
                    soundEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  title="Ses Bildirimleri"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2.5 rounded-xl transition-all ${
                    autoRefresh ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  title="Otomatik Yenileme"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2.5 rounded-xl transition-all ${
                    showFilters ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  title="Filtreler"
                >
                  <Filter className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowStatsModal(true)}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                  title="İstatistikler"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>

                <button
                  onClick={exportData}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                  title="Dışa Aktar"
                >
                  <Download className="w-5 h-5" />
                </button>

                <button
                  onClick={loadOrders}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Yenile</span>
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const count = stats[status] || 0
                  const Icon = config.icon
                  return (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                      className={`p-3 rounded-xl transition-all ${
                        filterStatus === status
                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                          : `bg-${config.color}-50 hover:bg-${config.color}-100`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${filterStatus === status ? 'text-white' : `text-${config.color}-600`}`} />
                        <span className={`text-xl font-bold ${filterStatus === status ? 'text-white' : `text-${config.color}-900`}`}>
                          {count}
                        </span>
                      </div>
                      <div className={`text-xs font-medium mt-1 ${filterStatus === status ? 'text-white' : `text-${config.color}-700`}`}>
                        {config.label}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Masa, sipariş, ürün ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      {/* Table Filter */}
                      <input
                        type="number"
                        placeholder="Masa numarası"
                        value={filterTable}
                        onChange={(e) => setFilterTable(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />

                      {/* Priority Filter */}
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="all">Tüm Öncelikler</option>
                        {Object.entries(priorityConfig).map(([priority, config]) => (
                          <option key={priority} value={priority}>{config.label}</option>
                        ))}
                      </select>

                      {/* Date Filter */}
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="today">Bugün</option>
                        <option value="week">Bu Hafta</option>
                        <option value="month">Bu Ay</option>
                        <option value="all">Tümü</option>
                      </select>
                    </div>

                    {/* Additional Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={showCompletedOrders}
                          onChange={(e) => setShowCompletedOrders(e.target.checked)}
                          className="rounded border-gray-300 text-amber-600"
                        />
                        <span className="text-sm text-gray-700">Tamamlananları Göster</span>
                      </label>

                      <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={compactView}
                          onChange={(e) => setCompactView(e.target.checked)}
                          className="rounded border-gray-300 text-amber-600"
                        />
                        <span className="text-sm text-gray-700">Kompakt Görünüm</span>
                      </label>

                      {(filterStatus !== 'all' || filterPriority !== 'all' || filterTable || searchTerm) && (
                        <button
                          onClick={() => {
                            setFilterStatus('all')
                            setFilterPriority('all')
                            setFilterTable('')
                            setSearchTerm('')
                          }}
                          className="ml-auto px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          <X className="w-4 h-4" />
                          Filtreleri Temizle
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-2xl shadow-sm"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sipariş Bulunamadı</h3>
            <p className="text-gray-600 mb-6">
              {filterStatus !== 'all' || searchTerm 
                ? 'Bu filtrelerle eşleşen sipariş yok' 
                : 'Henüz sipariş alınmamış'}
            </p>
            {(filterStatus !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setFilterStatus('all')
                  setSearchTerm('')
                }}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors font-medium"
              >
                Tüm Siparişleri Göster
              </button>
            )}
          </motion.div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'
              : 'space-y-4'
          }>
            {filteredOrders.map((table, idx) => {
              const urgency = getUrgencyColor(table.createdAt)
              const totalItems = table.orders?.reduce((sum, o) => sum + (o.items?.length || 0), 0) || 0
              
              return (
                <motion.div
                  key={table.tableNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 hover:shadow-xl ${
                    table.priority === 'urgent' ? 'border-red-300 ring-2 ring-red-100' :
                    table.priority === 'high' ? 'border-orange-300' :
                    'border-gray-200 hover:border-amber-300'
                  } ${compactView ? 'p-3' : 'p-0'} overflow-hidden`}
                >
                  {/* Card Header */}
                  <div className={`p-4 bg-gradient-to-r ${statusConfig[table.status]?.gradient || 'from-gray-400 to-gray-600'}`}>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold flex items-center gap-2">
                            Masa {table.tableNumber}
                            {table.priority === 'urgent' && (
                              <Flame className="w-5 h-5 text-yellow-300 animate-pulse" />
                            )}
                          </div>
                          <div className="text-sm opacity-90 flex items-center gap-2">
                            <span>{table.orders?.length || 0} sipariş</span>
                            <span>•</span>
                            <span>{totalItems} ürün</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">₺{table.totalAmount.toFixed(2)}</div>
                        <div className="text-xs opacity-90 uppercase tracking-wide">Toplam</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className={`${compactView ? 'p-3' : 'p-4'} space-y-3`}>
                    {/* Time & Priority */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 text-${urgency}-500`} />
                        <span className="text-sm text-gray-600">{getTimeAgo(table.createdAt)}</span>
                        {parseInt((new Date() - new Date(table.createdAt)) / 60000) > 15 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            GECİKİYOR
                          </span>
                        )}
                      </div>
                      
                      {table.priority && table.priority !== 'normal' && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          table.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          table.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {priorityConfig[table.priority]?.icon && (
                            React.createElement(priorityConfig[table.priority].icon, { className: 'w-3 h-3' })
                          )}
                          {priorityConfig[table.priority]?.label}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium text-center ${
                        statusConfig[table.status]
                          ? `bg-${statusConfig[table.status].color}-100 text-${statusConfig[table.status].color}-700`
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {statusConfig[table.status]?.label || table.status}
                      </span>
                    </div>

                    {/* Orders List */}
                    {!compactView && (
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {(table.orders || []).map((order, orderIdx) => (
                          <div
                            key={order.id}
                            className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer group"
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowModal(true)
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                #{order.orderNumber?.slice(-6) || order.id.slice(-6)}
                              </span>
                              <span className="text-sm font-bold text-amber-600">
                                ₺{order.totalAmount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {(order.items || []).map((item, itemIdx) => (
                                <span
                                  key={itemIdx}
                                  className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200"
                                >
                                  {item.quantity}x {item.name}
                                </span>
                              ))}
                            </div>
                            {order.customerNotes && (
                              <div className="mt-2 flex items-start gap-2 text-xs text-gray-600">
                                <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1">{order.customerNotes}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {table.customerNotes && !compactView && (
                      <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-amber-900 font-medium">{table.customerNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-3 bg-gray-50 border-t flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(table.orders?.[0] || table)
                        setSelectedTable(table)
                        setShowModal(true)
                      }}
                      className="flex-1 min-w-[100px] px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Detay
                    </button>
                    
                    {!['completed', 'cancelled'].includes(table.status) && (
                      <>
                        <button
                          onClick={() => bulkUpdateStatus(table.tableNumber, 'ready')}
                          className="flex-1 min-w-[100px] px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Hazır
                        </button>
                        
                        <button
                          onClick={() => closeTable(table.tableNumber)}
                          className="flex-1 min-w-[100px] px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Package className="w-4 h-4" />
                          Kapat
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {showModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600">
                <div className="flex items-center justify-between text-white mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <Package className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">Sipariş Detayı</h2>
                      <p className="text-sm opacity-90 mt-1">
                        #{selectedOrder.orderNumber || selectedOrder.id?.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>

                {/* Quick Info Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <MapPin className="w-5 h-5 mb-2" />
                    <div className="text-sm opacity-80">Masa</div>
                    <div className="text-2xl font-bold">{selectedOrder.tableNumber}</div>
                  </div>
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <DollarSign className="w-5 h-5 mb-2" />
                    <div className="text-sm opacity-80">Toplam</div>
                    <div className="text-2xl font-bold">₺{selectedOrder.totalAmount?.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <Clock className="w-5 h-5 mb-2" />
                    <div className="text-sm opacity-80">Süre</div>
                    <div className="text-lg font-bold">{getTimeAgo(selectedOrder.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-320px)] custom-scrollbar">
                {/* Status & Priority Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Sipariş Durumu</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(statusConfig).slice(0, 4).map(([status, config]) => {
                        const Icon = config.icon
                        return (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(selectedOrder.id, status)}
                            className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                              selectedOrder.status === status
                                ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                                : `bg-${config.color}-50 text-${config.color}-700 hover:bg-${config.color}-100`
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{config.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Öncelik</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(priorityConfig).map(([priority, config]) => {
                        const Icon = config.icon
                        return (
                          <button
                            key={priority}
                            onClick={() => updateOrderPriority(selectedOrder.id, priority)}
                            className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                              selectedOrder.priority === priority
                                ? `bg-${config.color}-500 text-white shadow-lg`
                                : `bg-${config.color}-50 text-${config.color}-700 hover:bg-${config.color}-100`
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{config.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <Package className="w-6 h-6 text-amber-600" />
                    Sipariş Ürünleri
                  </h3>
                  <div className="space-y-3">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-lg text-gray-900">{item.name}</span>
                              <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-bold">
                                {item.quantity}x
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Birim: ₺{item.price.toFixed(2)} × {item.quantity} = ₺{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* 🆕 ZORUNLU SEÇİMLER */}
                        {item.requiredSelections && item.requiredSelections.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-bold text-purple-600 uppercase tracking-wide">Müşteri Seçimleri</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {item.requiredSelections.map((selection, selIdx) => (
                                <div key={selIdx} className="flex items-center justify-between p-3 bg-white rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span className="text-sm text-gray-700">
                                      <span className="font-bold">{selection.optionLabel}:</span>{' '}
                                      <span className="text-gray-900">{selection.selectedLabel}</span>
                                    </span>
                                  </div>
                                  {selection.price > 0 && (
                                    <span className="text-sm font-bold text-amber-600">+₺{selection.price.toFixed(2)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Customizations */}
                        {(item.customizations?.removed?.length > 0 || item.customizations?.extras?.length > 0) && (
                          <div className="mt-3 pt-3 border-t border-gray-300 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {item.customizations.removed?.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-bold text-red-600">Çıkarılanlar</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {item.customizations.removed.map((removed, rIdx) => (
                                    <span key={rIdx} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                                      {removed}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.customizations.extras?.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Plus className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-bold text-green-600">Ekstralar</span>
                                </div>
                                <div className="space-y-1">
                                  {item.customizations.extras.map((extra, eIdx) => (
                                    <div key={eIdx} className="flex items-center justify-between text-xs px-2 py-1 bg-green-50 rounded-lg">
                                      <span className="text-gray-700">{extra.name || extra}</span>
                                      {extra.price && (
                                        <span className="text-green-700 font-bold">+₺{extra.price.toFixed(2)}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Item Notes */}
                        {item.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-sm font-bold text-blue-600 block mb-1">Özel Not:</span>
                                <p className="text-sm text-gray-700">{item.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Notes */}
                {selectedOrder.customerNotes && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-bold text-amber-900 uppercase tracking-wide block mb-2">Masa Notu:</span>
                        <p className="text-base text-amber-900 font-medium">{selectedOrder.customerNotes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 border-t flex flex-wrap gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 min-w-[120px] px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-bold"
                >
                  Kapat
                </button>
                <button
                  onClick={() => printOrder(selectedOrder)}
                  className="flex-1 min-w-[120px] px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Yazdır
                </button>
                <button
                  onClick={() => deleteOrder(selectedOrder.id)}
                  className="flex-1 min-w-[120px] px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Modal */}
      <AnimatePresence>
        {showStatsModal && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStatsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">İstatistikler</h2>
                  </div>
                  <button
                    onClick={() => setShowStatsModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                    <Package className="w-8 h-8 text-blue-600 mb-3" />
                    <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
                    <div className="text-sm text-blue-700">Toplam Sipariş</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                    <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                    <div className="text-3xl font-bold text-green-900">₺{stats.totalRevenue?.toFixed(2)}</div>
                    <div className="text-sm text-green-700">Toplam Ciro</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                    <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                    <div className="text-3xl font-bold text-purple-900">₺{stats.averageOrderValue?.toFixed(2)}</div>
                    <div className="text-sm text-purple-700">Ortalama Sipariş</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}