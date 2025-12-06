"use client";
import { useEffect, useRef } from "react";

// =========================================
// SHADERS (GLSL)
// =========================================

const vertShader = `
    precision highp float;
    attribute vec2 a_position;
    varying vec2 vUv;
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
        // kill near edges
        if (vUv.x < u_texel.x || vUv.x > 1.0 - u_texel.x || vUv.y < u_texel.y || vUv.y > 1.0 - u_texel.y) {
            gl_FragColor = vec4(0.0);
            return;
        }

        vec2 coord = vUv - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
        gl_FragColor = u_dissipation * bilerp(u_input_texture, coord, u_output_textel);
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
    uniform vec2 u_texel;
    void main () {
        if (vUv.x < u_texel.x || vUv.x > 1.0 - u_texel.x || vUv.y < u_texel.y || vUv.y > 1.0 - u_texel.y) {
            gl_FragColor = vec4(0.0);
            return;
        }
        float L = texture2D(u_velocity_texture, vL).x;
        float R = texture2D(u_velocity_texture, vR).x;
        float T = texture2D(u_velocity_texture, vT).y;
        float B = texture2D(u_velocity_texture, vB).y;
        float div = .25 * (R - L + T - B);
        gl_FragColor = vec4(div, 0., 0., 1.);
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
    uniform vec2 u_texel;
    void main () {
        if (vUv.x < u_texel.x || vUv.x > 1.0 - u_texel.x || vUv.y < u_texel.y || vUv.y > 1.0 - u_texel.y) {
            gl_FragColor = vec4(0.0);
            return;
        }
        float L = texture2D(u_pressure_texture, vL).x;
        float R = texture2D(u_pressure_texture, vR).x;
        float T = texture2D(u_pressure_texture, vT).x;
        float B = texture2D(u_pressure_texture, vB).x;
        float divergence = texture2D(u_divergence_texture, vUv).x;
        float pressure = (L + R + B + T - divergence) * .25;
        gl_FragColor = vec4(pressure, 0., 0., 1.);
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
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0., 1.);
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
        vec2 p = vUv - u_point.xy;
        p.x *= u_ratio;
        vec3 splat = .6 * pow(2., -dot(p, p) / u_point_size) * u_point_value;
        vec3 base = texture2D(u_input_texture, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.);
    }
`;

const fragShaderOutputShader = `

    precision highp float;

    precision highp sampler2D;

    varying vec2 vUv;

    uniform float u_ratio;

    uniform float u_disturb_power;

    uniform sampler2D u_output_texture;

    uniform sampler2D u_velocity_texture;

    uniform sampler2D u_text_texture;


    void main () {

        float offset = texture2D(u_output_texture, vUv).r;

        vec2 velocity = texture2D(u_velocity_texture, vUv).xy;

       
        // Distort the UV based on fluid velocity

        vec2 img_uv = vUv;

        img_uv -= u_disturb_power * normalize(velocity) * offset;

        img_uv -= u_disturb_power * normalize(velocity) * offset;


        // Sample the text texture using the distorted UV

        // We flip Y because Canvas 2D and WebGL have different coordinate origins

        vec3 img = texture2D(u_text_texture, vec2(img_uv.x, 1. - img_uv.y)).rgb;


        // Simple alpha handling based on brightness
        float alpha = length(img);
        gl_FragColor = vec4(img, alpha);

    }

`;

// =========================================
// COMPONENT
// =========================================

export default function FluidText({ text = "FLUID" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const params = {
      cursorSize: 1,
      cursorPower: 8,
      distortionPower: 1.5,
    };
    

    const pointer = {
      x: 0.65 * window.innerWidth,
      y: 0.5 * window.innerHeight,
      dx: 0,
      dy: 0,
      moved: false,
    };

    let gl = canvasEl.getContext("webgl");
    if (!gl) return;

    // try to enable float textures (best-effort)
    gl.getExtension("OES_texture_float");

    // --- helper functions ---
    function createShader(sourceCode, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, sourceCode);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function createShaderProgram(vertexShader, fragmentShader) {
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      // ensure attribute location 0 is a_position
      gl.bindAttribLocation(program, 0, "a_position");
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    }

    function getUniforms(program) {
      let uniforms = {};
      let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        let name = gl.getActiveUniform(program, i).name;
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      return uniforms;
    }

    function createFBO(w, h) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // some devices require RGBA float; use RGB if you prefer but keep formats consistent
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.FLOAT, null);

      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return {
        fbo,
        texture,
        width: w,
        height: h,
        attach(id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    function createDoubleFBO(w, h) {
      let fbo1 = createFBO(w, h);
      let fbo2 = createFBO(w, h);
      return {
        width: w,
        height: h,
        texelSizeX: 1.0 / w,
        texelSizeY: 1.0 / h,
        read() {
          return fbo1;
        },
        write() {
          return fbo2;
        },
        swap() {
          let tmp = fbo1;
          fbo1 = fbo2;
          fbo2 = tmp;
        },
      };
    }

    // blit full-screen quad
    function blit(target) {
      // create and bind a small buffer each frame (cheap)
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);

      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }

      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    // text texture (canvas -> GL texture)
    const textCanvas = document.createElement("canvas");
    const textCtx = textCanvas.getContext("2d");
    let textTexture = null;
    function updateTextTexture() {
      textCanvas.width = window.innerWidth;
      textCanvas.height = window.innerHeight;

      // background black then white text (match your earlier choice)
      textCtx.fillStyle = "black";
      textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height);

      // determine font size to fit width (similar approach)
      const paddingX = 48;
      const targetWidth = window.innerWidth - paddingX * 2;
      let trialSize = 80;
      textCtx.font = `bold ${trialSize}px Anton, sans-serif`;
      const measured = textCtx.measureText(text);
      const textWidth = measured.width || 1;
      const scaleFactor = targetWidth / textWidth;
      let finalSize = Math.min(trialSize * scaleFactor, 300);
      finalSize = Math.max(12, finalSize);

      textCtx.font = `bold ${finalSize}px Anton, sans-serif`;
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      textCtx.fillStyle = "white";
      textCtx.fillText(text, textCanvas.width / 2, textCanvas.height / 2);

      if (!textTexture) textTexture = gl.createTexture();

      gl.bindTexture(gl.TEXTURE_2D, textTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    }

    // compile programs
    const vShader = createShader(vertShader, gl.VERTEX_SHADER);
    const makeProgram = (fragSrc) => {
      const fShader = createShader(fragSrc, gl.FRAGMENT_SHADER);
      const prog = createShaderProgram(vShader, fShader);
      return { program: prog, uniforms: getUniforms(prog) };
    };

    const splatProgram = makeProgram(fragShaderPoint);
    const divergenceProgram = makeProgram(fragShaderDivergence);
    const pressureProgram = makeProgram(fragShaderPressure);
    const gradientSubtractProgram = makeProgram(fragShaderGradientSubtract);
    const advectionProgram = makeProgram(fragShaderAdvection);
    const displayProgram = makeProgram(fragShaderOutputShader);

    // FBOs
    let outputColor, velocity, divergence, pressure;
    // edge padding in screen pixels
    let edgePaddingX = 1;
    let edgePaddingY = 1;

    const initFBOs = () => {
      const simResW = Math.max(2, Math.ceil(window.innerWidth / 2));
      const simResH = Math.max(2, Math.ceil(window.innerHeight / 2));

      outputColor = createDoubleFBO(simResW, simResH);
      velocity = createDoubleFBO(simResW, simResH);
      divergence = createFBO(simResW, simResH);
      pressure = createDoubleFBO(simResW, simResH);

      edgePaddingX = Math.max(1, Math.ceil(window.innerWidth * (velocity.texelSizeX)));
      edgePaddingY = Math.max(1, Math.ceil(window.innerHeight * (velocity.texelSizeY)));
    };

    // render loop
    let animationId;
    function render(t) {
      const dt = 1 / 60;

      // SPLAT (pointer)
      if (pointer.moved) {
        // splat into velocity
        gl.useProgram(splatProgram.program);
        if (splatProgram.uniforms.u_input_texture)
          gl.uniform1i(splatProgram.uniforms.u_input_texture, velocity.read().attach(1));
        if (splatProgram.uniforms.u_ratio)
          gl.uniform1f(splatProgram.uniforms.u_ratio, canvasEl.width / canvasEl.height);
        if (splatProgram.uniforms.u_point)
          gl.uniform2f(splatProgram.uniforms.u_point, pointer.x / window.innerWidth, 1 - pointer.y / window.innerHeight);
        if (splatProgram.uniforms.u_point_value)
          gl.uniform3f(splatProgram.uniforms.u_point_value, pointer.dx, -pointer.dy, 0);
        if (splatProgram.uniforms.u_point_size)
          gl.uniform1f(splatProgram.uniforms.u_point_size, params.cursorSize * 0.001);

        blit(velocity.write());
        velocity.swap();

        // splat into color/density
        if (splatProgram.uniforms.u_input_texture)
          gl.uniform1i(splatProgram.uniforms.u_input_texture, outputColor.read().attach(1));
        if (splatProgram.uniforms.u_point_value)
          gl.uniform3f(splatProgram.uniforms.u_point_value, params.cursorPower * 0.001, 0, 0);

        blit(outputColor.write());
        outputColor.swap();

        pointer.moved = false;
      }

      // Divergence
      gl.useProgram(divergenceProgram.program);
      if (divergenceProgram.uniforms.u_texel)
        gl.uniform2f(divergenceProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
      if (divergenceProgram.uniforms.u_velocity_texture)
        gl.uniform1i(divergenceProgram.uniforms.u_velocity_texture, velocity.read().attach(1));
      blit(divergence);

      // Pressure (Jacobi iterations)
      gl.useProgram(pressureProgram.program);
      if (pressureProgram.uniforms.u_texel)
        gl.uniform2f(pressureProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
      if (pressureProgram.uniforms.u_divergence_texture)
        gl.uniform1i(pressureProgram.uniforms.u_divergence_texture, divergence.attach(1));

      for (let i = 0; i < 16; i++) {
        if (pressureProgram.uniforms.u_pressure_texture)
          gl.uniform1i(pressureProgram.uniforms.u_pressure_texture, pressure.read().attach(2));
        blit(pressure.write());
        pressure.swap();
      }

      // Gradient subtract
      gl.useProgram(gradientSubtractProgram.program);
      if (gradientSubtractProgram.uniforms.u_texel)
        gl.uniform2f(gradientSubtractProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
      if (gradientSubtractProgram.uniforms.u_pressure_texture)
        gl.uniform1i(gradientSubtractProgram.uniforms.u_pressure_texture, pressure.read().attach(1));
      if (gradientSubtractProgram.uniforms.u_velocity_texture)
        gl.uniform1i(gradientSubtractProgram.uniforms.u_velocity_texture, velocity.read().attach(2));
      blit(velocity.write());
      velocity.swap();

      // Advection (velocity)
      gl.useProgram(advectionProgram.program);
      if (advectionProgram.uniforms.u_texel)
        gl.uniform2f(advectionProgram.uniforms.u_texel, velocity.texelSizeX, velocity.texelSizeY);
      if (advectionProgram.uniforms.u_output_textel)
        gl.uniform2f(advectionProgram.uniforms.u_output_textel, velocity.texelSizeX, velocity.texelSizeY);
      if (advectionProgram.uniforms.u_velocity_texture)
        gl.uniform1i(advectionProgram.uniforms.u_velocity_texture, velocity.read().attach(1));
      if (advectionProgram.uniforms.u_input_texture)
        gl.uniform1i(advectionProgram.uniforms.u_input_texture, velocity.read().attach(1));
      if (advectionProgram.uniforms.u_dt) gl.uniform1f(advectionProgram.uniforms.u_dt, dt);
      if (advectionProgram.uniforms.u_dissipation) gl.uniform1f(advectionProgram.uniforms.u_dissipation, 0.98);
      blit(velocity.write());
      velocity.swap();

      // Advection (color/density)
      gl.useProgram(advectionProgram.program);
      if (advectionProgram.uniforms.u_output_textel)
        gl.uniform2f(advectionProgram.uniforms.u_output_textel, outputColor.texelSizeX, outputColor.texelSizeY);
      if (advectionProgram.uniforms.u_input_texture)
        gl.uniform1i(advectionProgram.uniforms.u_input_texture, outputColor.read().attach(2));
      if (advectionProgram.uniforms.u_dissipation) gl.uniform1f(advectionProgram.uniforms.u_dissipation, 0.99);
      blit(outputColor.write());
      outputColor.swap();

      // Display
      gl.useProgram(displayProgram.program);
      if (displayProgram.uniforms.u_velocity_texture)
        gl.uniform1i(displayProgram.uniforms.u_velocity_texture, velocity.read().attach(2));
      if (displayProgram.uniforms.u_output_texture)
        gl.uniform1i(displayProgram.uniforms.u_output_texture, outputColor.read().attach(1));

      // bind text texture to a unit (3)
      gl.activeTexture(gl.TEXTURE0 + 3);
      gl.bindTexture(gl.TEXTURE_2D, textTexture);
      if (displayProgram.uniforms.u_text_texture)
        gl.uniform1i(displayProgram.uniforms.u_text_texture, 3);

      if (displayProgram.uniforms.u_ratio)
        gl.uniform1f(displayProgram.uniforms.u_ratio, canvasEl.width / canvasEl.height);
      if (displayProgram.uniforms.u_disturb_power)
        gl.uniform1f(displayProgram.uniforms.u_disturb_power, params.distortionPower);

      blit(null);

      animationId = requestAnimationFrame(render);
    }

    // resize + safe padding
    const resize = () => {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
      initFBOs();
      updateTextTexture();

      // clamp pointer after resize so it can't be inside kill zone
      pointer.x = Math.max(edgePaddingX, Math.min(pointer.x, window.innerWidth - edgePaddingX));
      pointer.y = Math.max(edgePaddingY, Math.min(pointer.y, window.innerHeight - edgePaddingY));
    };

    // input handling, using edgePadding computed after initFBOs
    const onMove = (e) => {
      const x = e.clientX || (e.touches && e.touches[0].clientX) || pointer.x;
      const y = e.clientY || (e.touches && e.touches[0].clientY) || pointer.y;

      pointer.moved = true;

      const safeX = Math.max(edgePaddingX, Math.min(x, window.innerWidth - edgePaddingX));
      const safeY = Math.max(edgePaddingY, Math.min(y, window.innerHeight - edgePaddingY));

      pointer.dx = Math.min(Math.max((safeX - pointer.x) * 5.0, -40), 40);
      pointer.dy = Math.min(Math.max((safeY - pointer.y) * 5.0, -40), 40);
      pointer.x = safeX;
      pointer.y = safeY;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    // initial setup
    resize();

    // update text texture once fonts are ready
    document.fonts.ready.then(() => {
      updateTextTexture();
      setTimeout(updateTextTexture, 100);
    });

    // small wake-up to seed sim (keeps it lively on start)
    const wakeUp = () => {
      pointer.x = Math.max(edgePaddingX, Math.min(window.innerWidth / 2, window.innerWidth - edgePaddingX));
      pointer.y = Math.max(edgePaddingY, Math.min(window.innerHeight / 2, window.innerHeight - edgePaddingY));
      pointer.dx = 10;
      pointer.dy = 10;
      pointer.moved = true;
    };
    wakeUp();
    setTimeout(wakeUp, 300);

    // start render loop
    render();

    // cleanup on unmount
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      cancelAnimationFrame(animationId);
      // best-effort GL resource cleanup
      try {
        if (textTexture) gl.deleteTexture(textTexture);
      } catch (err) {}
    };
  }, [text]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
