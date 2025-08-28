// Category Model
export const createCategory = (data) => {
  return {
    name: data.name.trim(),
    description: data.description?.trim() || '',
    slug: data.slug || generateSlug(data.name),
    parentId: data.parentId || null, // İç içe kategoriler için
    image: data.image || null,
    sortOrder: parseInt(data.sortOrder) || 0,
    isActive: data.isActive !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Ingredient Model (Malzemeler)
export const createIngredient = (data) => {
  return {
    name: data.name.trim(),
    description: data.description?.trim() || '',
    category: data.category || 'other', // dairy, meat, vegetable, spice, etc.
    allergens: data.allergens || [],
    isVegetarian: data.isVegetarian || false,
    isVegan: data.isVegan || false,
    isGlutenFree: data.isGlutenFree || false,
    extraPrice: parseFloat(data.extraPrice) || 0, // Ekstra ücret
    isActive: data.isActive !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Menu Item Model (Genişletilmiş)
export const createMenuItem = (data) => {
  return {
    name: data.name.trim(),
    description: data.description.trim(),
    slug: data.slug || generateSlug(data.name),
    price: parseFloat(data.price),
    categoryId: data.categoryId,
    image: data.image || null,
    
    // Malzemeler ve Özelleştirmeler
    ingredients: data.ingredients || [], // Temel malzemeler
    customizations: {
      removable: data.removableIngredients || [], // Çıkarılabilir malzemeler
      extras: data.extraIngredients || [], // Ekstra malzemeler
      sizes: data.sizes || [], // Boyut seçenekleri
      options: data.options || [] // Diğer seçenekler (acılık, pişme derecesi, vb.)
    },
    
    // Beslenme ve Alerjen Bilgileri
    nutritionInfo: {
      calories: parseInt(data.calories) || null,
      protein: parseFloat(data.protein) || null,
      carbs: parseFloat(data.carbs) || null,
      fat: parseFloat(data.fat) || null
    },
    allergens: data.allergens || [],
    dietaryInfo: {
      isVegetarian: data.isVegetarian || false,
      isVegan: data.isVegan || false,
      isGlutenFree: data.isGlutenFree || false,
      isHalal: data.isHalal || false
    },
    
    // Durum ve Meta
    available: data.available !== false,
    featured: data.featured || false,
    cookingTime: parseInt(data.cookingTime) || null, // dakika
    spicyLevel: parseInt(data.spicyLevel) || 0, // 0-5 arası
    sortOrder: parseInt(data.sortOrder) || 0,
    
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Customization Option Model
export const createCustomization = (data) => {
  return {
    name: data.name.trim(),
    type: data.type, // 'removable', 'extra', 'size', 'choice'
    ingredientId: data.ingredientId || null,
    price: parseFloat(data.price) || 0,
    maxQuantity: parseInt(data.maxQuantity) || 1,
    required: data.required || false,
    menuItemIds: data.menuItemIds || [], // Hangi ürünler için geçerli
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Utility functions
export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Özel karakterleri temizle
    .replace(/\s+/g, '-') // Boşlukları tire yap
    .replace(/-+/g, '-') // Çoklu tireleri tek tire yap
    .trim('-') // Başta/sonda tire varsa temizle
}

// Validation functions
export const validateCategory = (data) => {
  const errors = []
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Kategori adı en az 2 karakter olmalıdır')
  }
  
  return errors
}

export const validateIngredient = (data) => {
  const errors = []
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Malzeme adı en az 2 karakter olmalıdır')
  }
  
  if (data.extraPrice && data.extraPrice < 0) {
    errors.push('Ekstra fiyat negatif olamaz')
  }
  
  return errors
}

export const validateMenuItem = (data) => {
  const errors = []
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Ürün adı en az 2 karakter olmalıdır')
  }
  
  if (!data.description || data.description.trim().length < 5) {
    errors.push('Ürün açıklaması en az 5 karakter olmalıdır')
  }
  
  if (!data.price || data.price <= 0) {
    errors.push('Fiyat 0\'dan büyük olmalıdır')
  }
  
  if (!data.categoryId) {
    errors.push('Kategori seçilmelidir')
  }
  
  return errors
}