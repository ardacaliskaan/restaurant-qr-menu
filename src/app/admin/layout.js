'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Home, 
  Menu, 
  ShoppingBag, 
  QrCode, 
  LogOut, 
  User,
  Settings,
  ChevronLeft,
  Bell,
  Folder,
  ChefHat,
  Users 
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify')
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Başarıyla çıkış yapıldı')
        router.push('/login')
      }
    } catch (error) {
      toast.error('Çıkış yapılırken hata oluştu')
    }
  }

  const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/categories', label: 'Kategoriler', icon: Folder },
  { href: '/admin/ingredients', label: 'Malzemeler', icon: ChefHat },
  { href: '/admin/menu', label: 'Menü Yönetimi', icon: Menu },
  { href: '/admin/tables', label: 'Masa Yönetimi', icon: Users }, // 👈 BU SATIR EKLENDİ
  { href: '/admin/orders', label: 'Siparişler', icon: ShoppingBag },
  { href: '/admin/qr', label: 'QR Kodlar', icon: QrCode },
]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        {/* Sidebar */}
        <motion.div 
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className={`${sidebarCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 min-h-screen shadow-xl relative z-10`}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200/60">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-sm text-slate-500 mt-1">Restaurant Management</p>
              </motion.div>
            )}
            
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-8 bg-white border border-slate-200 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
            >
              <ChevronLeft className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                        : 'text-slate-700 hover:bg-slate-100 hover:shadow-md'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                    
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="ml-auto w-2 h-2 bg-white rounded-full"
                        initial={false}
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200/60">
            {user && (
              <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                )}
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-600">Sistem Aktif</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Page Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 overflow-auto"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}