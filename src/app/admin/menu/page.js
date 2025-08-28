'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Edit, Trash2, Save, X, Loader2, Tag, Leaf, 
  Clock, Flame, Star, Package, ChefHat, Info, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ImageUpload'


export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [activeTab, setActiveTab] = useState('basic') // basic, ingredients, customization, nutrition

  const [formData, setFormData] = useState({
    // Temel Bilgiler
    name: '',
    description: '',
    slug: '',
    price: '',
    categoryId: '',
    image: null,
    
    // Malzemeler
    ingredients: [],
    
    // Özelleştirmeler
    customizations: {
      removable: [], // Çıkarılabilir malzemeler
      extras: [], // Ekstra malzemeler {ingredientId, price}
      sizes: [], // Boyutlar {name, priceMultiplier}
      options: [] // Diğer seçenekler {name, choices: [{name, price}]}
    },
    
    // Beslenme ve Diyet
    nutritionInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    allergens: [],
    dietaryInfo: {
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isHalal: false
    },
    
    // Diğer
    cookingTime: '',
    spicyLevel: 0,
    featured: false,
    available: true,
    sortOrder: 0
  })

  const allergenOptions = [
    'gluten', 'dairy', 'eggs', 'nuts', 'peanuts', 'soy', 'fish', 'shellfish', 'sesame'
  ]

  const ingredientCategories = [
    'meat', 'dairy', 'vegetable', 'fruit', 'grain', 'spice', 'sauce', 'other'
  ]

  useEffect(() => {
    Promise.all([
      fetchMenuItems(),
      fetchCategories(),
      fetchIngredients()
    ])
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/admin/menu')
      const data = await response.json()
      if (data.success) {
        setMenuItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.flatCategories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/admin/ingredients')
      const data = await response.json()
      if (data.success) {
        setIngredients(data.ingredients || [])
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = '/api/admin/menu'
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem 
        ? { ...formData, id: editingItem.id }
        : formData

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        await fetchMenuItems()
        resetForm()
        toast.success(editingItem ? 'Ürün güncellendi!' : 'Ürün eklendi!')
      } else {
        toast.error(result.error || 'İşlem başarısız')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error('Kaydetme hatası!')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/admin/menu?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await fetchMenuItems()
        toast.success('Ürün silindi!')
      } else {
        toast.error(result.error || 'Silme hatası')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Silme hatası!')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      slug: item.slug || '',
      price: item.price.toString(),
      categoryId: item.categoryId,
      image: item.image,
      ingredients: item.ingredients || [],
      customizations: item.customizations || {
        removable: [],
        extras: [],
        sizes: [],
        options: []
      },
      nutritionInfo: item.nutritionInfo || {
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      },
      allergens: item.allergens || [],
      dietaryInfo: item.dietaryInfo || {
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isHalal: false
      },
      cookingTime: item.cookingTime?.toString() || '',
      spicyLevel: item.spicyLevel || 0,
      featured: item.featured || false,
      available: item.available !== false,
      sortOrder: item.sortOrder || 0
    })
    setShowAddForm(true)
    setActiveTab('basic')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      price: '',
      categoryId: '',
      image: null,
      ingredients: [],
      customizations: {
        removable: [],
        extras: [],
        sizes: [],
        options: []
      },
      nutritionInfo: {
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      },
      allergens: [],
      dietaryInfo: {
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isHalal: false
      },
      cookingTime: '',
      spicyLevel: 0,
      featured: false,
      available: true,
      sortOrder: 0
    })
    setShowAddForm(false)
    setEditingItem(null)
    setActiveTab('basic')
  }

  const handleAllergenChange = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }))
  }

  const handleIngredientToggle = (ingredientId) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.includes(ingredientId)
        ? prev.ingredients.filter(id => id !== ingredientId)
        : [...prev.ingredients, ingredientId]
    }))
  }

  const handleRemovableToggle = (ingredientId) => {
    setFormData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        removable: prev.customizations.removable.includes(ingredientId)
          ? prev.customizations.removable.filter(id => id !== ingredientId)
          : [...prev.customizations.removable, ingredientId]
      }
    }))
  }

  const addExtraIngredient = () => {
  setFormData(prev => ({
    ...prev,
    customizations: {
      ...prev.customizations,
      extras: [...prev.customizations.extras, { ingredientId: '', price: '' }] // 0 yerine ''
    }
  }))
}

  const updateExtraIngredient = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        extras: prev.customizations.extras.map((extra, i) => 
          i === index ? { ...extra, [field]: value } : extra
        )
      }
    }))
  }

  const removeExtraIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        extras: prev.customizations.extras.filter((_, i) => i !== index)
      }
    }))
  }

  // Auto-generate slug from name
  const handleNameChange = (name) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
    }))
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : 'Kategori Yok'
  }

  const getIngredientName = (ingredientId) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId)
    return ingredient ? ingredient.name : 'Malzeme Bulunamadı'
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: 'Temel Bilgiler', icon: Info },
    { id: 'ingredients', label: 'Malzemeler', icon: ChefHat },
    { id: 'customization', label: 'Özelleştirme', icon: Package },
    { id: 'nutrition', label: 'Beslenme & Diyet', icon: Leaf }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Menü Yönetimi
          </h1>
          <p className="text-slate-600 mt-2">Menü öğelerinizi ekleyin, düzenleyin ve yönetin</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Yeni Ürün Ekle
        </motion.button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid gap-6">
        {menuItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <ChefHat className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Henüz ürün yok</h3>
            <p className="text-slate-600 mb-6">İlk ürününüzü oluşturarak başlayın</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Ürün Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {menuItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-200 overflow-hidden group"
              >
                {/* Image */}
                <div className="relative h-48 bg-slate-100">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-white/90 rounded-full text-slate-700 hover:bg-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-500/90 rounded-full text-white hover:bg-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {item.featured && (
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Öne Çıkan
                      </span>
                    )}
                    {!item.available && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        Mevcut Değil
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-lg truncate">{item.name}</h3>
                      <p className="text-sm text-slate-600 mb-2">{getCategoryName(item.categoryId)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">₺{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">{item.description}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.dietaryInfo?.isVegetarian && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Vejetaryen
                      </span>
                    )}
                    {item.dietaryInfo?.isVegan && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Vegan
                      </span>
                    )}
                    {item.spicyLevel > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {item.spicyLevel}/5
                      </span>
                    )}
                    {item.cookingTime && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.cookingTime} dk
                      </span>
                    )}
                  </div>

                  {/* Allergens */}
                  {item.allergens && item.allergens.length > 0 && (
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs text-slate-500 mb-2">Alerjenler:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.map(allergen => (
                          <span key={allergen} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingItem ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
                  </h2>
                  <button 
                    onClick={resetForm}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                  {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-600 hover:bg-white/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Form Content */}
              <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-8">
                    {/* Basic Information Tab */}
                    {activeTab === 'basic' && (
                      <motion.div
                        key="basic"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                      >
                        {/* Left Column */}
                        <div className="space-y-6">
                          {/* Product Name */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Ürün Adı *
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => handleNameChange(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              placeholder="Ürün adını girin"
                              required
                            />
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Açıklama *
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => setFormData({...formData, description: e.target.value})}
                              rows="4"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Ürün açıklamasını girin..."
                              required
                            /></div>

                          {/* Price & Category */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Fiyat (₺) *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                placeholder="0.00"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Kategori *
                              </label>
                              <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                required
                              >
                                <option value="">Kategori Seç</option>
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Cooking Time & Spicy Level */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Hazırlama Süresi (dk)
                              </label>
                              <input
                                type="number"
                                value={formData.cookingTime}
                                onChange={(e) => setFormData({...formData, cookingTime: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                placeholder="15"
                                min="0"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Acılık Seviyesi (0-5)
                              </label>
                              <select
                                value={formData.spicyLevel}
                                onChange={(e) => setFormData({...formData, spicyLevel: parseInt(e.target.value)})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              >
                                <option value="0">Acısız</option>
                                <option value="1">Çok Az Acı</option>
                                <option value="2">Az Acı</option>
                                <option value="3">Orta</option>
                                <option value="4">Acı</option>
                                <option value="5">Çok Acı</option>
                              </select>
                            </div>
                          </div>

                          {/* Checkboxes */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id="featured"
                                checked={formData.featured}
                                onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                                className="w-5 h-5 text-indigo-600 bg-slate-50 border-slate-300 rounded focus:ring-indigo-500"
                              />
                              <label htmlFor="featured" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Öne çıkan ürün
                              </label>
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id="available"
                                checked={formData.available}
                                onChange={(e) => setFormData({...formData, available: e.target.checked})}
                                className="w-5 h-5 text-indigo-600 bg-slate-50 border-slate-300 rounded focus:ring-indigo-500"
                              />
                              <label htmlFor="available" className="text-sm font-medium text-slate-700">
                                Ürün mevcut
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                          {/* Product Image */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Ürün Görseli
                            </label>
                            <ImageUpload
                              currentImage={formData.image}
                              onImageUploaded={(image) => setFormData({...formData, image: image.url})}
                              onImageRemoved={() => setFormData({...formData, image: null})}
                              size="lg"
                            />
                          </div>

                          {/* URL Slug */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              URL Slug
                            </label>
                            <input
                              type="text"
                              value={formData.slug}
                              onChange={(e) => setFormData({...formData, slug: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              placeholder="urun-slug"
                            />
                            <p className="text-xs text-slate-500 mt-1">URL'de kullanılacak kısa isim (otomatik oluşturulur)</p>
                          </div>

                          {/* Sort Order */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Sıralama
                            </label>
                            <input
                              type="number"
                              value={formData.sortOrder}
                              onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value)})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              placeholder="0"
                              min="0"
                            />
                            <p className="text-xs text-slate-500 mt-1">Küçük sayılar önce görünür</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Ingredients Tab */}
                    {activeTab === 'ingredients' && (
                      <motion.div
                        key="ingredients"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <ChefHat className="w-5 h-5" />
                            Ürün Malzemeleri
                          </h3>
                          <p className="text-blue-700 text-sm">
                            Bu üründe bulunan temel malzemeleri seçin. Bu malzemeler müşteri menüsünde görünecek.
                          </p>
                        </div>

                        {/* Ingredients by Category */}
                        {ingredientCategories.map(category => {
                          const categoryIngredients = ingredients.filter(ing => ing.category === category)
                          if (categoryIngredients.length === 0) return null

                          return (
                            <div key={category} className="bg-white rounded-xl border border-slate-200 p-6">
                              <h4 className="font-semibold text-slate-900 mb-4 capitalize flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                {category === 'meat' ? 'Et Ürünleri' :
                                 category === 'dairy' ? 'Süt Ürünleri' :
                                 category === 'vegetable' ? 'Sebze' :
                                 category === 'fruit' ? 'Meyve' :
                                 category === 'grain' ? 'Tahıl' :
                                 category === 'spice' ? 'Baharat' :
                                 category === 'sauce' ? 'Sos' :
                                 'Diğer'}
                              </h4>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {categoryIngredients.map(ingredient => (
                                  <label
                                    key={ingredient.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                      formData.ingredients.includes(ingredient.id)
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.ingredients.includes(ingredient.id)}
                                      onChange={() => handleIngredientToggle(ingredient.id)}
                                      className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 flex-1">
                                      {ingredient.name}
                                    </span>
                                    {ingredient.isVegetarian && (
                                      <Leaf className="w-3 h-3 text-green-500" />
                                    )}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </motion.div>
                    )}

                    {/* Customization Tab */}
                    {activeTab === 'customization' && (
                      <motion.div
                        key="customization"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        {/* Removable Ingredients */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <X className="w-5 h-5" />
                            Çıkarılabilir Malzemeler
                          </h3>
                          <p className="text-slate-600 text-sm mb-4">
                            Müşterinin üründen çıkarabileceği malzemeleri seçin.
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {formData.ingredients.map(ingredientId => {
                              const ingredient = ingredients.find(ing => ing.id === ingredientId)
                              if (!ingredient) return null

                              return (
                                <label
                                  key={ingredientId}
                                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                    formData.customizations.removable.includes(ingredientId)
                                      ? 'border-red-500 bg-red-50'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.customizations.removable.includes(ingredientId)}
                                    onChange={() => handleRemovableToggle(ingredientId)}
                                    className="w-4 h-4 text-red-600 bg-white border-slate-300 rounded focus:ring-red-500"
                                  />
                                  <span className="text-sm font-medium text-slate-700 flex-1">
                                    {ingredient.name}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>

                        {/* Extra Ingredients */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Ekstra Malzemeler
                              </h3>
                              <p className="text-slate-600 text-sm mt-1">
                                Müşterinin ekstra ücret karşılığında ekleyebileceği malzemeler.
                              </p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={addExtraIngredient}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Ekstra Ekle
                            </motion.button>
                          </div>

                          <div className="space-y-3">
                            {formData.customizations.extras.map((extra, index) => (
                              <div key={index} className="flex gap-3 items-center p-3 bg-slate-50 rounded-lg">
                                <select
                                  value={extra.ingredientId}
                                  onChange={(e) => updateExtraIngredient(index, 'ingredientId', e.target.value)}
                                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="">Malzeme Seç</option>
                                  {ingredients.map(ingredient => (
                                    <option key={ingredient.id} value={ingredient.id}>
                                      {ingredient.name}
                                    </option>
                                  ))}
                                </select>

                                <input
  type="number"
  step="0.01"
  value={extra.price || ''} // extra.price yerine extra.price || ''
  onChange={(e) => updateExtraIngredient(index, 'price', e.target.value)} // parseFloat kaldır
  placeholder="Fiyat"
  className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>

                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  type="button"
                                  onClick={() => removeExtraIngredient(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            ))}

                            {formData.customizations.extras.length === 0 && (
                              <p className="text-slate-500 text-sm text-center py-4">
                                Henüz ekstra malzeme eklenmedi
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Nutrition & Diet Tab */}
                    {activeTab === 'nutrition' && (
                      <motion.div
                        key="nutrition"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        {/* Nutrition Info */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            Beslenme Bilgileri
                          </h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Kalori
                              </label>
                              <input
                                type="number"
                                value={formData.nutritionInfo.calories}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  nutritionInfo: {...formData.nutritionInfo, calories: e.target.value}
                                })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="kcal"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Protein (g)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={formData.nutritionInfo.protein}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  nutritionInfo: {...formData.nutritionInfo, protein: e.target.value}
                                })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="0.0"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Karbonhidrat (g)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={formData.nutritionInfo.carbs}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  nutritionInfo: {...formData.nutritionInfo, carbs: e.target.value}
                                })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="0.0"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Yağ (g)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={formData.nutritionInfo.fat}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  nutritionInfo: {...formData.nutritionInfo, fat: e.target.value}
                                })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="0.0"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Dietary Information */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Leaf className="w-5 h-5" />
                            Diyet Bilgileri
                          </h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-slate-300">
                              <input
                                type="checkbox"
                                checked={formData.dietaryInfo.isVegetarian}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  dietaryInfo: {...formData.dietaryInfo, isVegetarian: e.target.checked}
                                })}
                                className="w-4 h-4 text-green-600 bg-white border-slate-300 rounded focus:ring-green-500"
                              />
                              <span className="text-sm font-medium text-slate-700">Vejetaryen</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-slate-300">
                              <input
                                type="checkbox"
                                checked={formData.dietaryInfo.isVegan}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  dietaryInfo: {...formData.dietaryInfo, isVegan: e.target.checked}
                                })}
                                className="w-4 h-4 text-green-600 bg-white border-slate-300 rounded focus:ring-green-500"
                              />
                              <span className="text-sm font-medium text-slate-700">Vegan</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-slate-300">
                              <input
                                type="checkbox"
                                checked={formData.dietaryInfo.isGlutenFree}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  dietaryInfo: {...formData.dietaryInfo, isGlutenFree: e.target.checked}
                                })}
                                className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-slate-700">Glutensiz</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-slate-300">
                              <input
                                type="checkbox"
                                checked={formData.dietaryInfo.isHalal}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  dietaryInfo: {...formData.dietaryInfo, isHalal: e.target.checked}
                                })}
                                className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm font-medium text-slate-700">Helal</span>
                            </label>
                          </div>
                        </div>

                        {/* Allergens */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Alerjenler
                          </h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {allergenOptions.map(allergen => (
                              <label
                                key={allergen}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                  formData.allergens.includes(allergen)
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.allergens.includes(allergen)}
                                  onChange={() => handleAllergenChange(allergen)}
                                  className="w-4 h-4 text-orange-600 bg-white border-slate-300 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-slate-700 capitalize">
                                  {allergen === 'gluten' ? 'Gluten' :
                                   allergen === 'dairy' ? 'Süt Ürünleri' :
                                   allergen === 'eggs' ? 'Yumurta' :
                                   allergen === 'nuts' ? 'Fındık/Fıstık' :
                                   allergen === 'peanuts' ? 'Yer Fıstığı' :
                                   allergen === 'soy' ? 'Soya' :
                                   allergen === 'fish' ? 'Balık' :
                                   allergen === 'shellfish' ? 'Kabuklu Deniz Ürünleri' :
                                   allergen === 'sesame' ? 'Susam' : allergen}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Action Buttons - Fixed at bottom */}
                  <div className="flex gap-3 pt-6 border-t border-slate-200 bg-white">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {editingItem ? 'Ürün Güncelle' : 'Ürün Ekle'}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200"
                    >
                      İptal
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}