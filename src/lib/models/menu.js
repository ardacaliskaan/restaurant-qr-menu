// Menu Model - Helper Functions
export const generateMenuSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const validateMenuItem = (data) => {
  const errors = []
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Ürün adı en az 2 karakter olmalıdır')
  }
  
  if (data.name && data.name.length > 200) {
    errors.push('Ürün adı 200 karakterden uzun olamaz')
  }
  
  if (!data.description || data.description.trim().length < 5) {
    errors.push('Ürün açıklaması en az 5 karakter olmalıdır')
  }
  
  if (data.description && data.description.length > 1000) {
    errors.push('Açıklama 1000 karakterden uzun olamaz')
  }
  
  if (!data.price || data.price <= 0) {
    errors.push('Fiyat 0\'dan büyük olmalıdır')
  }
  
  if (data.price && data.price > 999999) {
    errors.push('Fiyat çok yüksek')
  }
  
  if (!data.categoryId) {
    errors.push('Ana kategori seçilmelidir')
  }
  
  if (data.cookingTime && (data.cookingTime < 1 || data.cookingTime > 999)) {
    errors.push('Hazırlama süresi 1-999 dakika arasında olmalıdır')
  }
  
  if (data.spicyLevel && (data.spicyLevel < 0 || data.spicyLevel > 5)) {
    errors.push('Acılık seviyesi 0-5 arasında olmalıdır')
  }
  
  return errors
}

export const createMenuItem = (data) => {
  const slug = data.slug || generateMenuSlug(data.name)
  
  return {
    name: data.name.trim(),
    description: data.description.trim(),
    slug,
    price: parseFloat(data.price),
    categoryId: data.categoryId,
    subcategoryId: data.subcategoryId || null,
    image: data.image || null,
    ingredients: data.ingredients || [],
    customizations: {
      removable: data.customizations?.removable || [],
      extras: data.customizations?.extras || []
    },
    nutritionInfo: {
      calories: data.nutritionInfo?.calories || null,
      protein: data.nutritionInfo?.protein || null,
      carbs: data.nutritionInfo?.carbs || null,
      fat: data.nutritionInfo?.fat || null
    },
    allergens: data.allergens || [],
    dietaryInfo: {
      isVegan: data.dietaryInfo?.isVegan || false,
      isVegetarian: data.dietaryInfo?.isVegetarian || false,
      isGlutenFree: data.dietaryInfo?.isGlutenFree || false,
      isKeto: data.dietaryInfo?.isKeto || false,
      isLowCarb: data.dietaryInfo?.isLowCarb || false
    },
    cookingTime: data.cookingTime || null,
    spicyLevel: data.spicyLevel || 0,
    sortOrder: parseInt(data.sortOrder) || 0,
    available: data.available !== false,
    featured: data.featured || false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export const updateMenuItem = (data) => {
  const slug = data.slug || generateMenuSlug(data.name)
  
  return {
    name: data.name.trim(),
    description: data.description.trim(),
    slug,
    price: parseFloat(data.price),
    categoryId: data.categoryId,
    subcategoryId: data.subcategoryId || null,
    image: data.image || null,
    ingredients: data.ingredients || [],
    customizations: {
      removable: data.customizations?.removable || [],
      extras: data.customizations?.extras || []
    },
    nutritionInfo: {
      calories: data.nutritionInfo?.calories || null,
      protein: data.nutritionInfo?.protein || null,
      carbs: data.nutritionInfo?.carbs || null,
      fat: data.nutritionInfo?.fat || null
    },
    allergens: data.allergens || [],
    dietaryInfo: {
      isVegan: data.dietaryInfo?.isVegan || false,
      isVegetarian: data.dietaryInfo?.isVegetarian || false,
      isGlutenFree: data.dietaryInfo?.isGlutenFree || false,
      isKeto: data.dietaryInfo?.isKeto || false,
      isLowCarb: data.dietaryInfo?.isLowCarb || false
    },
    cookingTime: data.cookingTime || null,
    spicyLevel: data.spicyLevel || 0,
    sortOrder: parseInt(data.sortOrder) || 0,
    available: data.available !== false,
    featured: data.featured || false,
    updatedAt: new Date()
  }
}

// Filtering helpers
export const buildMenuFilter = (params) => {
  const filter = {}
  
  // Kategori filtreleme
  if (params.categoryId) {
    filter.categoryId = params.categoryId
  }
  
  // Alt kategori filtreleme
  if (params.subcategoryId) {
    filter.subcategoryId = params.subcategoryId
  }
  
  // Availability filtreleme
  if (params.availableOnly === 'true') {
    filter.available = { $ne: false }
  }
  
  // Featured filtreleme
  if (params.featuredOnly === 'true') {
    filter.featured = true
  }
  
  // Diyet filtreleme
  if (params.isVegan === 'true') {
    filter['dietaryInfo.isVegan'] = true
  }
  
  if (params.isVegetarian === 'true') {
    filter['dietaryInfo.isVegetarian'] = true
  }
  
  if (params.isGlutenFree === 'true') {
    filter['dietaryInfo.isGlutenFree'] = true
  }
  
  // Fiyat aralığı filtreleme
  if (params.minPrice || params.maxPrice) {
    filter.price = {}
    if (params.minPrice) {
      filter.price.$gte = parseFloat(params.minPrice)
    }
    if (params.maxPrice) {
      filter.price.$lte = parseFloat(params.maxPrice)
    }
  }
  
  // Arama filtreleme
  if (params.search) {
    filter.$or = [
      { name: { $regex: params.search, $options: 'i' } },
      { description: { $regex: params.search, $options: 'i' } }
    ]
  }
  
  return filter
}

// Sorting helpers
export const buildMenuSort = (sortBy = 'sortOrder', sortOrder = 'asc') => {
  const sort = {}
  
  switch (sortBy) {
    case 'name':
      sort.name = sortOrder === 'desc' ? -1 : 1
      break
    case 'price':
      sort.price = sortOrder === 'desc' ? -1 : 1
      break
    case 'createdAt':
      sort.createdAt = sortOrder === 'desc' ? -1 : 1
      break
    case 'cookingTime':
      sort.cookingTime = sortOrder === 'desc' ? -1 : 1
      break
    case 'featured':
      sort.featured = sortOrder === 'desc' ? -1 : 1
      sort.sortOrder = 1 // Secondary sort
      break
    default:
      sort.sortOrder = sortOrder === 'desc' ? -1 : 1
      sort.name = 1 // Secondary sort
  }
  
  return sort
}

// Menu item helpers
export const enrichMenuItem = (item, categories = [], ingredients = []) => {
  // Kategori bilgilerini ekle
  const category = categories.find(cat => cat.id === item.categoryId)
  const subcategory = item.subcategoryId 
    ? categories.find(cat => cat.id === item.subcategoryId)
    : null
  
  // Malzeme bilgilerini ekle
  const enrichedIngredients = (item.ingredients || []).map(ingredientId => {
    return ingredients.find(ing => ing.id === ingredientId)
  }).filter(Boolean)
  
  return {
    ...item,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    subcategory: subcategory ? { id: subcategory.id, name: subcategory.name, slug: subcategory.slug } : null,
    enrichedIngredients
  }
}

// Analytics helpers
export const getMenuStatistics = (menuItems) => {
  const total = menuItems.length
  const available = menuItems.filter(item => item.available !== false).length
  const featured = menuItems.filter(item => item.featured).length
  const avgPrice = total > 0 
    ? menuItems.reduce((sum, item) => sum + item.price, 0) / total 
    : 0
  
  const priceRange = total > 0 
    ? {
        min: Math.min(...menuItems.map(item => item.price)),
        max: Math.max(...menuItems.map(item => item.price))
      }
    : { min: 0, max: 0 }
  
  // Kategori dağılımı
  const categoryStats = {}
  menuItems.forEach(item => {
    const catId = item.categoryId
    if (catId) {
      categoryStats[catId] = (categoryStats[catId] || 0) + 1
    }
  })
  
  // Diyet dağılımı
  const dietaryStats = {
    vegan: menuItems.filter(item => item.dietaryInfo?.isVegan).length,
    vegetarian: menuItems.filter(item => item.dietaryInfo?.isVegetarian).length,
    glutenFree: menuItems.filter(item => item.dietaryInfo?.isGlutenFree).length
  }
  
  return {
    total,
    available,
    featured,
    avgPrice: Math.round(avgPrice * 100) / 100,
    priceRange,
    categoryStats,
    dietaryStats
  }
}