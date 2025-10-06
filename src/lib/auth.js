// src/lib/auth.js - Güncellenmiş Auth Sistemi

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import clientPromise from './mongodb'
import { ObjectId } from 'mongodb'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = '24h'

// Create JWT token
export const createToken = (user) => {
  const payload = {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    permissions: user.permissions || [],
    name: user.name,
    avatar: user.avatar
  }
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'restaurant-qr',
    audience: 'restaurant-staff'
  })
}

// Verify JWT token
export const verifyToken = async (request) => {
  try {
    // Cookie'den token al
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      // Header'dan da kontrol et
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Token bulunamadı' }
      }
      token = authHeader.split(' ')[1]
    }
    
    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Database'den kullanıcıyı kontrol et (aktif mi, hala var mı)
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const user = await db.collection('users')
      .findOne({ 
        _id: new ObjectId(decoded.id),
        isActive: true
      }, {
        projection: { password: 0 } // Şifreyi döndürme
      })
    
    if (!user) {
      return { success: false, error: 'Kullanıcı bulunamadı veya aktif değil' }
    }
    
    // Token bilgileri güncel mi kontrol et
    if (user.role !== decoded.role) {
      return { success: false, error: 'Token güncel değil, tekrar giriş yapın' }
    }
    
    return {
      success: true,
      user: {
        ...user,
        id: user._id.toString(),
        _id: undefined
      }
    }
    
  } catch (error) {
    console.error('Token verification error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return { success: false, error: 'Geçersiz token' }
    }
    
    if (error.name === 'TokenExpiredError') {
      return { success: false, error: 'Token süresi dolmuş' }
    }
    
    return { success: false, error: 'Token doğrulama hatası' }
  }
}

// Authenticate user (login)
export const authenticateUser = async (username, password) => {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    // Kullanıcıyı bul
    const user = await db.collection('users')
      .findOne({ 
        username: username.toLowerCase().trim(),
        isActive: true
      })
    
    if (!user) {
      return { success: false, error: 'Kullanıcı adı veya şifre hatalı' }
    }
    
    // Şifreyi kontrol et
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return { success: false, error: 'Kullanıcı adı veya şifre hatalı' }
    }
    
    // Login istatistiklerini güncelle
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          'metadata.lastLogin': new Date(),
          updatedAt: new Date()
        },
        $inc: { 
          'metadata.loginCount': 1 
        }
      }
    )
    
    // Şifreyi response'dan çıkar
    const { password: _, ...userWithoutPassword } = user
    
    return {
      success: true,
      user: {
        ...userWithoutPassword,
        id: user._id.toString(),
        _id: undefined
      }
    }
    
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Giriş işleminde hata oluştu' }
  }
}

// Set auth cookie
export const setAuthCookie = async (token) => {
  const cookieStore = await cookies()
  
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 saat
    path: '/'
  })
}

// Clear auth cookie
export const clearAuthCookie = async () => {
  const cookieStore = await cookies()
  
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })
}

// Initialize default admin user
export const initializeDefaultAdmin = async () => {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    // Admin kullanıcısı var mı kontrol et
    const adminExists = await db.collection('users')
      .findOne({ role: 'admin' })
    
    if (!adminExists) {
      // Default admin oluştur
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      const defaultAdmin = {
        name: 'Restaurant Admin',
        username: 'admin',
        email: 'admin@restaurant.com',
        password: hashedPassword,
        role: 'admin',
        phone: null,
        avatar: null,
        isActive: true,
        permissions: [
          'users.*',
          'orders.*',
          'menu.*',
          'categories.*',
          'ingredients.*',
          'tables.*',
          'reports.*',
          'settings.*'
        ],
        metadata: {
          lastLogin: null,
          loginCount: 0,
          createdBy: null
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.collection('users').insertOne(defaultAdmin)
      console.log('✅ Default admin user created: admin/admin123')
    }
    
  } catch (error) {
    console.error('Error initializing default admin:', error)
  }
}

// Permission middleware for API routes
export const requirePermission = (permission) => {
  return async (request) => {
    const authResult = await verifyToken(request)
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(authResult.user.permissions, permission)) {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için yetkiniz bulunmuyor' },
        { status: 403 }
      )
    }
    
    return { user: authResult.user }
  }
}

// Check if user has permission
export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false
  }
  
  return userPermissions.some(permission => {
    if (permission === requiredPermission) {
      return true
    }
    
    // Wildcard permission check (users.* covers users.create, users.read, etc.)
    if (permission.endsWith('.*')) {
      const basePermission = permission.slice(0, -2)
      return requiredPermission.startsWith(basePermission + '.')
    }
    
    return false
  })
}