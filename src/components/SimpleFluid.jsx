'use client'

import { useEffect, useRef } from 'react'

export default function SimpleFluid() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', { alpha: true })
    if (!gl) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth * dpr
      const h = window.innerHeight * dpr
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      gl.viewport(0, 0, w, h)
    }

    resize()
    window.addEventListener('resize', resize)

    // ========================
    // SHADERS
    // ========================

    const vertexShader = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 uMouse;
      uniform vec2 uResolution;
      uniform float uTime;

      float ripple(vec2 uv, vec2 center) {
        float d = distance(uv, center);
        float wave = sin(d * 14.0 - uTime * 3.0);
        return exp(-d * 8.0) * wave;
      }

      void main() {
        vec2 uv = vUv;
        float r = ripple(uv, uMouse);

        uv.y += r * 0.03;
        uv.x += r * 0.02;

        float glow = smoothstep(0.4, 0.0, length(uv - uMouse));
        float wave = sin(uTime * 0.8 + uv.y * 5.0) * 0.04;

        vec3 color = vec3(
          0.1 + glow + wave,
          0.15 + 0.5 * glow,
          0.25 + glow * 0.8
        );

        gl_FragColor = vec4(color, 0.9);
      }
    `

    // ========================
    // PROGRAM
    // ========================

    const compile = (type, source) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShader))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader))
    gl.linkProgram(program)
    gl.useProgram(program)

    // ========================
    // GEOMETRY
    // ========================

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )

    const posLoc = gl.getAttribLocation(program, "position")
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    // ========================
    // UNIFORMS
    // ========================

    const uTime = gl.getUniformLocation(program, "uTime")
    const uMouse = gl.getUniformLocation(program, "uMouse")
    const uRes = gl.getUniformLocation(program, "uResolution")

    // ========================
    // EVENTS
    // ========================

    const onMove = e => {
      const dpr = window.devicePixelRatio || 1
      mouseRef.current.x = e.clientX / (canvas.width / dpr)
      mouseRef.current.y = 1 - e.clientY / (canvas.height / dpr)
    }

    window.addEventListener("mousemove", onMove)

    // ========================
    // RENDER LOOP
    // ========================

    let raf
    const render = () => {
      timeRef.current += 0.016

      gl.uniform1f(uTime, timeRef.current)
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y)
      gl.uniform2f(uRes, canvas.width, canvas.height)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        background: "black"
      }}
    />
  )
}
