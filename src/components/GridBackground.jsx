// GridBackground.jsx
'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 1. The Custom Shader Material
// This handles the math for the warping effect on the GPU
const fragmentShader = `
  uniform vec3 uColor;
  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`

const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Calculate distance from this vertex to the mouse
    // We map mouse (-1 to 1) to UV space (0 to 1) roughly for this effect
    float dist = distance(uv, uMouse);

    // 1. WAVE EFFECT: Gentle flowing movement
    pos.z += sin(pos.x * 5.0 + uTime) * 0.5;
    pos.z += sin(pos.y * 5.0 + uTime * 0.5) * 0.5;

    // 2. MOUSE INTERACTION: Warp upwards when mouse is near
    // smoothstep creates a clean radius around the mouse
    float mouseEffect = 1.0 - smoothstep(0.0, 0.3, dist);
    pos.z += mouseEffect * 2.0;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

function WarpedPlane() {
  const meshRef = useRef()
  
  // Initialize uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }, // Start center
      uColor: { value: new THREE.Color('#333333') }, // Dark Grey color
    }),
    []
  )

  useFrame((state) => {
    const { clock, pointer } = state
    if (meshRef.current) {
      // Update Time
      meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime()
      
      // Update Mouse (convert standard -1..1 pointer to 0..1 UV space roughly)
      // We dampen it slightly for smoother movement
      const targetX = (pointer.x + 1) / 2
      const targetY = (pointer.y + 1) / 2
      
      // Linear interpolation (lerp) for smooth trailing effect
      meshRef.current.material.uniforms.uMouse.value.x += (targetX - meshRef.current.material.uniforms.uMouse.value.x) * 0.1
      meshRef.current.material.uniforms.uMouse.value.y += (targetY - meshRef.current.material.uniforms.uMouse.value.y) * 0.1
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 3, 0, 0]}>
      {/* PlaneGeometry args: [Width, Height, WidthSegments, HeightSegments] 
         Higher segments = smoother waves but more expensive
      */}
      <planeGeometry args={[20, 20, 60, 60]} />
      <shaderMaterial
        wireframe={true} // Creates the grid look
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        opacity={0.15} // Barely visible as requested
      />
    </mesh>
  )
}

export default function GridBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* Canvas should not block clicks, but we pass events through 'pointer-events-none' on container */}
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 50 }} 
        // We allow events on the canvas specifically so it tracks the mouse
        style={{ pointerEvents: 'auto' }} 
      >
        <WarpedPlane />
      </Canvas>
    </div>
  )
}