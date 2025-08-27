'use client'
import { useState, useEffect } from 'react'
import { Plus, Minus, ShoppingCart, Clock, Loader2 } from 'lucide-react'

export default function MenuPage({ params }) {
  const [menu, setMenu] = useState({ categories: [] })
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableId, setTableId] = useState('')

  // Params'i await ile al
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setTableId(resolvedParams.tableId)
    }
    getParams()
  }, [params])

  // Menü verilerini API'den çek
  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/menu')
      const data = await response.json()
      
      if (data.success) {
        setMenu(data)
        // İlk kategoriyi seç
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id)
        }
      } else {
        setError('Menü yüklenemedi')
      }
    } catch (err) {
      console.error('Menu fetch error:', err)
      setError('Menü verileri alınamadı')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id)
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ).filter(item => item.quantity > 0)
    )
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handleOrderSubmit = async () => {
    if (cart.length === 0) return

    try {
      const orderData = {
        tableNumber: tableId,
        items: cart,
        notes: ''
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        alert('Siparişiniz başarıyla alındı!')
        setCart([])
        setIsCartOpen(false)
      } else {
        alert('Sipariş alınamadı: ' + result.error)
      }
    } catch (error) {
      console.error('Order submit error:', error)
      alert('Sipariş gönderilemedi')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Menü yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchMenu}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menü</h1>
              <p className="text-gray-600">Masa {tableId}</p>
            </div>
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Category Tabs */}
        {menu.categories.length > 0 && (
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {menu.categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Menu Items */}
        <div className="grid gap-4">
          {menu.categories
            .find(cat => cat.id === selectedCategory)
            ?.items.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h3>
                      <p className="text-gray-600 mb-4">{item.description}</p>
                      {item.allergens && item.allergens.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">
                            Alerjenler: {item.allergens.join(', ')}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-indigo-600">₺{item.price.toFixed(2)}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Sepete Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Empty state */}
        {menu.categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Henüz menü öğesi bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsCartOpen(false)}>
          <div 
            className="fixed right-0 top-0 h-full w-96 max-w-full bg-white shadow-xl transform transition-transform"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Sepetiniz</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(100% - 200px)' }}>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center">Sepetiniz boş</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-gray-600">₺{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Toplam:</span>
                  <span className="text-2xl font-bold text-indigo-600">₺{getTotalPrice().toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleOrderSubmit}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Siparişi Tamamla
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}