const { MongoClient } = require('mongodb')

const uri = 'mongodb://localhost:27017/restaurant-qr'

const demoMenuItems = [
  // Pizza Kategorisi
  {
    name: 'Margherita Pizza',
    description: 'Taze mozzarella, domates sosu, fesleğen yaprakları',
    price: 45.90,
    category: 'Pizza',
    image: null,
    allergens: ['gluten', 'dairy'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Pepperoni Pizza',
    description: 'Pepperoni dilimi, mozzarella peyniri, domates sosu',
    price: 52.90,
    category: 'Pizza',
    image: null,
    allergens: ['gluten', 'dairy'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Karışık Pizza',
    description: 'Sucuk, sosis, mantar, biber, mozzarella peyniri',
    price: 58.90,
    category: 'Pizza',
    image: null,
    allergens: ['gluten', 'dairy'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Burger Kategorisi
  {
    name: 'Klasik Burger',
    description: 'Beef köfte, marul, domates, soğan, turşu, burger sosu',
    price: 38.90,
    category: 'Burger',
    image: null,
    allergens: ['gluten'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Chicken Burger',
    description: 'Tavuk göğsü, marul, domates, mayonez',
    price: 35.90,
    category: 'Burger',
    image: null,
    allergens: ['gluten'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Double Burger',
    description: 'Çift köfte, çift peynir, özel burger sosu',
    price: 48.90,
    category: 'Burger',
    image: null,
    allergens: ['gluten', 'dairy'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Başlangıçlar
  {
    name: 'Mozarella Stick',
    description: '6 adet çıtır mozarella çubukları',
    price: 28.90,
    category: 'Başlangıçlar',
    image: null,
    allergens: ['gluten', 'dairy'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Soğan Halkası',
    description: 'Çıtır soğan halkaları, ranch sos ile',
    price: 24.90,
    category: 'Başlangıçlar',
    image: null,
    allergens: ['gluten'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // İçecekler
  {
    name: 'Coca Cola',
    description: 'Soğuk coca cola 330ml',
    price: 8.90,
    category: 'İçecekler',
    image: null,
    allergens: [],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Fanta',
    description: 'Soğuk fanta 330ml',
    price: 8.90,
    category: 'İçecekler',
    image: null,
    allergens: [],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Su',
    description: 'Doğal kaynak suyu 500ml',
    price: 4.90,
    category: 'İçecekler',
    image: null,
    allergens: [],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Türk Kahvesi',
    description: 'Geleneksel Türk kahvesi, lokum ile',
    price: 18.90,
    category: 'İçecekler',
    image: null,
    allergens: [],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Tatlılar
  {
    name: 'Tiramisu',
    description: 'Geleneksel İtalyan tatlısı',
    price: 32.90,
    category: 'Tatlılar',
    image: null,
    allergens: ['dairy', 'eggs'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Çikolatalı Sufle',
    description: 'Sıcak çikolatalı sufle, vanilyalı dondurma ile',
    price: 28.90,
    category: 'Tatlılar',
    image: null,
    allergens: ['dairy', 'eggs', 'gluten'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const demoOrders = [
  {
    tableNumber: 5,
    items: [
      {
        menuItemId: 'temp-id-1',
        name: 'Margherita Pizza',
        price: 45.90,
        quantity: 1
      },
      {
        menuItemId: 'temp-id-2',
        name: 'Coca Cola',
        price: 8.90,
        quantity: 2
      }
    ],
    totalAmount: 63.70,
    status: 'preparing',
    customerNotes: 'Az baharatlı olsun',
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 dakika önce
    updatedAt: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    tableNumber: 3,
    items: [
      {
        menuItemId: 'temp-id-3',
        name: 'Klasik Burger',
        price: 38.90,
        quantity: 1
      }
    ],
    totalAmount: 38.90,
    status: 'completed',
    customerNotes: '',
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 dakika önce
    updatedAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    tableNumber: 7,
    items: [
      {
        menuItemId: 'temp-id-4',
        name: 'Pepperoni Pizza',
        price: 52.90,
        quantity: 1
      },
      {
        menuItemId: 'temp-id-5',
        name: 'Tiramisu',
        price: 32.90,
        quantity: 1
      }
    ],
    totalAmount: 85.80,
    status: 'pending',
    customerNotes: 'Tatlıyı sonra getirin',
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 dakika önce
    updatedAt: new Date(Date.now() - 5 * 60 * 1000)
  }
]

async function seedDatabase() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('MongoDB bağlantısı başarılı!')
    
    const db = client.db('restaurant-qr')
    
    // Mevcut verileri temizle
    await db.collection('menu').deleteMany({})
    await db.collection('orders').deleteMany({})
    console.log('Mevcut veriler temizlendi')
    
    // Menü öğelerini ekle
    const menuResult = await db.collection('menu').insertMany(demoMenuItems)
    console.log(`${menuResult.insertedCount} menü öğesi eklendi`)
    
    // Siparişleri ekle
    const ordersResult = await db.collection('orders').insertMany(demoOrders)
    console.log(`${ordersResult.insertedCount} sipariş eklendi`)
    
    console.log('Demo veriler başarıyla eklendi!')
    
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await client.close()
  }
}

// Script'i çalıştır
seedDatabase()