'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Edit, Trash2, Save, X, Loader2, FolderPlus, 
  Folder, FolderOpen, ChevronRight, Image as ImageIcon,
  GripVertical
} from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ImageUpload'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [flatCategories, setFlatCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState(new Set())

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: '',
    image: null,
    sortOrder: 0,
    isActive: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
        setFlatCategories(data.flatCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Kategoriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = '/api/admin/categories'
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem 
        ? { ...formData, id: editingItem.id }
        : formData

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        await fetchCategories()
        resetForm()
        toast.success(editingItem ? 'Kategori güncellendi!' : 'Kategori eklendi!')
      } else {
        toast.error(result.error || 'İşlem başarısız')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Kaydetme hatası!')
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" kategorisini silmek istediğinizden emin misiniz?`)) return

    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await fetchCategories()
        toast.success('Kategori silindi!')
      } else {
        toast.error(result.error || 'Silme hatası')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Silme hatası!')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      slug: item.slug || '',
      parentId: item.parentId || '',
      image: item.image,
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      parentId: '',
      image: null,
      sortOrder: 0,
      isActive: true
    })
    setShowAddForm(false)
    setEditingItem(null)
  }

  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Auto-generate slug from name
  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
    })
  }

  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)

    return (
      <motion.div
        key={category.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2"
      >
        {/* Category Row */}
        <div 
          className="group flex items-center p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200"
          style={{ marginLeft: `${level * 20}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(category.id)}
              className="mr-3 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          )}
          
          {/* Drag Handle */}
          <div className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>

          {/* Category Icon */}
          <div className="mr-4">
            {category.image ? (
              <img 
                src={category.image} 
                alt={category.name}
                className="w-12 h-12 object-cover rounded-lg border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                {hasChildren ? (
                  isExpanded ? <FolderOpen className="w-6 h-6 text-indigo-600" /> : <Folder className="w-6 h-6 text-indigo-600" />
                ) : (
                  <FolderPlus className="w-6 h-6 text-purple-600" />
                )}
              </div>
            )}
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-slate-900 truncate">{category.name}</h3>
              {!category.isActive && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                  Pasif
                </span>
              )}
            </div>
            
            {category.description && (
              <p className="text-sm text-slate-600 truncate">{category.description}</p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span>Slug: {category.slug}</span>
              <span>Sıra: {category.sortOrder}</span>
              {hasChildren && (
                <span>{category.children.length} alt kategori</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleEdit(category)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDelete(category.id, category.name)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2"
            >
              {category.children.map(child => renderCategory(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Kategori Yönetimi
          </h1>
          <p className="text-slate-600 mt-2">Menü kategorilerinizi organize edin ve yönetin</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Yeni Kategori
        </motion.button>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <FolderPlus className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Henüz kategori yok</h3>
            <p className="text-slate-600 mb-6">İlk kategorinizi oluşturarak başlayın</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Kategori Ekle
            </button>
          </div>
        ) : (
          categories.map(category => renderCategory(category))
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingItem ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
                  </h2>
                  <button 
                    onClick={resetForm}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Category Name */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Kategori Adı *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Kategori adını girin"
                          required
                        />
                      </div>

                      {/* Slug */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          URL Slug
                        </label>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => setFormData({...formData, slug: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="kategori-slug"
                        />
                        <p className="text-xs text-slate-500 mt-1">URL'de kullanılacak kısa isim (otomatik oluşturulur)</p>
                      </div>

                      {/* Parent Category */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Üst Kategori
                        </label>
                        <select
                          value={formData.parentId}
                          onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Ana Kategori</option>
                          {flatCategories
                            .filter(cat => cat.id !== editingItem?.id) // Kendisini seçemesin
                            .map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.parentId ? `-- ${cat.name}` : cat.name}
                              </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">Alt kategori yapmak için üst kategori seçin</p>
                      </div>

                      {/* Sort Order */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Sıralama
                        </label>
                        <input
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="0"
                          min="0"
                        />
                        <p className="text-xs text-slate-500 mt-1">Küçük sayılar önce görünür</p>
                      </div>

                      {/* Active Status */}
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                          className="w-5 h-5 text-indigo-600 bg-slate-50 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                          Kategori aktif
                        </label>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Category Image */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Kategori Görseli
                        </label>
                        <ImageUpload
                          currentImage={formData.image}
                          onImageUploaded={(image) => setFormData({...formData, image: image.url})}
                          onImageRemoved={() => setFormData({...formData, image: null})}
                          size="default"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description - Full Width */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Açıklama
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Kategori açıklamasını girin..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {editingItem ? 'Güncelle' : 'Kategori Ekle'}
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