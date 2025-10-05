// src/app/api/menu/route.js - Düzeltilmiş versiyon
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// Yardımcı: Kategori ismini slug'a çevir
function toCategoryId(name) {
  const base = String(name ?? 'Diğer').trim().toLowerCase()
  return base
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    || 'diger'
}

// Yardımcı: Sayıyı güvenle parse et
function toNumber(val, fallback = 0) {
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'))
  return Number.isFinite(n) ? n : fallback
}

// GET - Menü verilerini getir (categories, menuItems VE ingredients döner)
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')

    // Menü öğelerini çek
    const menuItemsRaw = await db.collection('menu').find({}).toArray()

    // Malzemeleri çek - ARTIK BU EKLENDİ!
    const ingredientsRaw = await db.collection('ingredients').find({}).toArray()

    // Kategori kümesini topla
    const categorySet = new Map()
    menuItemsRaw.forEach((doc) => {
      const catName = doc?.category ?? 'Diğer'
      const id = toCategoryId(catName)
      if (!categorySet.has(catName)) {
        categorySet.set(catName, { id, name: catName })
      }
    })

    // Categories çıktısı
    const categories = Array.from(categorySet.values())

    // Ingredients çıktısı - ID'leri normalize et
    const ingredients = ingredientsRaw.map((doc) => ({
      id: String(doc._id),        // Hem id hem _id olarak kullanılabilsin
      _id: String(doc._id),
      name: doc.name,
      category: doc.category,
      allergens: doc.allergens || [],
      isVegetarian: doc.isVegetarian || false,
      isVegan: doc.isVegan || false,
      isGlutenFree: doc.isGlutenFree || false,
      extraPrice: doc.extraPrice || 0
    }))

    // MenuItems çıktısı
    const menuItems = menuItemsRaw.map((doc) => {
      const catName = doc?.category ?? 'Diğer'
      const categoryId = toCategoryId(catName)

      const cookingTime = doc?.cookingTime ?? null
      const spicyLevel = toNumber(doc?.spicyLevel ?? 0, 0)
      const dietaryInfo = doc?.dietaryInfo ?? null
      const nutritionInfo = doc?.nutritionInfo ?? null
      const customizations = doc?.customizations ?? { removable: [], extras: [] }
      const allergens = Array.isArray(doc?.allergens) ? doc.allergens : []

      return {
        id: String(doc._id),
        _id: String(doc._id),         // Hem id hem _id
        name: doc?.name ?? 'Ürün',
        description: doc?.description ?? '',
        price: toNumber(doc?.price, 0),
        image: doc?.image || null,
        allergens,
        available: doc?.available !== false,
        categoryId,
        cookingTime,
        spicyLevel,
        dietaryInfo,
        nutritionInfo,
        customizations,
      }
    })

    // ÖNEMLİ: Artık ingredients de döndürülüyor!
    return NextResponse.json({
      success: true,
      categories,
      menuItems,
      ingredients    // BU EKSİKTİ!
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

    // Zorunlu alan kontrolü
    if (!data?.name || !data?.description || data?.price == null || !data?.category) {
      return NextResponse.json(
        { success: false, error: 'Eksik bilgiler (name, description, price, category zorunlu)' },
        { status: 400 }
      )
    }

    // Normalize
    const price = toNumber(data.price, NaN)
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz fiyat' },
        { status: 400 }
      )
    }

    const menuItem = {
      name: String(data.name),
      description: String(data.description),
      price,
      category: String(data.category),
      image: data.image || null,
      allergens: Array.isArray(data.allergens) ? data.allergens : [],
      available: data.available === false ? false : true,
      // Opsiyonel alanlar
      cookingTime: data.cookingTime ?? null,
      spicyLevel: toNumber(data.spicyLevel ?? 0, 0),
      dietaryInfo: data.dietaryInfo ?? null,
      nutritionInfo: data.nutritionInfo ?? null,
      customizations: data.customizations ?? { removable: [], extras: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('menu').insertOne(menuItem)

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      message: 'Menü öğesi başarıyla eklendi',
    })
  } catch (error) {
    console.error('Menu POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü öğesi eklenemedi' },
      { status: 500 }
    )
  }
}