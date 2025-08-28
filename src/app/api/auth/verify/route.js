import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Basit user data (gerçek projede database'den gelecek)
const ADMIN_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@restaurant.com',
    role: 'admin',
    name: 'Restaurant Admin'
  }
]

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('admin-session')?.value

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session bulunamadı' },
        { status: 401 }
      )
    }

    // Basit session validation
    // Gerçek projede database'de session kontrolü yapılacak
    const user = ADMIN_USERS[0] // Geçici olarak admin user döndür

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      }
    })

  } catch (error) {
    console.error('Auth verify error:', error)
    return NextResponse.json(
      { success: false, error: 'Doğrulama hatası' },
      { status: 500 }
    )
  }
}