// 共享的图片存储（生产环境应使用数据库或对象存储）
// 注意：这个存储是临时的，服务器重启后会丢失
const imageStore = new Map<string, { data: string; mimeType: string }>()

export function storeImage(id: string, dataUrl: string, mimeType: string) {
  imageStore.set(id, { data: dataUrl, mimeType })
  console.log('图片已存储:', { id, mimeType, storeSize: imageStore.size })
}

export function getImage(
  id: string
): { data: string; mimeType: string } | undefined {
  return imageStore.get(id)
}

export function deleteImage(id: string) {
  imageStore.delete(id)
}
