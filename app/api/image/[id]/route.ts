import { NextRequest, NextResponse } from 'next/server'
import { getImage } from '../../image-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log('获取图片请求:', id)

    const imageData = getImage(id)

    if (!imageData) {
      console.error('图片不存在:', id)
      return NextResponse.json({ error: '图片不存在' }, { status: 404 })
    }

    console.log('图片找到:', { id, mimeType: imageData.mimeType })

    // 将 base64 数据转换为 Buffer
    const base64Data = imageData.data.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': imageData.mimeType,
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error) {
    console.error('获取图片错误:', error)
    return NextResponse.json({ error: '获取图片失败' }, { status: 500 })
  }
}
