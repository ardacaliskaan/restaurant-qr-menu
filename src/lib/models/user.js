// src/lib/models/user.js - User Model

import bcrypt from 'bcryptjs'

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',      // Ana sahip - her şey
  WAITER: 'waiter',    // Garson - siparişler
  KITCHEN: 'kitchen',  // Mutfak - sipariş durumları (gelecekte)
  CASHIER: 'cashier'   // Kasiyer - ödemeler (gelecekte)
}

// Role Permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'users.*',           // Kullanıcı yönetimi
    'orders.*',          // Sipariş yönetimi
    'menu.*',            // Menü yönetimi
    'categories.*',      // Kategori yönetimi
    'ingredients.*',     // Malzeme yönetimi
    'tables.*',          // Masa yönetimi
    'reports.*',         // Raporlar
    'settings.*'         // Ayarlar
  ],
  [USER_ROLES.WAITER]: [
    'orders.view',       // Siparişleri görme
    'orders.update',     // Sipariş durumu güncelleme
    'orders.create',     // Sipariş alma (manuel)
    'tables.view',       // Masaları görme
    'tables.close',      // Masa kapatma
    'menu.view'          // Menüyü görme
  ],
  [USER_ROLES.KITCHEN]: [
    'orders.view',
    'orders.update',
    'menu.view'
  ],
  [USER_ROLES.CASHIER]: [
    'orders.view',
    'orders.payment',
    'reports.view'
  ]
}

// User validation
export const validateUser = (data, isUpdate = false) => {
  const errors = []
  
  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Ad soyad en az 2 karakter olmalıdır')
  }
  
  if (data.name && data.name.length > 100) {
    errors.push('Ad soyad 100 karakterden uzun olamaz')
  }
  
  // Username validation
  if (!isUpdate && (!data.username || data.username.trim().length < 3)) {
    errors.push('Kullanıcı adı en az 3 karakter olmalıdır')
  }
  
  if (data.username && data.username.length > 50) {
    errors.push('Kullanıcı adı 50 karakterden uzun olamaz')
  }
  
  if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.push('Kullanıcı adı sadece harf, rakam ve _ içerebilir')
  }
  
  // Email validation (optional)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Geçersiz email formatı')
  }
  
  // Password validation (for new users or password updates)
  if (!isUpdate && (!data.password || data.password.length < 4)) {
    errors.push('Şifre en az 4 karakter olmalıdır')
  }
  
  if (data.password && data.password.length > 100) {
    errors.push('Şifre çok uzun')
  }
  
  // Role validation
  if (!data.role || !Object.values(USER_ROLES).includes(data.role)) {
    errors.push('Geçersiz kullanıcı rolü')
  }
  
  // Phone validation (optional)
  if (data.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(data.phone)) {
    errors.push('Geçersiz telefon formatı')
  }
  
  return errors
}

// Create user
export const createUser = async (data) => {
  const hashedPassword = await bcrypt.hash(data.password, 12)
  
  return {
    name: data.name.trim(),
    username: data.username.trim().toLowerCase(),
    email: data.email?.trim().toLowerCase() || null,
    password: hashedPassword,
    role: data.role,
    phone: data.phone?.trim() || null,
    avatar: data.avatar || null,
    isActive: data.isActive !== false,
    permissions: ROLE_PERMISSIONS[data.role] || [],
    metadata: {
      lastLogin: null,
      loginCount: 0,
      createdBy: data.createdBy || null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Update user
export const updateUser = (data) => {
  const updateFields = {
    name: data.name?.trim(),
    email: data.email?.trim().toLowerCase() || null,
    phone: data.phone?.trim() || null,
    avatar: data.avatar || null,
    isActive: data.isActive,
    updatedAt: new Date()
  }
  
  // Role değişirse permissions'ı güncelle
  if (data.role) {
    updateFields.role = data.role
    updateFields.permissions = ROLE_PERMISSIONS[data.role] || []
  }
  
  // Şifre güncelleniyorsa
  if (data.password) {
    updateFields.password = bcrypt.hashSync(data.password, 12)
  }
  
  // Undefined alanları temizle
  Object.keys(updateFields).forEach(key => {
    if (updateFields[key] === undefined) {
      delete updateFields[key]
    }
  })
  
  return updateFields
}

// Check permission
export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false
  }
  
  // Wildcard permission check (admin.* covers admin.create, admin.read, etc.)
  return userPermissions.some(permission => {
    if (permission === requiredPermission) {
      return true
    }
    
    // Wildcard check
    if (permission.endsWith('.*')) {
      const basePermission = permission.slice(0, -2)
      return requiredPermission.startsWith(basePermission + '.')
    }
    
    return false
  })
}

// Get role label
export const getRoleLabel = (role) => {
  const roleLabels = {
    [USER_ROLES.ADMIN]: 'Yönetici',
    [USER_ROLES.WAITER]: 'Garson',
    [USER_ROLES.KITCHEN]: 'Mutfak',
    [USER_ROLES.CASHIER]: 'Kasiyer'
  }
  
  return roleLabels[role] || role
}

// Get role color
export const getRoleColor = (role) => {
  const roleColors = {
    [USER_ROLES.ADMIN]: 'bg-purple-100 text-purple-800',
    [USER_ROLES.WAITER]: 'bg-blue-100 text-blue-800',
    [USER_ROLES.KITCHEN]: 'bg-orange-100 text-orange-800',
    [USER_ROLES.CASHIER]: 'bg-green-100 text-green-800'
  }
  
  return roleColors[role] || 'bg-gray-100 text-gray-800'
}

// User filtering helpers
export const buildUserFilter = (params) => {
  const filter = {}
  
  // Role filtering
  if (params.role) {
    filter.role = params.role
  }
  
  // Active status filtering
  if (params.isActive !== undefined) {
    filter.isActive = params.isActive === 'true'
  }
  
  // Search filtering
  if (params.search) {
    filter.$or = [
      { name: { $regex: params.search, $options: 'i' } },
      { username: { $regex: params.search, $options: 'i' } },
      { email: { $regex: params.search, $options: 'i' } }
    ]
  }
  
  return filter
}

// User sorting helpers
export const buildUserSort = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const sort = {}
  
  switch (sortBy) {
    case 'name':
      sort.name = sortOrder === 'desc' ? -1 : 1
      break
    case 'username':
      sort.username = sortOrder === 'desc' ? -1 : 1
      break
    case 'role':
      sort.role = sortOrder === 'desc' ? -1 : 1
      sort.name = 1 // Secondary sort
      break
    case 'lastLogin':
      sort['metadata.lastLogin'] = sortOrder === 'desc' ? -1 : 1
      break
    case 'isActive':
      sort.isActive = sortOrder === 'desc' ? -1 : 1
      sort.name = 1 // Secondary sort
      break
    default:
      sort.createdAt = sortOrder === 'desc' ? -1 : 1
  }
  
  return sort
}

// Password validation
export const validatePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword)
}