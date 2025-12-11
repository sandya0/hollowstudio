'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, RenderTexture, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

// ... (Keep your shaders exactly as they were) ...
const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uHover;
  uniform float uVelocity;
  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float dist = distance(uv, uMouse);
    float primaryDecay = smoothstep(0.3, 0.0, dist);
    float secondaryDecay = smoothstep(0.5, 0.0, dist) * 0.5;
    float totalDecay = primaryDecay + secondaryDecay;
    float noise1 = snoise(uv * 15.0 + uTime * 0.8);
    float noise2 = snoise(uv * 8.0 - uTime * 0.3);
    vec2 flowDir = normalize(uMouse - uv);
    float noise3 = snoise(uv * 12.0 + flowDir * uTime * 0.5);
    float combinedNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
    float distortionStrength = 0.035 + uVelocity * 0.04;
    vec2 pushDirection = normalize(uv - uMouse);
    vec2 distortion = vec2(
      combinedNoise * distortionStrength + pushDirection.x * totalDecay * 0.015,
      combinedNoise * distortionStrength + pushDirection.y * totalDecay * 0.015
    ) * totalDecay * uHover;
    vec4 color = texture2D(uTexture, uv + distortion);
    gl_FragColor = color;
  }
`

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

function LiquidPlane() {
  const meshRef = useRef()
  const { viewport } = useThree()
  
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5))
  const targetHover = useRef(0)
  const currentHover = useRef(0)

  const uniforms = useMemo(() => ({
    uTexture: { value: null },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uTime: { value: 0 },
    uHover: { value: 0 },
    uVelocity: { value: 0 }
  }), [])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime()
      
      const uvMouseX = (state.pointer.x + 1) / 2
      const uvMouseY = (state.pointer.y + 1) / 2
      
      const prevX = mouseRef.current.x
      const prevY = mouseRef.current.y
      
      const lerpFactor = 0.08
      mouseRef.current.x += (uvMouseX - mouseRef.current.x) * lerpFactor
      mouseRef.current.y += (uvMouseY - mouseRef.current.y) * lerpFactor
      meshRef.current.material.uniforms.uMouse.value.copy(mouseRef.current)

      const velocityX = mouseRef.current.x - prevX
      const velocityY = mouseRef.current.y - prevY
      const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY)
      
      const currentVel = meshRef.current.material.uniforms.uVelocity.value
      meshRef.current.material.uniforms.uVelocity.value += (velocity * 20 - currentVel) * 0.1

      const centerDist = Math.sqrt(
        Math.pow(uvMouseX - 0.5, 2) + Math.pow(uvMouseY - 0.5, 2)
      )
      
      targetHover.current = centerDist < 0.6 ? 1.0 : Math.max(0, 1.0 - (centerDist - 0.6) * 2)
      
      const hoverLerp = 0.05
      currentHover.current += (targetHover.current - currentHover.current) * hoverLerp
      
      meshRef.current.material.uniforms.uHover.value = currentHover.current
    }
  })

  // 1. Adjusted font size logic to be slightly larger so it's clearly visible
  const responsiveFontSize = Math.min(viewport.width * 0., 3)

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      {/* 2. Changed shaderMaterial from self-closing to wrapper */}
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      >
         {/* 3. RenderTexture is now a CHILD of shaderMaterial */}
        <RenderTexture attach="uniforms-uTexture-value" width={2048} height={2048}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <color attach="background" args={['#000000']} />
          <Text
            fontSize={responsiveFontSize} /* 4. Added font size prop */
            letterSpacing={-0.025}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
          >
                                    HOLLO STUDIO          </Text>
        </RenderTexture>
      </shaderMaterial>
    </mesh>
  )
}

export default function InteractiveTitle() {
  return (
    <div className="w-screen h-screen bg-black">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 50 }}
      >
        <LiquidPlane />
      </Canvas>
    </div>
  )
}