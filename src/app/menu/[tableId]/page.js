'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Plus, Minus, X, Clock, Flame, Leaf, Check, AlertCircle, 
  Send, ChefHat, Star, Heart, Filter, Search, ArrowUp, Eye, Info,
  Zap, Shield, Award, ThumbsUp, Coffee, Utensils, Timer
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function CustomerMenu() {
  const params = useParams()
  const tableId = params?.tableId
  
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [customizations, setCustomizations] = useState({
    removed: [],
    extras: [],
    notes: ''
  })

  useEffect(() => {
    if (tableId) {
      fetchMenuData()
      loadCart()
      loadFavorites()
    }
  }, [tableId])

  useEffect(() => {
    saveCart()
  }, [cart])

  const fetchMenuData = async () => {
    try {
      setLoading(true)
      const menuResponse = await fetch('/api/menu')
      const menuData = await menuResponse.json()
      
      if (menuData.success) {
        setCategories(menuData.categories || [])
        setMenuItems(menuData.menuItems || [])
        setIngredients(menuData.ingredients || [])
      } else {
        throw new Error('Menü verisi alınamadı')
      }
    } catch (error) {
      console.error('Menu fetch error:', error)
      toast.error('Menü yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem(`cart_${tableId}`)
      if (savedCart) setCart(JSON.parse(savedCart))
    } catch (error) {
      console.error('Cart load error:', error)
    }
  }

  const saveCart = () => {
    try {
      localStorage.setItem(`cart_${tableId}`, JSON.stringify(cart))
    } catch (error) {
      console.error('Cart save error:', error)
    }
  }

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('favorites') || '[]'
      setFavorites(JSON.parse(savedFavorites))
    } catch (error) {
      console.error('Favorites load error:', error)
    }
  }

  const toggleFavorite = (itemId) => {
    const newFavorites = favorites.includes(itemId) 
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId]
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
    toast.success(favorites.includes(itemId) ? 'Favorilerden kaldırıldı' : 'Favorilere eklendi')
  }

  const getIngredientById = (id) => {
  return ingredients.find(ing => 
    (ing._id === id) || 
    (ing.id === id) || 
    (ing._id === id.toString()) || 
    (ing.id === id.toString()) ||
    (ing._id?.toString() === id) ||
    (ing.id?.toString() === id)
  )
}

  const addToCart = (item, customizations = { removed: [], extras: [], notes: '' }) => {
    const cartItem = {
      id: item._id || item.id,
      menuItemId: item._id || item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      customizations: {
        removed: customizations.removed.map(ing => ({
          id: ing._id || ing.id,
          name: ing.name
        })),
        extras: customizations.extras.map(extra => ({
          ingredient: {
            id: extra.ingredient._id || extra.ingredient.id,
            name: extra.ingredient.name
          },
          price: extra.price
        })),
        notes: customizations.notes
      },
      image: item.image
    }

    // Aynı özelleştirmeli ürün var mı kontrol et
    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.id === item._id && 
      JSON.stringify(cartItem.customizations) === JSON.stringify(cartItem.customizations)
    )

    if (existingItemIndex >= 0) {
      const newCart = [...cart]
      newCart[existingItemIndex].quantity += 1
      setCart(newCart)
    } else {
      setCart([...cart, cartItem])
    }

    toast.success(
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5 text-green-600" />
        <span>{item.name} sepete eklendi</span>
      </div>,
      { duration: 2000 }
    )
    
    setSelectedItem(null)
    setCustomizations({ removed: [], extras: [], notes: '' })
  }

  const updateCartItemQuantity = (index, quantity) => {
    if (quantity <= 0) {
      const newCart = cart.filter((_, i) => i !== index)
      setCart(newCart)
    } else {
      const newCart = [...cart]
      newCart[index].quantity = quantity
      setCart(newCart)
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      let itemTotal = item.price * item.quantity
      if (item.customizations?.extras) {
        const extrasTotal = item.customizations.extras.reduce((sum, extra) => {
          return sum + (extra.price * item.quantity)
        }, 0)
        itemTotal += extrasTotal
      }
      return total + itemTotal
    }, 0)
  }

  const sendOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepetiniz boş')
      return
    }

    const loadingToast = toast.loading('Sipariş gönderiliyor...')

    try {
      const orderData = {
        tableId: tableId,
        tableNumber: parseInt(tableId),
        items: cart,
        notes: ''
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Siparişiniz başarıyla gönderildi!', { id: loadingToast })
        setCart([])
        setShowCart(false)
        localStorage.removeItem(`cart_${tableId}`)
      } else {
        throw new Error(result.error || 'Sipariş gönderilemedi')
      }
    } catch (error) {
      console.error('Order send error:', error)
      toast.error('Sipariş gönderilirken hata oluştu', { id: loadingToast })
    }
  }

  const openItemModal = (item) => {
    setSelectedItem(item)
    setCustomizations({ removed: [], extras: [], notes: '' })
  }

  const toggleRemovedIngredient = (ingredient) => {
    const isRemoved = customizations.removed.some(r => r._id === ingredient._id)
    if (isRemoved) {
      setCustomizations({
        ...customizations,
        removed: customizations.removed.filter(r => r._id !== ingredient._id)
      })
    } else {
      setCustomizations({
        ...customizations,
        removed: [...customizations.removed, ingredient]
      })
    }
  }

  const toggleExtraIngredient = (ingredient, price = 0) => {
    const isExtra = customizations.extras.some(e => e.ingredient._id === ingredient._id)
    if (isExtra) {
      setCustomizations({
        ...customizations,
        extras: customizations.extras.filter(e => e.ingredient._id !== ingredient._id)
      })
    } else {
      setCustomizations({
        ...customizations,
        extras: [...customizations.extras, { ingredient, price }]
      })
    }
  }

  // Filtreleme
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFavorites = selectedCategory !== 'favorites' || favorites.includes(item._id || item.id)
    
    return matchesCategory && matchesSearch && matchesFavorites
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
        />
        <div className="ml-4 text-center">
          <h3 className="text-xl font-bold text-gray-800">Menü Hazırlanıyor</h3>
          <p className="text-gray-600">Lezzetli deneyiminiz için hazırlık yapıyoruz...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 relative">
        {/* Header */}
        <motion.header 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-lg"
        >
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <ChefHat className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Restoran Menü
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-gray-600 font-medium">Masa {tableId}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </motion.button>

                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCart(true)}
                  className="relative p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <AnimatePresence>
                    {cart.length > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white"
                      >
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>

            {/* Search Bar */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 relative"
                >
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Yemek ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-colors text-gray-800 placeholder-gray-500"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.header>

        {/* Category Filter */}
        <div className="sticky top-[100px] z-30 bg-white/90 backdrop-blur-lg border-b border-gray-200/50 px-4 sm:px-6 py-4">
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
            <CategoryButton 
              active={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
              icon={<Utensils className="w-4 h-4" />}
            >
              Tümü
            </CategoryButton>
            
            <CategoryButton 
              active={selectedCategory === 'favorites'}
              onClick={() => setSelectedCategory('favorites')}
              icon={<Heart className="w-4 h-4" />}
            >
              Favoriler
            </CategoryButton>
            
            {categories.map((category) => (
              <CategoryButton
                key={category._id || category.id}
                active={selectedCategory === (category._id || category.id)}
                onClick={() => setSelectedCategory(category._id || category.id)}
              >
                {category.name}
              </CategoryButton>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-4 sm:px-6 py-6">
          <AnimatePresence>
            {filteredItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Coffee className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchQuery ? 'Arama sonucu bulunamadı' : 'Bu kategoride ürün yok'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Farklı kelimeler deneyin' : 'Başka kategorilere göz atın'}
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, index) => (
                  <MenuItem
                    key={item._id || item.id}
                    item={item}
                    index={index}
                    isFavorite={favorites.includes(item._id || item.id)}
                    onToggleFavorite={toggleFavorite}
                    onOpenModal={openItemModal}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Scroll to Top Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 z-30 p-3 bg-white border-2 border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <ArrowUp className="w-5 h-5 text-gray-600" />
        </motion.button>
      </div>

      {/* Cart Modal */}
      <CartModal 
        show={showCart}
        cart={cart}
        totalPrice={getTotalPrice()}
        onClose={() => setShowCart(false)}
        onUpdateQuantity={updateCartItemQuantity}
        onSendOrder={sendOrder}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        ingredients={ingredients}
        customizations={customizations}
        onClose={() => setSelectedItem(null)}
        onToggleRemoved={toggleRemovedIngredient}
        onToggleExtra={toggleExtraIngredient}
        onUpdateNotes={(notes) => setCustomizations({...customizations, notes})}
        onAddToCart={addToCart}
      />

      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'bg-white border border-gray-200 text-gray-800 shadow-lg',
          duration: 3000,
        }}
      />
    </>
  )
}

// Category Button Component
function CategoryButton({ active, onClick, icon, children }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap font-medium text-sm transition-all border-2
        ${active 
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-lg' 
          : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
        }
      `}
    >
      {icon}
      <span>{children}</span>
    </motion.button>
  )
}

// Menu Item Component
function MenuItem({ item, index, isFavorite, onToggleFavorite, onOpenModal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 group"
    >
      {/* Image & Favorite */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(item._id || item.id)
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 text-gray-600 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </motion.button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {item.featured && (
            <div className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              <span>Öne Çıkan</span>
            </div>
          )}
          
          {item.dietaryInfo?.isVegan && (
            <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              <span>Vegan</span>
            </div>
          )}
          
          {item.spicyLevel > 0 && (
            <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              {[...Array(item.spicyLevel)].map((_, i) => (
                <Flame key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {item.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          {item.cookingTime && (
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              <span>{item.cookingTime} dk</span>
            </div>
          )}
          
          {item.allergens?.length > 0 && (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Alerjen</span>
            </div>
          )}
          
          {item.nutritionInfo?.calories && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>{item.nutritionInfo.calories} kcal</span>
            </div>
          )}
        </div>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              ₺{item.price}
            </span>
            {item.customizations?.extras?.length > 0 && (
              <span className="text-xs text-gray-500">+ ekstralar</span>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onOpenModal(item)}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>İlerle</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}// Cart Modal Component - Devamı
function CartModal({ show, cart, totalPrice, onClose, onUpdateQuantity, onSendOrder }) {
  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Sepetim</h2>
                <p className="text-orange-100">{cart.length} ürün</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-280px)]">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-6">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Sepetiniz Boş</h3>
                <p className="text-gray-500">Lezzetli ürünleri keşfetmeye başlayın!</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {cart.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                  >
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                        
                        {/* Customizations */}
                        {item.customizations && (
                          <div className="space-y-1 mb-3">
                            {item.customizations.removed && item.customizations.removed.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-xs font-medium text-red-600">Çıkarılan:</span>
                                {item.customizations.removed.map((ingredient, idx) => (
                                  <span key={idx} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full border border-red-200">
                                    -{ingredient.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {item.customizations.extras && item.customizations.extras.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-xs font-medium text-green-600">Eklenen:</span>
                                {item.customizations.extras.map((extra, idx) => (
                                  <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">
                                    +{extra.ingredient.name} {extra.price > 0 && `(+₺${extra.price})`}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.customizations.notes && (
                              <div className="text-xs text-gray-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                                <Info className="w-3 h-3 inline mr-1" />
                                {item.customizations.notes}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                              className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </motion.button>
                            
                            <span className="font-bold text-lg min-w-[2rem] text-center">{item.quantity}</span>
                            
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">
                              ₺{(item.price * item.quantity + 
                                (item.customizations?.extras?.reduce((sum, extra) => sum + (extra.price * item.quantity), 0) || 0)
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl font-bold text-gray-900">Toplam:</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  ₺{totalPrice.toFixed(2)}
                </span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSendOrder}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Send className="w-6 h-6" />
                <span>Sipariş Ver</span>
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Item Detail Modal Component - Footer Düzeltilmiş
function ItemDetailModal({ item, ingredients, customizations, onClose, onToggleRemoved, onToggleExtra, onUpdateNotes, onAddToCart }) {
  if (!item) return null

  const getIngredientById = (id) => {
    return ingredients.find(ing => 
      (ing._id === id) || 
      (ing.id === id) || 
      (ing._id === id.toString()) || 
      (ing.id === id.toString()) ||
      (ing._id?.toString() === id) ||
      (ing.id?.toString() === id)
    )
  }
  
  const calculateTotalPrice = () => {
    let total = item.price
    if (customizations.extras) {
      total += customizations.extras.reduce((sum, extra) => sum + extra.price, 0)
    }
    return total
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 100 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden"
        >
          {/* Image Header */}
          <div className="relative h-48 sm:h-64 bg-gradient-to-br from-orange-100 to-red-100 flex-shrink-0">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ChefHat className="w-20 h-20 text-gray-400" />
              </div>
            )}
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            >
              <X className="w-6 h-6 text-gray-600" />
            </motion.button>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {item.featured && (
                <div className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span>Öne Çıkan</span>
                </div>
              )}
              
              {item.dietaryInfo?.isVegan && (
                <div className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                  <Leaf className="w-4 h-4" />
                  <span>Vegan</span>
                </div>
              )}
              
              {item.spicyLevel > 0 && (
                <div className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                  {[...Array(item.spicyLevel)].map((_, i) => (
                    <Flame key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Basic Info */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{item.name}</h2>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">{item.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  ₺{item.price}
                </div>
                
                {item.cookingTime && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-5 h-5" />
                    <span>{item.cookingTime} dk</span>
                  </div>
                )}
                
                {item.nutritionInfo?.calories && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Zap className="w-5 h-5" />
                    <span>{item.nutritionInfo.calories} kcal</span>
                  </div>
                )}
              </div>

              {/* Nutrition Info */}
              {item.nutritionInfo && Object.values(item.nutritionInfo).some(val => val) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-2xl">
                  {item.nutritionInfo.protein && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{item.nutritionInfo.protein}g</div>
                      <div className="text-xs text-gray-600">Protein</div>
                    </div>
                  )}
                  {item.nutritionInfo.carbs && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{item.nutritionInfo.carbs}g</div>
                      <div className="text-xs text-gray-600">Karb.</div>
                    </div>
                  )}
                  {item.nutritionInfo.fat && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{item.nutritionInfo.fat}g</div>
                      <div className="text-xs text-gray-600">Yağ</div>
                    </div>
                  )}
                  {item.nutritionInfo.calories && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{item.nutritionInfo.calories}</div>
                      <div className="text-xs text-gray-600">Kalori</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Removable Ingredients */}
            {item.customizations?.removable && item.customizations.removable.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Minus className="w-5 h-5 text-red-500" />
                  Çıkarılabilir Malzemeler
                </h3>
                <div className="space-y-3">
                  {item.customizations.removable.map((ingredientId) => {
                    const ingredient = getIngredientById(ingredientId)
                    if (!ingredient) return null
                    
                    const isRemoved = customizations.removed.some(r => (r._id || r.id) === (ingredient._id || ingredient.id))
                    
                    return (
                      <motion.button
                        key={ingredient._id || ingredient.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onToggleRemoved(ingredient)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                          isRemoved 
                            ? 'bg-red-50 border-red-300 text-red-800' 
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isRemoved ? 'bg-red-500 border-red-500' : 'border-gray-300'
                            }`}>
                              {isRemoved && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="font-medium">{ingredient.name}</span>
                          </div>
                          {isRemoved && (
                            <div className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                              Çıkarıldı
                            </div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Extra Ingredients */}
            {item.customizations?.extras && item.customizations.extras.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-500" />
                  Ekstra Malzemeler
                </h3>
                <div className="space-y-3">
                  {item.customizations.extras.map((extra, index) => {
                    const ingredient = getIngredientById(extra.ingredientId)
                    if (!ingredient) return null
                    
                    const isExtra = customizations.extras.some(e => (e.ingredient._id || e.ingredient.id) === (ingredient._id || ingredient.id))
                    const extraPrice = parseFloat(extra.price || 0)
                    
                    return (
                      <motion.button
                        key={index}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onToggleExtra(ingredient, extraPrice)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                          isExtra 
                            ? 'bg-green-50 border-green-300 text-green-800' 
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isExtra ? 'bg-green-500 border-green-500' : 'border-gray-300'
                            }`}>
                              {isExtra && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <span className="font-medium block">{ingredient.name}</span>
                              {extraPrice > 0 && (
                                <span className="text-sm text-gray-500">+₺{extraPrice.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                          {isExtra && (
                            <div className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Eklendi
                            </div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Special Notes */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Özel İstek
              </h3>
              <textarea
                placeholder="Özel notlarınızı buraya yazabilirsiniz..."
                value={customizations.notes}
                onChange={(e) => onUpdateNotes(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none resize-none h-24 text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Allergen Warning */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="p-6">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-yellow-800 mb-2">Alerjen Uyarısı</h4>
                      <p className="text-yellow-700 text-sm leading-relaxed">
                        Bu ürün şu alerjenleri içerir: <span className="font-semibold">{item.allergens.join(', ')}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STICKY FOOTER - Her zaman görünür */}
          <div className="border-t border-gray-200 bg-white p-4 sm:p-6 flex-shrink-0">
            {/* Price Display */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg sm:text-xl font-semibold text-gray-900">Toplam Fiyat:</span>
              <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                ₺{calculateTotalPrice().toFixed(2)}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
              >
                İptal
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAddToCart(item, customizations)}
                className="flex-2 py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 min-w-[200px]"
              >
                <Plus className="w-5 h-5" />
                <span>Onayla</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}