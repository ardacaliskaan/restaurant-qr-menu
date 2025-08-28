import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { createCategory, validateCategory } from '@/lib/models/category'

// GET - Tüm kategorileri getir
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const categories = await db.collection('categories')
      .find({})
      .sort({ sortOrder: 1, name: 1 })
      .toArray()
    
    // Hiyerarşik yapı oluştur
    const categoryMap = {}
    const rootCategories = []
    
    categories.forEach(cat => {
      cat.id = cat._id.toString()
      delete cat._id
      cat.children = []
      categoryMap[cat.id] = cat
    })
    
    categories.forEach(cat => {
      if (cat.parentId) {
        if (categoryMap[cat.parentId]) {
          categoryMap[cat.parentId].children.push(cat)
        }
      } else {
        rootCategories.push(cat)
      }
    })
    
    return NextResponse.json({
      success: true,
      categories: rootCategories,
      flatCategories: categories // Düz liste de döndür
    })
    
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Kategoriler alınamadı' },
      { status: 500 }
    )
  }
}

// POST - Yeni kategori ekle
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    // Validasyon
    const errors = validateCategory(data)
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Slug unique kontrolü
    const existingCategory = await db.collection('categories')
      .findOne({ slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-') })
    
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Bu slug zaten kullanılıyor' },
        { status: 400 }
      )
    }
    
    const category = createCategory(data)
    const result = await db.collection('categories').insertOne(category)
    
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: 'Kategori başarıyla eklendi'
    })
    
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Kategori eklenemedi' },
      { status: 500 }
    )
  }
}

// PUT - Kategori güncelle
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kategori ID gerekli' },
        { status: 400 }
      )
    }
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    }
    
    const result = await db.collection('categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Kategori güncellendi'
    })
    
  } catch (error) {
    console.error('Categories PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Kategori güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Kategori sil
export async function DELETE(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kategori ID gerekli' },
        { status: 400 }
      )
    }
    
    // Alt kategorileri kontrol et
    const childCategories = await db.collection('categories')
      .find({ parentId: id }).toArray()
    
    if (childCategories.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu kategorinin alt kategorileri var, önce onları silin' },
        { status: 400 }
      )
    }
    
    // Bu kategorideki ürünleri kontrol et
    const menuItems = await db.collection('menu')
      .find({ categoryId: id }).toArray()
    
    if (menuItems.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu kategoride ürünler var, önce ürünleri başka kategoriye taşıyın' },
        { status: 400 }
      )
    }
    
    const result = await db.collection('categories').deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Kategori silindi'
    })
    
  } catch (error) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Kategori silinemedi' },
      { status: 500 }
    )
  }
}