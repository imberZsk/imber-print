import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('request_id')

    if (!requestId) {
      return NextResponse.json(
        { error: '缺少 request_id 参数' },
        { status: 400 }
      )
    }

    // 从服务器端环境变量获取 API key
    const apiToken =
      process.env['302_API_KEY'] || process.env.NEXT_PUBLIC_302_API_KEY

    if (!apiToken) {
      return NextResponse.json({ error: '缺少 302 API 密钥' }, { status: 500 })
    }

    // 使用正确的 API 端点查询任务状态
    // https://api.302.ai/302/submit/hunyuan3d-v21?request_id=<id>
    const resp = await fetch(
      `https://api.302.ai/302/submit/hunyuan3d-v21?request_id=${requestId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const text = await resp.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json(
        { error: `API 响应不是有效的JSON: ${text.slice(0, 256)}` },
        { status: 500 }
      )
    }

    if (!resp.ok) {
      const errorMsg =
        typeof data.error === 'string'
          ? data.error
          : data.error?.message || `HTTP ${resp.status}`
      return NextResponse.json({ error: errorMsg }, { status: resp.status })
    }

    // 统一处理 request_id 为 id
    if (!data.id && data.request_id) {
      data.id = data.request_id
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('查询任务状态失败:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '查询任务状态失败'
      },
      { status: 500 }
    )
  }
}
