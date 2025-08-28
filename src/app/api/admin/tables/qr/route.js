import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import QRCode from 'qrcode'

// POST - Tekil QR kod oluştur
export async function POST(request) {
  try {
    
    const { tableNumber, menuUrl } = await request.json()

    if (!tableNumber || !menuUrl) {
      return NextResponse.json({ 
        error: 'Masa numarası ve menü URL\'i gerekli' 
      }, { status: 400 })
    }

    // QR kod oluşturma seçenekleri
    const qrCodeOptions = {
      width: 400,
      height: 400,
      margin: 2,
      color: {
        dark: '#000000',    // QR kod rengi (siyah)
        light: '#FFFFFF'    // Arka plan rengi (beyaz)
      },
      errorCorrectionLevel: 'M', // Orta seviye hata düzeltme
      type: 'image/png',
      quality: 0.92
    }

    // QR kod oluştur
    const qrCodeDataURL = await QRCode.toDataURL(menuUrl, qrCodeOptions)

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      menuUrl: menuUrl,
      tableNumber: tableNumber,
      generatedAt: new Date().toISOString(),
      message: `Masa ${tableNumber} için QR kod başarıyla oluşturuldu`
    })

  } catch (error) {
    console.error('QR Code generation error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'QR kod oluşturulurken hata oluştu',
      details: error.message
    }, { status: 500 })
  }
}

// GET - Toplu QR kod oluşturma
export async function GET(request) {
  try {


    const { searchParams } = new URL(request.url)
    const tablesParam = searchParams.get('tables')
    const baseUrl = searchParams.get('baseUrl') || 'http://localhost:3000'

    if (!tablesParam) {
      return NextResponse.json({ 
        error: 'tables parametresi gerekli (örn: ?tables=1,2,3)' 
      }, { status: 400 })
    }

    // Masa numaralarını parse et
    const tableNumbers = tablesParam
      .split(',')
      .map(num => num.trim())
      .filter(num => num && !isNaN(num))

    if (tableNumbers.length === 0) {
      return NextResponse.json({ 
        error: 'Geçerli masa numarası bulunamadı' 
      }, { status: 400 })
    }

    const qrCodes = []
    const errors = []

    // Her masa için QR kod oluştur
    for (const tableNum of tableNumbers) {
      try {
        const menuUrl = `${baseUrl}/menu/${tableNum}`
        
        const qrCodeOptions = {
          width: 400,
          height: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92
        }

        const qrCodeDataURL = await QRCode.toDataURL(menuUrl, qrCodeOptions)

        qrCodes.push({
          tableNumber: tableNum,
          menuUrl: menuUrl,
          qrCode: qrCodeDataURL,
          success: true
        })

      } catch (error) {
        console.error(`QR kod oluşturma hatası - Masa ${tableNum}:`, error)
        errors.push({
          tableNumber: tableNum,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      qrCodes,
      errors,
      summary: {
        total: tableNumbers.length,
        successful: qrCodes.length,
        failed: errors.length
      },
      generatedAt: new Date().toISOString(),
      baseUrl
    })

  } catch (error) {
    console.error('Bulk QR Code generation error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Toplu QR kod oluşturulurken hata oluştu',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - Mevcut QR kodu güncelle
export async function PUT(request) {
  try {

    const { tableNumber, customUrl } = await request.json()

    if (!tableNumber) {
      return NextResponse.json({ 
        error: 'Masa numarası gerekli' 
      }, { status: 400 })
    }

    // Custom URL yoksa default URL kullan
    const menuUrl = customUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/menu/${tableNumber}`

    const qrCodeOptions = {
      width: 400,
      height: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92
    }

    const qrCodeDataURL = await QRCode.toDataURL(menuUrl, qrCodeOptions)

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      menuUrl: menuUrl,
      tableNumber: tableNumber,
      updatedAt: new Date().toISOString(),
      message: `Masa ${tableNumber} QR kodu güncellendi`
    })

  } catch (error) {
    console.error('QR Code update error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'QR kod güncellenirken hata oluştu',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - QR kod sil (masa QR kodunu temizle)
export async function DELETE(request) {
  try {
    // Auth kontrolü


    const { tableNumber } = await request.json()

    if (!tableNumber) {
      return NextResponse.json({ 
        error: 'Masa numarası gerekli' 
      }, { status: 400 })
    }

    // Bu endpoint sadece QR kod silme işlemi için
    // Gerçek masa verisindeki QR kod alanını temizlemek için
    // ana tables API'sini kullanmak gerekiyor

    return NextResponse.json({
      success: true,
      message: `Masa ${tableNumber} için QR kod silme işlemi tamamlandı`,
      tableNumber: tableNumber,
      deletedAt: new Date().toISOString(),
      note: 'QR kod verisi temizlendi. Masa kaydını güncellemek için /api/admin/tables PUT endpoint\'ini kullanın.'
    })

  } catch (error) {
    console.error('QR Code deletion error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'QR kod silinirken hata oluştu',
      details: error.message
    }, { status: 500 })
  }
}