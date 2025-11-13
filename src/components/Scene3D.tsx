'use client'

import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Center, Grid, useGLTF } from '@react-three/drei'
import ErrorBoundary from './ErrorBoundary'
import * as THREE from 'three'

interface Scene3DProps {
  modelUrl?: string
  onModelLoad?: (model: THREE.Object3D) => void
  autoRotate?: boolean
  showGrid?: boolean
  className?: string
}

// 3D模型加载组件
function Model({
  url,
  onLoad
}: {
  url: string
  onLoad?: (model: THREE.Object3D) => void
}) {
  const validatedUrl = useMemo(() => {
    const u = url?.trim()
    if (!u) throw new Error('模型URL不能为空')
    let parsed: URL
    try {
      parsed = new URL(u)
    } catch {
      throw new Error('模型URL格式不合法')
    }
    if (!/^https?:$/.test(parsed.protocol))
      throw new Error('模型URL必须为http/https')
    if (!/[.]glb$|[.]gltf$/i.test(parsed.pathname))
      throw new Error('模型URL需要以.glb或.gltf结尾')
    return parsed.toString()
  }, [url])

  const { scene } = useGLTF(validatedUrl)
  const modelRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (scene && onLoad) {
      onLoad(scene)
    }
  }, [scene, onLoad])

  useFrame((state) => {
    if (modelRef.current) {
      // 可以添加动画效果
      modelRef.current.rotation.y += 0.005
    }
  })

  return (
    <group ref={modelRef}>
      <primitive object={scene} scale={1} />
    </group>
  )
}

// 加载指示器
function LoadingIndicator() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3B82F6" wireframe />
    </mesh>
  )
}

// 默认场景（当没有模型时显示）
function DefaultScene() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.3
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <Center>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1, 0.3, 128, 16]} />
        <meshStandardMaterial color="#3B82F6" metalness={0.8} roughness={0.2} />
      </mesh>
    </Center>
  )
}

const Scene3D: React.FC<Scene3DProps> = ({
  modelUrl,
  onModelLoad,
  autoRotate = false,
  showGrid = true,
  className = ''
}) => {
  const [cameraPosition, _setCameraPosition] = useState<
    [number, number, number]
  >([5, 5, 5])

  return (
    <div
      className={`w-full h-full bg-linear-to-br from-gray-900 to-gray-700 ${className}`}
    >
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        {/* 环境光 */}
        <ambientLight intensity={0.3} />

        {/* 主光源 */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* 补光 */}
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color="#3B82F6"
        />

        {/* 网格 */}
        {showGrid && (
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6B7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#9CA3AF"
            fadeDistance={30}
            fadeStrength={1}
            infiniteGrid
          />
        )}

        {/* 3D内容 */}
        <ErrorBoundary fallback={<DefaultScene />}>
          <Suspense fallback={<LoadingIndicator />}>
            {modelUrl ? (
              <Model url={modelUrl} onLoad={onModelLoad} />
            ) : (
              <DefaultScene />
            )}
          </Suspense>
        </ErrorBoundary>

        {/* 相机控制 */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          minDistance={2}
          maxDistance={50}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* 控制面板覆盖层 */}
      <div className="absolute top-20 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-4 z-10">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">鼠标拖拽</div>
              <div className="text-xs text-gray-500">旋转视角</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">滚轮</div>
              <div className="text-xs text-gray-500">缩放视图</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">右键拖拽</div>
              <div className="text-xs text-gray-500">平移视图</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Scene3D
