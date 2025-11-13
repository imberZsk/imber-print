import type { } from 'react'

export interface Hunyuan3DResponse {
  completed_at: string | null
  created_at: string
  error: null | string | { err_code?: number; message?: string; message_cn?: string; message_jp?: string; type?: string }
  id: string
  model: string
  output: unknown
  started_at: string
  status: string
}

function ensureValidUrl(url: string): string {
  const u = url?.trim()
  if (!u) throw new Error('input_image_url 不能为空')
  let parsed: URL
  try {
    parsed = new URL(u)
  } catch {
    throw new Error('input_image_url 格式不合法')
  }
  if (!/^https?:$/.test(parsed.protocol)) throw new Error('input_image_url 必须为 http/https URL')
  return parsed.toString()
}

function getToken(explicit?: string): string {
  const token = explicit ?? (import.meta as any)?.env?.VITE_302_API_TOKEN ?? (import.meta as any)?.env?.VITE_302_API_KEY
  if (!token) throw new Error('缺少 302 API 密钥 (Authorization: Bearer)')
  return token
}

function normalizeError(err: Hunyuan3DResponse['error']): string | null {
  if (!err) return null
  if (typeof err === 'string') return err
  return err.message || (err as any).error || '未知错误'
}

export async function submitHunyuan3D(inputImageUrl: string, token?: string): Promise<Hunyuan3DResponse> {
  const validUrl = ensureValidUrl(inputImageUrl)
  const apiToken = getToken(token)

  const resp = await fetch('https://api.302.ai/302/submit/hunyuan3d-v21', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input_image_url: validUrl }),
  })

  const text = await resp.text()
  let data: Hunyuan3DResponse
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`响应不是有效的JSON: ${text.slice(0, 256)}`)
  }

  if (!resp.ok) {
    const msg = normalizeError(data.error) ?? `HTTP ${resp.status}`
    throw new Error(msg)
  }

  const errMsg = normalizeError(data.error)
  if (errMsg) throw new Error(errMsg)

  return data
}

export function buildCurlForHunyuan3D(inputImageUrl: string, token?: string): string {
  const validUrl = ensureValidUrl(inputImageUrl)
  const apiToken = getToken(token)
  const payload = JSON.stringify({ input_image_url: validUrl }).replace(/"/g, '\\"')
  return `curl -X POST \
  'https://api.302.ai/302/submit/hunyuan3d-v21' \
  -H 'Authorization: Bearer ${apiToken}' \
  -H 'Content-Type: application/json' \
  -d "${payload}"`
}

