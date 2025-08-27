import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - Siparişleri getir
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tableNumber = searchParams.get('table')
    
    // Filtre oluştur
    const filter = {}
    if (status) filter.status = status
    if (tableNumber) filter.tableNumber = parseInt(tableNumber)
    
    const orders = await db.collection('orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()
    
    // ObjectId'leri string'e çevir
    const formattedOrders = orders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined
    }))
    
    return NextResponse.json({
      success: true,
      orders: formattedOrders
    })
    
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Siparişler alınamadı' },
      { status: 500 }
    )
  }
}

// POST - Yeni sipariş oluştur
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    // Veri validasyonu
    if (!data.tableNumber || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Eksik sipariş bilgileri' },
        { status: 400 }
      )
    }
    
    // Toplam tutarı hesapla
    const totalAmount = data.items.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
    
    const order = {
      tableNumber: parseInt(data.tableNumber),
      items: data.items.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity)
      })),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'pending',
      customerNotes: data.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('orders').insertOne(order)
    
    return NextResponse.json({
      success: true,
      orderId: result.insertedId,
      message: 'Sipariş başarıyla oluşturuldu'
    })
    
  } catch (error) {
    console.error('Orders POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş oluşturulamadı' },
      { status: 500 }
    )
  }
}

// PUT - Sipariş durumunu güncelle
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { orderId, status } = data
    
    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Sipariş ID ve durum gerekli' },
        { status: 400 }
      )
    }
    
    // Geçerli durumları kontrol et
    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz sipariş durumu' },
        { status: 400 }
      )
    }
    
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sipariş durumu güncellendi'
    })
    
  } catch (error) {
    console.error('Orders PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş güncellenemedi' },
      { status: 500 }
    )
  }
}