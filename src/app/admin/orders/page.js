'use client'
import { useState, useEffect } from 'react'
import { Clock, Users, CheckCircle, AlertCircle, TrendingUp, DollarSign, Package, Eye, Trash2, Check, X, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function OrdersPage() {
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [stats, setStats] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  const orderStatuses = [
    { value: 'pending', label: 'Bekliyor', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300' },
    { value: 'preparing', label: 'Hazırlanıyor', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
    { value: 'ready', label: 'Hazır', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
    { value: 'delivered', label: 'Teslim Edildi', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' },
    { value: 'completed', label: 'Tamamlandı', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' },
    { value: 'cancelled', label: 'İptal', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-300' }
  ]

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setRefreshing(true)
      const [tablesRes, ordersRes] = await Promise.all([
        fetch('/api/admin/tables'),
        fetch('/api/orders?stats=true')
      ])

      if (tablesRes.ok && ordersRes.ok) {
        const tablesData = await tablesRes.json()
        const ordersData = await ordersRes.json()
        
        setTables(Array.isArray(tablesData) ? tablesData : [])
        
        if (ordersData.success) {
          setOrders(ordersData.orders || [])
          setStats(ordersData.stats || {})
        } else {
          setOrders([])
          setStats({})
        }
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
      toast.error('Veriler yüklenemedi')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getTableOrders = (tableNumber) => {
    const safeOrders = Array.isArray(orders) ? orders : []
    return safeOrders.filter(order => 
      order.tableId === tableNumber.toString() || 
      order.tableNumber === tableNumber
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const getTableStatus = (table) => {
    const tableOrders = getTableOrders(table.number)
    const activeOrders = tableOrders.filter(order => 
      ['pending', 'preparing', 'ready'].includes(order.status)
    )
    
    if (activeOrders.length === 0) return 'empty'
    if (activeOrders.some(order => order.status === 'ready')) return 'ready'
    if (activeOrders.some(order => order.status === 'preparing')) return 'preparing'
    return 'pending'
  }

  const getTableTotalAmount = (tableNumber) => {
    const tableOrders = getTableOrders(tableNumber)
    return tableOrders
      .filter(order => ['pending', 'preparing', 'ready'].includes(order.status))
      .reduce((total, order) => total + (order.totalAmount || 0), 0)
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      })

      const data = await res.json()
      if (data.success) {
        await fetchData()
        toast.success('Sipariş durumu güncellendi')
      } else {
        toast.error(data.error || 'Durum güncellenemedi')
      }
    } catch (error) {
      toast.error('Durum güncellenemedi')
    }
  }

  const completeTable = async (table) => {
    const tableOrders = getTableOrders(table.number)
    const activeOrders = tableOrders.filter(order => 
      ['pending', 'preparing', 'ready'].includes(order.status)
    )

    if (activeOrders.length === 0) {
      toast.error('Bu masada aktif sipariş yok')
      return
    }

    const totalAmount = activeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    
    if (!confirm(`Masa ${table.number} kapatılacak.\nToplam tutar: ${totalAmount.toFixed(2)}₺\nEmin misiniz?`)) {
      return
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bulkUpdate: true,
          tableId: table.number,
          status: 'completed'
        })
      })

      const data = await res.json()
      if (data.success) {
        await fetchData()
        toast.success(`Masa ${table.number} kapatıldı - ${totalAmount.toFixed(2)}₺`)
        setSelectedTable(null)
      } else {
        toast.error(data.error || 'Masa kapatılamadı')
      }
    } catch (error) {
      toast.error('Masa kapatılamadı')
    }
  }

  const cancelOrder = async (orderId) => {
    if (!confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) return

    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: 'Admin tarafından iptal edildi' })
      })

      const data = await res.json()
      if (data.success) {
        await fetchData()
        toast.success('Sipariş iptal edildi')
      } else {
        toast.error(data.error || 'Sipariş iptal edilemedi')
      }
    } catch (error) {
      toast.error('Sipariş iptal edilemedi')
    }
  }

  const getStatusInfo = (status) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0]
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTables = statusFilter === 'all' 
    ? tables 
    : tables.filter(table => {
        const status = getTableStatus(table)
        return statusFilter === 'active' 
          ? ['pending', 'preparing', 'ready'].includes(status)
          : status === statusFilter
      })

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Siparişler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sipariş Yönetimi</h1>
          <p className="text-gray-600">Masa bazlı sipariş takibi ve yönetimi</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="all">Tüm Masalar</option>
            <option value="active">Aktif Siparişler</option>
            <option value="pending">Bekleyen</option>
            <option value="preparing">Hazırlanan</option>
            <option value="ready">Hazır</option>
            <option value="empty">Boş Masalar</option>
          </select>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktif Siparişler</p>
              <p className="text-3xl font-bold text-blue-600">
                {(stats.pending || 0) + (stats.preparing || 0) + (stats.ready || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Günlük Ciro</p>
              <p className="text-3xl font-bold text-green-600">{(stats.totalRevenue || 0).toFixed(2)}₺</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ort. Sipariş</p>
              <p className="text-3xl font-bold text-purple-600">{(stats.averageOrderValue || 0).toFixed(2)}₺</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
              <p className="text-3xl font-bold text-gray-600">{stats.completed || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tables Grid */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Masa Durumları</h2>
          <p className="text-gray-600 mt-1">Sipariş veren masalar renk kodlu olarak gösterilir</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTables.map((table, index) => {
              const tableOrders = getTableOrders(table.number)
              const activeOrders = tableOrders.filter(order => 
                ['pending', 'preparing', 'ready'].includes(order.status)
              )
              const tableStatus = getTableStatus(table)
              const totalAmount = getTableTotalAmount(table.number)
              const statusInfo = getStatusInfo(tableStatus)
              
              return (
                <motion.div
                  key={table._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    tableStatus === 'empty' ? 'border-gray-200 bg-gray-50' :
                    tableStatus === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                    tableStatus === 'preparing' ? 'border-blue-300 bg-blue-50' :
                    tableStatus === 'ready' ? 'border-green-300 bg-green-50 shadow-lg animate-pulse' :
                    'border-gray-200 bg-gray-50'
                  }`}
                  onClick={() => activeOrders.length > 0 && setSelectedTable(table)}
                >
                  {/* Status Indicator */}
                  <div className={`absolute top-4 right-4 w-4 h-4 rounded-full ${
                    tableStatus === 'ready' ? 'bg-green-500 animate-ping' :
                    tableStatus === 'preparing' ? 'bg-blue-500' :
                    tableStatus === 'pending' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}>
                    {tableStatus === 'ready' && (
                      <div className="absolute w-4 h-4 bg-green-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Table Info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                        tableStatus === 'empty' ? 'bg-gray-500' :
                        tableStatus === 'pending' ? 'bg-yellow-500' :
                        tableStatus === 'preparing' ? 'bg-blue-500' :
                        tableStatus === 'ready' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}>
                        M{table.number}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Masa {table.number}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {table.capacity} kişilik
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Info */}
                  {activeOrders.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Aktif Sipariş:</span>
                        <span className="font-semibold text-gray-900 bg-white px-2 py-1 rounded">
                          {activeOrders.length} adet
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Toplam Tutar:</span>
                        <span className="font-bold text-green-600 text-lg">
                          {totalAmount.toFixed(2)}₺
                        </span>
                      </div>

                      {activeOrders[0] && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Son Sipariş:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatTime(activeOrders[0].createdAt)}
                          </span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTable(table)
                            }}
                            className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Detay
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              completeTable(table)
                            }}
                            className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            Kapat
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-gray-400 mb-3">
                        <Package className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Sipariş Bekliyor</p>
                      <p className="text-xs text-gray-400 mt-1">Müşteri henüz sipariş vermedi</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Table Detail Modal */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTable(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white p-6 border-b z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Masa {selectedTable.number} Siparişleri</h2>
                    <p className="text-gray-600 mt-1">
                      {selectedTable.capacity} kişilik masa • 
                      Toplam tutar: <span className="font-semibold text-green-600">
                        {getTableTotalAmount(selectedTable.number).toFixed(2)}₺
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => completeTable(selectedTable)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Masayı Kapat
                    </button>
                    <button
                      onClick={() => setSelectedTable(null)}
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {getTableOrders(selectedTable.number).map((order, index) => {
                  const statusInfo = getStatusInfo(order.status)
                  const isActive = ['pending', 'preparing', 'ready'].includes(order.status)
                  
                  return (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border-2 rounded-xl p-6 mb-4 ${
                        isActive ? statusInfo.borderColor + ' ' + statusInfo.bgColor : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Sipariş #{order._id.slice(-6)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.textColor} ${statusInfo.bgColor}`}>
                            {statusInfo.label}
                          </span>
                          <span className="font-bold text-lg text-green-600">
                            {(order.totalAmount || 0).toFixed(2)}₺
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items?.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex justify-between items-center py-2 px-4 bg-white rounded-lg shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-gray-100 text-black rounded-full flex items-center justify-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <span className="font-medium text-black">{item.name}</span>
                              {item.notes && (
                                <span className="text-xs text-gray-500 italic">({item.notes})</span>
                              )}
                            </div>
                            <span className="font-semibold text-gray-900">
                              {((item.price || 0) * (item.quantity || 1)).toFixed(2)}₺
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.customerNotes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-yellow-800">
                            <strong>Müşteri Notu:</strong> {order.customerNotes}
                          </p>
                        </div>
                      )}

                      {order.adminNotes && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-blue-800">
                            <strong>Admin Notu:</strong> {order.adminNotes}
                          </p>
                        </div>
                      )}

                      {isActive && (
                        <div className="flex gap-2 pt-4 border-t border-gray-200 ">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'preparing')}
                              className="bg-blue-600 text-black px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Hazırlamaya Başla
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'ready')}
                              className="bg-green-600 text-black px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              Hazır
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'delivered')}
                              className="bg-purple-600 text-black px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                            >
                              Teslim Edildi
                            </button>
                          )}
                          <button
                            onClick={() => cancelOrder(order._id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            İptal Et
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )
                })}

                {getTableOrders(selectedTable.number).length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş Yok</h3>
                    <p className="text-gray-600">Bu masada henüz sipariş verilmemiş</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}