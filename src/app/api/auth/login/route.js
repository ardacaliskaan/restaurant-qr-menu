import { NextResponse } from 'next/server'
import { authenticateUser, createSession, setAuthCookie } from '@/lib/auth'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    // Input validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      )
    }

    // Authenticate user
    const authResult = await authenticateUser(username.trim(), password)

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Create session
    const session = createSession(authResult.user.id)

    // Set cookie
    const response = NextResponse.json({
      success: true,
      message: 'Başarıyla giriş yapıldı',
      user: authResult.user
    })

    // Set cookie manually since setAuthCookie uses server-side cookies()
    response.cookies.set('admin-session', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 saat
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}