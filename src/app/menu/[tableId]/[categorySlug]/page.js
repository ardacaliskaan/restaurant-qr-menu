'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Coffee, Thermometer, Snowflake, ChevronRight, Package, 
  Sparkles, Layers, GraduationCap, Tag, Heart, Instagram, Facebook, 
  Twitter, Grid3x3, Plus, Minus, ShoppingCart, X, Flame, Trash2, Send, Check
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

// Footer Component
function MenuFooter() {
  const mottos = [
    {
      icon: GraduationCap,
      title: "Öğrenci Dostu",
      description: "Özel fiyatlarla her zaman yanınızdayız"
    },
    {
      icon: Tag,
      title: "Kampanyanın Tek Adresi",
      description: "Her gün yeni fırsatlar"
    },
    {
      icon: Heart,
      title: "Kaliteli Lezzetler",
      description: "Taze malzeme, özenli servis"
    }
  ]

  const socialLinks = [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" }
  ]

  return (
    <footer className="relative z-10 mt-16 border-t border-teal-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {mottos.map((motto, index) => {
            const IconComponent = motto.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <IconComponent className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-teal-900 mb-2">
                  {motto.title}
                </h3>
                <p className="text-sm text-teal-600 font-medium">
                  {motto.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        <div className="border-t border-teal-200 my-8"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-700 rounded-xl flex items-center justify-center">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div className="text-teal-800">
              <p className="font-bold text-lg">MEVA CAFE</p>
              <p className="text-xs text-teal-600">© 2025 Tüm hakları saklıdır</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {socialLinks.map((social, index) => {
              const IconComponent = social.icon
              return (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 bg-teal-100 hover:bg-teal-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                  aria-label={social.label}
                >
                  <IconComponent className="w-5 h-5 text-teal-700" />
                </motion.a>
              )
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-teal-600 text-sm font-medium flex items-center justify-center gap-2">
            <Coffee className="w-4 h-4" />
            Her Damla Özenle Hazırlanır
            <Heart className="w-4 h-4 fill-current" />
          </p>
        </motion.div>
      </div>
    </footer>
  )
}

export default function SubcategoriesPage({ params }) {
  const [subcategories, setSubcategories] = useState([])
  const [products, setProducts] = useState([])
  const [parentCategory, setParentCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const [categorySlug, setCategorySlug] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState([])
  const router = useRouter()

  const subcategoryIcons = {
    'sicak': Thermometer,
    'sıcak': Thermometer,
    'sicak-icecekler': Thermometer,
    'sıcak-içecekler': Thermometer,
    'soguk': Snowflake,
    'soğuk': Snowflake,
    'soguk-icecekler': Snowflake,
    'soğuk-içecekler': Snowflake,
    'default': Package
  }

  const getCartKey = () => `meva-cart-${tableId}`

  useEffect(() => {
    if (tableId) {
      const savedCart = localStorage.getItem(getCartKey())
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    }
  }, [tableId])

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
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (tableId && categorySlug) {
      fetchData()
    }
  }, [tableId, categorySlug])

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
        
        if (mainCategory) {
          const subCats = allCategories.filter(cat => 
            cat.parentId === mainCategory.id && cat.isActive
          )
          setSubcategories(subCats)
          
          if (productsData.success) {
            const categoryProducts = productsData.items?.filter(item => 
              item.categoryId === mainCategory.id && item.available !== false
            ) || []
            setProducts(categoryProducts)
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSubcategoryIcon = (subcategoryName) => {
    const slug = subcategoryName.toLowerCase().replace(/\s+/g, '-')
    const IconComponent = subcategoryIcons[slug] || subcategoryIcons.default
    return IconComponent
  }

  const handleSubcategoryClick = (subcategory) => {
    router.push(`/menu/${tableId}/${categorySlug}/${subcategory.slug}`)
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

    try {
      const orderData = {
        tableNumber: parseInt(tableId),
        items: cart.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: getCartTotal()
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Siparişiniz alındı! 🎉')
        clearCart()
        closeCartModal()
      } else {
        toast.error('Sipariş gönderilemedi: ' + data.error)
      }
    } catch (error) {
      console.error('Order error:', error)
      toast.error('Bir hata oluştu')
    }
  }

  if (loading) {
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
              Yükleniyor...
            </motion.p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

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
              className="text-xl font-black text-teal-800 flex items-center justify-center gap-2"
            >
              <Layers className="w-6 h-6 text-teal-600" />
              {parentCategory?.name}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-teal-600 text-sm font-semibold flex items-center justify-center gap-2 mt-1"
            >
              Masa {tableId}
            </motion.p>
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

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {subcategories.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 mt-6"
            >
              <h2 className="text-2xl md:text-3xl font-black text-teal-800 mb-3">
                {parentCategory?.name} Çeşitlerimiz
              </h2>
              <p className="text-teal-600 text-lg font-medium flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Kategori seçin veya tüm ürünlere göz atın
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
              <AnimatePresence mode="popLayout">
                {subcategories.map((subcategory, index) => {
                  const IconComponent = getSubcategoryIcon(subcategory.name)
                  
                  return (
                    <motion.div
                      key={subcategory.id}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => handleSubcategoryClick(subcategory)}
                      className="group cursor-pointer"
                    >
                      <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 h-44">
                        {subcategory.image ? (
                          <div className="absolute inset-0">
                            <Image
                              src={subcategory.image}
                              alt={subcategory.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/95 via-cyan-50/90 to-teal-50/85 group-hover:from-teal-50/90 group-hover:via-cyan-50/85 group-hover:to-teal-50/80 transition-all duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-tl from-teal-200/30 to-cyan-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-100 to-emerald-100" />
                        )}

                        <div className="relative h-full flex flex-col justify-between p-5">
                          <div className="flex justify-between items-start">
                            <motion.div
                              whileHover={{ rotate: 360, scale: 1.15 }}
                              transition={{ duration: 0.6 }}
                              className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-xl"
                            >
                              <IconComponent className="w-6 h-6 text-white" />
                            </motion.div>

                            <motion.div
                              whileHover={{ x: 5 }}
                              className="p-2 bg-white/60 backdrop-blur-sm rounded-full border border-teal-200"
                            >
                              <ChevronRight className="w-5 h-5 text-teal-700" />
                            </motion.div>
                          </div>

                          <div>
                            <h3 className="text-2xl md:text-3xl font-black text-teal-900 mb-1 drop-shadow-sm group-hover:text-teal-700 transition-colors duration-300">
                              {subcategory.name}
                            </h3>
                            {subcategory.description && (
                              <p className="text-teal-700 text-sm font-medium leading-relaxed line-clamp-2">
                                {subcategory.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        <div className="absolute inset-0 border-2 border-teal-300/0 group-hover:border-teal-300/60 rounded-2xl transition-all duration-300" />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            <div className="relative my-12">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-teal-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-100 px-6 py-2 rounded-full border-2 border-teal-200 text-teal-700 font-bold flex items-center gap-2">
                  <Grid3x3 className="w-5 h-5" />
                  veya Tüm Ürünlere Göz Atın
                </span>
              </div>
            </div>
          </>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-black text-teal-800 mb-3 text-center">
            Tüm {parentCategory?.name}
          </h2>
          <p className="text-teal-600 text-center mb-8">
            {products.length} ürün bulundu
          </p>

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
                    <div className="relative h-48 bg-gradient-to-br from-teal-100 to-cyan-100">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
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
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-teal-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-teal-700 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-teal-600 text-sm line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-teal-700">
                          ₺{product.price?.toFixed(2)}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05, x: 3 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                        >
                          İleri
                          <ChevronRight className="w-4 h-4" />
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
              <div className="relative h-64">
                {selectedProduct.image ? (
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-teal-100 to-cyan-100 h-full flex items-center justify-center">
                    <Coffee className="w-20 h-20 text-teal-300" />
                  </div>
                )}
                
                <button
                  onClick={closeProductModal}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
                >
                  <X className="w-6 h-6 text-teal-700" />
                </button>
              </div>

              <div className="p-6">
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
                  <Check className="w-6 h-6" />
                  Onayla - ₺{(selectedProduct.price * quantity).toFixed(2)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
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