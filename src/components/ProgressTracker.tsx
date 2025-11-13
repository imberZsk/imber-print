'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  RotateCcw,
  Pause
} from 'lucide-react'
import { clsx } from 'clsx'

export type GenerationStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'generating'
  | 'completed'
  | 'error'
  | 'cancelled'

interface ProgressData {
  taskId?: string
  status: GenerationStatus
  progress: number // 0-100
  message: string
  estimatedTimeRemaining?: number // seconds
  currentStep?: string
  stepProgress?: number
  error?: string
}

interface ProgressTrackerProps {
  progress: ProgressData
  onCancel?: () => void
  onRetry?: () => void
  className?: string
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  onCancel,
  onRetry,
  className = ''
}) => {
  const [elapsedTime, setElapsedTime] = useState(0)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    // 当任务状态变为进行中时，重置开始时间
    if (
      progress.status === 'uploading' ||
      progress.status === 'processing' ||
      progress.status === 'generating'
    ) {
      // 如果任务ID变化，说明是新任务，重置开始时间
      if (progress.taskId) {
        startTimeRef.current = Date.now()
      }
    }
  }, [progress.taskId])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (
      progress.status === 'uploading' ||
      progress.status === 'processing' ||
      progress.status === 'generating'
    ) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } else {
      // 任务完成或失败时，停止计时
      setElapsedTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [progress.status])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'uploading':
      case 'processing':
      case 'generating':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      case 'cancelled':
        return <RotateCcw className="w-6 h-6 text-gray-500" />
      default:
        return <Clock className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (progress.status) {
      case 'idle':
        return '准备就绪'
      case 'uploading':
        return '正在上传文件...'
      case 'processing':
        return '正在处理图像...'
      case 'generating':
        return '正在生成3D模型...'
      case 'completed':
        return '生成完成！'
      case 'error':
        return '生成失败'
      case 'cancelled':
        return '已取消'
      default:
        return '未知状态'
    }
  }

  const getProgressBarColor = () => {
    switch (progress.status) {
      case 'error':
        return 'bg-red-500'
      case 'completed':
        return 'bg-green-500'
      default:
        return 'bg-blue-500'
    }
  }

  const canCancel = () => {
    return ['uploading', 'processing', 'generating'].includes(progress.status)
  }

  const canRetry = () => {
    return progress.status === 'error' || progress.status === 'cancelled'
  }

  return (
    <div className={clsx('w-full space-y-4', className)}>
      {/* 状态指示器 */}
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{getStatusText()}</h3>
          {progress.message && (
            <p className="text-sm text-gray-600 mt-1">{progress.message}</p>
          )}
          {progress.currentStep && (
            <p className="text-xs text-gray-500 mt-1">
              当前步骤: {progress.currentStep}
            </p>
          )}
        </div>

        {/* 时间显示 */}
        {['uploading', 'processing', 'generating'].includes(
          progress.status
        ) && (
          <div className="text-right">
            <div className="text-sm text-gray-500">已用时间</div>
            <div className="text-lg font-mono text-gray-900">
              {formatTime(elapsedTime)}
            </div>
            {progress.estimatedTimeRemaining && (
              <div className="text-xs text-gray-500">
                预计剩余: {formatTime(progress.estimatedTimeRemaining)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 进度条 */}
      {progress.status !== 'idle' && progress.status !== 'error' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>进度</span>
            <span>{progress.progress}%</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all duration-500 ease-out',
                getProgressBarColor()
              )}
              style={{ width: `${progress.progress}%` }}
            />
          </div>

          {/* 步骤进度（如果有） */}
          {progress.stepProgress !== undefined && progress.currentStep && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>当前步骤进度</span>
                <span>{progress.stepProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress.stepProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {progress.status === 'completed' && (
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>3D模型生成成功！</span>
            </span>
          )}
          {progress.status === 'error' && progress.error && (
            <span className="text-red-600">{progress.error}</span>
          )}
        </div>

        <div className="flex space-x-2">
          {canCancel() && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Pause className="w-4 h-4" />
              <span>取消</span>
            </button>
          )}

          {canRetry() && onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重试</span>
            </button>
          )}
        </div>
      </div>

      {/* 状态详细信息（调试用） */}
      {progress.taskId && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <div className="flex justify-between">
            <span>任务ID:</span>
            <span className="font-mono">{progress.taskId}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressTracker
