// src/app/api/admin/users/route.js - Users API

import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { 
  validateUser, 
  createUser, 
  updateUser,
  buildUserFilter,
  buildUserSort,
  USER_ROLES,
  hasPermission
} from '@/lib/models/user'
import { verifyToken } from '@/lib/auth'

// GET - Kullanıcıları listele
export async function GET(request) {
  try {
    // Permission check
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(authResult.user.permissions, 'users.view')) {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için yetkiniz bulunmuyor' },
        { status: 403 }
      )
    }
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeStats = searchParams.get('stats') === 'true'
    
    // Build filter
    const filter = buildUserFilter({
      role: searchParams.get('role'),
      isActive: searchParams.get('isActive'),
      search: searchParams.get('search')
    })
    
    // Build sort
    const sort = buildUserSort(sortBy, sortOrder)
    
    console.log('Users filter:', filter) // Debug
    console.log('Users sort:', sort) // Debug
    
    // Pagination
    const skip = (page - 1) * limit
    
    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      db.collection('users')
        .find(filter, { 
          projection: { password: 0 } // Şifreleri döndürme
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('users').countDocuments(filter)
    ])
    
    // Format users
    const formattedUsers = users.map(user => ({
      ...user,
      id: user._id.toString(),
      _id: undefined
    }))
    
    let response = {
      success: true,
      users: formattedUsers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    }
    
    // Include statistics
    if (includeStats) {
      const allUsers = await db.collection('users')
        .find({}, { projection: { password: 0 } })
        .toArray()
      
      const stats = {
        total: allUsers.length,
        active: allUsers.filter(u => u.isActive).length,
        inactive: allUsers.filter(u => !u.isActive).length,
        byRole: {
          admin: allUsers.filter(u => u.role === USER_ROLES.ADMIN).length,
          waiter: allUsers.filter(u => u.role === USER_ROLES.WAITER).length,
          kitchen: allUsers.filter(u => u.role === USER_ROLES.KITCHEN).length,
          cashier: allUsers.filter(u => u.role === USER_ROLES.CASHIER).length
        },
        recentLogins: allUsers.filter(u => {
          if (!u.metadata?.lastLogin) return false
          const lastLogin = new Date(u.metadata.lastLogin)
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          return lastLogin > dayAgo
        }).length
      }
      
      response.statistics = stats
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Kullanıcılar alınamadı' },
      { status: 500 }
    )
  }
}

// POST - Yeni kullanıcı oluştur
export async function POST(request) {
  try {
    // Permission check
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(authResult.user.permissions, 'users.create')) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı oluşturma yetkiniz bulunmuyor' },
        { status: 403 }
      )
    }
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    console.log('📝 Creating user:', data.username, data.role) // Debug
    
    // Validation
    const errors = validateUser(data)
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Username unique kontrolü
    const existingUser = await db.collection('users')
      .findOne({ username: data.username.trim().toLowerCase() })
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      )
    }
    
    // Email unique kontrolü (eğer verilmişse)
    if (data.email) {
      const existingEmail = await db.collection('users')
        .findOne({ email: data.email.trim().toLowerCase() })
      
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'Bu email zaten kullanılıyor' },
          { status: 400 }
        )
      }
    }
    
    // Sadece admin yeni admin oluşturabilir
    if (data.role === USER_ROLES.ADMIN && authResult.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Sadece yöneticiler yeni yönetici oluşturabilir' },
        { status: 403 }
      )
    }
    
    // Create user
    const userData = await createUser({
      ...data,
      createdBy: authResult.user.id
    })
    
    const result = await db.collection('users').insertOne(userData)
    
    console.log('✅ User created:', result.insertedId.toString()) // Debug
    
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: `${data.role === USER_ROLES.ADMIN ? 'Yönetici' : 'Kullanıcı'} başarıyla oluşturuldu`
    })
    
  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Kullanıcı oluşturulamadı' },
      { status: 500 }
    )
  }
}

// PUT - Kullanıcı güncelle
export async function PUT(request) {
  try {
    // Permission check
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(authResult.user.permissions, 'users.update')) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı güncelleme yetkiniz bulunmuyor' },
        { status: 403 }
      )
    }
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      )
    }
    
    // Validation
    const errors = validateUser(updateData, true) // isUpdate = true
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Mevcut kullanıcıyı kontrol et
    const existingUser = await db.collection('users')
      .findOne({ _id: new ObjectId(id) })
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }
    
    // Kendisi dışında başka admin olmadığından emin ol (son admin'i silmesin)
    if (existingUser.role === USER_ROLES.ADMIN && updateData.isActive === false) {
      const activeAdminCount = await db.collection('users').countDocuments({
        role: USER_ROLES.ADMIN,
        isActive: true,
        _id: { $ne: new ObjectId(id) }
      })
      
      if (activeAdminCount === 0) {
        return NextResponse.json(
          { success: false, error: 'En az bir aktif yönetici olmalıdır' },
          { status: 400 }
        )
      }
    }
    
    // Sadece admin role değişikliği yapabilir
    if (updateData.role && updateData.role !== existingUser.role) {
      if (authResult.user.role !== USER_ROLES.ADMIN) {
        return NextResponse.json(
          { success: false, error: 'Sadece yöneticiler rol değişikliği yapabilir' },
          { status: 403 }
        )
      }
    }
    
    // Update user
    const updateFields = updateUser(updateData)
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }
    
    console.log('✅ User updated:', id) // Debug
    
    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi'
    })
    
  } catch (error) {
    console.error('Users PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Kullanıcı güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Kullanıcı sil (soft delete)
export async function DELETE(request) {
  try {
    // Permission check
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(authResult.user.permissions, 'users.delete')) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı silme yetkiniz bulunmuyor' },
        { status: 403 }
      )
    }
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await db.collection('users')
      .findOne({ _id: new ObjectId(id) })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }
    
    // Kendini silmeye çalışıyor mu?
    if (user._id.toString() === authResult.user.id) {
      return NextResponse.json(
        { success: false, error: 'Kendi hesabınızı silemezsiniz' },
        { status: 400 }
      )
    }
    
    // Son admin'i silmeye çalışıyor mu?
    if (user.role === USER_ROLES.ADMIN) {
      const activeAdminCount = await db.collection('users').countDocuments({
        role: USER_ROLES.ADMIN,
        isActive: true,
        _id: { $ne: new ObjectId(id) }
      })
      
      if (activeAdminCount === 0) {
        return NextResponse.json(
          { success: false, error: 'En az bir aktif yönetici olmalıdır' },
          { status: 400 }
        )
      }
    }
    
    // Soft delete (isActive = false)
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isActive: false,
          deletedAt: new Date(),
          deletedBy: authResult.user.id
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı silinemedi' },
        { status: 500 }
      )
    }
    
    console.log('🗑️ User soft deleted:', id) // Debug
    
    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    })
    
  } catch (error) {
    console.error('Users DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Kullanıcı silinemedi' },
      { status: 500 }
    )
  }
}