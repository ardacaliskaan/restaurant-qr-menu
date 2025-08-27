'use client'
import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, preparing, ready, completed

  useEffect(() => {
    fetchOrders()
    // Her 30 saniyede bir otomatik yenile
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [filter])

  const fetchOrders = async () => {
    try {
      const url = filter !== 'all' ? `/api/orders?status=${filter}` : '/api/orders'
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus
        })
      })

      const result = await response.json()

      if (result.success) {
        await fetchOrders()
        alert('Sipariş durumu güncellendi!')
      } else {
        alert('Güncelleme hatası: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Güncelleme hatası!')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'preparing':
        return 'bg-blue-100 text-blue-800'
      case 'ready':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor'
      case 'preparing':
        return 'Hazırlanıyor'
      case 'ready':
        return 'Hazır'
      case 'completed':
        return 'Tamamlandı'
      case 'cancelled':
        return 'İptal Edildi'
      default:
        return status
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getTimeAgo = (dateString) => {
    const now = new Date()
    const orderTime = new Date(dateString)
    const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Az önce'
    if (diffInMinutes === 1) return '1 dakika önce'
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return '1 saat önce'
    return `${diffInHours} saat önce`
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
          <p className="text-gray-600">Aktif siparişleri takip edin ve durumlarını güncelleyin</p>
        </div>
        <button
          onClick={fetchOrders}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Yenile
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'Tümü' },
          { id: 'pending', label: 'Bekleyen' },
          { id: 'preparing', label: 'Hazırlanan' },
          { id: 'ready', label: 'Hazır' },
          { id: 'completed', label: 'Tamamlanan' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-6 py-3 rounded-full whitespace-nowrap font-medium transition-colors ${
              filter === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-semibold">
                    Masa {order.tableNumber}
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{formatTime(order.createdAt)}</div>
                  <div className="text-xs text-gray-400">{getTimeAgo(order.createdAt)}</div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Sipariş Detayı:</h4>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>₺{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {order.customerNotes && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-800">Not: </span>
                    <span className="text-sm text-yellow-700">{order.customerNotes}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-lg font-bold text-gray-900">
                  Toplam: ₺{order.totalAmount.toFixed(2)}
                </div>

                {/* Status Update Buttons */}
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Hazırlamaya Başla
                    </button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Hazır
                    </button>
                  )}
                  
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Teslim Et
                    </button>
                  )}

                  {(order.status === 'pending' || order.status === 'preparing') && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      İptal Et
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <p className="text-gray-500">
            {filter === 'all' ? 'Henüz sipariş yok.' : `${getStatusText(filter)} sipariş bulunmuyor.`}
          </p>
        </div>
      )}
    </div>
  )
}