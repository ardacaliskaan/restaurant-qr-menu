'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Coffee, Plus, Minus, ShoppingCart, X, Flame, 
  GraduationCap, Tag, Heart, Instagram, Facebook, Twitter,
  Trash2, Send, Clock, Sparkles
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import MenuFooter from '@/components/MenuFooter'
// 🔐 YENİ: Session Manager Import
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
  
  // 🔐 YENİ: Session States
  const [session, setSession] = useState(null)
  const [sessionManager, setSessionManager] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  
  const router = useRouter()

  // Cart key for localStorage
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

  // 🔐 YENİ: Session Başlatma
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

  // 🔐 YENİ: Session Başlatma Fonksiyonu
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
        
        if (result.isNew) {
          toast.success('Hoş geldiniz! 🎉', {
            duration: 3000
          })
        }
      } else {
        console.error('❌ Session init failed:', result.error)
        toast.error('Bağlantı hatası. Sipariş verirken sorun yaşayabilirsiniz.', {
          duration: 4000
        })
      }
    } catch (error) {
      console.error('💥 Session initialization error:', error)
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
        
        const mainCategory = allCategories.find(cat => cat.slug === categorySlug)
        setParentCategory(mainCategory)
        
        const subcategory = allCategories.find(cat => cat.slug === subcategorySlug)
        setCurrentSubcategory(subcategory)
        
        if (subcategory && productsData.success) {
          const subcategoryProducts = productsData.items?.filter(item => 
            item.subcategoryId === subcategory.id && item.available !== false
          ) || []
          setProducts(subcategoryProducts)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Menü yüklenirken hata oluştu')
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
    setShowProductModal(true)
  }

  const closeProductModal = () => {
    setShowProductModal(false)
    setSelectedProduct(null)
    setQuantity(1)
  }

  const openCartModal = () => {
    setShowCartModal(true)
  }

  const closeCartModal = () => {
    setShowCartModal(false)
  }

  const handleAddToCart = () => {
    const existingItem = cart.find(item => item.id === selectedProduct.id)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === selectedProduct.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
      toast.success(`${quantity}x ${selectedProduct.name} sepete eklendi!`)
    } else {
      setCart([...cart, {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.image,
        quantity: quantity
      }])
      toast.success(`${selectedProduct.name} sepete eklendi!`)
    }
    
    closeProductModal()
  }

  const updateCartItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }
    
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ))
  }

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId))
    toast.success('Ürün sepetten kaldırıldı')
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem(getCartKey())
    toast.success('Sepet temizlendi')
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // 🔐 GÜNCELLENMIŞ: Session Güvenliği ile Sipariş Gönderme
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepetiniz boş!')
      return
    }

    try {
      // 🔐 Session Bilgilerini Hazırla
      const orderData = {
        tableNumber: parseInt(tableId),
        tableId: tableId.toString(),
        items: cart.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          customizations: { removed: [], extras: [] }
        })),
        totalAmount: parseFloat(getCartTotal()) || 0,
        status: 'pending'
      }

      // 🔐 YENİ: Session bilgilerini ekle
      if (session && sessionManager) {
        orderData.sessionId = session.sessionId
        orderData.deviceFingerprint = sessionManager.deviceInfo.fingerprint
        orderData.deviceInfo = {
          browser: sessionManager.deviceInfo.browser,
          os: sessionManager.deviceInfo.os,
          isMobile: sessionManager.deviceInfo.isMobile
        }
        
        console.log('🔐 Sending order with session:', session.sessionId)
      } else {
        console.log('⚠️ Sending order WITHOUT session (backward compatible mode)')
      }

      console.log('📦 Sending order:', orderData)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()
      console.log('📦 Response:', result)

      // 🔐 YENİ: Hata Kodlarını Handle Et
      if (!response.ok || !result.success) {
        // Session hataları
        if (result.code === 'SESSION_EXPIRED' || result.code === 'INVALID_SESSION') {
          toast.error('Oturum süresi doldu. Lütfen QR kodu tekrar okutun.', {
            duration: 5000,
            icon: '⏰'
          })
          
          if (sessionManager) {
            sessionManager.clearSession()
            await initSession()
          }
          return
        }
        
        // Rate Limit
        if (result.code === 'RATE_LIMIT_EXCEEDED') {
          const waitTime = result.retryAfter ? Math.ceil(result.retryAfter / 60) : 2
          toast.error(`Çok fazla sipariş verdiniz.\n\nLütfen ${waitTime} dakika bekleyin.`, {
            duration: 6000,
            icon: '⏱️'
          })
          return
        }
        
        // Bot Detection
        if (result.code === 'BOT_DETECTED' || result.code === 'SLOW_DOWN') {
          toast.error('Çok hızlı sipariş veriyorsunuz. Lütfen bekleyin.', {
            duration: 5000,
            icon: '🤖'
          })
          return
        }
        
        // Duplicate Order
        if (result.code === 'DUPLICATE_SUSPECTED') {
          const confirmed = window.confirm(
            `${result.error}\n\nTekrar sipariş vermek istediğinizden emin misiniz?`
          )
          
          if (confirmed) {
            orderData.confirmed = true
            
            const retryResponse = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderData)
            })
            
            const retryResult = await retryResponse.json()
            
            if (retryResponse.ok && retryResult.success) {
              clearCart()
              closeCartModal()
              
              toast.success(`Siparişiniz alındı! 🎉\n\nSipariş No: ${retryResult.orderNumber || 'N/A'}`, {
                duration: 5000
              })
            } else {
              throw new Error(retryResult.error || 'Sipariş gönderilemedi')
            }
          }
          return
        }
        
        // Genel hata
        throw new Error(result.error || 'Sipariş gönderilemedi')
      }

      // ✅ Başarılı
      clearCart()
      closeCartModal()
      
      toast.success(`Siparişiniz alındı! 🎉\n\nSipariş No: ${result.orderNumber || 'N/A'}`, {
        duration: 5000
      })
      
      // 🔐 Session istatistiklerini güncelle
      if (sessionManager) {
        sessionManager.updateLastActivity()
      }
      
    } catch (error) {
      console.error('💥 Order error:', error)
      toast.error(`Bir hata oluştu: ${error.message}`, {
        duration: 5000
      })
    }
  }

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-100">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
        </div>

        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-teal-300 border-t-teal-600 rounded-full mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-teal-700 text-lg font-medium"
            >
              {sessionLoading ? 'Bağlantı kuruluyor...' : 'Yükleniyor...'}
            </motion.p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-20 backdrop-blur-xl bg-white/90 border-b border-teal-200 shadow-lg"
      >
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBackClick}
            className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </motion.button>
          
          <div className="text-center flex-1">
            <motion.h1 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xl font-black text-teal-800"
            >
              {currentSubcategory?.name}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-teal-600 text-sm font-semibold mt-1"
            >
              {parentCategory?.name} • Masa {tableId}
            </motion.p>
            {/* 🔐 YENİ: Session Durumu */}
            {session && (
              <p className="text-xs text-green-600 mt-0.5">
                🔐 Güvenli bağlantı
              </p>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={openCartModal}
            className="relative p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-lg transition-all duration-300"
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

      {/* Main Content */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 mt-6"
        >
          <h2 className="text-2xl md:text-3xl font-black text-teal-800 mb-3">
            {currentSubcategory?.name}
          </h2>
          <p className="text-teal-600 text-lg font-medium flex items-center justify-center gap-2">
            <Clock className="w-5 h-5" />
            {products.length} ürün bulundu
          </p>
        </motion.div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-white rounded-3xl border border-teal-200 shadow-xl">
              <Coffee className="w-20 h-20 text-teal-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-teal-800 mb-3">Ürün Bulunamadı</h3>
              <p className="text-teal-600 text-lg">Bu kategoride henüz ürün eklenmemiş</p>
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
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-teal-100 to-cyan-100 overflow-hidden">
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
                        <Coffee className="w-16 h-16 text-teal-300" />
                      </div>
                    )}
                    
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-teal-500 text-white p-2 rounded-full shadow-xl">
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

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-teal-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-teal-700 transition-colors">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-teal-600 text-sm line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Dietary Badges */}
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
                      <span className="text-2xl font-black text-teal-700">
                        ₺{product.price?.toFixed(2)}
                      </span>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="bg-teal-100 text-teal-700 p-2 rounded-lg"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
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
              {/* Modal Image */}
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
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                    <Coffee className="w-20 h-20 text-teal-300" />
                  </div>
                )}
                
                <button
                  onClick={closeProductModal}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-6 h-6 text-teal-700" />
                </button>

                {selectedProduct.spicyLevel > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg">
                    <Flame className="w-4 h-4" />
                    Acılık: {selectedProduct.spicyLevel}
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Dietary Badges in Modal */}
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

                <h2 className="text-3xl font-black text-teal-900 mb-2">
                  {selectedProduct.name}
                </h2>
                {selectedProduct.description && (
                  <p className="text-teal-600 mb-4">
                    {selectedProduct.description}
                  </p>
                )}

                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl font-black text-teal-700">
                    ₺{selectedProduct.price?.toFixed(2)}
                  </span>
                  
                  <div className="flex items-center gap-3 bg-teal-100 rounded-full p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="bg-white p-2 rounded-full hover:bg-teal-50 transition-colors"
                    >
                      <Minus className="w-5 h-5 text-teal-700" />
                    </button>
                    <span className="text-xl font-bold text-teal-900 w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="bg-white p-2 rounded-full hover:bg-teal-50 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-teal-700" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <ShoppingCart className="w-6 h-6" />
                  Sepete Ekle - ₺{(selectedProduct.price * quantity).toFixed(2)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
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
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-black">Sepetim</h2>
                      <p className="text-teal-100 text-sm">Masa {tableId}</p>
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
                    <ShoppingCart className="w-20 h-20 text-teal-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-teal-800 mb-2">Sepetiniz Boş</h3>
                    <p className="text-teal-600">Ürün ekleyerek başlayın</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-teal-50 rounded-xl p-4 flex items-center gap-4"
                      >
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100">
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
                              <Coffee className="w-8 h-8 text-teal-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-bold text-teal-900 mb-1">{item.name}</h4>
                          <p className="text-teal-700 font-semibold">
                            ₺{item.price.toFixed(2)} × {item.quantity} = ₺{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            className="bg-white p-2 rounded-lg hover:bg-teal-100 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-teal-700" />
                          </button>
                          <span className="font-bold text-teal-900 w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            className="bg-white p-2 rounded-lg hover:bg-teal-100 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-teal-700" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-teal-100 p-6 space-y-4">
                  <div className="flex items-center justify-between text-2xl font-black text-teal-900">
                    <span>Toplam:</span>
                    <span>₺{getCartTotal().toFixed(2)}</span>
                  </div>

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
                      className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
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

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
} 