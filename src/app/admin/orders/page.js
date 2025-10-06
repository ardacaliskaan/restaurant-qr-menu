'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, User, CreditCard, Filter, Search, MoreVertical,
  CheckCircle, XCircle, AlertCircle, Package, ChefHat,
  Eye, Edit2, Trash2, RefreshCw, Calendar, DollarSign,
  TrendingUp, Users, ShoppingCart, BarChart3, MapPin
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrdersAdminPage() {
  // States
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    tableNumber: '',
    paymentStatus: '',
    priority: '',
    today: true,
    search: ''
  })
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showKitchenView, setShowKitchenView] = useState(false)
  
  // View states
  const [viewMode, setViewMode] = useState('all') // 'all', 'kitchen', 'analytics'
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // Order statuses for filtering
  const orderStatuses = [
    { value: '', label: 'Tüm Durumlar', color: 'gray' },
    { value: 'pending', label: 'Bekliyor', color: 'yellow' },
    { value: 'confirmed', label: 'Onaylandı', color: 'blue' },
    { value: 'preparing', label: 'Hazırlanıyor', color: 'orange' },
    { value: 'ready', label: 'Hazır', color: 'green' },
    { value: 'delivered', label: 'Teslim Edildi', color: 'purple' },
    { value: 'completed', label: 'Tamamlandı', color: 'gray' },
    { value: 'cancelled', label: 'İptal Edildi', color: 'red' }
  ]

  const priorities = [
    { value: '', label: 'Tüm Öncelikler' },
    { value: 'low', label: 'Düşük' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Yüksek' },
    { value: 'urgent', label: 'Acil' }
  ]

  useEffect(() => {
    loadOrders()
    // Auto refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [filters, sortBy, sortOrder, viewMode])

  const loadOrders = async () => {
    try {
      if (!refreshing) setLoading(true)
      
      const params = new URLSearchParams({
        stats: 'true',
        analytics: viewMode === 'analytics' ? 'true' : 'false',
        kitchenView: viewMode === 'kitchen' ? 'true' : 'false',
        sortBy,
        sortOrder,
        limit: '50'
      })

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/orders?${params}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders || [])
        setStatistics(data.statistics)
        if (data.analytics) {
          setAnalytics(data.analytics)
        }
      } else {
        toast.error('Siparişler yüklenemedi')
      }
    } catch (error) {
      console.error('Orders loading error:', error)
      toast.error('Bağlantı hatası')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadOrders()
  }

  const updateOrderStatus = async (orderId, newStatus, assignedStaff = null) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          action: 'updateStatus',
          status: newStatus,
          assignedStaff
        })
      })

      const result = await response.json()

      if (result.success) {
        await loadOrders()
        toast.success('Sipariş durumu güncellendi')
      } else {
        toast.error(result.error || 'Güncelleme başarısız')
      }
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Güncelleme hatası')
    }
  }

  const cancelOrder = async (orderId) => {
    if (!confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        await loadOrders()
        toast.success('Sipariş iptal edildi')
      } else {
        toast.error(result.error || 'İptal işlemi başarısız')
      }
    } catch (error) {
      console.error('Cancel order error:', error)
      toast.error('İptal işlemi hatası')
    }
  }

  const getStatusColor = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status)
    return statusObj ? statusObj.color : 'gray'
  }

  const getStatusLabel = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status)
    return statusObj ? statusObj.label : status
  }

  const formatCurrency = (amount) => {
    return `₺${parseFloat(amount || 0).toFixed(2)}`
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}dk`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}s ${mins}dk`
  }

  if (loading && !refreshing) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Siparişler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Sipariş Yönetimi
          </h1>
          <p className="text-gray-600 mt-2">Siparişleri takip edin ve yönetin</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Buttons */}
          <div className="bg-white border border-gray-200 rounded-lg p-1">
            {[
              { id: 'all', label: 'Tümü', icon: ShoppingCart },
              { id: 'kitchen', label: 'Mutfak', icon: ChefHat },
              { id: 'analytics', label: 'Analiz', icon: BarChart3 }
            ].map(mode => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    viewMode === mode.id
                      ? 'bg-amber-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{mode.label}</span>
                </button>
              )
            })}
          </div>

          {/* Refresh Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Aktif Siparişler</p>
                <p className="text-3xl font-bold text-amber-600">
                  {(statistics.pending || 0) + (statistics.preparing || 0) + (statistics.ready || 0)}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Toplam Sipariş</p>
                <p className="text-3xl font-bold text-blue-600">{statistics.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Günlük Ciro</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(statistics.totalRevenue)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ort. Sipariş</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(statistics.averageOrderValue)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Sipariş ara..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {orderStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {/* Table Filter */}
          <input
            type="number"
            placeholder="Masa No"
            value={filters.tableNumber}
            onChange={(e) => setFilters({...filters, tableNumber: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {priorities.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>

          {/* Today Filter */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.today}
              onChange={(e) => setFilters({...filters, today: e.target.checked})}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Sadece Bugün</span>
          </label>

          {/* Clear Filters */}
          <button
            onClick={() => setFilters({
              status: '', tableNumber: '', paymentStatus: '', priority: '', today: true, search: ''
            })}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş bulunamadı</h3>
            <p className="text-gray-600">Seçilen kriterlere uygun sipariş yok</p>
          </div>
        ) : (
          orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  {/* Order Header */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        #{order.orderNumber || order.id?.slice(-6)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800`}>
                        {getStatusLabel(order.status)}
                      </span>
                      {order.priority && order.priority !== 'normal' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {priorities.find(p => p.value === order.priority)?.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.duration ? formatDuration(order.duration) : '-'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {/* Quick Status Updates */}
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Onayla"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Hazırlanmaya Başla"
                        >
                          <ChefHat className="w-4 h-4" />
                        </button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Hazır"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                      )}
                      
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Teslim Et"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      )}

                      {/* View Details */}
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowOrderModal(true)
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Detayları Gör"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Cancel Order */}
                      {['pending', 'confirmed'].includes(order.status) && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="İptal Et"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Table Info */}
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      Masa {order.tableNumber || order.tableId}
                    </span>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(order.createdAt).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Staff Info */}
                  {order.assignedStaff && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{order.assignedStaff}</span>
                    </div>
                  )}
                </div>

                {/* Order Items Preview */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {order.items?.length} ürün: {' '}
                      {order.items?.slice(0, 3).map(item => item.name).join(', ')}
                      {order.items?.length > 3 && ` +${order.items.length - 3} daha`}
                    </div>
                    
                    {order.customerNotes && (
                      <div className="text-sm text-orange-600 italic">
                        "{order.customerNotes}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    Sipariş #{selectedOrder.orderNumber || selectedOrder.id?.slice(-6)}
                  </h2>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Masa</p>
                    <p className="font-semibold">{selectedOrder.tableNumber || selectedOrder.tableId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Durum</p>
                    <p className="font-semibold">{getStatusLabel(selectedOrder.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam</p>
                    <p className="font-semibold">{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Süre</p>
                    <p className="font-semibold">
                      {selectedOrder.duration ? formatDuration(selectedOrder.duration) : '-'}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Sipariş Detayları</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">Adet: {item.quantity}</p>
                          {item.notes && (
                            <p className="text-sm text-orange-600 italic mt-1">"{item.notes}"</p>
                          )}
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.customerNotes && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Müşteri Notları</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg italic">
                      "{selectedOrder.customerNotes}"
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Kapat
                  </button>
                  {['pending', 'confirmed'].includes(selectedOrder.status) && (
                    <button
                      onClick={() => {
                        cancelOrder(selectedOrder.id)
                        setShowOrderModal(false)
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      İptal Et
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}