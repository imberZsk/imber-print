'use client'

import React, { useState, useCallback } from 'react'
import {
  Box,
  Sparkles,
  Image as ImageIcon,
  Type,
  Settings,
  Download,
  Share2,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react'
import { clsx } from 'clsx'

import Scene3D from './Scene3D'
import FileUpload from './FileUpload'
import TextInput from './TextInput'
import {
  useInputStore,
  useUIStore,
  useGenerationStore,
  GenerationTask,
  GenerationStatus
} from '../store'
import {
  submitHunyuan3D,
  getTaskStatus,
  type Hunyuan3DResponse
} from '../api/three02'

// 自定义下拉选择组件
const CustomSelect: React.FC<{
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}> = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 flex items-center justify-between"
      >
        <span className="text-left">{selectedOption?.label || '请选择'}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={clsx(
                  'w-full px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors',
                  opt.value === value
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// 参数配置组件
const GenerationOptions: React.FC = () => {
  const { generationOptions, setGenerationOptions } = useGenerationStore()
  const [isOpen, setIsOpen] = useState(false)

  const options = [
    {
      key: 'style' as keyof typeof generationOptions,
      label: '生成风格',
      description: '选择3D模型的生成风格',
      options: [
        { value: 'realistic', label: '写实风格' },
        { value: 'cartoon', label: '卡通风格' },
        { value: 'low-poly', label: '低多边形' },
        { value: 'abstract', label: '抽象风格' }
      ]
    },
    {
      key: 'quality' as keyof typeof generationOptions,
      label: '生成质量',
      description: '控制模型的细节和精度',
      options: [
        { value: 'standard', label: '标准质量' },
        { value: 'high', label: '高质量' },
        { value: 'ultra', label: '超高质量' }
      ]
    },
    {
      key: 'format' as keyof typeof generationOptions,
      label: '输出格式',
      description: '选择模型的文件格式',
      options: [
        { value: 'glb', label: 'GLB (推荐)' },
        { value: 'gltf', label: 'GLTF' }
      ]
    }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 hover:border-blue-400 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Settings className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">参数设置</span>
      </button>

      {isOpen && (
        <>
          {/* 点击外部关闭 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-5 space-y-5 z-20">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-gray-900">
                生成参数
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <div className="space-y-5">
              {options.map((option) => (
                <div key={option.key} className="space-y-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      {option.label}
                    </label>
                    {option.description && (
                      <p className="text-xs text-gray-500 mb-2">
                        {option.description}
                      </p>
                    )}
                  </div>
                  <CustomSelect
                    value={generationOptions[option.key] as string}
                    options={option.options}
                    onChange={(value) =>
                      setGenerationOptions({ [option.key]: value })
                    }
                  />
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                💡 提示：这些参数将在后续版本中生效
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// 3D查看器控制面板
const ViewerControls: React.FC<{
  showGrid: boolean
  setShowGrid: (show: boolean) => void
  autoRotate: boolean
  setAutoRotate: (rotate: boolean) => void
  onReset: () => void
  onDownload: () => void
  onShare: () => void
}> = ({
  showGrid,
  setShowGrid,
  autoRotate,
  setAutoRotate,
  onReset,
  onDownload,
  onShare
}) => {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-white rounded-lg border">
      <button
        onClick={() => setShowGrid(!showGrid)}
        className={clsx(
          'px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2',
          showGrid
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        <Box className="w-4 h-4" />
        <span>网格</span>
      </button>

      <button
        onClick={() => setAutoRotate(!autoRotate)}
        className={clsx(
          'px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2',
          autoRotate
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        <RotateCcw className="w-4 h-4" />
        <span>自动旋转</span>
      </button>

      <button
        onClick={onReset}
        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
      >
        重置视角
      </button>

      <div className="flex-1" />

      <button
        onClick={onDownload}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
      >
        <Download className="w-4 h-4" />
        <span>下载</span>
      </button>

      <button
        onClick={onShare}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
      >
        <Share2 className="w-4 h-4" />
        <span>分享</span>
      </button>
    </div>
  )
}

const HomePage: React.FC = () => {
  const {
    selectedFile,
    inputText,
    activeTab,
    setSelectedFile,
    setInputText,
    setActiveTab
  } = useInputStore()
  const { isGenerating, showPreview, setIsGenerating, setShowPreview } =
    useUIStore()
  const { currentTask, setCurrentTask } = useGenerationStore()

  const [showGrid, setShowGrid] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)

  // 处理文件上传
  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file)
    },
    [setSelectedFile]
  )

  // 处理文本输入
  const handleTextSubmit = useCallback(
    (text: string) => {
      setInputText(text)
    },
    [setInputText]
  )

  // 上传图片并获取 base64 data URL
  const uploadImage = useCallback(async (file: File): Promise<string> => {
    // 直接转换为 base64 data URL，不需要上传到服务器
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        if (dataUrl) {
          resolve(dataUrl)
        } else {
          reject(new Error('图片读取失败'))
        }
      }
      reader.onerror = () => {
        reject(new Error('图片读取失败'))
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // 将 API 状态映射到本地状态（移到 pollTaskStatus 之前，避免初始化顺序问题）
  const mapApiStatusToLocalStatus = useCallback(
    (apiStatus: string): GenerationStatus => {
      if (!apiStatus) return 'processing'

      const statusUpper = apiStatus.toUpperCase()
      const statusMap: Record<string, GenerationStatus> = {
        // API 实际返回的状态
        IN_QUEUE: 'uploading',
        QUEUED: 'uploading',
        PENDING: 'uploading',
        PROCESSING: 'processing',
        GENERATING: 'generating',
        COMPLETED: 'completed',
        COMPLETE: 'completed',
        FAILED: 'error',
        ERROR: 'error',
        // 兼容小写状态
        pending: 'uploading',
        processing: 'processing',
        generating: 'generating',
        completed: 'completed',
        failed: 'error'
      }
      return statusMap[statusUpper] || statusMap[apiStatus] || 'processing'
    },
    []
  )

  // 计算进度
  const calculateProgress = useCallback(
    (status: Hunyuan3DResponse, elapsedSeconds?: number): number => {
      // 安全检查：确保 status.status 存在
      if (!status || !status.status) {
        return 0
      }

      const statusUpper = status.status.toUpperCase()
      if (statusUpper === 'COMPLETED' || statusUpper === 'COMPLETE') return 100
      if (statusUpper === 'FAILED' || statusUpper === 'ERROR') return 0

      // 如果在队列中
      if (
        statusUpper === 'IN_QUEUE' ||
        statusUpper === 'QUEUED' ||
        statusUpper === 'PENDING'
      ) {
        // 如果队列位置大于 0，根据队列位置显示进度
        if (status.queue_position !== undefined && status.queue_position > 0) {
          // 队列中：5-15% 的进度，根据队列位置调整
          const baseProgress = Math.max(5, 15 - status.queue_position * 2)
          // 根据已等待时间增加进度（每等待30秒增加1%，最多到20%）
          if (elapsedSeconds) {
            const timeBonus = Math.min(5, Math.floor(elapsedSeconds / 30))
            return Math.min(20, baseProgress + timeBonus)
          }
          return baseProgress
        }
        // 队列位置为 0 或未提供，可能是刚提交或正在处理
        // 根据已等待时间显示进度（每等待30秒增加1%，最多到25%）
        if (elapsedSeconds) {
          const timeProgress = Math.min(
            25,
            10 + Math.floor(elapsedSeconds / 30)
          )
          return timeProgress
        }
        return 10
      }

      // 处理中状态
      if (statusUpper === 'PROCESSING') {
        // 根据已等待时间显示进度（30-50%）
        if (elapsedSeconds) {
          const timeProgress = Math.min(
            50,
            30 + Math.floor(elapsedSeconds / 10)
          )
          return timeProgress
        }
        return 30
      }

      // 生成中状态
      if (statusUpper === 'GENERATING') {
        // 根据已等待时间显示进度（60-90%）
        if (elapsedSeconds) {
          const timeProgress = Math.min(
            90,
            60 + Math.floor(elapsedSeconds / 10)
          )
          return timeProgress
        }
        return 60
      }

      // 兼容小写
      if (status.status === 'completed') return 100
      if (status.status === 'failed') return 0
      if (status.status === 'pending') return 10
      if (status.status === 'processing') return 30
      if (status.status === 'generating') return 60
      return 50
    },
    []
  )

  // 获取状态消息
  const getStatusMessage = useCallback(
    (status: string, queuePosition?: number): string => {
      if (!status) return '处理中...'

      const statusUpper = status.toUpperCase()

      // 如果在队列中
      if (statusUpper === 'IN_QUEUE' || statusUpper === 'QUEUED') {
        if (queuePosition !== undefined && queuePosition > 0) {
          return `任务已提交，排队中...（队列位置：${queuePosition}）`
        }
        // 队列位置为 0 或未提供，可能是正在处理或即将处理
        return '任务已提交，等待处理中...'
      }

      const messages: Record<string, string> = {
        // API 实际返回的状态
        PENDING: '任务已提交，等待处理...',
        PROCESSING: '正在处理图像...',
        GENERATING: '正在生成3D模型...',
        COMPLETED: '生成完成！',
        COMPLETE: '生成完成！',
        FAILED: '生成失败',
        ERROR: '生成失败',
        // 兼容小写状态
        pending: '任务已提交，等待处理...',
        processing: '正在处理图像...',
        generating: '正在生成3D模型...',
        completed: '生成完成！',
        failed: '生成失败'
      }
      return messages[statusUpper] || messages[status] || '处理中...'
    },
    []
  )

  // 轮询任务状态
  const pollTaskStatus = useCallback(
    async (taskId: string, maxAttempts = 600) => {
      // 增加最大尝试次数，因为任务可能需要很长时间（600次 * 3秒 = 30分钟）
      let attempts = 0
      const pollInterval = 3000 // 3秒轮询一次，减少服务器压力
      const taskStartTime = Date.now() // 记录任务开始时间，用于计算已等待时间

      while (attempts < maxAttempts) {
        try {
          const status = await getTaskStatus(taskId)

          // 安全检查：确保 status 和 status.status 存在
          if (!status) {
            console.warn('任务状态响应为空，继续轮询...')
            attempts++
            await new Promise((resolve) => setTimeout(resolve, pollInterval))
            continue
          }

          const currentStatus = status.status || 'UNKNOWN'
          const elapsedSeconds = Math.floor((Date.now() - taskStartTime) / 1000)

          // 更新任务状态
          setCurrentTask((prev: any) =>
            prev
              ? {
                  ...prev,
                  status: mapApiStatusToLocalStatus(currentStatus),
                  progress: calculateProgress(status, elapsedSeconds),
                  message: getStatusMessage(
                    currentStatus,
                    status.queue_position
                  ),
                  error: status.error
                    ? typeof status.error === 'string'
                      ? status.error
                      : (status.error as any).message || '生成失败'
                    : undefined
                }
              : prev
          )

          // 如果任务完成或失败，停止轮询
          const statusUpper = currentStatus.toUpperCase()
          if (
            statusUpper === 'COMPLETED' ||
            statusUpper === 'COMPLETE' ||
            statusUpper === 'FAILED' ||
            statusUpper === 'ERROR'
          ) {
            if (statusUpper === 'COMPLETED' || statusUpper === 'COMPLETE') {
              // 从 output 中提取模型 URL
              let modelUrl: string | null = null
              let fileSize = 0

              if (status.output) {
                if (typeof status.output === 'string') {
                  // 兼容旧格式（字符串 URL）
                  modelUrl = status.output
                } else if (
                  typeof status.output === 'object' &&
                  status.output !== null
                ) {
                  // 新格式（对象）
                  const output = status.output as any
                  // 优先使用 PBR 材质模型（更高质量），如果没有则使用普通 GLB
                  if (output.model_glb_pbr?.url) {
                    modelUrl = output.model_glb_pbr.url
                    fileSize = output.model_glb_pbr.file_size || 0
                  } else if (output.model_glb?.url) {
                    modelUrl = output.model_glb.url
                    fileSize = output.model_glb.file_size || 0
                  }
                }
              }

              // 如果有模型 URL，更新结果
              if (modelUrl) {
                setCurrentTask((prev: any) =>
                  prev
                    ? {
                        ...prev,
                        result: {
                          modelId: status.id || taskId,
                          modelUrl: modelUrl,
                          thumbnailUrl: modelUrl, // 使用模型 URL 作为缩略图
                          metadata: {
                            vertices: 0,
                            faces: 0,
                            materials: 0,
                            textures: 0,
                            fileSize: fileSize
                          }
                        }
                      }
                    : prev
                )
              }
            }
            break
          }

          attempts++
          await new Promise((resolve) => setTimeout(resolve, pollInterval))
        } catch (error) {
          console.error('轮询任务状态失败:', error)
          
          // 更新错误信息到UI，但不停止轮询
          setCurrentTask((prev: any) =>
            prev
              ? {
                  ...prev,
                  error: error instanceof Error ? error.message : '查询任务状态失败',
                  message: '查询状态时出错，正在重试...'
                }
              : prev
          )
          
          // 不要立即停止轮询，可能是临时网络错误
          // 连续失败3次才停止
          const consecutiveFailures = (error as any).consecutiveFailures || 0
          if (consecutiveFailures >= 3) {
            setCurrentTask((prev: any) =>
              prev
                ? {
                    ...prev,
                    status: 'error' as GenerationStatus,
                    error:
                      error instanceof Error
                        ? error.message
                        : '查询任务状态失败，请稍后重试'
                  }
                : prev
            )
            break
          }
          // 记录连续失败次数
          ;(error as any).consecutiveFailures = consecutiveFailures + 1

          // 等待后继续尝试
          attempts++
          await new Promise((resolve) => setTimeout(resolve, pollInterval))
        }
      }

      if (attempts >= maxAttempts) {
        setCurrentTask((prev: any) =>
          prev
            ? {
                ...prev,
                status: 'error' as GenerationStatus,
                error: '任务查询超时，请稍后手动查询任务状态'
              }
            : prev
        )
      }
    },
    [
      setCurrentTask,
      mapApiStatusToLocalStatus,
      calculateProgress,
      getStatusMessage
    ]
  )

  // 处理生成
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return

    try {
      setIsGenerating(true)
      setShowPreview(true)

      let imageUrl: string

      // 处理图片上传
      if (activeTab === 'image') {
        if (!selectedFile) {
          throw new Error('请先选择图片')
        }

        // 创建初始任务
        const initialTask: GenerationTask = {
          id: `task_${Date.now()}`,
          type: 'image',
          status: 'uploading',
          progress: 0,
          message: '正在上传图片...',
          createdAt: new Date()
        }
        setCurrentTask(initialTask)

        // 上传图片，直接获取 base64 data URL
        imageUrl = await uploadImage(selectedFile)

        // 现在直接使用 base64 data URL
        console.log(
          '使用 base64 data URL 提交:',
          imageUrl.substring(0, 50) + '...'
        )
      } else {
        // 文本输入场景
        if (!inputText || !inputText.trim()) {
          throw new Error('请输入图片 URL 或 base64 data URL')
        }

        // 创建初始任务
        const initialTask: GenerationTask = {
          id: `task_${Date.now()}`,
          type: 'text',
          status: 'processing',
          progress: 10,
          message: '正在验证图片输入...',
          createdAt: new Date()
        }
        setCurrentTask(initialTask)

        // 检查输入是否是 URL 或 base64 data URL
        const trimmedText = inputText.trim()
        const isUrl = /^https?:\/\//.test(trimmedText)
        const isDataUrl = /^data:image\//.test(trimmedText)

        if (isUrl || isDataUrl) {
          // 如果输入的是 URL 或 base64 data URL，直接使用
          imageUrl = trimmedText
        } else {
          // 如果不是 URL 或 base64，提示用户
          throw new Error(
            '请输入有效的图片 URL（以 http:// 或 https:// 开头）或 base64 data URL（以 data:image/ 开头）'
          )
        }
      }

      // 更新任务状态
      setCurrentTask((prev: any) =>
        prev
          ? {
              ...prev,
              status: 'processing',
              progress: 20,
              message: '正在提交生成任务...'
            }
          : prev
      )

      // 提交生成任务
      const response = await submitHunyuan3D(imageUrl)

      // 检查响应中是否有 id
      if (!response || !response.id) {
        console.error('API 响应数据:', response)
        throw new Error(
          `API 返回数据异常：缺少任务 ID。响应数据：${JSON.stringify(response)}`
        )
      }

      // 更新任务 ID
      const currentStatus = response.status || 'IN_QUEUE'
      setCurrentTask((prev: any) =>
        prev
          ? {
              ...prev,
              id: response.id,
              status: mapApiStatusToLocalStatus(currentStatus),
              progress: calculateProgress(response),
              message: getStatusMessage(currentStatus, response.queue_position)
            }
          : prev
      )

      // 开始轮询任务状态（异步执行，不阻塞）
      pollTaskStatus(response.id).catch((error) => {
        console.error('轮询任务状态出错:', error)
      })
    } catch (error) {
      console.error('生成失败:', error)
      setCurrentTask((prev: any) =>
        prev
          ? {
              ...prev,
              status: 'error',
              error: error instanceof Error ? error.message : '生成失败',
              progress: 0
            }
          : prev
      )
    } finally {
      setIsGenerating(false)
    }
  }, [
    activeTab,
    isGenerating,
    selectedFile,
    inputText,
    setIsGenerating,
    setCurrentTask,
    setShowPreview,
    uploadImage,
    pollTaskStatus,
    mapApiStatusToLocalStatus,
    calculateProgress,
    getStatusMessage
  ])

  // 重置生成
  const handleReset = useCallback(() => {
    setSelectedFile(null)
    setInputText('')
    setCurrentTask(null)
    setShowPreview(false)
    setIsGenerating(false)
  }, [
    setSelectedFile,
    setInputText,
    setCurrentTask,
    setShowPreview,
    setIsGenerating
  ])

  // 模拟任务（用于测试）
  const simulateTask = useCallback(async () => {
    const taskId = '72e552bd-8582-4a50-94d2-9e1134a9cc85'
    const taskStartTime = Date.now()

    // 创建初始任务
    const initialTask: GenerationTask = {
      id: taskId,
      type: 'image',
      status: 'uploading',
      progress: 5,
      message: '任务已提交，排队中...',
      createdAt: new Date()
    }
    setCurrentTask(initialTask)
    setIsGenerating(true)

    // 模拟状态变化序列
    const statusSequence = [
      {
        status: 'IN_QUEUE',
        queuePosition: 3,
        progress: 8,
        message: '任务已提交，排队中...（队列位置：3）',
        delay: 2000
      },
      {
        status: 'IN_QUEUE',
        queuePosition: 2,
        progress: 10,
        message: '任务已提交，排队中...（队列位置：2）',
        delay: 2000
      },
      {
        status: 'IN_QUEUE',
        queuePosition: 1,
        progress: 12,
        message: '任务已提交，排队中...（队列位置：1）',
        delay: 2000
      },
      {
        status: 'IN_QUEUE',
        queuePosition: 0,
        progress: 15,
        message: '任务已提交，等待处理中...',
        delay: 2000
      },
      {
        status: 'PROCESSING',
        queuePosition: undefined,
        progress: 35,
        message: '正在处理图像...',
        delay: 3000
      },
      {
        status: 'GENERATING',
        queuePosition: undefined,
        progress: 65,
        message: '正在生成3D模型...',
        delay: 4000
      },
      {
        status: 'COMPLETED',
        queuePosition: undefined,
        progress: 100,
        message: '生成完成！',
        delay: 1000
      }
    ]

    for (const step of statusSequence) {
      await new Promise((resolve) => setTimeout(resolve, step.delay))

      const elapsedSeconds = Math.floor((Date.now() - taskStartTime) / 1000)

      // 模拟 API 响应
      const mockStatus: Hunyuan3DResponse = {
        id: taskId,
        request_id: taskId,
        status: step.status,
        queue_position: step.queuePosition,
        created_at: new Date().toISOString(),
        output:
          step.status === 'COMPLETED'
            ? {
                model_glb: {
                  url: 'https://file.302.ai/gpt/imgs/20251113/baebcdbccd6f04618ea495f442a8db67.glb',
                  content_type: 'application/octet-stream',
                  file_size: 1189132
                },
                model_glb_pbr: {
                  url: 'https://file.302.ai/gpt/imgs/20251113/f40735a1ed1a223b37a90b0b0823d8db.glb',
                  content_type: 'application/octet-stream',
                  file_size: 4521104
                },
                model_mesh: {
                  url: 'https://file.302.ai/gpt/imgs/20251113/7b0f4a83166944571540c46fcc189e4b.zip',
                  content_type: 'application/octet-stream',
                  file_size: 10201797
                },
                seed: 885440
              }
            : null
      }

      const currentStatus = mockStatus.status || 'UNKNOWN'
      const calculatedProgress = calculateProgress(mockStatus, elapsedSeconds)
      const statusMessage = getStatusMessage(
        currentStatus,
        mockStatus.queue_position
      )

      setCurrentTask((prev: any) =>
        prev
          ? {
              ...prev,
              status: mapApiStatusToLocalStatus(currentStatus),
              progress: calculatedProgress,
              message: statusMessage
            }
          : prev
      )

      // 如果是完成状态，设置结果
      if (step.status === 'COMPLETED' && mockStatus.output) {
        const output = mockStatus.output as any
        let modelUrl: string | null = null
        let fileSize = 0

        if (output.model_glb_pbr?.url) {
          modelUrl = output.model_glb_pbr.url
          fileSize = output.model_glb_pbr.file_size || 0
        } else if (output.model_glb?.url) {
          modelUrl = output.model_glb.url
          fileSize = output.model_glb.file_size || 0
        }

        if (modelUrl) {
          setCurrentTask((prev: any) =>
            prev
              ? {
                  ...prev,
                  result: {
                    modelId: taskId,
                    modelUrl: modelUrl,
                    thumbnailUrl: modelUrl,
                    metadata: {
                      vertices: 0,
                      faces: 0,
                      materials: 0,
                      textures: 0,
                      fileSize: fileSize
                    }
                  }
                }
              : prev
          )
        }
      }
    }

    setIsGenerating(false)
  }, [
    setCurrentTask,
    setIsGenerating,
    mapApiStatusToLocalStatus,
    calculateProgress,
    getStatusMessage
  ])

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-linear-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">3D模型生成器</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* 测试按钮 - 模拟任务 */}
              <button
                onClick={simulateTask}
                disabled={isGenerating}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="模拟任务流程（使用请求ID: 72e552bd-8582-4a50-94d2-9e1134a9cc85）"
              >
                测试模拟
              </button>
              <GenerationOptions />
              {showPreview && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  重新开始
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showPreview ? (
          /* 输入阶段 */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：输入区域 */}
            <div className="space-y-6">
              {/* 标签切换 */}
              <div className="flex bg-white rounded-lg p-1 border">
                <button
                  onClick={() => setActiveTab('image')}
                  className={clsx(
                    'flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all duration-200',
                    activeTab === 'image'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  )}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>图片生成</span>
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={clsx(
                    'flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all duration-200',
                    activeTab === 'text'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  )}
                >
                  <Type className="w-5 h-5" />
                  <span>文本生成</span>
                </button>
              </div>

              {/* 输入内容 */}
              <div className="bg-white rounded-lg p-6 border">
                {activeTab === 'image' ? (
                  <FileUpload onFileSelect={handleFileSelect} />
                ) : (
                  <TextInput onTextSubmit={handleTextSubmit} />
                )}
              </div>

              {/* 生成按钮 */}
              <button
                onClick={handleGenerate}
                disabled={
                  (activeTab === 'image' && !selectedFile) ||
                  (activeTab === 'text' && !inputText?.trim()) ||
                  isGenerating
                }
                className={clsx(
                  'w-full py-4 rounded-lg font-medium text-lg transition-all duration-200 flex items-center justify-center space-x-3',
                  ((activeTab === 'image' && selectedFile) ||
                    (activeTab === 'text' && inputText?.trim())) &&
                    !isGenerating
                    ? 'bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>开始生成3D模型</span>
                  </>
                )}
              </button>

              {/* 任务进度显示 */}
              {currentTask && (
                <div className="bg-white rounded-lg p-6 border">
                  <h3 className="font-medium text-gray-900 mb-4">生成进度</h3>
                  <div className="space-y-4">
                    {/* 状态信息 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">状态：</span>
                      <span className="text-sm font-medium text-gray-900">
                        {currentTask.message || '处理中...'}
                      </span>
                    </div>

                    {/* 进度条 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>进度</span>
                        <span>{currentTask.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={clsx(
                            'h-full transition-all duration-500 ease-out',
                            currentTask.status === 'completed'
                              ? 'bg-green-500'
                              : currentTask.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          )}
                          style={{ width: `${currentTask.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* 任务ID */}
                    {currentTask.id && (
                      <div className="text-xs text-gray-500">
                        任务ID: {currentTask.id}
                      </div>
                    )}

                    {/* 错误信息 */}
                    {currentTask.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                        {currentTask.error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：3D预览 */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">实时预览</h3>
                <p className="text-sm text-gray-500">
                  {currentTask?.result?.modelUrl
                    ? '3D模型预览'
                    : '上传图片后将显示预览效果'}
                </p>
              </div>
              <div className="h-96">
                <Scene3D
                  modelUrl={currentTask?.result?.modelUrl}
                  showGrid={showGrid}
                  className="rounded-b-lg"
                />
              </div>
            </div>
          </div>
        ) : (
          /* 预览阶段 */
          <></>
          // <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          //   {/* 左侧：进度和控制 */}
          //   <div className="space-y-6">
          //     {/* 进度跟踪 */}
          //     <div className="bg-white rounded-lg p-6 border">
          //       <h3 className="font-medium text-gray-900 mb-4">生成进度</h3>
          //       {currentTask && (
          //         <ProgressTracker
          //           progress={{
          //             taskId: currentTask.id,
          //             status: currentTask.status,
          //             progress: currentTask.progress,
          //             message: currentTask.message,
          //             currentStep: currentTask.currentStep,
          //             stepProgress: currentTask.stepProgress,
          //             error: currentTask.error,
          //             estimatedTimeRemaining: currentTask.estimatedTimeRemaining
          //           }}
          //         />
          //       )}
          //     </div>

          //     {/* 模型信息 */}
          //     {currentTask?.result && (
          //       <div className="bg-white rounded-lg p-6 border">
          //         <h3 className="font-medium text-gray-900 mb-4">模型信息</h3>
          //         <div className="space-y-3 text-sm">
          //           <div className="flex justify-between">
          //             <span className="text-gray-600">顶点数：</span>
          //             <span className="font-medium">
          //               {currentTask.result.metadata.vertices.toLocaleString()}
          //             </span>
          //           </div>
          //           <div className="flex justify-between">
          //             <span className="text-gray-600">面数：</span>
          //             <span className="font-medium">
          //               {currentTask.result.metadata.faces.toLocaleString()}
          //             </span>
          //           </div>
          //           <div className="flex justify-between">
          //             <span className="text-gray-600">材质数：</span>
          //             <span className="font-medium">
          //               {currentTask.result.metadata.materials}
          //             </span>
          //           </div>
          //           <div className="flex justify-between">
          //             <span className="text-gray-600">文件大小：</span>
          //             <span className="font-medium">
          //               {(
          //                 currentTask.result.metadata.fileSize /
          //                 1024 /
          //                 1024
          //               ).toFixed(2)}{' '}
          //               MB
          //             </span>
          //           </div>
          //         </div>
          //       </div>
          //     )}
          //   </div>

          //   {/* 右侧：3D查看器 */}
          //   <div className="lg:col-span-2 space-y-6">
          //     {/* 3D场景 */}
          //     <div className="bg-white rounded-lg border overflow-hidden">
          //       <div className="h-[500px]">
          //         <Scene3D
          //           modelUrl={currentTask?.result?.modelUrl}
          //           autoRotate={autoRotate}
          //           showGrid={showGrid}
          //         />
          //       </div>
          //     </div>

          //     {/* 控制面板 */}
          //     {currentTask?.status === 'completed' && (
          //       <ViewerControls
          //         showGrid={showGrid}
          //         setShowGrid={setShowGrid}
          //         autoRotate={autoRotate}
          //         setAutoRotate={setAutoRotate}
          //         onReset={() => {}}
          //         onDownload={() => {}}
          //         onShare={() => {}}
          //       />
          //     )}
          //   </div>
          // </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
