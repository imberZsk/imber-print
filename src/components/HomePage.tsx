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
import ProgressTracker from './ProgressTracker'
import {
  useInputStore,
  useUIStore,
  useGenerationStore,
  GenerationTask,
  GenerationStatus
} from '../store'

// 参数配置组件
const GenerationOptions: React.FC = () => {
  const { generationOptions, setGenerationOptions } = useGenerationStore()
  const [isOpen, setIsOpen] = useState(false)

  const options = [
    {
      key: 'style' as keyof typeof generationOptions,
      label: '风格',
      options: [
        { value: 'realistic', label: '写实' },
        { value: 'cartoon', label: '卡通' },
        { value: 'low-poly', label: '低多边形' },
        { value: 'abstract', label: '抽象' }
      ]
    },
    {
      key: 'quality' as keyof typeof generationOptions,
      label: '质量',
      options: [
        { value: 'standard', label: '标准' },
        { value: 'high', label: '高质量' },
        { value: 'ultra', label: '超高质量' }
      ]
    },
    {
      key: 'format' as keyof typeof generationOptions,
      label: '格式',
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
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">参数设置</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-4 z-10">
          {options.map((option) => (
            <div key={option.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {option.label}
              </label>
              <select
                value={generationOptions[option.key] as string}
                onChange={(e) =>
                  setGenerationOptions({ [option.key]: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {option.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
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
      handleGenerate()
    },
    [setInputText]
  )

  // 处理生成
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return

    setIsGenerating(true)

    // 模拟生成过程
    const taskId = `task_${Date.now()}`
    const newTask: GenerationTask = {
      id: taskId,
      type: activeTab === 'image' ? 'image' : 'text',
      status: 'uploading' as GenerationStatus,
      progress: 0,
      message: '正在准备生成...',
      createdAt: new Date()
    }

    setCurrentTask(newTask)
    setShowPreview(true)

    // 模拟进度更新
    const steps = [
      {
        status: 'uploading' as GenerationStatus,
        progress: 10,
        message: '正在上传文件...',
        delay: 1000
      },
      {
        status: 'processing' as GenerationStatus,
        progress: 30,
        message: '正在处理图像...',
        delay: 2000
      },
      {
        status: 'generating' as GenerationStatus,
        progress: 60,
        message: '正在生成3D模型...',
        delay: 3000
      },
      {
        status: 'generating' as GenerationStatus,
        progress: 90,
        message: '正在优化模型...',
        delay: 2000
      },
      {
        status: 'completed' as GenerationStatus,
        progress: 100,
        message: '生成完成！',
        delay: 1000
      }
    ]

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay))

      setCurrentTask((prev: any) =>
        prev
          ? {
              ...prev,
              status: step.status,
              progress: step.progress,
              message: step.message
            }
          : prev
      )
    }

    // 模拟生成结果
    setCurrentTask((prev: any) =>
      prev
        ? {
            ...prev,
            result: {
              modelId: `model_${Date.now()}`,
              modelUrl:
                'https://threejs.org/examples/models/gltf/Duck/glTF/Duck.gltf',
              thumbnailUrl:
                'https://threejs.org/examples/models/gltf/Duck/glTF/Duck.png',
              metadata: {
                vertices: 1200,
                faces: 600,
                materials: 3,
                textures: 2,
                fileSize: 1024000
              }
            }
          }
        : prev
    )

    setIsGenerating(false)
  }, [activeTab, isGenerating, setIsGenerating, setCurrentTask, setShowPreview])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">3D模型生成器</h1>
            </div>

            <div className="flex items-center space-x-4">
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
              {activeTab === 'image' && (
                <button
                  onClick={handleGenerate}
                  disabled={!selectedFile || isGenerating}
                  className={clsx(
                    'w-full py-4 rounded-lg font-medium text-lg transition-all duration-200 flex items-center justify-center space-x-3',
                    selectedFile && !isGenerating
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
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
              )}
            </div>

            {/* 右侧：3D预览 */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">实时预览</h3>
                <p className="text-sm text-gray-500">
                  上传图片后将显示预览效果
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：进度和控制 */}
            <div className="space-y-6">
              {/* 进度跟踪 */}
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="font-medium text-gray-900 mb-4">生成进度</h3>
                {currentTask && (
                  <ProgressTracker
                    progress={{
                      taskId: currentTask.id,
                      status: currentTask.status,
                      progress: currentTask.progress,
                      message: currentTask.message,
                      currentStep: currentTask.currentStep,
                      stepProgress: currentTask.stepProgress,
                      error: currentTask.error,
                      estimatedTimeRemaining: currentTask.estimatedTimeRemaining
                    }}
                  />
                )}
              </div>

              {/* 模型信息 */}
              {currentTask?.result && (
                <div className="bg-white rounded-lg p-6 border">
                  <h3 className="font-medium text-gray-900 mb-4">模型信息</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">顶点数：</span>
                      <span className="font-medium">
                        {currentTask.result.metadata.vertices.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">面数：</span>
                      <span className="font-medium">
                        {currentTask.result.metadata.faces.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">材质数：</span>
                      <span className="font-medium">
                        {currentTask.result.metadata.materials}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">文件大小：</span>
                      <span className="font-medium">
                        {(
                          currentTask.result.metadata.fileSize /
                          1024 /
                          1024
                        ).toFixed(2)}{' '}
                        MB
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：3D查看器 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 3D场景 */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="h-[500px]">
                  <Scene3D
                    modelUrl={currentTask?.result?.modelUrl}
                    autoRotate={autoRotate}
                    showGrid={showGrid}
                  />
                </div>
              </div>

              {/* 控制面板 */}
              {currentTask?.status === 'completed' && (
                <ViewerControls
                  showGrid={showGrid}
                  setShowGrid={setShowGrid}
                  autoRotate={autoRotate}
                  setAutoRotate={setAutoRotate}
                  onReset={() => {}}
                  onDownload={() => {}}
                  onShare={() => {}}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
