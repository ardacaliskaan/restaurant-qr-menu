'use client'
import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, ArrowLeft, Star, Clock, Flame, Leaf, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function CustomerMenu() {
  const { tableId } = useParams()
  const router = useRouter()
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    fetchMenuData()
    // Cart'ı localStorage'dan yükle
    const savedCart = localStorage.getItem(`cart_table_${tableId}`)
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [tableId])

  // Cart değişikliklerini localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem(`cart_table_${tableId}`, JSON.stringify(cart))
  }, [cart, tableId])

  const fetchMenuData = async () => {
    try {
      const [menuRes, categoriesRes, ingredientsRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/ingredients')
      ])

      if (menuRes.ok && categoriesRes.ok && ingredientsRes.ok) {
        const menuData = await menuRes.json()
        const categoriesData = await categoriesRes.json()
        const ingredientsData = await ingredientsRes.json()

        setMenuItems(menuData.success ? menuData.menuItems : [])
        setCategories(categoriesData.success ? categoriesData.flatCategories : [])
        setIngredients(ingredientsData.success ? ingredientsData.ingredients : [])
      }
    } catch (error) {
      console.error('Menü yüklenirken hata:', error)
      toast.error('Menü yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.name || 'Kategori'
  }

  const getIngredientName = (ingredientId) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId)
    return ingredient?.name || 'Malzeme'
  }

  const getIngredientInfo = (ingredientId) => {
    return ingredients.find(ing => ing.id === ingredientId)
  }

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.categoryId === selectedCategory)

  const addToCart = (item, customizations = {}) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      customizations,
      totalPrice: calculateItemPrice(item, customizations)
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(cartItem => 
        cartItem.id === item.id && 
        JSON.stringify(cartItem.customizations) === JSON.stringify(customizations)
      )

      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex].quantity += 1
        updated[existingIndex].totalPrice = updated[existingIndex].quantity * calculateItemPrice(item, customizations)
        return updated
      } else {
        return [...prev, cartItem]
      }
    })

    toast.success(`${item.name} sepete eklendi`)
    setSelectedItem(null)
  }

  const updateCartQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index))
      return
    }

    setCart(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, quantity: newQuantity, totalPrice: newQuantity * (item.totalPrice / item.quantity) }
        : item
    ))
  }

  const calculateItemPrice = (item, customizations) => {
    let price = item.price

    // Ekstra malzemeler için fiyat ekle
    if (customizations.extras) {
      customizations.extras.forEach(extraId => {
        const ingredient = getIngredientInfo(extraId)
        if (ingredient?.extraPrice) {
          price += ingredient.extraPrice
        }
      })
    }

    return price
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0)
  }

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepetiniz boş')
      return
    }

    try {
      const orderData = {
        tableNumber: tableId,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.totalPrice / item.quantity,
          quantity: item.quantity,
          customizations: item.customizations
        })),
        totalAmount: getTotalPrice(),
        notes: ''
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Siparişiniz alındı!')
        setCart([])
        localStorage.removeItem(`cart_table_${tableId}`)
        setShowCart(false)
      } else {
        toast.error(data.error || 'Sipariş gönderilemedi')
      }
    } catch (error) {
      console.error('Sipariş gönderme hatası:', error)
      toast.error('Sipariş gönderilemedi')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Menü yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Restorant Menüsü</h1>
              <p className="text-gray-600">Masa {tableId}</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-orange-600 text-white px-4 py-3 rounded-2xl shadow-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Sepet</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-[88px] z-30 bg-white/95 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tümü
            </button>
            {categories.filter(cat => cat.isActive).map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid gap-4">
          {filteredItems.filter(item => item.available).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className="flex">
                {/* Product Image */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                      <Users className="w-8 h-8 text-orange-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                      {item.name}
                    </h3>
                    <div className="text-right ml-2">
                      <p className="text-xl font-bold text-orange-600">
                        {item.price.toFixed(2)}₺
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between">
                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.cookingTime && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          <Clock className="w-3 h-3" />
                          {item.cookingTime}dk
                        </span>
                      )}
                      {item.spicyLevel > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          <Flame className="w-3 h-3" />
                          {Array(item.spicyLevel).fill('🌶️').join('')}
                        </span>
                      )}
                      {item.dietaryInfo?.isVegan && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          <Leaf className="w-3 h-3" />
                          Vegan
                        </span>
                      )}
                      {item.dietaryInfo?.isVegetarian && !item.dietaryInfo?.isVegan && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          <Leaf className="w-3 h-3" />
                          Vejetaryen
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (item.customizations?.removable?.length > 0 || 
                            item.customizations?.extras?.length > 0) {
                          setSelectedItem(item)
                        } else {
                          addToCart(item)
                        }
                      }}
                      className="bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                      Sepete Ekle
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <ProductDetailModal 
                item={selectedItem}
                ingredients={ingredients}
                onAddToCart={addToCart}
                onClose={() => setSelectedItem(null)}
                getIngredientInfo={getIngredientInfo}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CartModal 
                cart={cart}
                onUpdateQuantity={updateCartQuantity}
                onSubmitOrder={submitOrder}
                onClose={() => setShowCart(false)}
                totalPrice={getTotalPrice()}
                tableId={tableId}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Product Detail Modal Component
function ProductDetailModal({ item, ingredients, onAddToCart, onClose, getIngredientInfo }) {
  const [removedIngredients, setRemovedIngredients] = useState([])
  const [extraIngredients, setExtraIngredients] = useState([])

  const handleSubmit = () => {
    const customizations = {
      removed: removedIngredients,
      extras: extraIngredients
    }
    onAddToCart(item, customizations)
  }

  const calculatePrice = () => {
    let price = item.price
    extraIngredients.forEach(extraId => {
      const ingredient = getIngredientInfo(extraId)
      if (ingredient?.extraPrice) {
        price += ingredient.extraPrice
      }
    })
    return price
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 flex-1 text-center mr-10">
          Ürün Detayı
        </h2>
      </div>

      {/* Product Image */}
      {item.image && (
        <div className="w-full h-48 mb-6 rounded-2xl overflow-hidden">
          <Image
            src={item.image}
            alt={item.name}
            width={400}
            height={200}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Product Info */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h3>
        <p className="text-gray-600 mb-4">{item.description}</p>
        
        {/* Tags and Info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {item.cookingTime && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
              <Clock className="w-4 h-4" />
              {item.cookingTime} dakika
            </span>
          )}
          {item.nutritionInfo?.calories && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              {item.nutritionInfo.calories} kalori
            </span>
          )}
          {item.allergens?.length > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
              Alerjen içerir
            </span>
          )}
        </div>
      </div>

      {/* Customizations */}
      {item.customizations?.removable?.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Çıkarılabilir Malzemeler</h4>
          <div className="space-y-2">
            {item.customizations.removable.map(ingredientId => {
              const ingredient = getIngredientInfo(ingredientId)
              if (!ingredient) return null
              
              return (
                <label key={ingredientId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removedIngredients.includes(ingredientId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRemovedIngredients(prev => [...prev, ingredientId])
                      } else {
                        setRemovedIngredients(prev => prev.filter(id => id !== ingredientId))
                      }
                    }}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-gray-900">{ingredient.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {item.customizations?.extras?.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Ekstra Malzemeler</h4>
          <div className="space-y-2">
            {item.customizations.extras.map(extra => {
              const ingredient = getIngredientInfo(extra.ingredientId)
              if (!ingredient) return null
              
              const extraPrice = parseFloat(extra.price || 0)
              
              return (
                <label key={extra.ingredientId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={extraIngredients.includes(extra.ingredientId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExtraIngredients(prev => [...prev, extra.ingredientId])
                      } else {
                        setExtraIngredients(prev => prev.filter(id => id !== extra.ingredientId))
                      }
                    }}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="flex-1 text-gray-900">{ingredient.name}</span>
                  {extraPrice > 0 && (
                    <span className="text-orange-600 font-medium">+{extraPrice.toFixed(2)}₺</span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <div className="sticky bottom-0 bg-white pt-4 border-t">
        <button
          onClick={handleSubmit}
          className="w-full bg-orange-600 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-orange-700 transition-colors"
        >
          Sepete Ekle - {calculatePrice().toFixed(2)}₺
        </button>
      </div>
    </div>
  )
}

// Cart Modal Component
function CartModal({ cart, onUpdateQuantity, onSubmitOrder, onClose, totalPrice, tableId }) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Sepetim</h2>
        <div className="w-10 h-10"></div>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sepetiniz boş</h3>
          <p className="text-gray-600">Menüden ürün ekleyerek başlayın</p>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {cart.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="w-15 h-15 object-cover rounded-xl"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    {(item.totalPrice / item.quantity).toFixed(2)}₺
                  </p>
                  {item.customizations?.removed?.length > 0 && (
                    <p className="text-xs text-red-600">
                      Çıkarılan: {item.customizations.removed.length} malzeme
                    </p>
                  )}
                  {item.customizations?.extras?.length > 0 && (
                    <p className="text-xs text-green-600">
                      Ekstra: {item.customizations.extras.length} malzeme
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-medium min-w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total and Order Button */}
          <div className="sticky bottom-0 bg-white pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium text-gray-900">Toplam</span>
              <span className="text-2xl font-bold text-orange-600">{totalPrice.toFixed(2)}₺</span>
            </div>
            <button
              onClick={onSubmitOrder}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-orange-700 transition-colors"
            >
              Sipariş Ver - Masa {tableId}
            </button>
          </div>
        </>
      )}
    </div>
  )
}