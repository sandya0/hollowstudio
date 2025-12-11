"use client";
import { useEffect, useRef } from "react";

/**
 * Full FluidText component — copy/paste.
 * - Fixes edge disappearance by clamping UVs & safe normalization.
 * - Includes full GL program + FBO plumbing.
 */

const vertShader = `
precision highp float;
attribute vec2 a_position;
uniform vec2 u_texel;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

void main () {
    vUv = 0.5 * (a_position + 1.0);
    vL = vUv - vec2(u_texel.x, 0.0);
    vR = vUv + vec2(u_texel.x, 0.0);
    vT = vUv + vec2(0.0, u_texel.y);
    vB = vUv - vec2(0.0, u_texel.y);
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

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

    // Clamp to avoid sampling outside [0,1]
    coord = clamp(coord, vec2(0.0), vec2(1.0));

    vec4 velocity = bilerp(u_input_texture, coord, u_output_textel);
    gl_FragColor = u_dissipation * velocity;
}
`;

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
    float div = 0.25 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

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
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

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
    velocity -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

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
    vec2 p = vUv - u_point;
    p.x *= u_ratio;
    vec3 splat = 0.6 * pow(2.0, -dot(p, p) / u_point_size) * u_point_value;
    vec3 base = texture2D(u_input_texture, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
}
`;

const fragShaderOutputShader = `
precision highp float;
precision highp sampler2D;

varying vec2 vUv;

uniform sampler2D u_output_texture;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_text_texture;
uniform float u_disturb_power;
uniform float u_ratio;

void main () {
    float offset = texture2D(u_output_texture, vUv).r;
    vec2 velocity = texture2D(u_velocity_texture, vUv).xy;

    // Safe normalization
    float vlen = length(velocity);
    vec2 vnorm = velocity / (vlen + 1e-6);

    // Distort uv
    vec2 img_uv = vUv - u_disturb_power * vnorm * offset;

    // Clamp to valid sampling range
    img_uv = clamp(img_uv, vec2(0.0), vec2(1.0));

    vec3 img = texture2D(u_text_texture, vec2(img_uv.x, 1.0 - img_uv.y)).rgb;
    float alpha = length(img);

    gl_FragColor = vec4(img, alpha);
}
`;

export default function FluidText({ text = "FLUID" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Options
    const params = {
      cursorSize: 1,
      cursorPower: 30,
      distortionPower: 1.2,
    };

    // Pointer state
    const pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      dx: 0,
      dy: 0,
      moved: false,
    };

    // Text canvas (2D) for generating texture
    const textCanvas = document.createElement("canvas");
    const textCtx = textCanvas.getContext("2d");
    let textTexture = null;

    // WebGL context
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return;

    // Ensure float textures available
    const ext = gl.getExtension("OES_texture_float");
    if (!ext) {
      console.warn("OES_texture_float not available — fluid simulation may not work.");
    }

    // ---------- GL Helpers ----------
    function createShader(src, type) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    function createProgram(vertexSrc, fragmentSrc) {
      const vs = createShader(vertexSrc, gl.VERTEX_SHADER);
      const fs = createShader(fragmentSrc, gl.FRAGMENT_SHADER);
      if (!vs || !fs) return null;

      const prog = gl.createProgram();
      // Bind attribute location 0 to a_position so blit can use location 0 reliably
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.bindAttribLocation(prog, 0, "a_position");
      gl.linkProgram(prog);

      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        return null;
      }

      // Gather uniforms
      const uniforms = {};
      const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(prog, i);
        uniforms[info.name] = gl.getUniformLocation(prog, info.name);
      }

      return { prog, uniforms };
    }

    // Fullscreen quad setup (one buffer reused)
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    const quadIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

    function blit(target, program) {
      // Bind quad
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer);

      // If a program is provided, use it (so uniforms already set before calling)
      if (program) gl.useProgram(program);

      // Ensure attribute 0 is enabled and points to the buffer
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      if (target == null) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        gl.viewport(0, 0, target.width, target.height);
      }

      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    // Create a texture + framebuffer object
    function createFBO(w, h, internalFormat = gl.RGBA, format = gl.RGBA, type = gl.FLOAT) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // If float not supported, fall back to UNSIGNED_BYTE
      const actualType = type === gl.FLOAT && !ext ? gl.UNSIGNED_BYTE : type;
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, actualType, null);

      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return {
        fbo: fb,
        texture: tex,
        width: w,
        height: h,
        attach(unit) {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          return unit;
        },
      };
    }

    function createDoubleFBO(w, h) {
      let f1 = createFBO(w, h);
      let f2 = createFBO(w, h);
      return {
        width: w,
        height: h,
        texelSizeX: 1.0 / w,
        texelSizeY: 1.0 / h,
        read: () => f1,
        write: () => f2,
        swap() {
          const t = f1;
          f1 = f2;
          f2 = t;
        },
      };
    }

    // ---------- Programs ----------
    const splatProg = createProgram(vertShader, fragShaderPoint);
    const divergenceProg = createProgram(vertShader, fragShaderDivergence);
    const pressureProg = createProgram(vertShader, fragShaderPressure);
    const gradSubProg = createProgram(vertShader, fragShaderGradientSubtract);
    const advectProg = createProgram(vertShader, fragShaderAdvection);
    const displayProg = createProgram(vertShader, fragShaderOutputShader);

    // FBO references
    let outputColor, velocity, divergence, pressure;

    function initFBOs() {
      const simW = Math.max(2, Math.ceil(window.innerWidth / 2));
      const simH = Math.max(2, Math.ceil(window.innerHeight / 2));

      outputColor = createDoubleFBO(simW, simH);
      velocity = createDoubleFBO(simW, simH);
      divergence = createFBO(simW, simH);
      pressure = createDoubleFBO(simW, simH);
    }

    // Upload/update text canvas to GL texture
    function updateTextTexture() {
    if (!gl) return;

    // Resize canvas to window
    textCanvas.width = window.innerWidth;
    textCanvas.height = window.innerHeight;

    // Background
    textCtx.fillStyle = "black";
    textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height);

    // Responsive font calculation
    const paddingX = 36;
    const paddingY = 36;
    const maxWidth = textCanvas.width - paddingX * 2;
    const maxHeight = textCanvas.height - paddingY * 2;

    let fontSize = 100; // starting guess
    textCtx.font = `bold ${fontSize}px Anton, sans-serif`;

    let textWidth = textCtx.measureText(text).width;
    let scaleFactor = Math.min(maxWidth / textWidth, maxHeight / fontSize);

    // Clamp font size to reasonable range
    fontSize = Math.max(60, Math.min(fontSize * scaleFactor, 400));
    textCtx.font = `bold ${fontSize}px Anton, sans-serif`;

    // Draw text centered
    textCtx.fillStyle = "white";
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";
    textCtx.fillText(text, textCanvas.width / 2, textCanvas.height / 2);

    // Upload to texture
    if (!textTexture) textTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + 3);
    gl.bindTexture(gl.TEXTURE_2D, textTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
}


    // ---------- Render Loop ----------
    let animationId = null;

    function render(time) {
        if (time - lastTime < 1000 / targetFPS) {
       animationId = requestAnimationFrame(render);
        return;
      }
      lastTime = time;

      const dt = 1.0 / 60.0;

      // SPLAT from pointer movement
      if (pointer.moved) {
        // Velocity splat
        gl.useProgram(splatProg.prog);
        // bind input velocity texture
        gl.uniform1i(splatProg.uniforms.u_input_texture, velocity.read().attach(1));
        gl.uniform1f(splatProg.uniforms.u_ratio, canvas.width / canvas.height);

        // clamp point to avoid exact 0 or 1
        const px = Math.min(0.9999, Math.max(0.0001, pointer.x / window.innerWidth));
        const py = Math.min(0.9999, Math.max(0.0001, 1.0 - pointer.y / window.innerHeight));
        gl.uniform2f(splatProg.uniforms.u_point, px, py);

        // pointer vec -> velocity splat
        const scale = Math.min(1, Math.abs(pointer.dx + pointer.dy) / 50);
        const vx = pointer.dx * 0.001 * scale;
        const vy = pointer.dy * 0.001 * scale;
        gl.uniform3f(splatProg.uniforms.u_point_value, vx, -vy, 0.0);
        gl.uniform1f(splatProg.uniforms.u_point_size, params.cursorSize * 0.001);
        blit(velocity.write(), splatProg.prog);
        velocity.swap();

        // Color/offset splat
        gl.uniform1i(splatProg.uniforms.u_input_texture, outputColor.read().attach(1));
        gl.uniform3f(splatProg.uniforms.u_point_value, params.cursorPower * 0.001, 0.0, 0.0);
        blit(outputColor.write(), splatProg.prog);
        outputColor.swap();

        pointer.moved = false;
      }

      // Divergence step
      gl.useProgram(divergenceProg.prog);
      gl.uniform2f(divergenceProg.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(divergenceProg.uniforms.u_velocity_texture, velocity.read().attach(1));
      blit(divergence, divergenceProg.prog);

      // Pressure solve (Jacobi)
      gl.useProgram(pressureProg.prog);
      gl.uniform2f(pressureProg.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(pressureProg.uniforms.u_divergence_texture, divergence.attach(1));
      for (let i = 0; i < 4; i++) {
        gl.uniform1i(pressureProg.uniforms.u_pressure_texture, pressure.read().attach(2));
        blit(pressure.write(), pressureProg.prog);
        pressure.swap();
      }

      // Gradient subtract
      gl.useProgram(gradSubProg.prog);
      gl.uniform2f(gradSubProg.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gradSubProg.uniforms.u_pressure_texture, pressure.read().attach(1));
      gl.uniform1i(gradSubProg.uniforms.u_velocity_texture, velocity.read().attach(2));
      blit(velocity.write(), gradSubProg.prog);
      velocity.swap();

      // Advect velocity
      gl.useProgram(advectProg.prog);
      gl.uniform2f(advectProg.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform2f(advectProg.uniforms.u_output_textel, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(advectProg.uniforms.u_velocity_texture, velocity.read().attach(1));
      gl.uniform1i(advectProg.uniforms.u_input_texture, velocity.read().attach(1));
      gl.uniform1f(advectProg.uniforms.u_dt, dt);
      gl.uniform1f(advectProg.uniforms.u_dissipation, 0.98);
      blit(velocity.write(), advectProg.prog);
      velocity.swap();

      // Advect color / output
      gl.useProgram(advectProg.prog);
      gl.uniform2f(advectProg.uniforms.u_output_textel, outputColor.texelSizeX, outputColor.texelSizeY);
      gl.uniform1i(advectProg.uniforms.u_input_texture, outputColor.read().attach(2));
      gl.uniform1f(advectProg.uniforms.u_dissipation, 0.97);
      blit(outputColor.write(), advectProg.prog);
      outputColor.swap();

      // Display
      gl.useProgram(displayProg.prog);
      gl.uniform1i(displayProg.uniforms.u_velocity_texture, velocity.read().attach(2));
      gl.uniform1i(displayProg.uniforms.u_output_texture, outputColor.read().attach(1));

      // bind text texture on texture unit 3
      if (textTexture) {
        gl.activeTexture(gl.TEXTURE0 + 3);
        gl.bindTexture(gl.TEXTURE_2D, textTexture);
        gl.uniform1i(displayProg.uniforms.u_text_texture, 3);
      }
      gl.uniform1f(displayProg.uniforms.u_ratio, canvas.width / canvas.height);
      gl.uniform1f(displayProg.uniforms.u_disturb_power, params.distortionPower);

      // draw to screen
      blit(null, displayProg.prog);

      animationId = requestAnimationFrame(render);
    }

    // ---------- Listeners ----------
    function onMove(e) {
      const x = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
      const y = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
      if (x == null || y == null) return;
      pointer.dx = (x - pointer.x) * 5.0;
      pointer.dy = (y - pointer.y) * 5.0;
      pointer.x = x;
      pointer.y = y;
      pointer.moved = true;
    }

    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      initFBOs();
      updateTextTexture();
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    // Initialize once
    onResize();
    // Ensure fonts loaded
    document.fonts.ready.then(() => {
      updateTextTexture();
      setTimeout(updateTextTexture, 120);
    });

    // small wake-up splashes
    const wakeUp = () => {
      pointer.x = window.innerWidth / 2;
      pointer.y = window.innerHeight / 2;
      pointer.dx = 10;
      pointer.dy = 10;
      pointer.moved = true;
    };
    wakeUp();
    setTimeout(wakeUp, 300);

    let lastTime = 0;
    const targetFPS = 144;
    


    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("resize", onResize);
      // Best-effort resource cleanup
      try {
        [splatProg, divergenceProg, pressureProg, gradSubProg, advectProg, displayProg].forEach(p => {
          if (p && p.prog) gl.deleteProgram(p.prog);
        });
      } catch (e) {}
    };
  }, [text]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
