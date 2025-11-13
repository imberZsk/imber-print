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
  const [cameraPosition, setCameraPosition] = useState<
    [number, number, number]
  >([5, 5, 5])

  return (
    <div
      className={`w-full h-full bg-gradient-to-br from-gray-900 to-gray-700 ${className}`}
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
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-lg p-4 text-white">
        <div className="text-sm space-y-2">
          <div>鼠标拖拽：旋转视角</div>
          <div>滚轮：缩放</div>
          <div>右键拖拽：平移</div>
        </div>
      </div>
    </div>
  )
}

export default Scene3D
