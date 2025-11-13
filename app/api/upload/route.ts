import { NextRequest, NextResponse } from 'next/server'
import { storeImage } from '../image-store'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
    }

    // 将文件转换为 base64 data URL
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${base64}`

    // 生成唯一 ID
    const imageId = `img_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`

    // 存储图片
    storeImage(imageId, dataUrl, mimeType)

    // 获取基础 URL（确保使用正确的协议和域名）
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || request.nextUrl.host
    const baseUrl = `${protocol}://${host}`
    const imageUrl = `${baseUrl}/api/image/${imageId}`

    console.log('图片上传成功:', { imageId, imageUrl, baseUrl })

    // 返回可访问的 URL
    return NextResponse.json({
      url: imageUrl,
      dataUrl: dataUrl, // 也返回 data URL 作为备用
      id: imageId,
      filename: file.name,
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error('上传错误:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
