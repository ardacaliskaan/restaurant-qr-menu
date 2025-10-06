'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Coffee, Utensils, Cookie, Wine, Gift, ChevronRight } from 'lucide-react'
import Image from 'next/image'

export default function CategoriesPage({ params }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const router = useRouter()

  // Default icons for categories
  const categoryIcons = {
    'kahvaltı': Coffee,
    'kahvaltılık': Coffee,
    'ana-yemek': Utensils,
    'ana-yemekler': Utensils,
    'aperatif': Cookie,
    'aperatifler': Cookie,
    'tatlı': Cookie,
    'tatlılar': Cookie,
    'içecek': Wine,
    'içecekler': Wine,
    'kampanya': Gift,
    'kampanyalar': Gift,
    'default': Utensils
  }

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setTableId(resolvedParams.tableId)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (tableId) {
      fetchCategories()
    }
  }, [tableId])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      
      if (data.success) {
        // Sadece ana kategorileri al (parentId olmayan)
        const mainCategories = data.flatCategories?.filter(cat => !cat.parentId && cat.isActive) || []
        setCategories(mainCategories)
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (categoryName) => {
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-')
    const IconComponent = categoryIcons[slug] || categoryIcons.default
    return IconComponent
  }

  const handleCategoryClick = (category) => {
    // Alt kategori sayfasına yönlendir
    router.push(`/menu/${tableId}/${category.slug}`)
  }

  const handleBackClick = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-amber-600 mt-4 font-medium">Kategoriler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-amber-100 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleBackClick}
            className="p-2 hover:bg-amber-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-amber-600" />
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              MEVA CAFE
            </h1>
            <p className="text-sm text-amber-600 font-medium">Masa {tableId}</p>
          </div>
          
          <div className="w-10"></div> {/* Spacer for center alignment */}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl font-bold text-amber-700 mb-2">Menümüzü Keşfedin</h2>
          <p className="text-amber-600">İstediğiniz kategoriyi seçin</p>
        </motion.div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Coffee className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-600 mb-2">Henüz kategori eklenmemiş</h3>
            <p className="text-amber-500">Lütfen daha sonra tekrar deneyin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category, index) => {
              const IconComponent = getCategoryIcon(category.name)
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => handleCategoryClick(category)}
                  className="relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group active:scale-95"
                >
                  {/* Background Image */}
                  {category.image && (
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-orange-50/50"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-amber-700 group-hover:text-amber-800 transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-amber-600 text-sm mt-1 max-w-xs">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <ChevronRight className="w-6 h-6 text-amber-500 group-hover:text-amber-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 to-orange-400/0 group-hover:from-amber-400/5 group-hover:to-orange-400/5 transition-all duration-300"></div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 px-4">
        <div className="inline-flex items-center justify-center space-x-2 text-amber-600">
          <Coffee className="w-4 h-4" />
          <span className="text-sm font-medium">Sevgiyle Hazırlanmış</span>
          <Coffee className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}