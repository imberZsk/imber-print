import { create } from 'zustand'

export type GenerationStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'generating'
  | 'completed'
  | 'error'
  | 'cancelled'

export interface GenerationTask {
  id: string
  type: 'image' | 'text'
  status: GenerationStatus
  progress: number
  message: string
  estimatedTimeRemaining?: number
  currentStep?: string
  stepProgress?: number
  result?: {
    modelId: string
    modelUrl: string
    thumbnailUrl: string
    metadata: {
      vertices: number
      faces: number
      materials: number
      textures: number
      fileSize: number
    }
  }
  error?: string
  createdAt: Date
}

export interface GenerationOptions {
  style: 'realistic' | 'cartoon' | 'low-poly' | 'abstract'
  quality: 'standard' | 'high' | 'ultra'
  format: 'glb' | 'gltf'
  textureResolution?: '512' | '1024' | '2048'
  generateTexture?: boolean
  preserveColors?: boolean
}

interface AppState {
  // 生成相关状态
  currentTask: GenerationTask | null
  generationOptions: GenerationOptions

  // 输入状态
  selectedFile: File | null
  inputText: string
  activeTab: 'image' | 'text'

  // UI状态
  isGenerating: boolean
  showPreview: boolean

  // 方法
  setCurrentTask: (
    task:
      | GenerationTask
      | null
      | ((prev: GenerationTask | null) => GenerationTask | null)
  ) => void
  updateTaskProgress: (progress: Partial<GenerationTask>) => void
  setGenerationOptions: (options: Partial<GenerationOptions>) => void
  setSelectedFile: (file: File | null) => void
  setInputText: (text: string) => void
  setActiveTab: (tab: 'image' | 'text') => void
  setIsGenerating: (generating: boolean) => void
  setShowPreview: (show: boolean) => void
  resetGeneration: () => void
}

export const useStore = create<AppState>((set, get) => ({
  // 初始状态
  currentTask: null,
  generationOptions: {
    style: 'realistic',
    quality: 'high',
    format: 'glb',
    textureResolution: '1024',
    generateTexture: true,
    preserveColors: true
  },
  selectedFile: null,
  inputText: '',
  activeTab: 'image',
  isGenerating: false,
  showPreview: false,

  // 方法实现
  setCurrentTask: (task) => {
    if (typeof task === 'function') {
      set((state) => ({
        currentTask: task(state.currentTask)
      }))
    } else {
      set({ currentTask: task })
    }
  },

  updateTaskProgress: (progress) => {
    const { currentTask } = get()
    if (currentTask) {
      set({
        currentTask: { ...currentTask, ...progress }
      })
    }
  },

  setGenerationOptions: (options) => {
    const { generationOptions } = get()
    set({
      generationOptions: { ...generationOptions, ...options }
    })
  },

  setSelectedFile: (file) => set({ selectedFile: file }),
  setInputText: (text) => set({ inputText: text }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setShowPreview: (show) => set({ showPreview: show }),

  resetGeneration: () => {
    set({
      currentTask: null,
      selectedFile: null,
      inputText: '',
      isGenerating: false,
      showPreview: false
    })
  }
}))

// 选择器钩子
export const useGenerationStore = () => {
  const store = useStore()
  return {
    currentTask: store.currentTask,
    generationOptions: store.generationOptions,
    setCurrentTask: store.setCurrentTask,
    updateTaskProgress: store.updateTaskProgress,
    setGenerationOptions: store.setGenerationOptions
  }
}

export const useInputStore = () => {
  const store = useStore()
  return {
    selectedFile: store.selectedFile,
    inputText: store.inputText,
    activeTab: store.activeTab,
    setSelectedFile: store.setSelectedFile,
    setInputText: store.setInputText,
    setActiveTab: store.setActiveTab
  }
}

export const useUIStore = () => {
  const store = useStore()
  return {
    isGenerating: store.isGenerating,
    showPreview: store.showPreview,
    setIsGenerating: store.setIsGenerating,
    setShowPreview: store.setShowPreview,
    resetGeneration: store.resetGeneration
  }
}
