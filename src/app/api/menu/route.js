import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// GET - Menü verilerini getir
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    // Menü öğelerini kategoriye göre grupla
    const menuItems = await db.collection('menu').find({ available: true }).toArray()
    
    // Kategorilere göre grupla
    const categorizedMenu = {}
    menuItems.forEach(item => {
      if (!categorizedMenu[item.category]) {
        categorizedMenu[item.category] = []
      }
      categorizedMenu[item.category].push({
        id: item._id.toString(),
        name: item.name,
        description: item.description,
        price: parseFloat(item.price) || 0,
        image: item.image,
        allergens: item.allergens
      })
    })
    
    // Response formatını düzenle
    const categories = Object.keys(categorizedMenu).map(categoryName => ({
      id: categoryName.toLowerCase().replace(/\s+/g, '-'),
      name: categoryName,
      items: categorizedMenu[categoryName]
    }))
    
    return NextResponse.json({
      success: true,
      categories: categories
    })
    
  } catch (error) {
    console.error('Menu GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü verileri alınamadı' },
      { status: 500 }
    )
  }
}

// POST - Yeni menü öğesi ekle (Admin)
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    // Veri validasyonu
    if (!data.name || !data.description || !data.price || !data.category) {
      return NextResponse.json(
        { success: false, error: 'Eksik bilgiler' },
        { status: 400 }
      )
    }
    
    const menuItem = {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      category: data.category,
      image: data.image || null,
      allergens: data.allergens || [],
      available: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('menu').insertOne(menuItem)
    
    return NextResponse.json({
      success: true,
      id: result.insertedId,
      message: 'Menü öğesi başarıyla eklendi'
    })
    
  } catch (error) {
    console.error('Menu POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü öğesi eklenemedi' },
      { status: 500 }
    )
  }
}