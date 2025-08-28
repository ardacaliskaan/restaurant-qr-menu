import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - Tüm menü öğelerini getir (Admin)
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const menuItems = await db.collection('menu')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    
    const formattedItems = menuItems.map(item => ({
      ...item,
      id: item._id.toString(),
      _id: undefined,
      price: parseFloat(item.price) || 0,
      cookingTime: item.cookingTime ? parseInt(item.cookingTime) : null,
      spicyLevel: item.spicyLevel ? parseInt(item.spicyLevel) : 0,
      sortOrder: item.sortOrder ? parseInt(item.sortOrder) : 0
    }))
    
    return NextResponse.json({
      success: true,
      items: formattedItems
    })
    
  } catch (error) {
    console.error('Admin Menu GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü öğeleri alınamadı' },
      { status: 500 }
    )
  }
}

// POST - Yeni menü öğesi ekle
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    // Validasyon
    const errors = []
    if (!data.name?.trim()) errors.push('Ürün adı gerekli')
    if (!data.description?.trim()) errors.push('Ürün açıklaması gerekli')
    if (!data.price || data.price <= 0) errors.push('Geçerli fiyat gerekli')
    if (!data.category?.trim()) errors.push('Kategori gerekli')
    
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    const menuItem = {
      name: data.name.trim(),
      description: data.description.trim(),
      price: parseFloat(data.price),
      category: data.category.trim(),
      image: data.image || null,
      allergens: data.allergens || [],
      available: data.available !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('menu').insertOne(menuItem)
    
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: 'Menü öğesi başarıyla eklendi'
    })
    
  } catch (error) {
    console.error('Admin Menu POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü öğesi eklenemedi' },
      { status: 500 }
    )
  }
}

// PUT - Menü öğesini güncelle
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ürün ID gerekli' },
        { status: 400 }
      )
    }
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    }
    
    const result = await db.collection('menu').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Menü öğesi güncellendi'
    })
    
  } catch (error) {
    console.error('Admin Menu PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü öğesi güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Menü öğesini sil
export async function DELETE(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ürün ID gerekli' },
        { status: 400 }
      )
    }
    
    const result = await db.collection('menu').deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Menü öğesi silindi'
    })
    
  } catch (error) {
    console.error('Admin Menu DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü öğesi silinemedi' },
      { status: 500 }
    )
  }
}