'use client'
import { useEffect, useRef } from 'react'

const FluidBackground = ({ 
  containerRef, // Reference to the parent section to listen for events
  imageSrc = "https://ksenia-k.com/img/codepen/for-fluid-sim-demo-1.jpg" // Optional: leave null for just smoke
}) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    const container = containerRef?.current || document.body
    if (!canvasEl) return

    // --- 1. CONFIGURATION ---
    const params = {
      cursorSize: 50, // Larger splash for a hero section
      cursorPower: 30,
      distortionPower: 0.35, // How much the image/colors warp
    }

    // --- 2. SHADERS (Standard Fluid Simulation) ---
    const vertShaderSource = `
      precision highp float;
      varying vec2 vUv;
      attribute vec2 a_position;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 u_texel;
      void main () {
          vUv = .5 * (a_position + 1.);
          vL = vUv - vec2(u_texel.x, 0.);
          vR = vUv + vec2(u_texel.x, 0.);
          vT = vUv + vec2(0., u_texel.y);
          vB = vUv - vec2(0., u_texel.y);
          gl_Position = vec4(a_position, 0., 1.);
      }
    `

    const fragShaderAdvection = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D u_velocity_texture;
      uniform sampler2D u_input_texture;
      uniform vec2 u_texel;
      uniform vec2 u_output_textel;
      uniform float u_dt;
      uniform float u_dissipation;
      vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
          vec2 st = uv / tsize - 0.5;
          vec2 iuv = floor(st);
          vec2 fuv = fract(st);
          vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
          vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
          vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
          vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
          return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
      }
      void main () {
          vec2 coord = vUv - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
          vec4 velocity = bilerp(u_input_texture, coord, u_output_textel);
          gl_FragColor = u_dissipation * velocity;
      }
    `

    const fragShaderDivergence = `
      precision highp float;
      precision highp sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D u_velocity_texture;
      void main () {
          float L = texture2D(u_velocity_texture, vL).x;
          float R = texture2D(u_velocity_texture, vR).x;
          float T = texture2D(u_velocity_texture, vT).y;
          float B = texture2D(u_velocity_texture, vB).y;
          float div = .25 * (R - L + T - B);
          gl_FragColor = vec4(div, 0., 0., 1.);
      }
    `

    const fragShaderPressure = `
      precision highp float;
      precision highp sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D u_pressure_texture;
      uniform sampler2D u_divergence_texture;
      void main () {
          float L = texture2D(u_pressure_texture, vL).x;
          float R = texture2D(u_pressure_texture, vR).x;
          float T = texture2D(u_pressure_texture, vT).x;
          float B = texture2D(u_pressure_texture, vB).x;
          float C = texture2D(u_pressure_texture, vUv).x;
          float divergence = texture2D(u_divergence_texture, vUv).x;
          float pressure = (L + R + B + T - divergence) * .25;
          gl_FragColor = vec4(pressure, 0., 0., 1.);
      }
    `

    const fragShaderGradientSubtract = `
      precision highp float;
      precision highp sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D u_pressure_texture;
      uniform sampler2D u_velocity_texture;
      void main () {
          float L = texture2D(u_pressure_texture, vL).x;
          float R = texture2D(u_pressure_texture, vR).x;
          float T = texture2D(u_pressure_texture, vT).x;
          float B = texture2D(u_pressure_texture, vB).x;
          vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
          velocity.xy -= vec2(R - L, T - B);
          gl_FragColor = vec4(velocity, 0., 1.);
      }
    `

    const fragShaderPoint = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D u_input_texture;
      uniform float u_ratio;
      uniform vec3 u_point_value;
      uniform vec2 u_point;
      uniform float u_point_size;
      void main () {
          vec2 p = vUv - u_point.xy;
          p.x *= u_ratio;
          vec3 splat = .6 * pow(2., -dot(p, p) / u_point_size) * u_point_value;
          vec3 base = texture2D(u_input_texture, vUv).xyz;
          gl_FragColor = vec4(base + splat, 1.);
      }
    `

    const fragShaderDisplay = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform float u_ratio;
      uniform float u_img_ratio;
      uniform float u_disturb_power;
      uniform sampler2D u_output_texture;
      uniform sampler2D u_velocity_texture;
      uniform sampler2D u_text_texture;
      
      vec2 get_img_uv() {
          vec2 img_uv = vUv;
          img_uv -= .5;
          if (u_ratio > u_img_ratio) {
              img_uv.x = img_uv.x * u_ratio / u_img_ratio;
          } else {
              img_uv.y = img_uv.y * u_img_ratio / u_ratio;
          }
          float scale_factor = 1.0; 
          img_uv *= scale_factor;
          img_uv += .5;
          return img_uv;
      }
      
      void main () {
          vec3 fluid = texture2D(u_output_texture, vUv).rgb;
          vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
          float intensity = length(velocity);

          vec2 img_uv = get_img_uv();
          // Distort the UVs based on velocity
          img_uv -= u_disturb_power * velocity;
          
          vec4 imgColor = texture2D(u_text_texture, vec2(img_uv.x, 1. - img_uv.y));
          
          // Mix the fluid density with the image
          gl_FragColor = imgColor;
      }
    `

    // --- 3. WEBGL SETUP ---
    const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false }
    const res = { w: null, h: null }
    let outputColor, velocity, divergence, pressure, imageTexture, imgRatio
    let animationId
    const gl = canvasEl.getContext("webgl")
    gl.getExtension("OES_texture_float")

    function createShader(source, type) {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
        return null
      }
      return shader
    }

    function createProgram(vertex, fragmentSource) {
      const fragment = createShader(fragmentSource, gl.FRAGMENT_SHADER)
      const vertexS = createShader(vertex, gl.VERTEX_SHADER)
      const program = gl.createProgram()
      gl.attachShader(program, vertexS)
      gl.attachShader(program, fragment)
      gl.linkProgram(program)
      
      const uniforms = {}
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
      for (let i = 0; i < count; i++) {
        const name = gl.getActiveUniform(program, i).name
        uniforms[name] = gl.getUniformLocation(program, name)
      }
      return { program, uniforms }
    }

    const splatProgram = createProgram(vertShaderSource, fragShaderPoint)
    const divergenceProgram = createProgram(vertShaderSource, fragShaderDivergence)
    const pressureProgram = createProgram(vertShaderSource, fragShaderPressure)
    const gradientSubtractProgram = createProgram(vertShaderSource, fragShaderGradientSubtract)
    const advectionProgram = createProgram(vertShaderSource, fragShaderAdvection)
    const displayProgram = createProgram(vertShaderSource, fragShaderDisplay)

    function createFBO(w, h) {
      gl.activeTexture(gl.TEXTURE0)
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, h, 0, gl.RGB, gl.FLOAT, null)
      const fbo = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
      return { fbo, width: w, height: h, attach: (id) => {
        gl.activeTexture(gl.TEXTURE0 + id)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        return id
      }}
    }

    function createDoubleFBO(w, h) {
      let fbo1 = createFBO(w, h)
      let fbo2 = createFBO(w, h)
      return {
        width: w, height: h, texelSizeX: 1./w, texelSizeY: 1./h,
        read: () => fbo1, write: () => fbo2,
        swap: () => { let tmp = fbo1; fbo1 = fbo2; fbo2 = tmp; }
      }
    }

    function blit(target) {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,-1]), gl.STATIC_DRAW)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(0)
      
      if (!target) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      } else {
        gl.viewport(0, 0, target.width, target.height)
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
    }

    function resizeCanvas() {
      if (!canvasEl.parentElement) return
      canvasEl.width = canvasEl.parentElement.clientWidth
      canvasEl.height = canvasEl.parentElement.clientHeight
      res.w = canvasEl.width
      res.h = canvasEl.height
    }

    function initFBOs() {
      const ratio = canvasEl.width / canvasEl.height
      const simResW = Math.max(128 * ratio, 256) // Resolution of simulation
      const simResH = Math.max(128, 256)
      outputColor = createDoubleFBO(simResW, simResH)
      velocity = createDoubleFBO(simResW, simResH)
      divergence = createFBO(simResW, simResH)
      pressure = createDoubleFBO(simResW, simResH)
    }

    const loadImage = (src) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = src
      img.onload = () => {
        imgRatio = img.naturalWidth / img.naturalHeight
        imageTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, imageTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      }
    }

    // --- 4. RENDER LOOP ---
    function render(t) {
      const dt = 1/60
      
      if (pointer.moved) {
        gl.useProgram(splatProgram.program)
        gl.uniform1i(splatProgram.uniforms.u_input_texture, velocity.read().attach(1))
        gl.uniform1f(splatProgram.uniforms.u_ratio, canvasEl.width / canvasEl.height)
        gl.uniform2f(splatProgram.uniforms.u_point, pointer.x / canvasEl.width, 1 - pointer.y / canvasEl.height)
        gl.uniform3f(splatProgram.uniforms.u_point_value, pointer.dx, -pointer.dy, 0)
        gl.uniform1f(splatProgram.uniforms.u_point_size, params.cursorSize * 0.001)
        blit(velocity.write())
        velocity.swap()

        gl.uniform1i(splatProgram.uniforms.u_input_texture, outputColor.read().attach(1))
        gl.uniform3f(splatProgram.uniforms.u_point_value, 1, 1, 1) // White smoke
        blit(outputColor.write())
        outputColor.swap()
        pointer.moved = false
      }

      gl.useProgram(divergenceProgram.program)
      gl.uniform2f(divergenceProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(divergenceProgram.uniforms.u_velocity_texture, velocity.read().attach(1))
      blit(divergence)

      gl.useProgram(pressureProgram.program)
      gl.uniform2f(pressureProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(pressureProgram.uniforms.u_divergence_texture, divergence.attach(1))
      for(let i=0; i<16; i++) {
        gl.uniform1i(pressureProgram.uniforms.u_pressure_texture, pressure.read().attach(2))
        blit(pressure.write())
        pressure.swap()
      }

      gl.useProgram(gradientSubtractProgram.program)
      gl.uniform2f(gradientSubtractProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(gradientSubtractProgram.uniforms.u_pressure_texture, pressure.read().attach(1))
      gl.uniform1i(gradientSubtractProgram.uniforms.u_velocity_texture, velocity.read().attach(2))
      blit(velocity.write())
      velocity.swap()

      gl.useProgram(advectionProgram.program)
      gl.uniform2f(advectionProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform2f(advectionProgram.uniforms.u_output_textel, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(advectionProgram.uniforms.u_velocity_texture, velocity.read().attach(1))
      gl.uniform1i(advectionProgram.uniforms.u_input_texture, velocity.read().attach(1))
      gl.uniform1f(advectionProgram.uniforms.u_dt, dt)
      gl.uniform1f(advectionProgram.uniforms.u_dissipation, 0.96)
      blit(velocity.write())
      velocity.swap()

      gl.useProgram(advectionProgram.program)
      gl.uniform2f(advectionProgram.uniforms.u_output_textel, outputColor.texelSizeX, outputColor.texelSizeY)
      gl.uniform1i(advectionProgram.uniforms.u_input_texture, outputColor.read().attach(2))
      gl.uniform1f(advectionProgram.uniforms.u_dt, dt)
      gl.uniform1f(advectionProgram.uniforms.u_dissipation, 0.95)
      blit(outputColor.write())
      outputColor.swap()

      gl.useProgram(displayProgram.program)
      gl.uniform2f(displayProgram.uniforms.u_point, pointer.x / canvasEl.width, 1 - pointer.y / canvasEl.height)
      gl.uniform1i(displayProgram.uniforms.u_velocity_texture, velocity.read().attach(2))
      gl.uniform1i(displayProgram.uniforms.u_output_texture, outputColor.read().attach(1))
      if (imageTexture) {
         gl.uniform1i(displayProgram.uniforms.u_text_texture, 3)
         gl.activeTexture(gl.TEXTURE0 + 3)
         gl.bindTexture(gl.TEXTURE_2D, imageTexture)
      }
      gl.uniform1f(displayProgram.uniforms.u_ratio, canvasEl.width / canvasEl.height)
      gl.uniform1f(displayProgram.uniforms.u_img_ratio, imgRatio || 1.0)
      gl.uniform1f(displayProgram.uniforms.u_disturb_power, params.distortionPower)
      
      blit()
      animationId = requestAnimationFrame(render)
    }

    // --- 5. INTERACTION ---
    const updatePointer = (e) => {
        const rect = canvasEl.getBoundingClientRect()
        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        const clientY = e.touches ? e.touches[0].clientY : e.clientY
        // Relative to canvas
        pointer.dx = (clientX - rect.left - pointer.x) * 10
        pointer.dy = (clientY - rect.top - pointer.y) * 10
        pointer.x = clientX - rect.left
        pointer.y = clientY - rect.top
        pointer.moved = true
    }

    resizeCanvas()
    initFBOs()
    loadImage(imageSrc)
    render()

    // Attach events to the CONTAINER or WINDOW, not just the canvas
    // This allows the fluid to move even when hovering over text
    const target = container || window
    target.addEventListener("mousemove", updatePointer)
    target.addEventListener("touchmove", updatePointer)
    window.addEventListener("resize", () => {
        resizeCanvas()
        initFBOs()
    })

    return () => {
      cancelAnimationFrame(animationId)
      target.removeEventListener("mousemove", updatePointer)
      target.removeEventListener("touchmove", updatePointer)
    }
  }, [containerRef, imageSrc])

  return (
    <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    />
  )
}

export default FluidBackground