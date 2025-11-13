'use client'

import React, { useState, useCallback } from 'react'
import { Lightbulb, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface TextInputProps {
  onTextSubmit: (text: string) => void
  maxLength?: number
  placeholder?: string
  examples?: string[]
  className?: string
}

const TextInput: React.FC<TextInputProps> = ({
  onTextSubmit,
  maxLength = 500,
  placeholder = '请输入图片 URL 或 base64 data URL（例如：https://example.com/image.jpg 或 data:image/jpeg;base64,...）',
  examples = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.png',
    'https://example.com/image3.webp'
  ],
  className = ''
}) => {
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showExamples, setShowExamples] = useState(false)

  const handleSubmit = useCallback(() => {
    if (text.trim() && text.length <= maxLength) {
      onTextSubmit(text.trim())
    }
  }, [text, maxLength, onTextSubmit])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleExampleClick = (example: string) => {
    setText(example)
    setShowExamples(false)
  }

  const charCount = text.length
  const isNearLimit = charCount > maxLength * 0.8
  const isOverLimit = charCount > maxLength

  return (
    <div className={clsx('w-full space-y-4', className)}>
      {/* 文本输入区域 */}
      <div className="relative">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            maxLength={maxLength + 50} // 允许稍微超出以显示警告
            className={clsx(
              'w-full min-h-[120px] p-4 border-2 rounded-lg resize-none transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'text-gray-900 placeholder:text-gray-400',
              {
                'border-gray-300 bg-white': !isFocused && !isOverLimit,
                'border-blue-400 bg-white': isFocused && !isOverLimit,
                'border-red-400 bg-red-50': isOverLimit
              }
            )}
          />

          {/* 字符计数器 */}
          <div
            className={clsx('absolute bottom-3 right-3 text-sm', {
              'text-gray-500': !isNearLimit && !isOverLimit,
              'text-orange-500': isNearLimit && !isOverLimit,
              'text-red-500': isOverLimit
            })}
          >
            {charCount}/{maxLength}
          </div>

          {/* 图标 */}
          {/* <div className="absolute top-3 left-3">
            <Type className="w-5 h-5 text-gray-400" />
          </div> */}
        </div>

        {/* 超出限制警告 */}
        {isOverLimit && (
          <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>已超出字符限制 {charCount - maxLength} 个字符</span>
          </div>
        )}
      </div>

      {/* 示例提示词 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm font-medium">
              {showExamples ? '隐藏' : '显示'}示例 URL
            </span>
          </button>
        </div>

        {showExamples && (
          <div className="grid gap-2">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200 group"
              >
                <p className="text-sm text-gray-700 group-hover:text-blue-700">
                  {example}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 输入提示 */}
      <div className="text-xs text-gray-600 space-y-1">
        <p className="font-medium">
          💡 提示：请输入图片 URL 或 base64 data URL
        </p>
        <div className="flex flex-wrap gap-4 text-gray-500">
          <span>✓ 支持 http:// 和 https:// URL</span>
          <span>✓ 支持 base64 data URL（data:image/...）</span>
          <span>✓ 推荐使用 JPG、PNG 格式</span>
        </div>
      </div>
    </div>
  )
}

export default TextInput
