'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  FileImage
} from 'lucide-react'
import { clsx } from 'clsx'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  maxSize?: number
  acceptedFormats?: string[]
  className?: string
}

interface ValidationResult {
  isValid: boolean
  error?: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true
  })

  const validateFile = (file: File): ValidationResult => {
    // 检查文件类型
    if (!acceptedFormats.includes(file.type)) {
      return {
        isValid: false,
        error: `不支持的文件格式。请上传 ${acceptedFormats
          .map((format) => format.split('/')[1].toUpperCase())
          .join(', ')} 格式的文件。`
      }
    }

    // 检查文件大小
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
      return {
        isValid: false,
        error: `文件过大。请选择小于 ${maxSizeMB}MB 的文件。`
      }
    }

    return { isValid: true }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setValidation({ isValid: true })

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        let errorMessage = '文件上传失败。'

        if (rejection.errors[0]?.code === 'file-too-large') {
          const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
          errorMessage = `文件过大。请选择小于 ${maxSizeMB}MB 的文件。`
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          errorMessage = `不支持的文件格式。请上传 ${acceptedFormats
            .map((format) => format.split('/')[1].toUpperCase())
            .join(', ')} 格式的文件。`
        }

        setValidation({ isValid: false, error: errorMessage })
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        const validationResult = validateFile(file)

        if (validationResult.isValid) {
          setSelectedFile(file)
          onFileSelect(file)

          // 生成预览
          const reader = new FileReader()
          reader.onload = (e) => {
            setPreview(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        } else {
          setValidation(validationResult)
        }
      }
    },
    [onFileSelect, maxSize, acceptedFormats]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce(
      (acc, format) => ({
        ...acc,
        [format]: []
      }),
      {}
    ),
    maxSize,
    multiple: false
  })

  const removeFile = () => {
    setSelectedFile(null)
    setPreview(null)
    setValidation({ isValid: true })
  }

  return (
    <div className={clsx('w-full', className)}>
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={clsx(
            'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
            {
              'border-blue-400 bg-blue-50': isDragActive,
              'border-gray-300 hover:border-blue-400 hover:bg-gray-50':
                !isDragActive,
              'border-red-300 bg-red-50': !validation.isValid
            }
          )}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center space-y-4">
            {isDragActive ? (
              <FileImage className="w-12 h-12 text-blue-500" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}

            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                {isDragActive
                  ? '释放文件以上传'
                  : '拖拽图片到此处，或点击选择文件'}
              </p>
              <p className="text-sm text-gray-500">
                支持{' '}
                {acceptedFormats
                  .map((format) => format.split('/')[1].toUpperCase())
                  .join(', ')}{' '}
                格式，最大 {(maxSize / (1024 * 1024)).toFixed(0)}MB
              </p>
            </div>
          </div>

          {/* 拖拽时的覆盖层 */}
          {isDragActive && (
            <div className="absolute inset-0 bg-blue-100 bg-opacity-50 rounded-lg flex items-center justify-center">
              <div className="text-blue-700 font-medium">释放文件以上传</div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative border-2 border-green-300 rounded-lg overflow-hidden">
          {/* 预览图片 */}
          {preview && (
            <div className="relative">
              <img
                src={preview}
                alt="预览"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-30" />
            </div>
          )}

          {/* 文件信息 */}
          <div className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {!validation.isValid && validation.error && (
        <div className="mt-3 flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{validation.error}</p>
        </div>
      )}

      {/* 示例图片提示 */}
      {!selectedFile && (
        <div className="mt-4 text-center text-sm text-gray-500">
          <p className="mb-2">
            💡 提示：上传清晰的图片可以获得更好的3D生成效果
          </p>
          <div className="flex justify-center space-x-4 text-xs">
            <span>✓ 推荐使用正面视角</span>
            <span>✓ 光线充足的照片</span>
            <span>✓ 主体突出的构图</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload
