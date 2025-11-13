// 模型输出数据结构
export interface ModelOutput {
  model_glb?: {
    url: string
    content_type?: string
    file_size?: number
  }
  model_glb_pbr?: {
    url: string
    content_type?: string
    file_size?: number
  }
  model_mesh?: {
    url: string
    content_type?: string
    file_size?: number
  }
  seed?: number
}

export interface Hunyuan3DResponse {
  completed_at?: string | null
  created_at?: string
  error?:
    | null
    | string
    | {
        err_code?: number
        message?: string
        message_cn?: string
        message_jp?: string
        type?: string
      }
  id?: string // 可能是 request_id
  request_id?: string // API 实际返回的字段
  model?: string
  output?: string | null | ModelOutput // 支持字符串（旧格式）或对象（新格式）
  started_at?: string | null
  status: string
  queue_position?: number
  logs?: any
  metrics?: any
}

/**
 * 验证并处理图片输入（支持 URL 或 base64 data URL）
 */
function ensureValidImageInput(input: string): string {
  const u = input?.trim()
  if (!u) throw new Error('input_image_url 不能为空')
  
  // 检查是否是 base64 data URL (data:image/...)
  if (u.startsWith('data:image/')) {
    return u
  }
  
  // 检查是否是普通 URL
  let parsed: URL
  try {
    parsed = new URL(u)
  } catch {
    throw new Error('input_image_url 格式不合法，需要是 URL 或 base64 data URL')
  }
  
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error('input_image_url 必须为 http/https URL 或 base64 data URL')
  }
  
  return parsed.toString()
}

function getToken(explicit?: string): string {
  // Next.js 环境变量获取方式
  // 在客户端使用 process.env.NEXT_PUBLIC_* 会自动暴露
  const token = explicit ?? process.env.NEXT_PUBLIC_302_API_KEY

  if (!token) {
    throw new Error(
      '缺少 302 API 密钥 (NEXT_PUBLIC_302_API_KEY)，请在 .env.local 文件中设置'
    )
  }
  return token
}

function normalizeError(err: Hunyuan3DResponse['error']): string | null {
  if (!err) return null
  if (typeof err === 'string') return err
  return err.message || (err as any).error || '未知错误'
}

/**
 * 提交 3D 模型生成任务
 * 现在通过 Next.js API 路由调用，保护 API key
 * 支持 URL 或 base64 data URL
 */
export async function submitHunyuan3D(
  inputImageUrl: string,
  token?: string
): Promise<Hunyuan3DResponse> {
  const validInput = ensureValidImageInput(inputImageUrl)

  // 通过 Next.js API 路由调用，保护 API key
  const resp = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input_image_url: validInput })
  })

  const text = await resp.text()
  let data: Hunyuan3DResponse
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`响应不是有效的JSON: ${text.slice(0, 256)}`)
  }

  if (!resp.ok) {
    const errorData = data as any
    const msg =
      errorData.error || normalizeError(data.error) || `HTTP ${resp.status}`
    throw new Error(msg)
  }

  const errMsg = normalizeError(data.error)
  if (errMsg) throw new Error(errMsg)

  // 调试：打印响应数据
  console.log('submitHunyuan3D 响应:', data)

  // API 返回的是 request_id 而不是 id
  // 统一转换为 id 字段以便后续使用
  if (!data.id) {
    // 优先使用 request_id（API 实际返回的字段）
    const taskId =
      data.request_id ||
      (data as any).task_id ||
      (data as any).taskId ||
      data.id ||
      (data as any).task?.id

    if (taskId) {
      // 如果找到了其他字段名的 ID，更新 data.id
      data.id = taskId
      console.log('使用 request_id 作为任务 ID:', taskId)
    } else {
      console.error('API 响应缺少任务 ID 字段，完整响应:', data)
      throw new Error(`API 响应缺少任务 ID。响应数据：${JSON.stringify(data)}`)
    }
  }

  return data
}

/**
 * 查询任务状态
 * 使用正确的 API 端点：https://api.302.ai/302/submit/hunyuan3d-v21?request_id=<id>
 */
export async function getTaskStatus(
  taskId: string,
  token?: string
): Promise<Hunyuan3DResponse> {
  if (!taskId) {
    throw new Error('任务 ID 不能为空')
  }

  // 通过 Next.js API 路由调用，保护 API key
  const resp = await fetch(`/api/status?request_id=${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const text = await resp.text()
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`响应不是有效的JSON: ${text.slice(0, 256)}`)
  }

  if (!resp.ok) {
    const errorData = data as any
    const msg =
      errorData.error || normalizeError(data.error) || `HTTP ${resp.status}`
    throw new Error(msg)
  }

  // 调试：打印响应数据
  console.log('getTaskStatus 响应:', data)

  // 特殊情况：如果API直接返回了output数据（只有模型信息，没有status/id）
  // 说明任务已完成，需要构造完整的响应对象
  if (
    !data.status &&
    !data.id &&
    !data.request_id &&
    (data.model_glb || data.model_glb_pbr || data.model_mesh)
  ) {
    console.log('检测到API返回的是完成状态的output数据，构造完整响应')
    const normalizedData: Hunyuan3DResponse = {
      id: taskId,
      request_id: taskId,
      status: 'COMPLETED',
      output: data as ModelOutput,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    }
    return normalizedData
  }

  // API 返回的是 request_id 而不是 id
  // 统一转换为 id 字段以便后续使用
  if (!data.id) {
    const taskIdValue =
      data.request_id ||
      (data as any).task_id ||
      (data as any).taskId ||
      data.id ||
      (data as any).task?.id

    if (taskIdValue) {
      data.id = taskIdValue
      console.log('使用 request_id 作为任务 ID:', taskIdValue)
    } else {
      // 如果还是没有id，但任务可能已完成（有output），使用传入的taskId
      if (data.output || data.status === 'COMPLETED' || data.status === 'COMPLETE') {
        console.log('任务已完成但缺少ID，使用传入的taskId:', taskId)
        data.id = taskId
        if (!data.request_id) {
          data.request_id = taskId
        }
      } else {
        console.error('API 响应缺少任务 ID 字段，完整响应:', data)
        throw new Error(`API 响应缺少任务 ID。响应数据：${JSON.stringify(data)}`)
      }
    }
  }

  return data as Hunyuan3DResponse
}

export function buildCurlForHunyuan3D(
  inputImageUrl: string,
  token?: string
): string {
  const validInput = ensureValidImageInput(inputImageUrl)
  const apiToken = getToken(token)
  const payload = JSON.stringify({ input_image_url: validInput }).replace(
    /"/g,
    '\\"'
  )
  return `curl -X POST \
  'https://api.302.ai/302/submit/hunyuan3d-v21' \
  -H 'Authorization: Bearer ${apiToken}' \
  -H 'Content-Type: application/json' \
  -d "${payload}"`
}
