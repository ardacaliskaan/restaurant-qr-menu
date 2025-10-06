'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, User, CreditCard, Filter, Search, MoreVertical,
  CheckCircle, XCircle, AlertCircle, Package, ChefHat,
  Eye, Edit2, Trash2, RefreshCw, Calendar, DollarSign,
  TrendingUp, Users, ShoppingCart, BarChart3, MapPin,
  X, Plus, Minus, MessageSquare, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

// Gelişmiş Order Detail Modal Component
const OrderDetailModal = ({ order, isOpen, onClose, onStatusChange, onDelete }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!order || !isOpen) return null;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-orange-100 text-orange-800 border-orange-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      delivered: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Bekliyor',
      confirmed: 'Onaylandı', 
      preparing: 'Hazırlanıyor',
      ready: 'Hazır',
      delivered: 'Teslim Edildi',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi'
    };
    return labels[status] || status;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'details', label: 'Sipariş Detayları', icon: Package },
    { id: 'timeline', label: 'Zaman Çizelgesi', icon: Clock },
    { id: 'notes', label: 'Notlar & Özelleştirme', icon: MessageSquare }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Package className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">Sipariş #{order.orderNumber || order.id?.slice(-6)}</h2>
                  <p className="text-orange-100">Masa {order.tableNumber} • {formatTime(order.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-6 py-4 bg-gray-50 border-b grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">₺{order.totalAmount}</div>
              <div className="text-sm text-gray-600">Toplam Tutar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{order.items?.length || 0}</div>
              <div className="text-sm text-gray-600">Ürün Sayısı</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{order.estimatedTime || 25}dk</div>
              <div className="text-sm text-gray-600">Tahmini Süre</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {order.priority === 'urgent' ? 'ACİL' : 
                 order.priority === 'high' ? 'YÜKSEK' : 
                 order.priority === 'normal' ? 'NORMAL' : 'DÜŞÜK'}
              </div>
              <div className="text-sm text-gray-600">Öncelik</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors
                      ${isActive 
                        ? 'border-orange-500 text-orange-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Ürünler */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ChefHat className="w-5 h-5 mr-2" />
                    Sipariş Ürünleri
                  </h3>
                  <div className="space-y-4">
                    {(order.items || []).map((item, index) => (
                      <motion.div
                        key={item.id || index}
                        className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-sm text-gray-600">Adet: {item.quantity}</span>
                                  <span className="text-sm text-gray-600">Birim: ₺{item.price}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">₺{(item.price * item.quantity).toFixed(2)}</div>
                              </div>
                            </div>

                            {/* Özelleştirmeler */}
                            {item.customizations && (item.customizations.removed?.length > 0 || item.customizations.extras?.length > 0) && (
                              <div className="mt-3 space-y-2">
                                {item.customizations.removed?.length > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <Minus className="w-4 h-4 text-red-500" />
                                    <span className="text-sm text-red-600">
                                      Çıkarılan: {item.customizations.removed.join(', ')}
                                    </span>
                                  </div>
                                )}
                                {item.customizations.extras?.length > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <Plus className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">
                                      Eklenen: {item.customizations.extras.map(extra => 
                                        typeof extra === 'object' ? `${extra.name} (+₺${extra.price})` : extra
                                      ).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Ürün Notu */}
                            {item.notes && (
                              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <MessageSquare className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm text-blue-700">{item.notes}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Masa & Staff Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Masa Bilgileri
                    </h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div>Masa Numarası: {order.tableNumber}</div>
                      <div>Masa ID: {order.tableId}</div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Sorumlu Personel
                    </h4>
                    <div className="text-sm text-green-700">
                      {order.assignedStaff || 'Atanmamış'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Sipariş Zaman Çizelgesi
                </h3>
                
                <div className="space-y-4">
                  {[
                    { status: 'created', label: 'Sipariş Alındı', time: order.createdAt, completed: true },
                    { status: 'confirmed', label: 'Sipariş Onaylandı', time: order.confirmedAt, completed: ['confirmed', 'preparing', 'ready', 'delivered', 'completed'].includes(order.status) },
                    { status: 'preparing', label: 'Hazırlanıyor', time: order.preparingAt, completed: ['preparing', 'ready', 'delivered', 'completed'].includes(order.status) },
                    { status: 'ready', label: 'Hazır', time: order.readyAt, completed: ['ready', 'delivered', 'completed'].includes(order.status) },
                    { status: 'delivered', label: 'Teslim Edildi', time: order.deliveredAt, completed: ['delivered', 'completed'].includes(order.status) },
                    { status: 'completed', label: 'Tamamlandı', time: order.completedAt, completed: order.status === 'completed' }
                  ].map((step) => (
                    <div key={step.status} className="flex items-center space-x-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${step.completed 
                          ? 'bg-green-100 text-green-600 border-2 border-green-200' 
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                        }
                      `}>
                        {step.completed ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {step.label}
                        </div>
                        {step.time && (
                          <div className="text-sm text-gray-500">
                            {new Date(step.time).toLocaleString('tr-TR')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Müşteri Notları
                  </h3>
                  {order.customerNotes ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div className="text-amber-800">{order.customerNotes}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Bu sipariş için özel not bulunmuyor.</p>
                    </div>
                  )}
                </div>

                {/* Tüm Özelleştirmeler Özeti */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Özelleştirme Özeti</h3>
                  <div className="space-y-4">
                    {(order.items || []).map((item, index) => (
                      (item.customizations?.removed?.length > 0 || item.customizations?.extras?.length > 0 || item.notes) && (
                        <div key={item.id || index} className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-medium text-gray-900 mb-3">{item.name}</h4>
                          
                          {item.customizations?.removed?.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <Minus className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium text-red-600">Çıkarılan Malzemeler</span>
                              </div>
                              <div className="pl-6 space-y-1">
                                {item.customizations.removed.map((removed, idx) => (
                                  <div key={idx} className="text-sm text-red-700">• {removed}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.customizations?.extras?.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <Plus className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-green-600">Eklenen Malzemeler</span>
                              </div>
                              <div className="pl-6 space-y-1">
                                {item.customizations.extras.map((extra, idx) => (
                                  <div key={idx} className="text-sm text-green-700 flex justify-between">
                                    <span>• {typeof extra === 'object' ? extra.name : extra}</span>
                                    {typeof extra === 'object' && extra.price && <span>+₺{extra.price}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.notes && (
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-blue-600">Özel Not</span>
                              </div>
                              <div className="pl-6 text-sm text-blue-700">{item.notes}</div>
                            </div>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select 
                value={order.status}
                onChange={(e) => onStatusChange?.(order.id, e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="pending">Bekliyor</option>
                <option value="confirmed">Onaylandı</option>
                <option value="preparing">Hazırlanıyor</option>
                <option value="ready">Hazır</option>
                <option value="delivered">Teslim Edildi</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
              
              <button
                onClick={() => onDelete?.(order.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sil</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Kapat
              </button>
              <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2">
                <Edit2 className="w-4 h-4" />
                <span>Düzenle</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Ana Orders Admin Component
export default function OrdersAdminPage() {
  // States
  const [orders, setOrders] = useState([])
  const [statistics, setStatistics] = useState(null)
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
  
  // View states
  const [viewMode, setViewMode] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // Demo data
  const demoOrders = [
    {
      id: '202510068809',
      orderNumber: '#202510068809',
      tableNumber: 2,
      tableId: 'table-2',
      status: 'preparing',
      priority: 'normal',
      paymentStatus: 'pending',
      totalAmount: 52.90,
      customerNotes: 'Lütfen acısız hazırlayın. Ketçap ve mayonez ayrı gelsin.',
      createdAt: '2025-01-06T10:30:00Z',
      estimatedTime: 25,
      assignedStaff: 'Ahmet Çakmak',
      items: [
        {
          id: 'item-1',
          menuItemId: 'menu-pepperoni',
          name: 'Pepperoni Pizza',
          price: 45.90,
          quantity: 1,
          customizations: {
            removed: ['Soğan', 'Zeytin'],
            extras: [
              { name: 'Ekstra Peynir', price: 5.00 },
              { name: 'Mantar', price: 3.00 }
            ]
          },
          notes: 'Orta boy, ince hamur'
        },
        {
          id: 'item-2', 
          menuItemId: 'menu-coke',
          name: 'Coca Cola',
          price: 8.00,
          quantity: 2,
          customizations: { removed: [], extras: [] },
          notes: 'Buz ile'
        }
      ]
    },
    {
      id: '202510068810',
      orderNumber: '#202510068810',
      tableNumber: 5,
      status: 'ready',
      priority: 'high',
      totalAmount: 38.50,
      customerNotes: '',
      createdAt: '2025-01-06T11:15:00Z',
      items: [
        {
          id: 'item-3',
          name: 'Chicken Burger',
          price: 35.90,
          quantity: 1,
          customizations: { removed: ['Marul'], extras: [] }
        },
        {
          id: 'item-4',
          name: 'Patates Kızartması',
          price: 12.60,
          quantity: 1,
          customizations: { removed: [], extras: [] }
        }
      ]
    }
  ];

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
        groupByTable: 'true', // 🔥 Masa bazlı gruplama aktif
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
        // Masa gruplarını ana liste olarak kullan
        setOrders(data.orders || []) // Artık bu masa grupları
        setStatistics(data.statistics)
        if (data.analytics) {
          setAnalytics(data.analytics)
        }
        
        console.log('📊 Loaded table groups:', data.orders?.length)
        console.log('📦 Original orders:', data.originalOrders?.length)
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

  const getStatusColor = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status)
    return statusObj ? statusObj.color : 'gray'
  }

  const getStatusLabel = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status)
    return statusObj ? statusObj.label : status
  }

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const handleDelete = (orderId) => {
    if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
      cancelOrder(orderId);
    }
  };

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
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        await loadOrders()
        setShowOrderModal(false)
        toast.success('Sipariş iptal edildi')
      } else {
        toast.error(result.error || 'İptal işlemi başarısız')
      }
    } catch (error) {
      console.error('Cancel order error:', error)
      toast.error('İptal işlemi hatası')
    }
  }

  const closeTable = async (tableNumber) => {
    if (!confirm(`Masa ${tableNumber}'yi kapatmak istediğinizden emin misiniz? Bu masadaki tüm aktif siparişler tamamlanmış olarak işaretlenecek.`)) {
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'closeTable',
          tableNumber: tableNumber
        })
      })

      const result = await response.json()

      if (result.success) {
        await loadOrders()
        toast.success(`Masa ${tableNumber} başarıyla kapatıldı`)
      } else {
        toast.error(result.error || 'Masa kapatma başarısız')
      }
    } catch (error) {
      console.error('Close table error:', error)
      toast.error('Masa kapatma hatası')
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
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
          <p className="text-gray-600">Siparişleri takip edin ve yönetin</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </button>
        </div>
      </div>

      {/* Quick Stats - Masa Bazlı */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="w-12 h-12 text-orange-500 bg-orange-100 rounded-full p-3" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktif Masalar</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(table => !['completed', 'cancelled'].includes(table.status)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ShoppingCart className="w-12 h-12 text-blue-500 bg-blue-100 rounded-full p-3" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.reduce((sum, table) => sum + (table.customerCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <DollarSign className="w-12 h-12 text-green-500 bg-green-100 rounded-full p-3" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Günlük Ciro</p>
              <p className="text-2xl font-bold text-gray-900">
                ₺{orders.reduce((sum, table) => sum + (table.totalAmount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="w-12 h-12 text-purple-500 bg-purple-100 rounded-full p-3" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ortalama Süre</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.length > 0 
                  ? Math.round(orders.reduce((sum, table) => sum + (table.estimatedTime || 0), 0) / orders.length)
                  : 0
                }dk
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {orderStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Sipariş ara..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Today Filter */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.today}
              onChange={(e) => setFilters({...filters, today: e.target.checked})}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Sadece Bugün</span>
          </label>
        </div>
      </div>

      {/* Orders List - Masa Bazlı Görünüm */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş bulunamadı</h3>
            <p className="text-gray-600">Seçilen kriterlere uygun sipariş yok</p>
          </div>
        ) : (
          orders.map((tableGroup, index) => (
            <motion.div
              key={tableGroup.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="p-6">
                {/* Masa Group Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      {/* Masa Icon */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          🍽️ Masa {tableGroup.tableNumber}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{tableGroup.customerCount} Sipariş</span>
                          <span>{tableGroup.itemCount} Ürün</span>
                          <span className="text-green-600 font-medium">₺{tableGroup.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Masa Status */}
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(tableGroup.status)}-100 text-${getStatusColor(tableGroup.status)}-800`}>
                        {getStatusLabel(tableGroup.status)}
                      </span>
                      
                      {tableGroup.priority && tableGroup.priority !== 'normal' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tableGroup.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          tableGroup.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {tableGroup.priority === 'urgent' ? 'ACİL' : 
                           tableGroup.priority === 'high' ? 'YÜKSEK' : 'DÜŞÜK'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Table Actions */}
                  <div className="flex items-center space-x-2">
                    {/* Close Table Button */}
                    {!['completed', 'cancelled'].includes(tableGroup.status) && (
                      <button
                        onClick={() => closeTable(tableGroup.tableNumber)}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium flex items-center space-x-2"
                        title={`Masa ${tableGroup.tableNumber} Kapat`}
                      >
                        <X className="w-4 h-4" />
                        <span>Masa Kapat</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        // İlk siparişi seçili sipariş olarak ata (modal için)
                        setSelectedOrder(tableGroup.orders?.[0] || tableGroup)
                        setShowOrderModal(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Detayları Gör"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Masa Details */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Time Info */}
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <div className="text-sm">
                        <div>İlk: {new Date(tableGroup.createdAt).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</div>
                        <div>Son: {new Date(tableGroup.lastOrderAt).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</div>
                      </div>
                    </div>

                    {/* Status Summary */}
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Package className="w-4 h-4" />
                      <div className="text-sm">
                        {tableGroup.summary && (
                          <div className="flex space-x-2">
                            {tableGroup.summary.pendingCount > 0 && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                {tableGroup.summary.pendingCount} Bekliyor
                              </span>
                            )}
                            {tableGroup.summary.preparingCount > 0 && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                {tableGroup.summary.preparingCount} Hazırlanıyor
                              </span>
                            )}
                            {tableGroup.summary.readyCount > 0 && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {tableGroup.summary.readyCount} Hazır
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Staff Info */}
                    {tableGroup.assignedStaff && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="text-sm">{tableGroup.assignedStaff}</span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Order Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Masa Siparişleri ({tableGroup.orders?.length || 0})</h4>
                    <div className="space-y-2">
                      {(tableGroup.orders || []).map((order, orderIndex) => (
                        <div key={order.id || orderIndex} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-900">
                              #{order.orderNumber || order.id?.slice(-6)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800`}>
                              {getStatusLabel(order.status)}
                            </span>
                            <span className="text-sm text-gray-600">
                              {order.items?.length || 0} ürün
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-900">₺{order.totalAmount}</span>
                            <button
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowOrderModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Detay
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {tableGroup.customerNotes && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <strong>Masa Notları:</strong> {tableGroup.customerNotes}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Gelişmiş Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  )
}