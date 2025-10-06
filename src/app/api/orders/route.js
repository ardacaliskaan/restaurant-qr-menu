import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { 
  validateOrder, 
  createOrder, 
  updateOrder,
  buildOrderFilter,
  buildOrderSort,
  calculateOrderStats,
  getKitchenOrders,
  getOrderTrends,
  getTablePerformance,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  getNextStatuses,
  getOrderDuration
} from '@/lib/models/order'

// GET - Orders listesi (advanced filtering & analytics)
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeStats = searchParams.get('stats') === 'true'
    const kitchenView = searchParams.get('kitchenView') === 'true'
    const analytics = searchParams.get('analytics') === 'true'
    
    // Build filter
    const filter = buildOrderFilter({
      status: searchParams.get('status'),
      statuses: searchParams.get('statuses')?.split(','),
      tableNumber: searchParams.get('tableNumber'),
      tableId: searchParams.get('tableId'),
      orderType: searchParams.get('orderType'),
      priority: searchParams.get('priority'),
      paymentStatus: searchParams.get('paymentStatus'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      today: searchParams.get('today'),
      assignedStaff: searchParams.get('assignedStaff'),
      minAmount: searchParams.get('minAmount'),
      maxAmount: searchParams.get('maxAmount'),
      search: searchParams.get('search')
    })
    
    // Build sort
    const sort = buildOrderSort(sortBy, sortOrder)
    
    console.log('Orders filter:', filter) // Debug
    console.log('Orders sort:', sort) // Debug
    
    // Kitchen view has different logic
    if (kitchenView) {
      const kitchenOrders = await db.collection('orders')
        .find({
          status: { $in: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.PREPARING, ORDER_STATUSES.READY] },
          ...filter
        })
        .sort({ priority: -1, createdAt: 1 })
        .toArray()
      
      const formattedOrders = kitchenOrders.map(order => ({
        ...order,
        id: order._id.toString(),
        _id: undefined,
        duration: getOrderDuration(order)
      }))
      
      return NextResponse.json({
        success: true,
        orders: formattedOrders,
        view: 'kitchen',
        total: formattedOrders.length
      })
    }
    
    // Regular pagination
    const skip = (page - 1) * limit
    
    // Get orders with pagination
    const [orders, totalCount] = await Promise.all([
      db.collection('orders')
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('orders').countDocuments(filter)
    ])
    
    // Format orders
    const formattedOrders = orders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined,
      duration: getOrderDuration(order)
    }))
    
    let response = {
      success: true,
      orders: formattedOrders,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    }
    
    // Include statistics
    if (includeStats) {
      response.statistics = calculateOrderStats(formattedOrders)
    }
    
    // Include analytics
    if (analytics) {
      const allOrders = await db.collection('orders')
        .find({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }) // Last 30 days
        .toArray()
      
      const formattedAllOrders = allOrders.map(order => ({
        ...order,
        id: order._id.toString()
      }))
      
      response.analytics = {
        trends: getOrderTrends(formattedAllOrders, 7),
        tablePerformance: getTablePerformance(formattedAllOrders),
        statusDistribution: calculateOrderStats(formattedAllOrders)
      }
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
    
    console.log('📦 Received order data:', JSON.stringify(data, null, 2)) // Debug
    
    // Validation
    const errors = validateOrder(data)
    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors) // Debug
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Table kontrolü (eğer tableId verilmişse)
    if (data.tableId) {
      // tableId ObjectId formatında mı kontrol et
      let tableQuery = {}
      
      if (data.tableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(data.tableId)) {
        // ObjectId formatında
        tableQuery = { _id: new ObjectId(data.tableId) }
      } else {
        // Masa numarası formatında (string veya number)
        tableQuery = { number: parseInt(data.tableId) }
      }
      
      console.log('Table query:', tableQuery) // Debug
      
      const tableExists = await db.collection('tables')
        .findOne(tableQuery)
      
      console.log('Table exists:', tableExists) // Debug
      
      if (!tableExists) {
        return NextResponse.json(
          { success: false, error: 'Masa bulunamadı' },
          { status: 400 }
        )
      }
    }
    
    // Menu items kontrolü
    const menuItemIds = data.items.map(item => item.menuItemId)
    console.log('🍕 Menu item IDs:', menuItemIds) // Debug
    
    // ObjectId formatını kontrol et
    const validObjectIds = menuItemIds.filter(id => 
      id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)
    )
    
    console.log('✅ Valid ObjectIds:', validObjectIds) // Debug
    
    if (validObjectIds.length !== menuItemIds.length) {
      console.log('❌ Invalid menu item IDs found') // Debug
      return NextResponse.json(
        { success: false, error: 'Geçersiz ürün ID\'leri bulundu' },
        { status: 400 }
      )
    }
    
    const validMenuItems = await db.collection('menu')
      .find({ 
        _id: { $in: validObjectIds.map(id => new ObjectId(id)) },
        available: { $ne: false }
      })
      .toArray()
    
    console.log('🍕 Found menu items:', validMenuItems.length) // Debug
    
    if (validMenuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { success: false, error: 'Bazı ürünler bulunamadı veya müsait değil' },
        { status: 400 }
      )
    }
    
    // Create order
    const order = createOrder(data)
    
    // Estimated time calculation based on items
    let totalEstimatedTime = 0
    data.items.forEach(item => {
      const menuItem = validMenuItems.find(mi => mi._id.toString() === item.menuItemId)
      if (menuItem && menuItem.cookingTime) {
        totalEstimatedTime += menuItem.cookingTime * item.quantity
      }
    })
    
    if (totalEstimatedTime > 0) {
      order.estimatedTime = Math.ceil(totalEstimatedTime / data.items.length) // Average
    }
    
    // Insert order
    const result = await db.collection('orders').insertOne(order)
    
    // Update table status if needed
    if (data.tableId) {
      let tableQuery = {}
      
      if (data.tableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(data.tableId)) {
        // ObjectId formatında
        tableQuery = { _id: new ObjectId(data.tableId) }
      } else {
        // Masa numarası formatında
        tableQuery = { number: parseInt(data.tableId) }
      }
      
      await db.collection('tables').updateOne(
        tableQuery,
        { 
          $set: { 
            status: 'occupied',
            lastOrderAt: new Date()
          }
        }
      )
    }
    
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      orderNumber: order.orderNumber,
      estimatedTime: order.estimatedTime,
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

// PUT - Sipariş güncelle (status, payment, etc.)
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { id, action, ...updateData } = data
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Sipariş ID gerekli' },
        { status: 400 }
      )
    }
    
    // Find existing order
    const existingOrder = await db.collection('orders')
      .findOne({ _id: new ObjectId(id) })
    
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }
    
    let updateFields = {}
    
    // Handle different actions
    switch (action) {
      case 'updateStatus':
        const newStatus = updateData.status
        const allowedNextStatuses = getNextStatuses(existingOrder.status)
        
        if (!allowedNextStatuses.includes(newStatus)) {
          return NextResponse.json(
            { success: false, error: `${existingOrder.status} durumundan ${newStatus} durumuna geçiş yapılamaz` },
            { status: 400 }
          )
        }
        
        updateFields = {
          status: newStatus,
          [`timestamps.${newStatus}`]: new Date(),
          updatedAt: new Date()
        }
        
        // Add staff assignment if provided
        if (updateData.assignedStaff) {
          updateFields.assignedStaff = updateData.assignedStaff
        }
        
        break
        
      case 'updatePayment':
        if (!Object.values(PAYMENT_STATUSES).includes(updateData.paymentStatus)) {
          return NextResponse.json(
            { success: false, error: 'Geçersiz ödeme durumu' },
            { status: 400 }
          )
        }
        
        updateFields = {
          paymentStatus: updateData.paymentStatus,
          updatedAt: new Date()
        }
        
        // If payment is completed, mark order as completed
        if (updateData.paymentStatus === PAYMENT_STATUSES.PAID && 
            existingOrder.status === ORDER_STATUSES.DELIVERED) {
          updateFields.status = ORDER_STATUSES.COMPLETED
          updateFields[`timestamps.${ORDER_STATUSES.COMPLETED}`] = new Date()
        }
        
        break
        
      case 'addNotes':
        updateFields = {
          customerNotes: updateData.customerNotes || existingOrder.customerNotes,
          kitchenNotes: updateData.kitchenNotes || existingOrder.kitchenNotes,
          updatedAt: new Date()
        }
        break
        
      case 'updatePriority':
        updateFields = {
          priority: updateData.priority,
          updatedAt: new Date()
        }
        break
        
      case 'assignStaff':
        updateFields = {
          assignedStaff: updateData.assignedStaff,
          updatedAt: new Date()
        }
        break
        
      default:
        // Full update
        const errors = validateOrder({ ...existingOrder, ...updateData })
        if (errors.length > 0) {
          return NextResponse.json(
            { success: false, errors },
            { status: 400 }
          )
        }
        
        updateFields = updateOrder(updateData)
    }
    
    // Update order
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }
    
    // Handle table status updates
    if (updateFields.status === ORDER_STATUSES.COMPLETED && existingOrder.tableId) {
      // Check if table has any other active orders
      const activeOrdersCount = await db.collection('orders').countDocuments({
        $or: [
          { tableId: existingOrder.tableId },
          { tableNumber: parseInt(existingOrder.tableId) }
        ],
        status: { $nin: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED] }
      })
      
      // If no active orders, mark table as empty
      if (activeOrdersCount === 0) {
        let tableQuery = {}
        
        if (existingOrder.tableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(existingOrder.tableId)) {
          tableQuery = { _id: new ObjectId(existingOrder.tableId) }
        } else {
          tableQuery = { number: parseInt(existingOrder.tableId) }
        }
        
        await db.collection('tables').updateOne(
          tableQuery,
          { $set: { status: 'empty' } }
        )
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sipariş başarıyla güncellendi'
    })
    
  } catch (error) {
    console.error('Orders PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Sipariş iptal et
export async function DELETE(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Sipariş ID gerekli' },
        { status: 400 }
      )
    }
    
    // Find order
    const order = await db.collection('orders')
      .findOne({ _id: new ObjectId(id) })
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }
    
    // Check if order can be cancelled
    const cancellableStatuses = [ORDER_STATUSES.PENDING, ORDER_STATUSES.CONFIRMED]
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Bu durumda olan sipariş iptal edilemez' },
        { status: 400 }
      )
    }
    
    // Update order status to cancelled instead of deleting
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: ORDER_STATUSES.CANCELLED,
          [`timestamps.${ORDER_STATUSES.CANCELLED}`]: new Date(),
          updatedAt: new Date()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sipariş iptal edilemedi' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sipariş başarıyla iptal edildi'
    })
    
  } catch (error) {
    console.error('Orders DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş iptal edilemedi' },
      { status: 500 }
    )
  }
}