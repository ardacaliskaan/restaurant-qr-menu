import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - Siparişleri getir (geliştirilmiş)
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
      // Hem tableNumber hem tableId alanlarını kontrol et
      filter.$or = [
        { tableNumber: parseInt(tableNumber) },
        { tableId: tableNumber.toString() }
      ]
    }
    
    // Tarih filtresi
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }
    
    const orders = await db.collection('orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()
    
    // ObjectId'leri string'e çevir ve veri düzenle
    const formattedOrders = orders.map(order => ({
      ...order,
      _id: order._id.toString(),
      // Eski sistemle uyumlu kalması için tableId ekle
      tableId: order.tableId || order.tableNumber?.toString(),
      tableNumber: order.tableNumber || parseInt(order.tableId || '0')
    }))
    
    let response = {
      success: true,
      orders: formattedOrders
    }
    
    // İstatistikleri hesapla (istenirse)
    if (includeStats) {
      const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        totalRevenue: orders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        todayOrders: orders.filter(o => {
          const today = new Date()
          const orderDate = new Date(o.createdAt)
          return orderDate.toDateString() === today.toDateString()
        }).length
      }
      
      const completedOrders = orders.filter(o => o.status === 'completed')
      stats.averageOrderValue = completedOrders.length > 0 
        ? stats.totalRevenue / completedOrders.length 
        : 0
      
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
      tableId: data.tableNumber.toString(), // Hem eski hem yeni sistem için
      items: data.items.map(item => ({
        menuItemId: item.id || item.menuItemId,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
        notes: item.notes || ''
      })),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'pending',
      customerNotes: data.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
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

// PUT - Sipariş durumunu güncelle (geliştirilmiş)
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { orderId, status, notes, tableId, bulkUpdate } = data
    
    // Toplu güncelleme (masa bazlı)
    if (bulkUpdate && tableId) {
      if (!status) {
        return NextResponse.json(
          { success: false, error: 'Durum bilgisi gerekli' },
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
      
      const result = await db.collection('orders').updateMany(
        {
          $or: [
            { tableId: tableId.toString() },
            { tableNumber: parseInt(tableId) }
          ],
          status: { $in: ['pending', 'preparing', 'ready'] }
        },
        { $set: updateData }
      )
      
      return NextResponse.json({
        success: true,
        modifiedCount: result.modifiedCount,
        message: `Masa ${tableId} için ${result.modifiedCount} sipariş güncellendi`
      })
    }
    
    // Tekil sipariş güncelleme
    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Sipariş ID ve durum gerekli' },
        { status: 400 }
      )
    }
    
    // Geçerli durumları kontrol et
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
    
    // Güncellenmiş siparişi döndür
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

// DELETE - Sipariş sil/iptal et
export async function DELETE(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { orderId, reason } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Sipariş ID gerekli' },
        { status: 400 }
      )
    }
    
    // Siparişi kontrol et
    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) })
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }
    
    // Tamamlanan siparişler silinemez
    if (['completed', 'delivered'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Tamamlanan sipariş silinemez' },
        { status: 400 }
      )
    }
    
    // Siparişi iptal et (silme yerine)
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason || 'Admin tarafından iptal edildi',
          updatedAt: new Date()
        }
      }
    )
    
    return NextResponse.json({
      success: true,
      message: 'Sipariş iptal edildi'
    })
    
  } catch (error) {
    console.error('Orders DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş iptal edilemedi' },
      { status: 500 }
    )
  }
}