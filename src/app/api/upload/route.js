import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request) {
  try {
    // Auth kontrolü
    const cookieStore = await request.cookies
    const sessionId = cookieStore.get('admin-session')?.value
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı' },
        { status: 400 }
      )
    }

    // Dosya validasyonu
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Sadece JPEG, PNG ve WebP dosyaları destekleniyor' },
        { status: 400 }
      )
    }

    // Dosya boyutu kontrolü (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 5MB\'dan büyük olamaz' },
        { status: 400 }
      )
    }

    // Dosyayı buffer'a çevir
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Unique filename oluştur
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = path.extname(file.name) || '.jpg'
    const filename = `menu-${timestamp}-${randomString}${extension}`

    // Upload klasörünü oluştur
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'menu')
    
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Klasör zaten varsa hata verme
      if (error.code !== 'EEXIST') {
        throw error
      }
    }

    // Dosyayı kaydet
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Public URL oluştur
    const imageUrl = `/uploads/menu/${filename}`

    return NextResponse.json({
      success: true,
      image: {
        filename: filename,
        url: imageUrl,
        originalName: file.name,
        size: file.size,
        type: file.type
      },
      message: 'Resim başarıyla yüklendi'
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Resim yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// DELETE - Resim silme
export async function DELETE(request) {
  try {
    // Auth kontrolü
    const cookieStore = await request.cookies
    const sessionId = cookieStore.get('admin-session')?.value
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename gerekli' },
        { status: 400 }
      )
    }

    // Dosya yolunu oluştur
    const filepath = path.join(process.cwd(), 'public', 'uploads', 'menu', filename)

    try {
      const { unlink } = await import('fs/promises')
      await unlink(filepath)
      
      return NextResponse.json({
        success: true,
        message: 'Resim başarıyla silindi'
      })
    } catch (error) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({
          success: true,
          message: 'Dosya zaten mevcut değil'
        })
      }
      throw error
    }

  } catch (error) {
    console.error('Image delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Resim silinirken hata oluştu' },
      { status: 500 }
    )
  }
}