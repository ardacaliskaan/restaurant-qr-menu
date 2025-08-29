// src/app/admin/orders/page.js - Güncellenmiş Siparişler Sayfası
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  DollarSign, 
  ShoppingBag, 
  Users,
  Eye,
  X,
  CheckCircle,
  ChefHat,
  Utensils,
  MapPin,
  Calendar,
  Hash,
  Minus,
  Plus,
  Info,
  Star,
  Search,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const statusConfig = {
  pending: { 
    label: 'Bekliyor', 
    color: 'yellow', 
    icon: Clock,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200'
  },
  preparing: { 
    label: 'Hazırlanıyor', 
    color: 'blue', 
    icon: ChefHat,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200'
  },
  ready: { 
    label: 'Hazır', 
    color: 'green', 
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200'
  },
  delivered: { 
    label: 'Teslim', 
    color: 'purple', 
    icon: Utensils,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200'
  },
  completed: { 
    label: 'Tamamlandı', 
    color: 'gray', 
    icon: CheckCircle,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200'
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [stats, setStats] = useState({})
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // 30 saniyede bir güncelle
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Orders ve stats verilerini getir
      const ordersResponse = await fetch('/api/orders?stats=true')
      const ordersData = await ordersResponse.json()
      
      // Tables verilerini getir
      const tablesResponse = await fetch('/api/admin/tables')
      const tablesData = await tablesResponse.json()
      
      if (ordersData.success) {
        setOrders(ordersData.orders || [])
        setStats(ordersData.stats || {})
      } else {
        console.error('Orders fetch error:', ordersData.error)
        setOrders([])
        setStats({})
      }
      
      if (Array.isArray(tablesData)) {
        setTables(tablesData)
      } else {
        console.error('Tables fetch error:', tablesData)
        setTables([])
      }
      
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Veriler yüklenirken hata oluştu')
      setOrders([])
      setTables([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      })
      
      const data = await response.json()
      if (data.success) {
        await fetchData()
        toast.success('Sipariş durumu güncellendi')
        // Modal'daki siparişi de güncelle
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }))
        }
      } else {
        toast.error(data.error || 'Durum güncellenemedi')
      }
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Durum güncellenemedi')
    }
  }

  const closeTable = async (tableNumber) => {
    if (!confirm(`Masa ${tableNumber} kapatılacak. Emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableNumber, 
          action: 'closeTable' 
        })
      })
      
      const data = await response.json()
      if (data.success) {
        await fetchData()
        toast.success(`Masa ${tableNumber} kapatıldı`)
      } else {
        toast.error(data.error || 'Masa kapatılamadı')
      }
    } catch (error) {
      console.error('Close table error:', error)
      toast.error('Masa kapatılamadı')
    }
  }

  // Filtreleme
  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false
    if (searchTerm && !order.tableNumber.toString().includes(searchTerm)) return false
    return true
  })

  // Masa bazında grupla
  const ordersByTable = filteredOrders.reduce((acc, order) => {
    const key = order.tableNumber
    if (!acc[key]) acc[key] = []
    acc[key].push(order)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktif Siparişler</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.activeOrders || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Günlük Ciro</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">₺{stats.dailyRevenue || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ortalama Tutar</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">₺{stats.averageOrder || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktif Masalar</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{Object.keys(ordersByTable).length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Masa numarası ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </div>

        {/* Orders by Table */}
        <div className="space-y-6">
          {Object.entries(ordersByTable).map(([tableNumber, tableOrders]) => (
            <motion.div
              key={tableNumber}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                    {tableNumber}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Masa {tableNumber}</h3>
                    <p className="text-sm text-gray-600">{tableOrders.length} sipariş</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Toplam: ₺{tableOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
                  </div>
                  <button
                    onClick={() => closeTable(tableNumber)}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Masayı Kapat
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {tableOrders.map((order) => {
                  const config = statusConfig[order.status]
                  const StatusIcon = config.icon
                  
                  return (
                    <div key={order._id} className="p-4 sm:p-6">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className={`
                              inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium
                              ${config.bgColor} ${config.textColor} ${config.borderColor} border
                            `}>
                              <StatusIcon className="w-4 h-4" />
                              <span>{config.label}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString('tr-TR')}
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              ₺{order.totalAmount}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {order.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg text-sm">
                                <span className="font-medium">{item.name}</span>
                                <span className="text-gray-500">x{item.quantity}</span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="px-3 py-1 bg-gray-200 rounded-lg text-sm text-gray-600">
                                +{order.items.length - 3} daha
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">Detay</span>
                          </button>

                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sipariş bulunamadı</h3>
            <p className="text-gray-600">Henüz sipariş bulunmamaktadır.</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)}
        onStatusUpdate={updateOrderStatus}
      />
    </div>
  )
}

// Order Detail Modal
function OrderDetailModal({ order, onClose, onStatusUpdate }) {
  if (!order) return null

  const config = statusConfig[order.status]
  const StatusIcon = config.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <Utensils className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Sipariş Detayı</h2>
                <p className="text-blue-100">Masa {order.tableNumber}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Order Info */}
            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Tarih & Saat</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Toplam</p>
                    <p className="font-semibold text-gray-900">₺{order.totalAmount}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Durum:</span>
                  <div className={`
                    inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
                    ${config.bgColor} ${config.textColor} ${config.borderColor} border
                  `}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{config.label}</span>
                  </div>
                </div>
                
                <select
                  value={order.status}
                  onChange={(e) => onStatusUpdate(order._id, e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {order.customerNotes && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Müşteri Notu:</p>
                      <p className="text-sm text-yellow-700 mt-1">{order.customerNotes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sipariş İçeriği</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">x{item.quantity}</span>
                        <span className="font-bold text-gray-900">₺{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Customizations */}
                    {item.customizations && (
                      <div className="space-y-2 mt-3">
                        {item.customizations.removed && item.customizations.removed.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                              Çıkarılan:
                            </span>
                            {item.customizations.removed.map((ingredient, idx) => (
                              <div key={idx} className="flex items-center space-x-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                <Minus className="w-3 h-3" />
                                <span>{ingredient.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.customizations.extras && item.customizations.extras.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              Eklenen:
                            </span>
                            {item.customizations.extras.map((extra, idx) => (
                              <div key={idx} className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                <Plus className="w-3 h-3" />
                                <span>{extra.ingredient.name}</span>
                                {extra.price > 0 && (
                                  <span className="font-semibold">+₺{extra.price}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5" />
                      </div>
                      <span className="text-lg font-semibold text-gray-900">Genel Toplam</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">₺{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}