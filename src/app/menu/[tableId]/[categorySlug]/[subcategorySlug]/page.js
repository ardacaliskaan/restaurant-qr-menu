'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Coffee, Plus, Minus, ShoppingCart, X, Flame, 
  Trash2, Send, Clock, Sparkles, Check, AlertCircle, MessageSquare
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import MenuFooter from '@/components/MenuFooter'
// 🔐 Session Manager Import
import { SessionManager } from '@/lib/sessionManager'

export default function SubcategoryProductsPage({ params }) {
  const [products, setProducts] = useState([])
  const [currentSubcategory, setCurrentSubcategory] = useState(null)
  const [parentCategory, setParentCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const [categorySlug, setCategorySlug] = useState(null)
  const [subcategorySlug, setSubcategorySlug] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState([])
  
  // 🔐 Session States
  const [session, setSession] = useState(null)
  const [sessionManager, setSessionManager] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  
  // 🆕 Zorunlu Seçimler ve Özelleştirme
  const [selectedOptions, setSelectedOptions] = useState({})
  const [customizations, setCustomizations] = useState({ removed: [], extras: [] })
  const [customerNotes, setCustomerNotes] = useState('')
  
  const router = useRouter()

  const getCartKey = () => `meva-cart-${tableId}`

  // Load cart from localStorage
  useEffect(() => {
    if (tableId) {
      const savedCart = localStorage.getItem(getCartKey())
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    }
  }, [tableId])

  // Save cart to localStorage
  useEffect(() => {
    if (tableId && cart.length >= 0) {
      localStorage.setItem(getCartKey(), JSON.stringify(cart))
    }
  }, [cart, tableId])

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setTableId(resolvedParams.tableId)
      setCategorySlug(resolvedParams.categorySlug)
      setSubcategorySlug(resolvedParams.subcategorySlug)
    }
    unwrapParams()
  }, [params])

  // 🔐 Session Başlatma
  useEffect(() => {
    if (tableId) {
      initSession()
    }
  }, [tableId])

  useEffect(() => {
    if (tableId && categorySlug && subcategorySlug) {
      fetchData()
    }
  }, [tableId, categorySlug, subcategorySlug])

  // 🔐 Session Başlatma Fonksiyonu
  const initSession = async () => {
    try {
      setSessionLoading(true)
      
      const manager = new SessionManager(parseInt(tableId))
      setSessionManager(manager)
      
      console.log('🔐 Initializing session for table:', tableId)
      
      const result = await manager.initSession()
      
      if (result.success) {
        setSession(result.session)
        console.log('✅ Session initialized:', result.session.sessionId)
        console.log('📱 Device fingerprint:', manager.deviceInfo.fingerprint)
        
        if (result.isNew) {
          toast.success('Hoş geldiniz! 🎉', {
            duration: 3000,
            icon: '👋'
          })
        }
      } else {
        console.error('❌ Session init failed:', result.error)
        toast.error('Bağlantı hatası. Sipariş verirken sorun yaşayabilirsiniz.')
      }
    } catch (error) {
      console.error('Session error:', error)
    } finally {
      setSessionLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const categoriesRes = await fetch('/api/admin/categories')
      const categoriesData = await categoriesRes.json()
      
      const productsRes = await fetch('/api/menu')
      const productsData = await productsRes.json()
      
      if (categoriesData.success) {
        const allCategories = categoriesData.flatCategories || []
        
        const parentCat = allCategories.find(cat => cat.slug === categorySlug)
        setParentCategory(parentCat)
        
        const subCat = allCategories.find(cat => cat.slug === subcategorySlug)
        setCurrentSubcategory(subCat)
        
        if (subCat && productsData.success) {
          const subcategoryProducts = productsData.items?.filter(item => 
            item.subcategoryId === subCat.id && item.available !== false
          ) || []
          setProducts(subcategoryProducts)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleBackClick = () => {
    router.back()
  }

  const openProductModal = (product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setSelectedOptions({})
    setCustomizations({ removed: [], extras: [] })
    setCustomerNotes('')
    setShowProductModal(true)
  }

  const closeProductModal = () => {
    setShowProductModal(false)
    setSelectedProduct(null)
    setQuantity(1)
    setSelectedOptions({})
    setCustomizations({ removed: [], extras: [] })
    setCustomerNotes('')
  }

  const openCartModal = () => {
    setShowCartModal(true)
  }

  const closeCartModal = () => {
    setShowCartModal(false)
  }

  // 🆕 Zorunlu seçim kontrolü
  const canAddToCart = () => {
    if (!selectedProduct?.requiredOptions) return true
    
    for (const option of selectedProduct.requiredOptions) {
      if (option.required && !selectedOptions[option.id]) {
        return false
      }
    }
    return true
  }

  // 🆕 Fiyat hesaplama
  const calculateItemPrice = () => {
    let basePrice = selectedProduct.price
    
    // Zorunlu seçimlerin fiyatını ekle
    if (selectedProduct?.requiredOptions) {
      selectedProduct.requiredOptions.forEach(optGroup => {
        const selectedValue = selectedOptions[optGroup.id]
        if (selectedValue) {
          const option = optGroup.options.find(opt => opt.value === selectedValue)
          if (option && option.price) {
            basePrice += option.price
          }
        }
      })
    }
    
    // Ekstra malzemelerin fiyatını ekle
    customizations.extras.forEach(extra => {
      basePrice += extra.price || 0
    })
    
    return basePrice
  }

  const handleAddToCart = () => {
    if (!canAddToCart()) {
      toast.error('Lütfen zorunlu seçimleri yapın!', {
        icon: '⚠️'
      })
      return
    }
    
    const itemPrice = calculateItemPrice()
    
    const cartItem = {
      id: `${selectedProduct.id}-${Date.now()}`,
      menuItemId: selectedProduct.id,
      name: selectedProduct.name,
      basePrice: selectedProduct.price,
      price: itemPrice,
      image: selectedProduct.image,
      quantity: quantity,
      selectedOptions: selectedOptions,
      customizations: customizations,
      notes: customerNotes
    }
    
    setCart([...cart, cartItem])
    toast.success(`${selectedProduct.name} sepete eklendi!`, {
      icon: '✅'
    })
    
    closeProductModal()
  }

  const updateCartItemQuantity = (item, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(item)
      return
    }
    
    setCart(cart.map(cartItem => 
      cartItem.id === item.id ? { ...cartItem, quantity: newQuantity } : cartItem
    ))
  }

  const removeFromCart = (item) => {
    setCart(cart.filter(cartItem => cartItem.id !== item.id))
    toast.success('Ürün sepetten kaldırıldı')
  }

  const clearCart = () => {
    setCart([])
    toast.success('Sepet temizlendi')
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepetiniz boş!')
      return
    }

    // 🔐 Session kontrolü
    if (!session || !sessionManager) {
      toast.error('Oturum hatası! Lütfen sayfayı yenileyin.')
      return
    }

    try {
      const deviceFingerprint = sessionManager.deviceInfo.fingerprint
      
      const orderData = {
        sessionId: session.sessionId,
        deviceFingerprint: deviceFingerprint,
        tableNumber: parseInt(tableId),
        tableId: tableId,
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customizations: item.customizations,
          selectedOptions: item.selectedOptions,
          notes: item.notes
        })),
        totalAmount: getCartTotal(),
        customerNotes: cart.map(item => item.notes).filter(n => n).join(' | ')
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Siparişiniz alındı! 🎉', {
          duration: 4000,
          icon: '🎊'
        })
        clearCart()
        closeCartModal()
      } else {
        // Hata koduna göre aksiyon
        switch (data.code) {
          case 'INVALID_SESSION':
          case 'SESSION_EXPIRED':
            toast.error('Oturum süresi doldu! Lütfen QR kodu tekrar okutun.')
            localStorage.removeItem(`session_table_${tableId}`)
            setSession(null)
            break
          case 'RATE_LIMIT_EXCEEDED':
            toast.error(data.error)
            break
          case 'SLOW_DOWN':
          case 'BOT_DETECTED':
            toast.error('Çok hızlı sipariş veriyorsunuz. Lütfen bekleyin.')
            break
          case 'DUPLICATE_SUSPECTED':
            const confirm = window.confirm(data.error)
            if (confirm) {
              orderData.confirmed = true
              const retryResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
              })
              const retryData = await retryResponse.json()
              if (retryData.success) {
                toast.success('Siparişiniz alındı! 🎉')
                clearCart()
                closeCartModal()
              }
            }
            break
          default:
            toast.error(data.error || 'Sipariş gönderilemedi')
        }
      }
    } catch (error) {
      console.error('Order error:', error)
      toast.error('Bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto mb-6"
          />
          <motion.p className="text-purple-700 text-lg font-medium">
            {sessionLoading ? 'Bağlantı kuruluyor...' : 'Yükleniyor...'}
          </motion.p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-100">
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-20 backdrop-blur-xl bg-white/90 border-b border-purple-200 shadow-lg"
      >
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBackClick}
            className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </motion.button>
          
          <div className="text-center flex-1">
            <motion.h1 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xl font-black text-purple-800"
            >
              {currentSubcategory?.name}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-purple-600 text-sm font-semibold mt-1"
            >
              Masa {tableId}
            </motion.p>
            {/* 🔐 Session Durumu */}
            {session && (
              <p className="text-xs text-green-600 mt-0.5">
                🔐 Güvenli bağlantı aktif
              </p>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={openCartModal}
            className="relative p-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-lg transition-all duration-300"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cart.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
              >
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </motion.div>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Products Grid */}
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-black text-purple-800 mb-3 text-center">
            {parentCategory?.name} - {currentSubcategory?.name}
          </h2>
          <p className="text-purple-600 text-center mb-8">
            {products.length} ürün bulundu
          </p>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block p-8 bg-white rounded-3xl border border-purple-200 shadow-xl">
                <Coffee className="w-20 h-20 text-purple-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-purple-800 mb-3">Ürün Bulunamadı</h3>
                <p className="text-purple-600 text-lg">Bu kategoride henüz ürün eklenmemiş</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  onClick={() => openProductModal(product)}
                  className="group cursor-pointer"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          priority={false}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Coffee className="w-16 h-16 text-purple-300" />
                        </div>
                      )}
                      
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-purple-500 text-white p-2 rounded-full shadow-xl">
                          <Plus className="w-5 h-5" />
                        </div>
                      </div>

                      {product.spicyLevel > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {product.spicyLevel}
                        </div>
                      )}

                      {product.featured && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Özel
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-purple-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-purple-600 text-sm line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.dietaryInfo?.isVegan && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            🌱 Vegan
                          </span>
                        )}
                        {product.dietaryInfo?.isVegetarian && !product.dietaryInfo?.isVegan && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            🥬 Vejetaryen
                          </span>
                        )}
                        {product.dietaryInfo?.isGlutenFree && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            🌾 Glutensiz
                          </span>
                        )}
                        {product.cookingTime && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {product.cookingTime}dk
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-purple-700">
                          ₺{product.price?.toFixed(2)}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Ekle
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* 🆕 Product Modal - Zorunlu Seçimler + Notlar */}
      <AnimatePresence>
        {showProductModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={closeProductModal}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="relative aspect-video w-full overflow-hidden">
                {selectedProduct.image ? (
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 512px"
                    className="object-cover"
                    priority={true}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <Coffee className="w-20 h-20 text-purple-300" />
                  </div>
                )}
                
                <button
                  onClick={closeProductModal}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-6 h-6 text-purple-700" />
                </button>

                {selectedProduct.spicyLevel > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg">
                    <Flame className="w-4 h-4" />
                    Acılık: {selectedProduct.spicyLevel}
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedProduct.dietaryInfo?.isVegan && (
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                      🌱 Vegan
                    </span>
                  )}
                  {selectedProduct.dietaryInfo?.isVegetarian && !selectedProduct.dietaryInfo?.isVegan && (
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                      🥬 Vejetaryen
                    </span>
                  )}
                  {selectedProduct.dietaryInfo?.isGlutenFree && (
                    <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">
                      🌾 Glutensiz
                    </span>
                  )}
                  {selectedProduct.cookingTime && (
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedProduct.cookingTime} dakika
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-3xl font-black text-purple-900 mb-2">
                    {selectedProduct.name}
                  </h2>
                  {selectedProduct.description && (
                    <p className="text-purple-600 mb-4">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>

                {/* 🆕 Zorunlu Seçimler */}
                {selectedProduct.requiredOptions?.map((optionGroup) => (
                  <div key={optionGroup.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-purple-900">
                        {optionGroup.label}
                      </h3>
                      {optionGroup.required && (
                        <span className="text-red-500 text-sm font-semibold">* Zorunlu</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {optionGroup.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedOptions({
                            ...selectedOptions,
                            [optionGroup.id]: option.value
                          })}
                          className={`p-3 rounded-lg border-2 font-medium transition-all ${
                            selectedOptions[optionGroup.id] === option.value
                              ? 'border-purple-500 bg-purple-50 text-purple-900'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="text-sm">{option.label}</div>
                          {option.price > 0 && (
                            <div className="text-xs text-purple-600 mt-1">+₺{option.price.toFixed(2)}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 🆕 Çıkarılabilir Malzemeler */}
                {selectedProduct.customizations?.removable?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-purple-900">
                      Çıkarılabilir Malzemeler
                    </h3>
                    <div className="space-y-2">
                      {selectedProduct.customizations.removable.map((ing) => (
                        <label
                          key={ing._id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={customizations.removed.includes(ing._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCustomizations({
                                  ...customizations,
                                  removed: [...customizations.removed, ing._id]
                                })
                              } else {
                                setCustomizations({
                                  ...customizations,
                                  removed: customizations.removed.filter(id => id !== ing._id)
                                })
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm">{ing.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🆕 Ekstra Malzemeler */}
                {selectedProduct.customizations?.extras?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-purple-900">
                      Ekstra Malzemeler
                    </h3>
                    <div className="space-y-2">
                      {selectedProduct.customizations.extras.map((extra) => (
                        <label
                          key={extra.ingredientId}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={customizations.extras.some(e => e.ingredientId === extra.ingredientId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCustomizations({
                                    ...customizations,
                                    extras: [...customizations.extras, extra]
                                  })
                                } else {
                                  setCustomizations({
                                    ...customizations,
                                    extras: customizations.extras.filter(e => e.ingredientId !== extra.ingredientId)
                                  })
                                }
                              }}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm">{extra.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-purple-700">
                            +₺{extra.price?.toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🆕 Not Ekleme */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-purple-900">
                      Notunuz (Opsiyonel)
                    </h3>
                  </div>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Özel bir isteğiniz varsa buraya yazabilirsiniz..."
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {customerNotes.length}/200
                  </div>
                </div>

                {/* 🆕 Miktar + Fiyat + Sepete Ekle */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Toplam Fiyat</div>
                      <div className="text-3xl font-black text-purple-700">
                        ₺{(calculateItemPrice() * quantity).toFixed(2)}
                      </div>
                      {calculateItemPrice() > selectedProduct.price && (
                        <div className="text-xs text-gray-500">
                          Baz fiyat: ₺{selectedProduct.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 bg-purple-100 rounded-full p-1">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="bg-white p-2 rounded-full hover:bg-purple-50 transition-colors"
                      >
                        <Minus className="w-5 h-5 text-purple-700" />
                      </button>
                      <span className="text-xl font-bold text-purple-900 w-8 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="bg-white p-2 rounded-full hover:bg-purple-50 transition-colors"
                      >
                        <Plus className="w-5 h-5 text-purple-700" />
                      </button>
                    </div>
                  </div>

                  {!canAddToCart() && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">
                        Lütfen tüm zorunlu seçimleri yapın
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleAddToCart}
                    disabled={!canAddToCart()}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                      canAddToCart()
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-6 h-6" />
                    Sepete Ekle
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🆕 Cart Modal */}
      <AnimatePresence>
        {showCartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={closeCartModal}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-black">Sepetim</h2>
                      <p className="text-purple-100 text-sm">Masa {tableId}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeCartModal}
                    className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-20 h-20 text-purple-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-purple-800 mb-2">Sepetiniz Boş</h3>
                    <p className="text-purple-600">Ürün ekleyerek başlayın</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-purple-50 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Coffee className="w-8 h-8 text-purple-300" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-purple-900 mb-1">{item.name}</h4>
                            
                            {/* Seçimler */}
                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                              <div className="text-xs text-purple-700 mb-1 flex flex-wrap gap-1">
                                {Object.entries(item.selectedOptions).map(([key, value]) => (
                                  <span key={key} className="inline-block bg-purple-100 px-2 py-0.5 rounded-full">
                                    {value}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Özelleştirmeler */}
                            {(item.customizations?.removed?.length > 0 || item.customizations?.extras?.length > 0) && (
                              <div className="text-xs text-purple-600 mb-1">
                                {item.customizations.removed?.length > 0 && (
                                  <div>❌ Çıkarılan: {item.customizations.removed.length} malzeme</div>
                                )}
                                {item.customizations.extras?.length > 0 && (
                                  <div>➕ Ekstra: {item.customizations.extras.length} malzeme</div>
                                )}
                              </div>
                            )}
                            
                            {/* Not */}
                            {item.notes && (
                              <div className="text-xs text-purple-600 italic bg-purple-100 p-2 rounded mt-1">
                                💬 "{item.notes}"
                              </div>
                            )}
                            
                            <p className="text-purple-700 font-semibold mt-2">
                              ₺{item.price.toFixed(2)} × {item.quantity} = ₺{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCartItemQuantity(item, item.quantity - 1)}
                                className="bg-white p-2 rounded-lg hover:bg-purple-100 transition-colors"
                              >
                                <Minus className="w-4 h-4 text-purple-700" />
                              </button>
                              <span className="font-bold text-purple-900 w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartItemQuantity(item, item.quantity + 1)}
                                className="bg-white p-2 rounded-lg hover:bg-purple-100 transition-colors"
                              >
                                <Plus className="w-4 h-4 text-purple-700" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item)}
                              className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-purple-100 p-6 space-y-4">
                  <div className="flex items-center justify-between text-2xl font-black text-purple-900">
                    <span>Toplam:</span>
                    <span>₺{getCartTotal().toFixed(2)}</span>
                  </div>

                  {!session && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <p className="text-sm text-yellow-700">
                        Sipariş vermek için lütfen bekleyin...
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={clearCart}
                      className="bg-red-100 text-red-700 py-3 rounded-xl font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      Temizle
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={!session}
                      className={`py-3 rounded-xl font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                        session
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-xl'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                      Sipariş Ver
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MenuFooter />
    </div>
  )
}