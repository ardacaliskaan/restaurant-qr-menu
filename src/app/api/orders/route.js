// src/app/api/orders/route.js - Düzeltilmiş Orders API
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - Siparişleri getir (düzeltilmiş)
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tableNumber = searchParams.get('table')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeStats = searchParams.get('stats') === 'true'
    
    // Filtre oluştur
    const filter = {}
    if (status) filter.status = status
    if (tableNumber) {
      filter.$or = [
        { tableNumber: parseInt(tableNumber) },
        { tableId: tableNumber.toString() }
      ]
    }
    
    // Tarih filtresi (bugün için)
    if (!startDate && !endDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      filter.createdAt = {
        $gte: today,
        $lt: tomorrow
      }
    } else {
      if (startDate || endDate) {
        filter.createdAt = {}
        if (startDate) filter.createdAt.$gte = new Date(startDate)
        if (endDate) filter.createdAt.$lte = new Date(endDate)
      }
    }
    
    const orders = await db.collection('orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()
    
    // ObjectId'leri string'e çevir ve veri düzenle
    const formattedOrders = orders.map(order => ({
      ...order,
      _id: order._id.toString(),
      // Uyumluluk için her iki alanı da ekle
      tableId: order.tableId || order.tableNumber?.toString(),
      tableNumber: order.tableNumber || parseInt(order.tableId || '0')
    }))
    
    let response = {
      success: true,
      orders: formattedOrders
    }
    
    // İstatistikleri hesapla
    if (includeStats) {
      const activeStatuses = ['pending', 'preparing', 'ready', 'delivered']
      const activeOrders = orders.filter(o => activeStatuses.includes(o.status))
      const completedOrders = orders.filter(o => o.status === 'completed')
      const todayRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      
      const stats = {
        activeOrders: activeOrders.length,
        totalOrders: orders.length,
        dailyRevenue: todayRevenue.toFixed(2),
        averageOrder: completedOrders.length > 0 
          ? (todayRevenue / completedOrders.length).toFixed(2) 
          : '0.00',
        
        // Durum bazlı istatistikler
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        completed: orders.filter(o => o.status === 'completed').length,
      }
      
      response.stats = stats
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Siparişler alınamadı' },
      { status: 500 }
    )
  }
}

// POST - Yeni sipariş oluştur (düzeltilmiş)
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    console.log('Received order data:', data) // Debug için
    
    // Veri validasyonu
    if (!data.tableNumber && !data.tableId) {
      return NextResponse.json(
        { success: false, error: 'Masa numarası gerekli' },
        { status: 400 }
      )
    }
    
    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sipariş içeriği gerekli' },
        { status: 400 }
      )
    }
    
    // Masa numarasını normalize et
    const tableNumber = data.tableNumber || data.tableId
    
    // Toplam tutarı hesapla (customization'ları da dahil et)
    const totalAmount = data.items.reduce((total, item) => {
      let itemTotal = item.price * item.quantity
      
      // Ekstra malzeme fiyatları
      if (item.customizations?.extras) {
        const extrasTotal = item.customizations.extras.reduce((sum, extra) => {
          return sum + (extra.price * item.quantity)
        }, 0)
        itemTotal += extrasTotal
      }
      
      return total + itemTotal
    }, 0)
    
    const order = {
      tableNumber: parseInt(tableNumber),
      tableId: tableNumber.toString(),
      items: data.items.map(item => ({
        menuItemId: item.id || item.menuItemId,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
        customizations: {
          removed: item.customizations?.removed || [],
          extras: item.customizations?.extras || []
        },
        notes: item.notes || ''
      })),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'pending',
      customerNotes: data.notes || data.customerNotes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('Creating order:', order) // Debug için
    
    const result = await db.collection('orders').insertOne(order)
    
    // Oluşturulan siparişi geri döndür
    const newOrder = await db.collection('orders').findOne({ _id: result.insertedId })
    
    return NextResponse.json({
      success: true,
      order: {
        ...newOrder,
        _id: newOrder._id.toString()
      },
      message: 'Sipariş başarıyla oluşturuldu'
    }, { status: 201 })
    
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
    const { orderId, status, notes, tableNumber, action } = data
    
    // Masa kapatma işlemi
    if (action === 'closeTable' && tableNumber) {
      const updateData = {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      }
      
      if (notes) updateData.adminNotes = notes
      
      const result = await db.collection('orders').updateMany(
        {
          $or: [
            { tableNumber: parseInt(tableNumber) },
            { tableId: tableNumber.toString() }
          ],
          status: { $in: ['pending', 'preparing', 'ready', 'delivered'] }
        },
        { $set: updateData }
      )
      
      return NextResponse.json({
        success: true,
        modifiedCount: result.modifiedCount,
        message: `Masa ${tableNumber} kapatıldı`
      })
    }
    
    // Tekil sipariş güncelleme
    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Sipariş ID ve durum gerekli' },
        { status: 400 }
      )
    }
    
    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz sipariş durumu' },
        { status: 400 }
      )
    }
    
    const updateData = {
      status,
      updatedAt: new Date()
    }
    
    if (notes) updateData.adminNotes = notes
    if (status === 'completed') updateData.completedAt = new Date()
    if (status === 'cancelled') updateData.cancelledAt = new Date()
    
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }
    
    const updatedOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) })
    
    return NextResponse.json({
      success: true,
      order: {
        ...updatedOrder,
        _id: updatedOrder._id.toString()
      },
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