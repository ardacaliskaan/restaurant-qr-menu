import Link from 'next/link'
import { QrCode, Users, Settings } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            QR Menu
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {' '}Pro
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Modern restoran menü sistemi. QR kod ile kolay erişim, anlık sipariş alma.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
            <QrCode className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">QR Menü</h3>
            <p className="text-gray-300">
              Müşteriler QR kod okutarak menüye anında erişebilir
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
            <Users className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Kolay Sipariş</h3>
            <p className="text-gray-300">
              Masadan doğrudan sipariş alma ve anlık bildirim
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
            <Settings className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Kolay Yönetim</h3>
            <p className="text-gray-300">
              Menü ve siparişleri kolayca yönetin
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <Link 
            href="/menu/demo" 
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            Demo Menü Görüntüle
          </Link>
          
          <Link 
            href="/admin" 
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 border border-white/30"
          >
            Yönetim Paneli
          </Link>
        </div>

        {/* Demo QR */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">Demo için QR kod:</p>
          <div className="inline-block bg-white p-4 rounded-xl">
            <div className="w-32 h-32 bg-black flex items-center justify-center text-white font-mono text-xs">
              QR CODE
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}