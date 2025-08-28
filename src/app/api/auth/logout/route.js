import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı'
    })

    // Clear auth cookie
    response.cookies.delete('admin-session')

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Çıkış yapılırken hata oluştu' },
      { status: 500 }
    )
  }
}