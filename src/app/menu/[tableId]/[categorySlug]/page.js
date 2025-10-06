'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Coffee, Thermometer, Snowflake, ChevronRight, Package } from 'lucide-react'
import Image from 'next/image'

export default function SubcategoriesPage({ params }) {
  const [subcategories, setSubcategories] = useState([])
  const [parentCategory, setParentCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const [categorySlug, setCategorySlug] = useState(null)
  const router = useRouter()

  // Alt kategori iconları
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
      fetchSubcategories()
    }
  }, [tableId, categorySlug])

  const fetchSubcategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      
      if (data.success) {
        const allCategories = data.flatCategories || []
        
        // Ana kategoriyi bul
        const mainCategory = allCategories.find(cat => cat.slug === categorySlug)
        setParentCategory(mainCategory)
        
        if (mainCategory) {
          // Bu ana kategorinin alt kategorilerini bul
          const subCats = allCategories.filter(cat => 
            cat.parentId === mainCategory.id && cat.isActive
          )
          
          if (subCats.length === 0) {
            // Alt kategori yoksa direkt ürünler sayfasına yönlendir
            router.replace(`/menu/${tableId}/${categorySlug}/products`)
            return
          }
          
          setSubcategories(subCats)
        }
      }
    } catch (error) {
      console.error('Alt kategoriler yüklenirken hata:', error)
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
    // Ürünler sayfasına yönlendir
    router.push(`/menu/${tableId}/${categorySlug}/${subcategory.slug}`)
  }

  const handleBackClick = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-amber-600 mt-4 font-medium">Alt kategoriler yükleniyor...</p>
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
            <h1 className="text-lg font-bold text-amber-700">
              {parentCategory?.name}
            </h1>
            <p className="text-sm text-amber-600">Masa {tableId}</p>
          </div>
          
          <div className="w-10"></div>
        </div>
      </div>

      {/* Subcategories Grid */}
      <div className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="text-xl font-bold text-amber-700 mb-2">
            {parentCategory?.name} Çeşitlerimiz
          </h2>
          <p className="text-amber-600">İstediğiniz türü seçin</p>
        </motion.div>

        {subcategories.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-600 mb-2">Alt kategori bulunamadı</h3>
            <p className="text-amber-500">Bu kategoride henüz alt bölüm eklenmemiş</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {subcategories.map((subcategory, index) => {
              const IconComponent = getSubcategoryIcon(subcategory.name)
              
              return (
                <motion.div
                  key={subcategory.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  onClick={() => handleSubcategoryClick(subcategory)}
                  className="relative overflow-hidden bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group active:scale-95"
                >
                  {/* Background Image */}
                  {subcategory.image && (
                    <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                      <Image
                        src={subcategory.image}
                        alt={subcategory.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 p-5 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-amber-700 group-hover:text-amber-800 transition-colors">
                          {subcategory.name}
                        </h3>
                        {subcategory.description && (
                          <p className="text-amber-600 text-sm mt-1 max-w-xs">
                            {subcategory.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-amber-500 group-hover:text-amber-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Hızlı Erişim - Tüm Ürünleri Gör */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 pt-6 border-t border-amber-200"
        >
          <button
            onClick={() => router.push(`/menu/${tableId}/${categorySlug}/products`)}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300"
          >
            Tüm {parentCategory?.name} Ürünlerini Gör
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 px-4">
        <div className="inline-flex items-center justify-center space-x-2 text-amber-600">
          <Coffee className="w-4 h-4" />
          <span className="text-sm font-medium">Meva Cafe</span>
          <Coffee className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}