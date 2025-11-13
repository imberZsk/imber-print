'use client'

import React, { useState, useCallback } from 'react'
import { Type, Sparkles, Lightbulb, AlertCircle } from 'lucide-react'
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
  placeholder = '描述您想要生成的3D模型...',
  examples = [
    '一个未来风格的机器人，银色金属外壳，蓝色LED眼睛',
    '可爱的小猫咪，橘色毛发，绿色眼睛，坐在垫子上',
    '中世纪城堡，石头建筑，高耸的塔楼，护城河环绕',
    '现代跑车，流线型设计，红色车身，黑色轮胎',
    '古老的橡树，粗壮的树干，茂密的树冠，阳光透过树叶'
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
              {
                'border-gray-300': !isFocused && !isOverLimit,
                'border-blue-400': isFocused && !isOverLimit,
                'border-red-400': isOverLimit,
                'bg-red-50': isOverLimit
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
          <div className="absolute top-3 left-3">
            <Type className="w-5 h-5 text-gray-400" />
          </div>
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
              {showExamples ? '隐藏' : '显示'}示例提示词
            </span>
          </button>

          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Sparkles className="w-3 h-3" />
            <span>Ctrl+Enter 快速提交</span>
          </div>
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

      {/* 提交按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isOverLimit}
          className={clsx(
            'px-6 py-2 rounded-lg font-medium transition-all duration-200',
            'flex items-center space-x-2',
            {
              'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg':
                text.trim() && !isOverLimit,
              'bg-gray-300 text-gray-500 cursor-not-allowed':
                !text.trim() || isOverLimit,
              'hover:scale-105': text.trim() && !isOverLimit
            }
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>生成3D模型</span>
        </button>
      </div>

      {/* 输入提示 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 提示：详细描述可以获得更好的生成效果</p>
        <div className="flex flex-wrap gap-4">
          <span>✓ 包含材质描述（金属、木质、玻璃等）</span>
          <span>✓ 说明颜色和纹理</span>
          <span>✓ 描述形状和大小</span>
          <span>✓ 添加风格关键词（现代、古典、科幻等）</span>
        </div>
      </div>
    </div>
  )
}

export default TextInput
