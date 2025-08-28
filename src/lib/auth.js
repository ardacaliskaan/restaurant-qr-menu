import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

// Admin kullanıcıları (gerçek projede database'den gelecek)
const ADMIN_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@restaurant.com',
    password: '$2b$12$RN/WN0a4q26XH1vaYnpCYOdS4rGXpEkfHB6UR31iFET.YBWXhDciC', // "admin123"
    role: 'admin',
    name: 'Restaurant Admin'
  }
]

// Password hash oluştur (development için)
export async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}

// Password doğrula
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

// Kullanıcı authentication
export async function authenticateUser(username, password) {
  const user = ADMIN_USERS.find(u => u.username === username || u.email === username)
  
  if (!user) {
    return { success: false, error: 'Kullanıcı bulunamadı' }
  }

  const isValid = await verifyPassword(password, user.password)
  
  if (!isValid) {
    return { success: false, error: 'Hatalı şifre' }
  }

  // Şifreyi response'tan çıkar
  const { password: _, ...userWithoutPassword } = user
  
  return { success: true, user: userWithoutPassword }
}

// Session oluştur
export function createSession(userId) {
  const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 saat
  
  return {
    sessionId,
    userId,
    expiresAt
  }
}

// Session cookie'sini ayarla
export function setAuthCookie(sessionId) {
  const cookieStore = cookies()
  cookieStore.set('admin-session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 // 24 saat
  })
}

// Session cookie'sini temizle
export function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete('admin-session')
}

// Session doğrula
export function getSession() {
  const cookieStore = cookies()
  const sessionId = cookieStore.get('admin-session')?.value
  
  if (!sessionId) {
    return null
  }

  // Basit session validation (gerçek projede database'de tutulacak)
  // Şimdilik sadece cookie varlığını kontrol ediyoruz
  return {
    sessionId,
    userId: 1, // Geçici olarak admin user
    user: ADMIN_USERS[0]
  }
}

// Admin middleware
export function requireAuth() {
  const session = getSession()
  
  if (!session) {
    return { isAuthenticated: false, user: null }
  }

  const { password: _, ...user } = session.user
  return { isAuthenticated: true, user }
}