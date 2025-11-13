import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { input_image_url } = await request.json()

    if (!input_image_url) {
      return NextResponse.json(
        { error: '缺少 input_image_url 参数' },
        { status: 400 }
      )
    }

    // 从服务器端环境变量获取 API key（不暴露给客户端）
    // 优先使用服务器端环境变量，如果没有则使用客户端环境变量
    const apiToken = process.env['302_API_KEY'] || process.env.NEXT_PUBLIC_302_API_KEY

    if (!apiToken) {
      return NextResponse.json(
        { error: '缺少 302 API 密钥，请在 .env.local 文件中设置 302_API_KEY' },
        { status: 500 }
      )
    }

    // 调用 302 API
    const resp = await fetch('https://api.302.ai/302/submit/hunyuan3d-v21', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input_image_url })
    })

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
    console.error('生成任务失败:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : '生成任务失败'
      },
      { status: 500 }
    )
  }
}

